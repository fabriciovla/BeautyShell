//! Pseudoconsole sessions (ConPTY on Windows, a pty elsewhere) exposed to the frontend.
//! Each session runs three threads: one streams output through a `Channel`, one writes input in order,
//! and one waits for the process to exit.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::mpsc::{self, Sender};
use std::sync::Mutex;
use std::thread;

use portable_pty::{native_pty_system, ChildKiller, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::lang;
use crate::mcp::AgentBridge;

struct Session {
    master: Mutex<Box<dyn MasterPty + Send>>,
    input: Sender<Vec<u8>>,
    killer: Mutex<Box<dyn ChildKiller + Send + Sync>>,
}

#[derive(Default)]
pub struct PtyState {
    next_id: AtomicU32,
    sessions: Mutex<HashMap<u32, Session>>,
}

#[derive(Serialize, Clone)]
struct ExitPayload {
    id: u32,
    code: u32,
}

#[derive(Serialize, Clone)]
pub struct ShellInfo {
    id: &'static str,
    name: &'static str,
}

struct ShellSpec {
    program: PathBuf,
    args: Vec<String>,
    env: Vec<(&'static str, String)>,
}

#[cfg(windows)]
const SHELLS: [(&str, &str); 5] = [
    ("pwsh", "PowerShell 7"),
    ("powershell", "Windows PowerShell"),
    ("cmd", "Command Prompt"),
    ("gitbash", "Git Bash"),
    ("wsl", "WSL"),
];

/// PowerShell integration injected at startup:
/// - Reports the cwd through the window title and OSC 9;9.
/// - Emits OSC 133 marks (A, B, C, D;exit) like VS Code and Windows Terminal, plus the command text in
///   base64 right before C (OSC 7701, specific to Beauty Shell).
/// - Turns off PSReadLine predictions: Beauty Shell draws its own, aware of where each command ran.
/// - Ctrl+Alt+Shift+F12, sent by the app, moves the prompt back to the last row after the terminal grows,
///   since ConPTY adds the new rows below it.
/// No double quotes on purpose, so it survives command-line building.
const PS_INTEGRATION: &str = "$global:__vidrio_prompt = $function:prompt; $global:__vidrio_ran = $false; \
function global:prompt { \
$s = $?; $c = $global:LASTEXITCODE; $e = [string][char]27; $o = ''; \
if ($global:__vidrio_ran) { $global:__vidrio_ran = $false; \
$o = $e + ']133;D;' + $(if ($s) { 0 } elseif ($c) { $c } else { 1 }) + $e + '\\' }; \
$o += $e + ']133;A' + $e + '\\'; \
$l = $executionContext.SessionState.Path.CurrentLocation; \
if ($l.Provider.Name -eq 'FileSystem') { $p = $l.ProviderPath; \
try { $Host.UI.RawUI.WindowTitle = $p } catch {}; \
$o += $e + ']9;9;' + $p + $e + '\\' }; \
$r = & $global:__vidrio_prompt; \
$global:LASTEXITCODE = $c; \
$o + $r + $e + ']133;B' + $e + '\\' }; \
try { if ($PSStyle) { $e = [string][char]27; $b = $e + '[1m'; \
if ($PSStyle.FileInfo.Directory -eq $e + '[44;1m') { $PSStyle.FileInfo.Directory = $b }; \
if ($PSStyle.FileInfo.SymbolicLink -eq $e + '[36;1m') { $PSStyle.FileInfo.SymbolicLink = $b }; \
if ($PSStyle.FileInfo.Executable -eq $e + '[32;1m') { $PSStyle.FileInfo.Executable = '' }; \
if ($PSStyle.FileInfo.Extension['.zip'] -eq $e + '[31;1m') { $PSStyle.FileInfo.Extension.Clear() }; \
if ($PSStyle.Formatting.TableHeader -eq $e + '[32;1m') { $PSStyle.Formatting.TableHeader = $b }; \
if ($PSStyle.Formatting.CustomTableHeaderLabel -eq $e + '[32;1;3m') { $PSStyle.Formatting.CustomTableHeaderLabel = $b } } } catch {}; \
function global:Clear-Host { [Console]::Clear(); [Console]::Write([string][char]10 * ([Math]::Min([Console]::WindowHeight, [Console]::BufferHeight) - 1)) }; \
try { Set-PSReadLineKeyHandler -Chord Ctrl+l -ScriptBlock { \
try { Clear-Host; [Microsoft.PowerShell.PSConsoleReadLine]::InvokePrompt() } \
catch { try { [Microsoft.PowerShell.PSConsoleReadLine]::ClearScreen() } catch {} } } } catch {}; \
try { Set-PSReadLineOption -PredictionSource None } catch {}; \
try { Set-PSReadLineKeyHandler -Chord Ctrl+Alt+Shift+F12 -ScriptBlock { \
$g = [Console]::WindowTop + [Console]::WindowHeight - 1 - [Console]::CursorTop; if ($g -le 0) { return }; \
$s = [Microsoft.PowerShell.PSConsoleReadLine].GetField('_singleton', 'NonPublic,Static').GetValue($null); \
$f = $s.GetType().GetField('_initialY', 'NonPublic,Instance'); if (-not $f) { return }; \
[Console]::Write([string][char]27 + '[' + $g + 'T'); $f.SetValue($s, $f.GetValue($s) + $g); \
[Console]::SetCursorPosition([Console]::CursorLeft, [Console]::CursorTop + $g) } } catch {}; \
try { $global:__vidrio_readline = $function:PSConsoleHostReadLine; \
if ($global:__vidrio_readline) { function global:PSConsoleHostReadLine { \
$l = $global:__vidrio_readline.Invoke(); $e = [string][char]27; $global:__vidrio_ran = $true; \
[Console]::Write($e + ']7701;' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$l)) + $e + '\\' + $e + ']133;C' + $e + '\\'); \
$l } } } catch {}";

fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

/// Store and winget installs in `WindowsApps` are execution aliases: `is_file` fails on them, yet they launch.
fn is_program(path: &Path) -> bool {
    path.is_file() || std::fs::symlink_metadata(path).map(|m| !m.is_dir()).unwrap_or(false)
}

fn find_in_path(exe: &str) -> Option<PathBuf> {
    let paths = std::env::var_os("PATH")?;
    std::env::split_paths(&paths)
        .map(|dir| dir.join(exe))
        .find(|p| is_program(p))
}

#[cfg(windows)]
fn existing(path: &str) -> Option<PathBuf> {
    let p = PathBuf::from(path);
    is_program(&p).then_some(p)
}

fn powershell_args() -> Vec<String> {
    ["-NoLogo", "-NoExit", "-Command", PS_INTEGRATION]
        .iter()
        .map(|s| s.to_string())
        .collect()
}

#[cfg(windows)]
fn shell_spec(id: &str) -> Option<ShellSpec> {
    let windir = std::env::var("SystemRoot").unwrap_or_else(|_| "C:\\Windows".into());
    match id {
        "pwsh" => find_in_path("pwsh.exe")
            .or_else(|| existing("C:\\Program Files\\PowerShell\\7\\pwsh.exe"))
            .or_else(|| {
                let local = std::env::var("LOCALAPPDATA").ok()?;
                existing(&format!("{local}\\Microsoft\\WindowsApps\\pwsh.exe"))
            })
            .map(|program| ShellSpec { program, args: powershell_args(), env: vec![] }),
        "powershell" => Some(ShellSpec {
            program: Path::new(&windir).join("System32\\WindowsPowerShell\\v1.0\\powershell.exe"),
            args: powershell_args(),
            env: vec![],
        }),
        "cmd" => Some(ShellSpec {
            program: Path::new(&windir).join("System32\\cmd.exe"),
            args: vec![],
            env: vec![("PROMPT", "$E]9;9;$P$E\\$P$G".into())],
        }),
        "gitbash" => existing("C:\\Program Files\\Git\\bin\\bash.exe").map(|program| ShellSpec {
            program,
            args: vec!["--login".into(), "-i".into()],
            env: vec![("PROMPT_COMMAND", r#"printf '\e]7;file://%s%s\e\\' "$HOSTNAME" "$PWD""#.into())],
        }),
        "wsl" => Some(Path::new(&windir).join("System32\\wsl.exe"))
            .filter(|p| p.is_file())
            .map(|program| ShellSpec { program, args: vec![], env: vec![] }),
        _ => None,
    }
}

#[cfg(windows)]
fn resolve_spec(id: &str) -> Option<ShellSpec> {
    shell_spec(id).or_else(|| shell_spec("powershell"))
}

#[cfg(windows)]
fn home() -> String {
    std::env::var("USERPROFILE").unwrap_or_else(|_| "C:\\".into())
}

#[cfg(not(windows))]
const SHELLS: [(&str, &str); 4] = [("bash", "Bash"), ("zsh", "Zsh"), ("fish", "Fish"), ("pwsh", "PowerShell")];

#[cfg(not(windows))]
const BASH_INTEGRATION: &str = r#"# Lo genera Beauty Shell en cada terminal nueva; los cambios se pierden.
[ -f ~/.bashrc ] && . ~/.bashrc
__bs_prompt() {
  local s=$?
  printf '\e]133;D;%s\a\e]7;file://%s%s\a' "$s" "$HOSTNAME" "$PWD"
  return $s
}
__bs_wrap() {
  local s=$?
  [[ $PS1 == *'133;B'* ]] || PS1='\[\e]133;A\a\]'"$PS1"'\[\e]133;B\a\]'
  return $s
}
__bs_command() {
  local c
  c=$(HISTTIMEFORMAT= builtin history 1)
  [[ $c =~ ^[[:space:]]*[0-9]+[*]?[[:space:]]+(.*)$ ]] && c=${BASH_REMATCH[1]}
  printf '\e]7701;%s\a\e]133;C\a' "$(printf %s "$c" | base64 -w0)"
}
PROMPT_COMMAND=$'__bs_prompt\n'"$PROMPT_COMMAND"$'\n__bs_wrap'
PS0='$(__bs_command)'"$PS0"
"#;

#[cfg(not(windows))]
const ZSH_ENV: &str = r#"# Lo genera Beauty Shell en cada terminal nueva; los cambios se pierden.
__bs_zdotdir=$ZDOTDIR
ZDOTDIR=${BEAUTY_USER_ZDOTDIR:-$HOME}
[[ -f $ZDOTDIR/.zshenv ]] && . $ZDOTDIR/.zshenv
__bs_user_zdotdir=$ZDOTDIR
ZDOTDIR=$__bs_zdotdir
"#;

#[cfg(not(windows))]
const ZSH_RC: &str = r#"# Lo genera Beauty Shell en cada terminal nueva; los cambios se pierden.
ZDOTDIR=$__bs_user_zdotdir
unset __bs_zdotdir __bs_user_zdotdir BEAUTY_USER_ZDOTDIR
[[ $ZDOTDIR == $HOME ]] && unset ZDOTDIR
[[ -f ${ZDOTDIR:-$HOME}/.zshrc ]] && . ${ZDOTDIR:-$HOME}/.zshrc
__bs_precmd() {
  local s=$?
  printf '\e]133;D;%s\a\e]7;file://%s%s\a' $s $HOST $PWD
  return $s
}
__bs_wrap() {
  [[ $PS1 == *'133;B'* ]] || PS1=$'%{\e]133;A\a%}'"$PS1"$'%{\e]133;B\a%}'
}
__bs_preexec() {
  printf '\e]7701;%s\a\e]133;C\a' "$(printf %s "$1" | base64 | tr -d '\n')"
}
precmd_functions=(__bs_precmd $precmd_functions __bs_wrap)
preexec_functions+=(__bs_preexec)
"#;

#[cfg(not(windows))]
const FISH_INIT: &str = r#"function __bs_cwd --on-variable PWD; printf '\e]7;file://%s%s\a' $hostname $PWD; end; __bs_cwd
function __bs_preexec --on-event fish_preexec; printf '\e]7701;%s\a' (printf %s $argv[1] | base64 | string join ''); string match -qr '^[0-3]\.' -- $version; and printf '\e]133;C\a'; end
if string match -qr '^[0-3]\.' -- $version
  function __bs_postexec --on-event fish_postexec; printf '\e]133;D;%s\a' $status; end
  functions -q fish_prompt; and functions -c fish_prompt __bs_fish_prompt
  function fish_prompt; printf '\e]133;A\a'; __bs_fish_prompt; printf '\e]133;B\a'; end
end"#;

#[cfg(not(windows))]
fn integration_dir() -> PathBuf {
    std::env::var_os("XDG_DATA_HOME")
        .map(PathBuf::from)
        .filter(|p| p.is_absolute())
        .unwrap_or_else(|| PathBuf::from(home()).join(".local/share"))
        .join("beauty-shell/shell")
}

#[cfg(not(windows))]
fn integration_file(name: &str, content: &str) -> Option<PathBuf> {
    let path = integration_dir().join(name);
    if std::fs::read_to_string(&path).ok().as_deref() != Some(content) {
        std::fs::create_dir_all(path.parent()?).ok()?;
        std::fs::write(&path, content).ok()?;
    }
    Some(path)
}

#[cfg(not(windows))]
fn find_shell(name: &str) -> Option<PathBuf> {
    find_in_path(name).or_else(|| {
        ["/usr/bin", "/bin", "/usr/local/bin"]
            .iter()
            .map(|dir| Path::new(dir).join(name))
            .find(|p| is_program(p))
    })
}

#[cfg(not(windows))]
fn shell_spec(id: &str) -> Option<ShellSpec> {
    if !SHELLS.iter().any(|(known, _)| *known == id) && id != "sh" {
        return None;
    }
    find_shell(id).map(|program| ShellSpec { program, args: vec![], env: vec![] })
}

#[cfg(not(windows))]
fn prepare(id: &str, mut spec: ShellSpec) -> ShellSpec {
    match id {
        "bash" => {
            if let Some(rc) = integration_file("bashrc", BASH_INTEGRATION) {
                spec.args.push("--rcfile".into());
                spec.args.push(rc.display().to_string());
            }
            spec.args.push("-i".into());
        }
        "zsh" => {
            let dir = integration_dir().join("zsh");
            if integration_file("zsh/.zshenv", ZSH_ENV).is_some() && integration_file("zsh/.zshrc", ZSH_RC).is_some() {
                if let Ok(user) = std::env::var("ZDOTDIR") {
                    spec.env.push(("BEAUTY_USER_ZDOTDIR", user));
                }
                spec.env.push(("ZDOTDIR", dir.display().to_string()));
            }
            spec.args.push("-i".into());
        }
        "fish" => spec.args.extend(["-i".to_string(), "-C".to_string(), FISH_INIT.to_string()]),
        "pwsh" => spec.args = powershell_args(),
        _ => spec.args.push("-i".into()),
    }
    spec
}

#[cfg(not(windows))]
fn login_shell() -> Option<&'static str> {
    let shell = std::env::var("SHELL").ok()?;
    let name = Path::new(&shell).file_name()?.to_str()?;
    SHELLS.iter().map(|(id, _)| *id).find(|id| *id == name)
}

#[cfg(not(windows))]
fn resolve_spec(id: &str) -> Option<ShellSpec> {
    [Some(id), login_shell(), Some("bash"), Some("sh")]
        .into_iter()
        .flatten()
        .find_map(|id| shell_spec(id).map(|spec| prepare(id, spec)))
}

#[cfg(not(windows))]
fn home() -> String {
    std::env::var("HOME").unwrap_or_else(|_| "/".into())
}

fn drain_utf8(pending: &mut Vec<u8>) -> String {
    match std::str::from_utf8(pending) {
        Ok(s) => {
            let out = s.to_owned();
            pending.clear();
            out
        }
        Err(e) if e.error_len().is_none() => {
            let valid = e.valid_up_to();
            let out = String::from_utf8_lossy(&pending[..valid]).into_owned();
            pending.drain(..valid);
            out
        }
        Err(_) => {
            let out = String::from_utf8_lossy(pending).into_owned();
            pending.clear();
            out
        }
    }
}

fn read_loop(mut reader: Box<dyn Read + Send>, out: Channel<String>) {
    let mut buf = vec![0u8; 64 * 1024];
    let mut pending = Vec::new();
    loop {
        match reader.read(&mut buf) {
            Ok(0) | Err(_) => break,
            Ok(n) => {
                pending.extend_from_slice(&buf[..n]);
                let text = drain_utf8(&mut pending);
                if !text.is_empty() && out.send(text).is_err() {
                    break;
                }
            }
        }
    }
}

#[tauri::command]
pub fn pty_spawn(
    app: AppHandle,
    state: State<'_, PtyState>,
    shell: String,
    cwd: Option<String>,
    cols: u16,
    rows: u16,
    on_data: Channel<String>,
) -> Result<u32, String> {
    let spec = resolve_spec(&shell)
        .ok_or(lang::t("no hay ninguna shell disponible", "no shell is available"))?;

    let pair = native_pty_system()
        .openpty(PtySize { rows: rows.max(2), cols: cols.max(10), pixel_width: 0, pixel_height: 0 })
        .map_err(err)?;

    let id = state.next_id.fetch_add(1, Ordering::Relaxed) + 1;
    let mut cmd = CommandBuilder::new(&spec.program);
    cmd.args(&spec.args);
    for (key, value) in &spec.env {
        cmd.env(key, value);
    }
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("TERM_PROGRAM", "BeautyShell");
    cmd.env("TERM_PROGRAM_VERSION", env!("CARGO_PKG_VERSION"));

    cmd.env("VIDRIO_SESSION", id.to_string());
    cmd.env("VIDRIO_MCP_PORT", app.state::<AgentBridge>().port().to_string());
    let dir = cwd.filter(|d| Path::new(d).is_dir()).unwrap_or_else(home);
    cmd.cwd(&dir);

    let mut child = pair.slave.spawn_command(cmd).map_err(err)?;

    drop(pair.slave);

    let reader = pair.master.try_clone_reader().map_err(err)?;
    let mut writer = pair.master.take_writer().map_err(err)?;
    let killer = child.clone_killer();

    let (input, input_rx) = mpsc::channel::<Vec<u8>>();
    thread::spawn(move || {
        for data in input_rx {
            if writer.write_all(&data).and_then(|_| writer.flush()).is_err() {
                break;
            }
        }
    });

    state.sessions.lock().unwrap().insert(
        id,
        Session { master: Mutex::new(pair.master), input, killer: Mutex::new(killer) },
    );

    let reader_thread = thread::spawn(move || read_loop(reader, on_data));
    thread::spawn(move || {
        let code = child.wait().map(|s| s.exit_code()).unwrap_or(1);
        let session = app.state::<PtyState>().sessions.lock().unwrap().remove(&id);

        drop(session);
        let _ = reader_thread.join();
        let _ = app.emit("pty-exit", ExitPayload { id, code });
    });

    Ok(id)
}

#[tauri::command]
pub fn pty_write(state: State<'_, PtyState>, id: u32, data: String) -> Result<(), String> {
    let sessions = state.sessions.lock().unwrap();
    let session = sessions.get(&id).ok_or(lang::t("la sesión ya no existe", "the session no longer exists"))?;
    session.input.send(data.into_bytes()).map_err(err)
}

#[tauri::command]
pub fn pty_resize(state: State<'_, PtyState>, id: u32, cols: u16, rows: u16) -> Result<(), String> {
    let sessions = state.sessions.lock().unwrap();
    let session = sessions.get(&id).ok_or(lang::t("la sesión ya no existe", "the session no longer exists"))?;
    let size = PtySize { rows: rows.max(2), cols: cols.max(10), pixel_width: 0, pixel_height: 0 };
    let result = session.master.lock().unwrap().resize(size);
    result.map_err(err)
}

#[tauri::command]
pub fn pty_kill(state: State<'_, PtyState>, id: u32) -> Result<(), String> {
    let sessions = state.sessions.lock().unwrap();
    if let Some(session) = sessions.get(&id) {
        session.killer.lock().unwrap().kill().map_err(err)?;
    }
    Ok(())
}

#[tauri::command]
pub fn list_shells() -> Vec<ShellInfo> {
    #[allow(unused_mut)]
    let mut shells: Vec<ShellInfo> = SHELLS
        .iter()
        .filter(|(id, _)| shell_spec(id).is_some())

        .map(|&(id, name)| ShellInfo { id, name: if id == "cmd" { lang::t("Símbolo del sistema", name) } else { name } })
        .collect();

    #[cfg(not(windows))]
    if let Some(i) = login_shell().and_then(|login| shells.iter().position(|s| s.id == login)) {
        let first = shells.remove(i);
        shells.insert(0, first);
    }
    shells
}

#[tauri::command]
pub fn home_dir() -> String {
    home()
}

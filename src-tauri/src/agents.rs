use std::path::PathBuf;

use serde::Serialize;
use serde_json::Value;

#[derive(Serialize)]
pub struct FoundProgram {
    command: String,
    path: Option<String>,
}

#[cfg(windows)]
fn extra_dirs() -> Vec<PathBuf> {
    let var = |name: &str| std::env::var_os(name).map(PathBuf::from);
    let mut dirs = Vec::new();
    if let Some(home) = var("USERPROFILE") {
        dirs.push(home.join(".local\\bin"));
        dirs.push(home.join(".bun\\bin"));
        dirs.push(home.join(".cargo\\bin"));
        dirs.push(home.join("scoop\\shims"));
    }
    if let Some(appdata) = var("APPDATA") {
        dirs.push(appdata.join("npm"));
    }
    if let Some(local) = var("LOCALAPPDATA") {
        dirs.push(local.join("pnpm"));
        dirs.push(local.join("Microsoft\\WinGet\\Links"));
    }
    dirs
}

#[cfg(not(windows))]
fn extra_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if let Some(home) = std::env::var_os("HOME").map(PathBuf::from) {
        for dir in [".local/bin", ".bun/bin", ".cargo/bin", ".npm-global/bin", ".volta/bin", ".deno/bin", ".local/share/pnpm", ".opencode/bin"] {
            dirs.push(home.join(dir));
        }
        if let Ok(versions) = std::fs::read_dir(home.join(".nvm/versions/node")) {
            dirs.extend(versions.flatten().map(|v| v.path().join("bin")));
        }
    }
    dirs.push(PathBuf::from("/usr/local/bin"));
    dirs
}

pub(crate) fn home_dir() -> Option<PathBuf> {
    std::env::var_os(if cfg!(windows) { "USERPROFILE" } else { "HOME" }).map(PathBuf::from)
}

fn search_dirs() -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = std::env::var_os("PATH")
        .map(|p| std::env::split_paths(&p).collect())
        .unwrap_or_default();
    dirs.extend(extra_dirs());
    dirs
}

#[cfg(windows)]
fn find(command: &str, dirs: &[PathBuf]) -> Option<PathBuf> {
    const EXTS: [&str; 4] = ["exe", "cmd", "bat", "com"];
    dirs.iter().find_map(|dir| {
        EXTS.iter()
            .map(|ext| dir.join(format!("{command}.{ext}")))
            .find(|p| p.is_file() || std::fs::symlink_metadata(p).map(|m| !m.is_dir()).unwrap_or(false))
    })
}

#[cfg(not(windows))]
fn find(command: &str, dirs: &[PathBuf]) -> Option<PathBuf> {
    use std::os::unix::fs::PermissionsExt;
    dirs.iter()
        .map(|dir| dir.join(command))
        .find(|p| std::fs::metadata(p).is_ok_and(|m| m.is_file() && m.permissions().mode() & 0o111 != 0))
}

#[cfg(not(windows))]
pub(crate) fn search_path() -> std::ffi::OsString {
    std::env::join_paths(search_dirs()).unwrap_or_default()
}

pub(crate) fn locate(command: &str) -> Option<PathBuf> {
    find(command, &search_dirs())
}

#[tauri::command]
pub async fn find_programs(commands: Vec<String>) -> Vec<FoundProgram> {
    tauri::async_runtime::spawn_blocking(move || {
        let dirs = search_dirs();
        commands
            .into_iter()
            .map(|command| {
                let path = find(&command, &dirs).map(|p| p.display().to_string());
                FoundProgram { command, path }
            })
            .collect()
    })
    .await
    .unwrap_or_default()
}

#[tauri::command]
pub fn claude_connected() -> bool {
    let Some(home) = home_dir() else {
        return false;
    };
    std::fs::read_to_string(home.join(".claude.json"))
        .ok()
        .and_then(|text| serde_json::from_str::<Value>(&text).ok())
        .is_some_and(|config| config["mcpServers"]["vidrio"].is_object())
}

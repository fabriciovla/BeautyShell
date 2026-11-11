use std::path::Path;
use std::process::Command;

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

use crate::agents::locate;

#[tauri::command]
pub fn paths_exist(paths: Vec<String>) -> Vec<bool> {
    paths.iter().map(|p| Path::new(p).exists()).collect()
}

/// `code` is a .cmd on Windows, which would open a console window.
fn code_command() -> Option<Command> {
    let code = locate("code")?;
    #[allow(unused_mut)]
    let mut cmd = Command::new(code);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    Some(cmd)
}

#[tauri::command]
pub async fn open_in_editor(app: AppHandle, path: String, line: Option<u32>, col: Option<u32>) -> Result<(), String> {
    if Path::new(&path).is_file() {
        if let Some(mut code) = code_command() {
            let target = match (line, col) {
                (Some(l), Some(c)) => format!("{path}:{l}:{c}"),
                (Some(l), None) => format!("{path}:{l}"),
                _ => path.clone(),
            };
            if code.args(["-g", &target]).spawn().is_ok() {
                return Ok(());
            }
        }
    }
    app.opener().open_path(path, None::<&str>).map_err(|e| e.to_string())
}

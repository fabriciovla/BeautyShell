use std::path::PathBuf;

fn history_file() -> Option<PathBuf> {
    if cfg!(windows) {
        let appdata = std::env::var_os("APPDATA")?;
        return Some(PathBuf::from(appdata).join(r"Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt"));
    }
    let data = std::env::var_os("XDG_DATA_HOME")
        .map(PathBuf::from)
        .filter(|p| p.is_absolute())
        .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".local/share")))?;
    Some(data.join("powershell/PSReadLine/ConsoleHost_history.txt"))
}

#[tauri::command]
pub async fn ps_history() -> Vec<String> {
    let Some(path) = history_file() else {
        return vec![];
    };
    let Ok(text) = std::fs::read_to_string(path) else {
        return vec![];
    };
    let lines: Vec<&str> = text.lines().collect();
    let mut out = Vec::new();
    let mut multiline = false;
    for line in &lines[lines.len().saturating_sub(5000)..] {
        // A trailing backtick continues the command on the next line.
        let continues = line.ends_with('`');
        if !multiline && !continues && !line.trim().is_empty() {
            out.push(line.trim_end().to_string());
        }
        multiline = continues;
    }
    out
}

#[tauri::command]
pub async fn list_dirs(dir: String) -> Vec<String> {
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return vec![];
    };
    let mut names: Vec<String> = entries
        .flatten()
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .filter_map(|e| e.file_name().into_string().ok())
        .collect();
    names.sort_by_key(|n| n.to_lowercase());
    names
}

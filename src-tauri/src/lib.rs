mod agents;
mod browser;
mod editor;
mod lang;
mod mcp;
mod predict;
mod pty;
mod quake;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())

        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(quake::plugin())
        .manage(pty::PtyState::default())
        .manage(mcp::AgentBridge::default())
        .manage(quake::QuakeState::default())
        .setup(|app| {
            mcp::start(app.handle().clone());
            quake::register(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            pty::pty_spawn,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_kill,
            pty::list_shells,
            pty::home_dir,
            mcp::agent_reply,
            mcp::agent_port,
            mcp::connect_claude,
            agents::find_programs,
            agents::claude_connected,
            editor::paths_exist,
            editor::open_in_editor,
            quake::quake_exit,
            browser::browser_open,
            browser::browser_bounds,
            browser::browser_visible,
            browser::browser_focus,
            browser::browser_navigate,
            browser::browser_reload,
            browser::browser_history,
            browser::browser_close,
            browser::browser_close_all,
            browser::browser_snapshot,
            browser::browser_read,
            predict::ps_history,
            predict::list_dirs,
        ])
        .run(tauri::generate_context!())
        .expect("failed to start Beauty Shell");
}

use std::sync::Mutex;

use tauri::plugin::TauriPlugin;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, State, WebviewWindow, Wry};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Default)]
pub struct QuakeState {
    saved: Mutex<Option<Saved>>,
}

struct Saved {
    position: PhysicalPosition<i32>,
    size: PhysicalSize<u32>,
    maximized: bool,
}

const HEIGHT: f64 = 0.5;

pub fn plugin() -> TauriPlugin<Wry> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, shortcut, event| {
            if event.state() == ShortcutState::Pressed && shortcut.matches(Modifiers::SUPER, Code::Backquote) {
                toggle(app);
            }
        })
        .build()
}

pub fn register(app: &AppHandle) {
    let shortcut = Shortcut::new(Some(Modifiers::SUPER), Code::Backquote);
    if let Err(e) = app.global_shortcut().register(shortcut) {
        eprintln!("Failed to register Win+`: {e}");
    }
}

fn toggle(app: &AppHandle) {
    let Some(win) = app.get_webview_window("main") else { return };
    let state = app.state::<QuakeState>();
    let mut saved = state.saved.lock().unwrap();
    let shown = win.is_visible().unwrap_or(false) && !win.is_minimized().unwrap_or(false);
    if saved.is_some() && shown && win.is_focused().unwrap_or(false) {
        let _ = win.hide();
        return;
    }
    if saved.is_none() {
        let (Ok(position), Ok(size)) = (win.outer_position(), win.outer_size()) else { return };
        *saved = Some(Saved { position, size, maximized: win.is_maximized().unwrap_or(false) });
    }
    drop(saved);

    let monitor = app
        .cursor_position()
        .ok()
        .and_then(|p| app.monitor_from_point(p.x, p.y).ok().flatten())
        .or_else(|| win.current_monitor().ok().flatten());
    if let Some(monitor) = monitor {
        let area = monitor.work_area();
        let _ = win.set_fullscreen(false);
        let _ = win.unmaximize();
        let _ = win.set_position(area.position);
        let _ = win.set_size(PhysicalSize::new(area.size.width, (area.size.height as f64 * HEIGHT) as u32));
    }
    let _ = win.unminimize();
    let _ = win.show();
    let _ = win.set_focus();
    let _ = win.emit("quake", true);
}

#[tauri::command]
pub fn quake_exit(window: WebviewWindow, state: State<'_, QuakeState>) {
    let Some(saved) = state.saved.lock().unwrap().take() else { return };
    let _ = window.set_size(saved.size);
    let _ = window.set_position(saved.position);
    if saved.maximized {
        let _ = window.maximize();
    }
    let _ = window.emit("quake", false);
}

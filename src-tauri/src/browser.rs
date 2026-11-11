use std::sync::mpsc;
use std::time::Duration;

use serde::Serialize;
use tauri::webview::{NewWindowResponse, PageLoadEvent};
use crate::lang;
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Rect, Url, WebviewBuilder, WebviewUrl};

#[derive(Serialize, Clone)]
struct BrowserEvent {
    label: String,
    kind: &'static str,
    value: String,
}

fn emit(app: &AppHandle, label: &str, kind: &'static str, value: String) {
    let _ = app.emit("browser-event", BrowserEvent { label: label.to_string(), kind, value });
}

fn webview(app: &AppHandle, label: &str) -> Result<tauri::Webview, String> {
    app.get_webview(label).ok_or_else(|| lang::t("Esa pestaña de navegador ya no existe.", "That browser tab no longer exists.").to_string())
}

fn parse(url: &str) -> Result<Url, String> {
    Url::parse(url).map_err(|e| format!("{}: {e}", lang::t("Dirección inválida", "Invalid address")))
}

/// Async on purpose: on Windows, `add_child` from a sync command deadlocks waiting on the main thread (wry #583).
#[tauri::command]
pub async fn browser_open(app: AppHandle, label: String, url: String, x: f64, y: f64, width: f64, height: f64) -> Result<(), String> {
    let window = app.get_window("main").ok_or(lang::t("No está la ventana principal.", "The main window is missing."))?;
    let url = parse(&url)?;
    let (nav, title, load, popup) = (app.clone(), app.clone(), app.clone(), app.clone());
    let (nav_label, title_label, load_label, popup_label) = (label.clone(), label.clone(), label.clone(), label.clone());
    let builder = WebviewBuilder::new(&label, WebviewUrl::External(url))
        .on_navigation(move |url| {
            emit(&nav, &nav_label, "url", url.to_string());
            true
        })
        .on_document_title_changed(move |_, value| emit(&title, &title_label, "title", value))
        .on_page_load(move |_, payload| {
            let kind = if payload.event() == PageLoadEvent::Started { "loading" } else { "loaded" };
            emit(&load, &load_label, kind, payload.url().to_string());
        })

        .on_new_window(move |url, _| {
            emit(&popup, &popup_label, "open", url.to_string());
            NewWindowResponse::Deny
        });
    window
        .add_child(builder, LogicalPosition::new(x, y), LogicalSize::new(width.max(1.0), height.max(1.0)))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn browser_bounds(app: AppHandle, label: String, x: f64, y: f64, width: f64, height: f64) -> Result<(), String> {
    webview(&app, &label)?
        .set_bounds(Rect {
            position: LogicalPosition::new(x, y).into(),
            size: LogicalSize::new(width.max(1.0), height.max(1.0)).into(),
        })
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_visible(app: AppHandle, label: String, visible: bool) -> Result<(), String> {
    let view = webview(&app, &label)?;
    if visible { view.show() } else { view.hide() }.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_focus(app: AppHandle, label: String) -> Result<(), String> {
    webview(&app, &label)?.set_focus().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_navigate(app: AppHandle, label: String, url: String) -> Result<(), String> {
    webview(&app, &label)?.navigate(parse(&url)?).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_reload(app: AppHandle, label: String) -> Result<(), String> {
    webview(&app, &label)?.reload().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_history(app: AppHandle, label: String, step: i32) -> Result<(), String> {
    webview(&app, &label)?.eval(format!("history.go({step})")).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_close(app: AppHandle, label: String) -> Result<(), String> {
    match app.get_webview(&label) {
        Some(view) => view.close().map_err(|e| e.to_string()),
        None => Ok(()),
    }
}

/// Native views outlive a frontend reload with nobody driving them, so the frontend closes them on startup.
#[tauri::command]
pub fn browser_close_all(app: AppHandle) {
    for (label, view) in app.webviews() {
        if label.starts_with("browser-") {
            let _ = view.close();
        }
    }
}

/// A JPEG of the page. Native views sit above all HTML, so when the UI must overlap one it is hidden
/// and this snapshot is shown in its place.
#[tauri::command]
pub async fn browser_snapshot(app: AppHandle, label: String) -> Result<tauri::ipc::Response, String> {
    let view = webview(&app, &label)?;
    let (tx, rx) = mpsc::channel::<Result<Vec<u8>, String>>();
    #[cfg(windows)]
    view.with_webview(move |platform| {
        if let Err(e) = capture_preview(platform.controller(), tx.clone()) {
            let _ = tx.send(Err(e.to_string()));
        }
    })
    .map_err(|e| e.to_string())?;
    #[cfg(not(windows))]
    let _ = (view, tx);
    let bytes = tauri::async_runtime::spawn_blocking(move || rx.recv_timeout(Duration::from_secs(2)))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|_| lang::t("La página no respondió a tiempo.", "The page didn't respond in time.").to_string())??;
    Ok(tauri::ipc::Response::new(bytes))
}

#[cfg(windows)]
fn capture_preview(
    controller: webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2Controller,
    tx: mpsc::Sender<Result<Vec<u8>, String>>,
) -> windows::core::Result<()> {
    use webview2_com::CapturePreviewCompletedHandler;
    use webview2_com::Microsoft::Web::WebView2::Win32::COREWEBVIEW2_CAPTURE_PREVIEW_IMAGE_FORMAT_JPEG;
    use windows::Win32::Foundation::HGLOBAL;
    use windows::Win32::System::Com::StructuredStorage::CreateStreamOnHGlobal;

    unsafe {
        let core = controller.CoreWebView2()?;
        let stream = CreateStreamOnHGlobal(HGLOBAL::default(), true)?;
        let written = stream.clone();
        let handler = CapturePreviewCompletedHandler::create(Box::new(move |result| {
            let _ = tx.send(result.and_then(|_| read_stream(&written)).map_err(|e| e.to_string()));
            Ok(())
        }));
        core.CapturePreview(COREWEBVIEW2_CAPTURE_PREVIEW_IMAGE_FORMAT_JPEG, &stream, &handler)
    }
}

#[cfg(windows)]
fn read_stream(stream: &windows::Win32::System::Com::IStream) -> windows::core::Result<Vec<u8>> {
    use windows::Win32::System::Com::STREAM_SEEK_SET;

    let mut bytes = Vec::new();
    let mut chunk = [0u8; 64 * 1024];
    unsafe {
        stream.Seek(0, STREAM_SEEK_SET, None)?;
        loop {
            let mut read = 0u32;
            stream.Read(chunk.as_mut_ptr().cast(), chunk.len() as u32, Some(&mut read)).ok()?;
            if read == 0 {
                break;
            }
            bytes.extend_from_slice(&chunk[..read as usize]);
        }
    }
    Ok(bytes)
}

#[tauri::command]
pub async fn browser_read(app: AppHandle, label: String) -> Result<String, String> {
    let view = webview(&app, &label)?;
    let (tx, rx) = mpsc::channel();
    view.eval_with_callback(
        "JSON.stringify({ title: document.title, url: location.href, text: document.body ? document.body.innerText : '' })",
        move |result| {
            let _ = tx.send(result);
        },
    )
    .map_err(|e| e.to_string())?;
    tauri::async_runtime::spawn_blocking(move || rx.recv_timeout(Duration::from_secs(10)))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|_| lang::t("La página no respondió a tiempo.", "The page didn't respond in time.").to_string())
}

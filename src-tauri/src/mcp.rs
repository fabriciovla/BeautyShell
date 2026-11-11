//! Local MCP server that lets agents running in a terminal see the other Beauty Shell sessions and write to them.
//! Speaks MCP over HTTP on 127.0.0.1 with plain JSON responses, no SSE. Each terminal gets `VIDRIO_SESSION` and
//! `VIDRIO_MCP_PORT`, which the Claude Code config passes in the URL and a header to identify the caller.

use std::collections::HashMap;
use std::process::Command;
use std::sync::atomic::{AtomicU16, AtomicU64, Ordering};
use std::sync::{mpsc, Mutex};
use std::thread;
use std::time::Duration;

use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, State};
use tiny_http::{Header, Method, Request, Response, Server};

use crate::lang;

const BASE_PORT: u16 = 47437;

const INSTRUCTIONS_ES: &str = "Estás dentro de Beauty Shell, una terminal con varias sesiones abiertas. \
Con list_sessions ves las demás; con send_to_session le escribís al agente de otra sesión \
(el texto aparece en su input firmado con tu nombre y se envía); con read_screen leés lo que \
muestra otra terminal. Para contestar un mensaje, usá send_to_session hacia la sesión que lo firmó. \
Con open_browser abrís una página en el navegador de Beauty Shell (en su propia pestaña, para que el \
usuario la vea) y con read_browser leés el texto de lo que muestra.";

const INSTRUCTIONS_EN: &str = "You are inside Beauty Shell, a terminal with several sessions open. \nWith list_sessions you see the others; with send_to_session you write to the agent in another session \n(the text shows up in its input signed with your name, and is sent); with read_screen you read what \nanother terminal shows. To answer a message, use send_to_session toward the session that signed it. \nWith open_browser you open a page in the Beauty Shell browser (in its own tab, so the user sees it) \nand with read_browser you read the text of what it shows.";

#[derive(Default)]
pub struct AgentBridge {
    port: AtomicU16,
    next_id: AtomicU64,
    pending: Mutex<HashMap<u64, mpsc::Sender<(String, bool)>>>,
}

impl AgentBridge {
    pub fn port(&self) -> u16 {
        self.port.load(Ordering::Relaxed)
    }
}

#[derive(Serialize, Clone)]
struct ToolRequest {
    id: u64,
    tool: String,
    args: Value,
    from: u32,
}

pub fn start(app: AppHandle) {
    let Some((server, port)) =
        (0..10).find_map(|i| Server::http(("127.0.0.1", BASE_PORT + i)).ok().map(|s| (s, BASE_PORT + i)))
    else {
        return;
    };
    app.state::<AgentBridge>().port.store(port, Ordering::Relaxed);
    thread::spawn(move || {
        for request in server.incoming_requests() {
            let app = app.clone();

            thread::spawn(move || handle(app, request));
        }
    });
}

fn header<'a>(request: &'a Request, name: &'static str) -> Option<&'a str> {
    request.headers().iter().find(|h| h.field.equiv(name)).map(|h| h.value.as_str())
}

fn handle(app: AppHandle, mut request: Request) {
    // DNS rebinding guard: a browser may only call from a local page.
    let origin_ok = header(&request, "Origin")
        .map_or(true, |o| o.starts_with("http://localhost") || o.starts_with("http://127.0.0.1"));
    if !origin_ok {
        let _ = request.respond(Response::empty(403));
        return;
    }
    if request.url().split('?').next() != Some("/mcp") {
        let _ = request.respond(Response::empty(404));
        return;
    }
    if *request.method() != Method::Post {
        let _ = request.respond(Response::empty(405));
        return;
    }
    let from = header(&request, "X-Vidrio-Session").and_then(|v| v.trim().parse().ok()).unwrap_or(0);

    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        let _ = request.respond(Response::empty(400));
        return;
    }
    let reply = match serde_json::from_str::<Value>(&body) {
        Ok(Value::Array(batch)) => {
            let replies: Vec<Value> = batch.iter().filter_map(|m| dispatch(&app, m, from)).collect();
            (!replies.is_empty()).then(|| Value::Array(replies))
        }
        Ok(message) => dispatch(&app, &message, from),
        Err(_) => Some(json!({ "jsonrpc": "2.0", "id": null, "error": { "code": -32700, "message": "Invalid JSON" } })),
    };
    let _ = match reply {
        Some(value) => {
            let json_type = Header::from_bytes("Content-Type", "application/json").unwrap();
            request.respond(Response::from_string(value.to_string()).with_header(json_type))
        }

        None => request.respond(Response::empty(202)),
    };
}

fn dispatch(app: &AppHandle, message: &Value, from: u32) -> Option<Value> {
    let method = message.get("method")?.as_str()?;
    let id = message.get("id")?.clone();
    let result = match method {
        "initialize" => Ok(json!({
            "protocolVersion": message["params"]["protocolVersion"].as_str().unwrap_or("2025-06-18"),
            "capabilities": { "tools": {} },
            "serverInfo": { "name": "vidrio", "version": env!("CARGO_PKG_VERSION") },
            "instructions": lang::t(INSTRUCTIONS_ES, INSTRUCTIONS_EN),
        })),
        "ping" => Ok(json!({})),
        "tools/list" => Ok(json!({ "tools": tools() })),
        "tools/call" => Ok(call_tool(app, &message["params"], from)),
        _ => Err(format!("{}: {method}", lang::t("método desconocido", "unknown method"))),
    };
    Some(match result {
        Ok(result) => json!({ "jsonrpc": "2.0", "id": id, "result": result }),
        Err(error) => json!({ "jsonrpc": "2.0", "id": id, "error": { "code": -32601, "message": error } }),
    })
}

fn tools() -> Value {
    json!([
        {
            "name": "list_sessions",
            "description": lang::t("Lista las terminales abiertas en Beauty Shell: id, nombre, carpeta y si están trabajando. La tuya aparece marcada.", "Lists the terminals open in Beauty Shell: id, name, folder and whether they are working. Yours is marked."),
            "inputSchema": { "type": "object", "properties": {} }
        },
        {
            "name": "send_to_session",
            "description": lang::t("Escribe un mensaje en el input de otra terminal y lo envía, como si lo tipeara el usuario. Sirve para hablar con el agente que corre ahí. El mensaje llega firmado con tu nombre y tu id de sesión.", "Writes a message into another terminal's input and sends it, as if the user typed it. Use it to talk to the agent running there. The message arrives signed with your name and session id."),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "to": { "type": "string", "description": lang::t("Id de la sesión (de list_sessions) o parte de su nombre.", "Session id (from list_sessions) or part of its name.") },
                    "text": { "type": "string", "description": lang::t("El mensaje. Completo y que se entienda solo: el otro agente no conoce tu conversación.", "The message. Complete and self-explanatory: the other agent doesn't know your conversation.") },
                    "submit": { "type": "boolean", "description": lang::t("Presionar Enter después de escribir. Por defecto sí.", "Press Enter after typing. Yes by default.") }
                },
                "required": ["to", "text"]
            }
        },
        {
            "name": "read_screen",
            "description": lang::t("Devuelve las últimas líneas que muestra otra terminal.", "Returns the last lines another terminal shows."),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "session": { "type": "string", "description": lang::t("Id de la sesión o parte de su nombre.", "Session id or part of its name.") },
                    "lines": { "type": "integer", "minimum": 1, "maximum": 400, "description": lang::t("Cuántas líneas. Por defecto 40.", "How many lines. 40 by default.") }
                },
                "required": ["session"]
            }
        },
        {
            "name": "open_browser",
            "description": lang::t("Abre una página en el navegador integrado de Beauty Shell, en su propia pestaña, y la muestra al usuario. Útil para mostrarle un servidor de desarrollo (http://localhost:...) o una documentación.", "Opens a page in the Beauty Shell built-in browser, in its own tab, and shows it to the user. Useful to show them a dev server (http://localhost:...) or some documentation."),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": { "type": "string", "description": lang::t("La dirección. Sin esquema se asume https:// (o http:// para localhost).", "The address. Without a scheme, https:// is assumed (or http:// for localhost).") },
                    "background": { "type": "boolean", "description": lang::t("Abrirla sin cambiar de pestaña. Por defecto no: se muestra.", "Open it without switching tabs. No by default: it's shown.") }
                },
                "required": ["url"]
            }
        },
        {
            "name": "read_browser",
            "description": lang::t("Devuelve el título, la dirección y el texto visible de una pestaña del navegador integrado. Sin indicar cuál, la última que se usó.", "Returns the title, address and visible text of a tab in the built-in browser. Without saying which, the last one used."),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "tab": { "type": "string", "description": lang::t("Parte del título o de la dirección de la pestaña.", "Part of the tab's title or address.") },
                    "max_chars": { "type": "integer", "minimum": 200, "maximum": 50000, "description": lang::t("Cuánto texto como máximo. Por defecto 8000.", "How much text at most. 8000 by default.") }
                }
            }
        }
    ])
}

fn call_tool(app: &AppHandle, params: &Value, from: u32) -> Value {
    let bridge = app.state::<AgentBridge>();
    let id = bridge.next_id.fetch_add(1, Ordering::Relaxed);
    let (tx, rx) = mpsc::channel();
    bridge.pending.lock().unwrap().insert(id, tx);
    let request = ToolRequest {
        id,
        tool: params["name"].as_str().unwrap_or_default().to_string(),
        args: params.get("arguments").cloned().unwrap_or_else(|| json!({})),
        from,
    };
    let (text, is_error) = if app.emit("agent-tool", request).is_err() {
        (lang::t("Beauty Shell no pudo procesar el pedido.", "Beauty Shell couldn't process the request.").to_string(), true)
    } else {
        rx.recv_timeout(Duration::from_secs(20))
            .unwrap_or_else(|_| (lang::t("Beauty Shell no respondió a tiempo.", "Beauty Shell didn't respond in time.").to_string(), true))
    };
    bridge.pending.lock().unwrap().remove(&id);
    json!({ "content": [{ "type": "text", "text": text }], "isError": is_error })
}

#[tauri::command]
pub fn agent_reply(state: State<'_, AgentBridge>, id: u64, text: String, is_error: bool) {
    if let Some(tx) = state.pending.lock().unwrap().remove(&id) {
        let _ = tx.send((text, is_error));
    }
}

#[tauri::command]
pub fn agent_port(state: State<'_, AgentBridge>) -> u16 {
    state.port()
}

fn finish(output: std::process::Output) -> Result<String, String> {
    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )
    .trim()
    .to_string();
    if output.status.success() {
        Ok(text)
    } else if text.is_empty() {
        Err(not_found())
    } else {
        Err(text)
    }
}

fn not_found() -> String {
    lang::t("No se encontró el comando `claude`. ¿Está instalado Claude Code?", "The `claude` command wasn't found. Is Claude Code installed?").to_string()
}

#[cfg(windows)]
fn run_claude(args: &str) -> Result<String, String> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    let mut cmd = Command::new("cmd");

    // With /S, cmd strips only the outer quotes and keeps the rest verbatim.
    cmd.raw_arg(format!("/D /S /C \"claude {args}\"")).creation_flags(CREATE_NO_WINDOW);
    finish(cmd.output().map_err(|e| e.to_string())?)
}

#[cfg(windows)]
fn register_claude() -> Result<String, String> {
    let config = r#"{\"type\":\"http\",\"url\":\"http://127.0.0.1:${VIDRIO_MCP_PORT:-47437}/mcp\",\"headers\":{\"X-Vidrio-Session\":\"${VIDRIO_SESSION:-0}\"}}"#;
    let _ = run_claude("mcp remove --scope user vidrio");
    run_claude(&format!("mcp add-json --scope user vidrio \"{config}\""))
}

#[cfg(not(windows))]
fn run_claude(args: &[&str]) -> Result<String, String> {
    let program = crate::agents::locate("claude").ok_or_else(not_found)?;
    let output = Command::new(program)
        .args(args)
        .env("PATH", crate::agents::search_path())
        .output()
        .map_err(|e| e.to_string())?;
    finish(output)
}

#[cfg(not(windows))]
fn register_claude() -> Result<String, String> {
    let config = r#"{"type":"http","url":"http://127.0.0.1:${VIDRIO_MCP_PORT:-47437}/mcp","headers":{"X-Vidrio-Session":"${VIDRIO_SESSION:-0}"}}"#;
    let _ = run_claude(&["mcp", "remove", "--scope", "user", "vidrio"]);
    run_claude(&["mcp", "add-json", "--scope", "user", "vidrio", config])
}

#[tauri::command]
pub async fn connect_claude() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(register_claude).await.map_err(|e| e.to_string())?
}

---
lang: en
id: architecture
description: "How Beauty Shell is built inside, from Tauri and Rust to ConPTY, xterm.js and WebView2."
lead: "Beauty Shell is a Tauri 2 app: the interface in TypeScript on WebView2 and the core in Rust. Here's how the work is split."
---

## The whole picture

| Layer | What it uses | What it does |
| --- | --- | --- |
| Window | Tauri 2 | A borderless, transparent window with Windows' acrylic or Mica effect behind it. |
| Interface | TypeScript with no framework, hand-written CSS | Tabs, sidebar, panes, settings, palette and browser. It runs on **WebView2**, the Edge engine Windows already has. |
| Terminal | xterm.js 6 with WebGL | Draws each terminal on the graphics card. |
| Pseudoconsole | ConPTY, via `portable-pty` | Runs the shells as if they were talking to a real console. |
| Core | Rust | Shells, browser views, MCP server, Quake mode, agent detection and paths. |

It doesn't use Electron: instead of shipping its own Chromium, it uses the system's WebView2. The app is lighter and starts faster. Altogether it's about 13,600 lines of TypeScript, CSS and Rust.

## How a keystroke travels

1. You type in a pane. xterm.js turns the key into the bytes a terminal expects (for example, `ESC [ A` for the up arrow).
2. The interface hands them to Rust with a Tauri command.
3. In Rust, each session has **three threads**: one **writes** the input in order to the pseudoconsole, another **reads** the output, and another **waits** for the process to exit to report its exit code.
4. The output goes back to the interface over a Tauri **channel**, in chunks of up to 64 KB. Rust always cuts at a UTF-8 character boundary, so it never splits a letter in half.
5. xterm.js interprets the output (colors, cursor movements, [OSC sequences](/en/shell/docs/escape-sequences/)) and draws it with WebGL.

Writing never blocks the main thread: if the shell is busy, the input waits on its own thread.

## The terminal

Each pane is an xterm.js instance with these add-ons:

- **WebGL**: draws letters from a glyph atlas on the GPU. Turning the translucent terminal on or off recreates the atlas, because it's built differently with and without transparency.
- **Fit**: fits columns and rows to the pane's size, and Rust reports it to ConPTY.
- **Unicode 11**: correct widths for emoji and wide characters.
- **Search**: the <kbd>Ctrl+F</kbd> search box.
- **Web links**: clickable links. File paths are detected by Beauty Shell, and Rust confirms which ones exist.

xterm.js is configured for ConPTY's behavior (the Windows pseudoconsole mode), which handles line wrapping differently on resize.

### When the window resizes

When the terminal grows, ConPTY adds the new rows at the bottom and the prompt would end up in the middle of the screen. In PowerShell, Beauty Shell sends a key combination nobody types (<kbd>Ctrl+Alt+Shift+F12</kbd>) and the integration responds by scrolling the content down and telling PSReadLine where its prompt ended up, without erasing anything.

The strip with the Windows controls doesn't resize the terminals either: if they shrank and grew back, ConPTY would leave empty rows every time the mouse passed by. Instead, the top edge of the panes is clipped within the margin they already have.

## The shells

When opening a shell, Rust adds the [integration](/en/shell/docs/shells/) that reports the folder and marks commands, and the environment variables (`TERM`, `VIDRIO_SESSION`…). If the chosen shell doesn't exist, it opens Windows PowerShell.

## The built-in browser

Each page is a **child WebView2 view** of the window, which Rust creates and places over the pane's slot. The interface tells it where to go every time the pane moves or resizes.

A native view is drawn above all the HTML, which forces a few things:

- **It hides** while a menu, the palette, settings or a drag has to be seen on top.
- **It's swapped for a photo** when the hidden sidebar floats in: Rust asks WebView2 for a capture (`CapturePreview`, as JPEG), the interface puts it in the slot and only then hides the view. The sidebar waits for the photo for 250 ms at most.
- **It waits until it's ready**: the view is created asynchronously, and whatever changes in the meantime (position, size, visibility) is applied when it finishes being created.
- **It's cleaned up on start**: native views survive a reload of the interface, so on start any left over from before are closed.

## The MCP server

Rust opens an HTTP server on `127.0.0.1` (from port 47437) that speaks [MCP](/en/shell/docs/mcp/). When an agent calls a tool, Rust hands the request to the interface, which is what knows the terminals, their screens and the bubble animation, and waits up to 20 seconds for the reply.

## Persistence

Settings, sessions, suggestion history and workspaces are saved in WebView2's local storage, in `%LOCALAPPDATA%\dev.vidrio.terminal`. Rust also reads, only to make suggestions, the history PowerShell already keeps on your computer.

## Updates

Tauri's updater plugin checks a `latest.json` published on GitHub. The installer is signed with minisign and the app rejects it if the signature doesn't match the public key it carries. The update downloads on its own and is installed when the person decides.

## The code

```
src/                 the interface (TypeScript)
  main.ts            startup, tabs, drag and drop, shortcuts, window
  session.ts         a terminal pane: xterm.js + the session, title, folder, status
  browser.ts         a browser pane
  layout.ts          the tree of split panes
  sidebar.ts         the sidebar grouped by folder
  tabstrip.ts        tabs on top
  predict.ts         suggestions
  settings.ts        settings and their page
src-tauri/src/       the core (Rust)
  pty.rs             ConPTY: open, write, resize, close
  browser.rs         the browser's WebView2 views
  mcp.rs             the MCP server
  agents.rs          finding installed agents
  editor.rs          which paths exist and opening them in VS Code
  quake.rs           Quake mode
  predict.rs         PowerShell's history and the folders for cd
```

---
lang: en
id: browser
description: "Beauty Shell's built-in browser, to see your local servers next to the terminal."
lead: "Beauty Shell has a browser inside, so you can see your dev server next to the terminal running it."
---

## Open a page

- **Click a local address** that shows up in the terminal, like the `http://localhost:5173` that `npm run dev` prints. It opens inside, in its own tab. `0.0.0.0` addresses (the ones `vite --host` prints) open as `localhost`.
- <kbd>Ctrl+Shift+O</kbd> opens an empty browser tab.
- In the [palette](/en/shell/docs/tools/): **Open browser** or **Open page…**
- Right-click **New terminal**: **Browser**.

Addresses that aren't local don't open inside: <kbd>Ctrl</kbd>+click opens them in your usual browser.

## The bar

Each page has its bar with **back**, **forward**, **reload**, the **address**, **open in your browser** and **close**.

In the address you can type:

- A full address (`https://…`, `file://…`).
- A local server, without `http://`: `localhost:3000`, `127.0.0.1:8080`.
- A domain: `github.com` opens as `https://github.com`.
- Anything else is searched on Google.

As you type, it suggests the local servers that showed up in your terminals.

| To | Shortcut |
| --- | --- |
| Go to the address | <kbd>Ctrl+L</kbd> |
| Reload | <kbd>Ctrl+R</kbd> or <kbd>F5</kbd> |
| Back / forward | <kbd>Alt+←</kbd> / <kbd>Alt+→</kbd> |
| Open a browser | <kbd>Ctrl+Shift+O</kbd> |
| Close | <kbd>Ctrl+W</kbd> |

Links that ask for another window (`target="_blank"`) open in a new tab of the built-in browser.

## It's just another pane

A page behaves just like a terminal: it goes in its tab, can be dragged, split next to a terminal (to have the server and the page together), split off and renamed. When the session is restored, it comes back with its address.

## How it's built

Each page is a **WebView2** view (the Microsoft Edge engine) that Beauty Shell places over the pane's slot. A native view is drawn above everything else, so:

- While a menu, the palette, settings or a drag is on screen, the page hides so it doesn't cover them.
- When the hidden sidebar floats in over it, Beauty Shell first takes a **photo of the page** and puts it in its place, so the sidebar slides over the photo. Meanwhile the page stays frozen; when the sidebar leaves, the real one comes back.

The details are in [Architecture](/en/shell/docs/architecture/).

## Agents use it

Agents connected to the [MCP server](/en/shell/docs/mcp/) can **open** a page to show you their work (`open_browser`) and **read** its text to check it (`read_browser`).

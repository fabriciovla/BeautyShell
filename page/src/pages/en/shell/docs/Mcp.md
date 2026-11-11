---
lang: en
id: mcp
description: "Beauty Shell's local MCP server, how to connect it to Claude Code and the reference for its five tools."
lead: "Beauty Shell opens an MCP server on your computer so agents in one terminal can see the others, write to them and use the built-in browser."
---

## What it is

**MCP** (Model Context Protocol) is the protocol coding agents use to get tools. Beauty Shell opens an MCP server **only on `127.0.0.1`**: it can't be reached from the internet or from other devices on your network.

- **Port**: the first free one from `47437` (if two Beauty Shell windows are open, the second uses the next one). You see it in **Settings → Agents → Local MCP server**.
- **Transport**: MCP over HTTP, replying with plain JSON (no SSE).
- **Who's calling**: each terminal gets `VIDRIO_SESSION` (its id) and `VIDRIO_MCP_PORT`. The configuration registered in Claude Code sends them in the URL and in a header, so Beauty Shell knows which terminal each request comes from.

## Connect Claude Code

1. Open **Settings → Agents**.
2. Under **Messages between sessions**, press **Connect** next to Claude Code.
3. **Restart** the Claude Code sessions that were already open, so they pick up the connection.

Under the hood, Beauty Shell runs:

```powershell
claude mcp add-json --scope user vidrio "<configuration>"
```

That is, it registers itself as the `vidrio` MCP server in your Claude Code user configuration (`~\.claude.json`), so it's available in all your folders. **Connect again** removes it and adds it back. To disconnect it:

```powershell
claude mcp remove --scope user vidrio
```

Other agents that speak MCP over HTTP can be connected by hand with the same address.

## Tools

### list_sessions

Lists the open terminals: id, name, folder and whether they're working. The calling agent's own is marked.

No parameters.

### read_screen

Returns the last lines another terminal is showing.

| Parameter | Type | Description |
| --- | --- | --- |
| `session` | string, required | The session's id (from `list_sessions`) or part of its name. |
| `lines` | integer, 1 to 400 | How many lines. 40 by default. |

### send_to_session

Types a message into another terminal's input and sends it, as if the user typed it. It's for talking to the agent running there. The message arrives **signed** with the sending session's name and id.

| Parameter | Type | Description |
| --- | --- | --- |
| `to` | string, required | The session's id or part of its name. |
| `text` | string, required | The message. It has to stand on its own: the other agent doesn't know your conversation. |
| `submit` | boolean | Press Enter after typing. Yes by default. |

On screen, the message leaves the sending terminal as a **bubble**, travels in an arc to the receiving one's text box and is only typed when it lands.

### open_browser

Opens a page in the [built-in browser](/en/shell/docs/browser/), in its own tab, and shows it to the user. Useful to show a dev server or some documentation.

| Parameter | Type | Description |
| --- | --- | --- |
| `url` | string, required | The address. Without a scheme, `https://` is assumed (or `http://` for `localhost`). |
| `background` | boolean | Open it without switching tabs. No by default: it's shown. |

### read_browser

Returns the title, address and visible text of a built-in browser tab. Without saying which, it uses the last one used.

| Parameter | Type | Description |
| --- | --- | --- |
| `tab` | string | Part of the tab's title or address. |
| `max_chars` | integer, 200 to 50,000 | Maximum amount of text. 8,000 by default. |

## Limits

- Each request waits for the app's reply for up to **20 seconds**. Reading a page waits up to 10.
- The tools are resolved by Beauty Shell's interface, which is what knows the terminals' names, their screens and the animation. If the window doesn't respond, the agent gets an error.
- A connected agent can read and write in any terminal in that window. Only connect agents you trust.

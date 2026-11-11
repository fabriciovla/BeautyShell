---
lang: en
id: settings
description: "Every Beauty Shell setting, with its possible values and its default."
lead: "Every option in Settings (Ctrl+,), with its possible values and its factory default. Changes apply on the spot and are saved automatically."
---

## How they're saved

Settings are saved on your computer as soon as you change them, in the app's data folder (see [Installation](/en/shell/docs/installation/)). There's no configuration file to edit by hand: everything is changed from **Settings**, which has a search box (<kbd>Ctrl+F</kbd>) to find any option.

## Appearance

| Setting | Values | Default |
| --- | --- | --- |
| Theme | Light, Dark, Like Windows | Light |
| Background → Window | Acrylic, Mica, Solid | Acrylic |
| Background → Glass | 0 to 100% (with Acrylic or Mica) | 75% |
| Background → Terminal | Pure, Gray, Glass | Pure |
| Background → Opacity | 30 to 100% (with the terminal set to Glass) | 72% |
| Tabs | On the side, Top | On the side |
| Text → Font | 15 typefaces (see [Appearance](/en/shell/docs/appearance/)) | JetBrains Mono |
| Text → Font size | 9 to 28 | 13 |
| Text → Weight | Thin, Normal, Medium, Semi, Bold | Normal |
| Text → Line height | 1.00 to 1.60, in steps of 0.05 | 1.00 |

## Terminal

| Setting | Values | Default |
| --- | --- | --- |
| Shell → Default | The installed shells (see [Shells](/en/shell/docs/shells/)) | PowerShell 7 |
| Cursor → Shape | Bar, Block, Underline | Bar |
| Cursor → Blink | Yes, No | Yes |
| Typing → Copy on select | Yes, No | No |
| Typing → Suggest as you type | Yes, No | Yes |
| History → Scrollback lines | 1,000, 2,000, 5,000, 10,000, 25,000, 50,000 or 100,000 | 10,000 |
| History → Restore on open | Yes, No | Yes |
| Notifications → Notify when done | Yes, No | Yes |

**Scrollback lines** are the ones kept above the visible screen, in each terminal. More lines use more memory.

**Notify when done** notifies you when a command took more than 10 seconds and Beauty Shell isn't in front.

## Agents

| Setting | What it does |
| --- | --- |
| Installed | Shows which agents it found and where. **Search again** repeats the search; **Install** runs the official installer in a terminal. |
| Messages between sessions → Claude Code | **Connect** registers Beauty Shell as an MCP server in Claude Code. See [MCP server](/en/shell/docs/mcp/). |
| Local MCP server | Shows the server's address and port (`127.0.0.1:47437` or the next free one). |

## Keybindings and About

**Keybindings** shows every keyboard shortcut, grouped (see [Keybindings](/en/shell/docs/keybindings/)). **About** shows the installed version and, if an update has been downloaded, the button to install it.

## What's set outside Settings

| What | Where | Default |
| --- | --- | --- |
| Sidebar pinned or hidden | <kbd>Ctrl+Shift+B</kbd> or the button at the bottom of the sidebar | Pinned |
| Sidebar width | Dragging its right edge, from 200 to 420 pixels | 260 |
| Font size | <kbd>Ctrl+=</kbd>, <kbd>Ctrl+-</kbd>, <kbd>Ctrl+0</kbd> | 13 |

---
lang: en
id: tabs
description: "How Beauty Shell groups tabs by folder, what each status means and how to move, rename and close them."
lead: "Terminals sort themselves by the folder they're in. Here's how the sidebar and the tab strip work."
---

## Grouped by folder

Each tab in the sidebar falls inside the **folder** its terminal is in, and each folder is a sheet with its name on top. You don't sort them: if you run `cd ..\other-project` in a terminal, the tab moves by itself to that folder's group (and creates it if it didn't exist).

Beauty Shell knows which folder each terminal is in because the shell tells it after every command, with an [escape sequence](/en/shell/docs/escape-sequences/). It works in PowerShell, cmd and Git Bash; in WSL the window title is used.

### Collapse a folder

Click the folder's name to collapse it. Collapsed, it shows how many tabs it has. The active tab's folder never collapses, so you don't lose sight of it.

The **+** that appears when you point at the name opens a new terminal in that folder.

## What each tab says

Below the name, the tab shows a second line only when there's something to say:

| Status | What it means |
| --- | --- |
| **working…** | Some pane in the tab is running a command. |
| **waiting for reply** | A program (a coding agent, for example) is asking you something: a permission, an answer. |
| **finished · code N** | The terminal's process ended, with that exit code. |
| **new activity** | There was new output while you were looking at another tab. |
| **types into all** | What you type goes to every pane in the tab (see [Panes](/en/shell/docs/panes/)). |
| **N panes** | The tab is split; its panes hang below it, like a tree. |
| *an address* | In a browser tab, the site that's open. |

The app's interface is in Spanish, so these show as *trabajando…*, *esperando respuesta*, *terminó · código N*, *actividad nueva*, *escribe en todos* and *N paneles*.

While you hold <kbd>Ctrl</kbd>, each tab shows its number: <kbd>Ctrl+1</kbd> to <kbd>Ctrl+8</kbd> go to that tab and <kbd>Ctrl+9</kbd> to the last one.

## Rename, close and reopen

- **Rename**: double-click the tab, or *Rename* in its menu (right-click). The name is saved with the session.
- **Close**: the **×** that appears when you point at it, a middle click, or <kbd>Ctrl+Shift+W</kbd>. <kbd>Ctrl+W</kbd> closes only the active pane.
- **Reopen the last closed**: <kbd>Ctrl+Shift+T</kbd>. It comes back with its panes and its folder.

## Move a terminal to another folder

Drag the tab and drop it on another folder in the sidebar: the terminal runs `cd` there and joins that group.

While you drag, a glass panel also slides up from the bottom of the window with **the open folders** and **Other folder…**, handy when the sidebar is hidden. If you drag a pane from a split tab, that pane adds **New tab**, which splits it off.

A **busy** terminal (running something) can't change folders: Beauty Shell tells you instead of typing a `cd` over what's running.

## Hide the sidebar

<kbd>Ctrl+Shift+B</kbd> hides the sidebar (so does the button at the bottom right of the sidebar). Hidden:

- **It floats in** when you move the mouse to the window's left edge.
- **It goes away on its own** when the mouse leaves it, or after two and a half seconds if the mouse never gets in.
- When you switch tabs with the keyboard, a short notice at the top shows **the folder and the tab** you went to.

The sidebar's width changes by dragging its right edge.

## Tabs on top

If you prefer tabs in a horizontal strip, like in Chrome, choose **Settings → Appearance → Tabs → Top** (or *Tabs on top* in the [palette](/en/shell/docs/tools/)).

In the strip, tabs aren't grouped by folder: they stay in the order you choose, and you reorder them by dragging them along the strip. The Windows controls stay fixed on the right. Everything else (splitting, dragging over the terminal, each tab's menu) works the same.

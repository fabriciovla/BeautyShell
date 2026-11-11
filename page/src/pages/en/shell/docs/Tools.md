---
lang: en
id: tools
description: "Beauty Shell's command palette, workspaces, restored sessions, Quake mode, clickable paths and notifications."
lead: "The tools that make everyday work faster: the command palette, workspaces, Quake mode and a few more details."
---

## Command palette

<kbd>Ctrl+Shift+P</kbd> opens a search box with **every action** in the app and **every open terminal**. Type part of what you're looking for and press <kbd>Enter</kbd>. The search ignores case and accents.

What you'll find there:

- **Open**: new terminal, new terminal with each installed shell, open in folder, open browser, open page.
- **Panes**: split right or down, enlarge or shrink the pane, type into all panes.
- **Terminal**: search, go to the previous or next command, rename.
- **Close**: the pane, the tab, and reopen the last closed.
- **Workspaces**: save, open and delete.
- **Window**: notifications when done, pin or hide the sidebar, tabs on the side or on top, settings, full screen, font size and exit Quake mode.
- **Go to**: every open terminal and page, with its folder next to it.

## Workspaces

A workspace saves your tabs **with their panes, their folders and the command that was running in each one** (`npm run dev`, `claude`, `docker compose up`). When you open it, everything is rebuilt and each command runs again.

- **Save**: in the palette, **Save workspace…**, and choose a name.
- **Open**: **Open workspace: *name*** in the palette. They open in new tabs, next to the ones you had.
- **Delete**: **Delete workspace: *name***.

Beauty Shell knows which command was running in each pane thanks to the [shell integration](/en/shell/docs/shells/), so it works in PowerShell, cmd and Git Bash.

## Restored sessions

With **Restore on open** on (it is by default), when you reopen Beauty Shell your tabs, split panes, folders, names and browser pages come back. What was running isn't run again (that's what workspaces are for): each pane opens its shell in its folder.

## Quake mode

<kbd>Win+`</kbd>, from any program, drops Beauty Shell down from the top of the screen the mouse is on, at full width and half height. The same shortcut hides it again. To put the window back where it was, choose **Exit Quake mode** in the palette.

If the shortcut doesn't respond, another program may have it taken (Windows Terminal uses the same one for its own Quake mode).

## Clickable paths and links

- **File paths**: <kbd>Ctrl</kbd>+click on a path in the output opens it in **VS Code, at the line and column** given. It understands the formats compilers leave: `src\main.ts:363`, `C:\x\a.rs:10:5`, `./lib/b.py(12,3)`. Only paths that really exist get underlined. A folder, or a file if you don't have VS Code, opens with the Windows default program.
- **Links**: <kbd>Ctrl</kbd>+click opens a link in your browser. Local ones (`localhost`) open with a single click in the [built-in browser](/en/shell/docs/browser/).

## Copy, paste and drop

- **Copy**: <kbd>Ctrl+C</kbd> with text selected copies it (with no selection, it sends Ctrl+C to the terminal as usual). <kbd>Ctrl+Shift+C</kbd> too. With **Copy on select** on, selecting already copies.
- **Paste**: <kbd>Ctrl+V</kbd> or <kbd>Ctrl+Shift+V</kbd>.
- **Right-click** on the terminal: copies if there's a selection, and pastes otherwise.
- **Dropping files** on the terminal types their paths, separated by spaces and in quotes if they contain spaces.

## Search the terminal

<kbd>Ctrl+F</kbd> opens the active pane's search box, with the number of results. <kbd>Enter</kbd> goes to the next, <kbd>Shift+Enter</kbd> to the previous and <kbd>Esc</kbd> closes it.

## Jump between commands

In PowerShell, <kbd>Ctrl+↑</kbd> and <kbd>Ctrl+↓</kbd> take you to the previous or next command in the output, without scrolling for them.

## Notifications

- **When done**: if a command or an agent worked for more than **10 seconds** and Beauty Shell isn't in front, Windows notifies you and the taskbar icon flashes. Turn them off from the palette or in **Settings → Terminal → Notifications**.
- **Waiting for reply**: when a program asks for your attention (an agent that needs a permission, for example), the tab marks it and a notification arrives. See [Agents](/en/shell/docs/agents/).

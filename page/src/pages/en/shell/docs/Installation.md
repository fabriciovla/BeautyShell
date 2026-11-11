---
lang: en
id: install
description: "How to install, update and uninstall Beauty Shell on Windows, and where it keeps its files."
lead: "How to install Beauty Shell, how it updates and what stays on your computer."
---

## Requirements

- **Windows 11.** Beauty Shell is designed for Windows 11: it uses its window effects (acrylic and Mica) and its notifications.
- **WebView2**, the Microsoft Edge engine that draws the interface. It ships with Windows 11; if it were missing, the installer downloads it.
- **At least one shell.** PowerShell 7 is recommended (it's the one with suggestions), but Windows PowerShell, cmd, Git Bash and WSL work too. See [Supported shells](/en/shell/docs/shells/).

You don't need an account or an internet connection to use it.

## Install

1. Download the installer from the **Download** button on this site.
2. Open it. It installs **for your user**, in `%LOCALAPPDATA%\Beauty Shell`, so it doesn't ask for administrator rights.
3. When it's done, Beauty Shell opens with the [welcome tour](/en/shell/docs/first-steps/).

It also shows up in the Start menu as **Beauty Shell**. You can pin it to the taskbar like any app.

## Updates

Beauty Shell checks for updates on its own. When there's a new version:

1. It downloads it in the background, without interrupting you.
2. Only then it lets you know with a floating notice, and you also see it in **Settings → About**.
3. You install it whenever you want. **It never restarts by itself**: restarting closes what's running in your terminals, so it's your call. If you have [Restore on open](/en/shell/docs/settings/) on, your tabs come back as they were.

Updates are published on GitHub and come **signed**. The app carries the public key and rejects any update whose signature doesn't match.

## Uninstall

From **Windows Settings → Apps → Installed apps**, find Beauty Shell and choose **Uninstall**.

The uninstaller offers to delete the app's data too. If you didn't check it and want a fresh start, delete the data folder by hand (below).

## Where it keeps things

| What | Where |
| --- | --- |
| The program | `%LOCALAPPDATA%\Beauty Shell` |
| Settings, sessions, suggestion history and workspaces | `%LOCALAPPDATA%\dev.vidrio.terminal` |
| Claude Code configuration (if you connect it) | `~\.claude.json`, as the `vidrio` MCP server |

None of this leaves your computer. See the [privacy policy](/en/privacy/).

## Microsoft Store version

Beauty Shell can also be packaged as MSIX for the Microsoft Store. In that version, updates are handled by the Store.

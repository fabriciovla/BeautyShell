---
lang: en
id: troubleshooting
description: "Solutions to the most common Beauty Shell problems."
lead: "What usually happens and how to fix it."
---

## No suggestions appear as I type

- Suggestions work in **PowerShell** (7 and 5.1), not in cmd, Git Bash or WSL.
- Check that **Settings → Terminal → Typing → Suggest as you type** is on.
- With a single letter nothing is suggested, and what comes from other folders only appears with three. See [Suggestions](/en/shell/docs/suggestions/).

## Ctrl+W or Ctrl+F don't reach my program

Beauty Shell uses them to close the pane and to search. In bash, instead of <kbd>Ctrl+W</kbd> (delete the previous word) use <kbd>Alt+Backspace</kbd>, and instead of <kbd>Ctrl+F</kbd> (move forward one character) use <kbd>→</kbd>.

## Win+` doesn't open Quake mode

Another program has the shortcut taken. The most common one is Windows Terminal, which uses the same one for its own Quake mode: turn it off in its settings or close it.

## The tab isn't grouped by folder

Beauty Shell knows the folder because the shell reports it. If it isn't grouped:

- In **WSL** the folder comes from the title, so it depends on your shell putting the path in the title.
- In **Git Bash**, if your `.bashrc` replaces `PROMPT_COMMAND`, add the OSC 7 line to it (it's in [Escape sequences](/en/shell/docs/escape-sequences/)).
- In **cmd**, if you change `PROMPT`, start it with `$E]9;9;$P$E\`.

## Messages between sessions don't work

1. In **Settings → Agents**, check that Claude Code says **Connected** and that the MCP server has a port.
2. **Restart** the Claude Code sessions that were open before connecting.
3. In a terminal, `claude mcp list` should show the `vidrio` server.

If it still doesn't work, **Connect again** registers it once more. See [MCP server](/en/shell/docs/mcp/).

## I'm not getting notifications

- Check **Settings → Terminal → Notifications → Notify when done**, or *Turn on notifications when done* in the palette.
- Notifications only arrive if Beauty Shell **isn't in front** and the command took more than 10 seconds.
- Check that Windows doesn't have **Do not disturb** on and that Beauty Shell is allowed to notify in **Settings → System → Notifications**.

## With the glass background, a program leaves a dark rectangle

Beauty Shell makes transparent the backgrounds a program paints with the same color as the terminal. A rectangle that stays is a background of **another** color, which the program chose on purpose (a diff, a selection). If it bothers you, try the **Pure** or **Gray** background.

## The prompt ended up in the middle of the screen

In PowerShell, Beauty Shell fixes it on its own when you enlarge the window. In other shells, `cls` (or `clear`) brings it back to the top.

## A browser page stays on top of everything

The page hides on its own while there's a menu, the palette or a drag on screen. If it ever stayed on top of something, close that tab and open it again.

## I want to start from scratch

Close Beauty Shell and delete the `%LOCALAPPDATA%\dev.vidrio.terminal` folder. Next time you open it, it'll be as if freshly installed, welcome tour included.

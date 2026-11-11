---
lang: en
id: sequences
description: "The escape sequences (VT and OSC) Beauty Shell understands and how to use them from your scripts and prompts."
lead: "On top of what any xterm-compatible terminal understands, Beauty Shell listens to a few OSC sequences to know where each terminal is, what it's running and when it needs you."
---

## The base: xterm-compatible

The terminal is **xterm.js**, the same engine VS Code uses. It emulates an xterm-compatible terminal, so console programs work as they expect: 256 and 24-bit colors (*truecolor*), the alternate screen (the one `vim`, `less` or `htop` use), mouse tracking, bracketed paste, text styles and **Unicode 11** character widths (emoji and wide characters take two cells).

Each terminal announces `TERM=xterm-256color` and `COLORTERM=truecolor` (see [Shells](/en/shell/docs/shells/)).

## Sequences Beauty Shell listens to

An OSC sequence starts with `ESC ]` and ends with `BEL` (`\a`, character 7) or with `ESC \`. These are the ones Beauty Shell uses:

| Sequence | What for |
| --- | --- |
| `OSC 0 ; title` / `OSC 2 ; title` | The terminal's title. If it's a path, it also tells the folder. |
| `OSC 7 ; file://host/path` | The current folder, bash and zsh style. Git Bash uses it. |
| `OSC 9 ; 9 ; path` | The current folder, Windows Terminal style. PowerShell and cmd use it. |
| `OSC 9 ; text` | A notification (iTerm2 style): the tab switches to **waiting for reply** with that text. |
| `OSC 777 ; notify ; title ; body` | A notification (kitty and Ghostty style): same as the previous one. |
| `OSC 11 ; ?` | Asks for the background color. With the terminal set to Glass, Beauty Shell answers with the theme's color and not "transparent", so the program picks its colors right. |
| `OSC 133 ; A` | The prompt starts. |
| `OSC 133 ; B` | The prompt ends: what the person types starts. |
| `OSC 133 ; C` | The command starts: the terminal switches to **working**. |
| `OSC 133 ; D ; code` | The command ended, with its exit code. |
| `OSC 7701 ; base64` | The text of the command about to run, in base64 (UTF-8). Beauty Shell's own. |
| A lone `BEL` | The bell. If you aren't looking at that terminal, it's marked as **waiting for reply**. |

`OSC 9` sequences with a number in front (for example `OSC 9 ; 4`, Windows Terminal's progress bar) are ignored.

### What Beauty Shell does with each one

- **Folder** (OSC 7 and 9;9): groups the tab in the sidebar, opens new terminals there and saves it for restoring.
- **Marks** (OSC 133): tell when a terminal is busy, how long each command took (for [notifications](/en/shell/docs/tools/)), whether it failed (for [suggestions](/en/shell/docs/suggestions/)) and where each command starts (for <kbd>Ctrl+↑</kbd> and <kbd>Ctrl+↓</kbd>).
- **Command text** (OSC 7701): the tab's subtitle and what's saved in a [workspace](/en/shell/docs/tools/).
- **Notifications** (OSC 9, 777 and BEL): the **waiting for reply** status and the Windows notification.

## Using them from your scripts

### Notify when something finishes

From PowerShell 7, at the end of a long script:

```powershell
Write-Host -NoNewline "`e]9;Build finished`a"
```

From bash:

```bash
printf '\e]777;notify;Build;Finished with no errors\a'
```

If you're in another tab or another window, the tab gets marked and a Windows notification arrives with that text.

### Report the folder from your own prompt

If your `.bashrc` replaces `PROMPT_COMMAND`, add the sequence so Beauty Shell keeps knowing where you are:

```bash
PROMPT_COMMAND='printf "\e]7;file://%s%s\e\\" "$HOSTNAME" "$PWD"'
```

In cmd, if you change `PROMPT`, start it with `$E]9;9;$P$E\`:

```bat
set PROMPT=$E]9;9;$P$E\$P$G
```

In PowerShell you don't need to: Beauty Shell wraps your `prompt` function, whatever it is.

### Mark commands in another shell

A shell that emits the OSC 133 marks in its prompt (as the VS Code and Windows Terminal integrations do) gets, in Beauty Shell, the **working** status, notifications when done and jumping between commands:

```bash
# before the prompt (with the last command's exit code):
printf '\e]133;D;%s\a' "$?"
printf '\e]133;A\a'
# at the end of the prompt:
printf '\e]133;B\a'
# right before running the command:
printf '\e]133;C\a'
```

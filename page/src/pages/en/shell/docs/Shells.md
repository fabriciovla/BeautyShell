---
lang: en
id: shells
description: "The shells Beauty Shell opens, where it looks for them, how it integrates with each one and which environment variables they get."
lead: "Beauty Shell opens the shells you already have installed and integrates with each one to know where it is and what it's doing."
---

## Supported shells

| Shell | Id | Where it looks |
| --- | --- | --- |
| PowerShell 7 | `pwsh` | In `PATH`, in `C:\Program Files\PowerShell\7\` and the Microsoft Store version. |
| Windows PowerShell 5.1 | `powershell` | `%SystemRoot%\System32\WindowsPowerShell\v1.0\` (ships with Windows). |
| Command Prompt | `cmd` | `%SystemRoot%\System32\cmd.exe` |
| Git Bash | `gitbash` | `C:\Program Files\Git\bin\bash.exe`, with `--login -i`. |
| WSL | `wsl` | `%SystemRoot%\System32\wsl.exe`, with your default distribution. |

Only installed ones show up. The default is chosen in **Settings → Terminal → Shell**; to open another one occasionally, right-click **New terminal**. If the chosen one isn't there, Beauty Shell opens Windows PowerShell.

We recommend **PowerShell 7**: it's the one with [suggestions](/en/shell/docs/suggestions/), jumping between commands and the most complete integration.

## What the integration does

To group by folder, show each tab's status and save commands in [workspaces](/en/shell/docs/tools/), the shell has to tell Beauty Shell what's going on. It does so with invisible [escape sequences](/en/shell/docs/escape-sequences/), which Beauty Shell adds when starting each shell without touching your configuration files.

### PowerShell 7 and Windows PowerShell

Beauty Shell opens PowerShell with `-NoLogo -NoExit` and a small script that **wraps your `prompt` function**, even if you use oh-my-posh or another theme: your prompt still looks the same. On every turn, the script:

- Reports the **current folder** (OSC 9;9) and sets it as the window title.
- Marks the **start of the prompt, the start of what you type, the start of the command and its end with the exit code** (OSC 133 A, B, C and D).
- Before running each command, sends its **text** (OSC 7701, Beauty Shell's own).

Also:

- **It turns off PSReadLine's suggestions**, because Beauty Shell draws its own, which know which folder you're in.
- **It removes PowerShell 7's default colors in listings** (folders with a blue background, green headers) and leaves them in bold. If your profile already changed them, it leaves them alone.
- It makes `cls` and <kbd>Ctrl+L</kbd> leave the prompt **at the very bottom**, just like when the terminal opens.

### cmd

Beauty Shell sets the `PROMPT` variable to `$E]9;9;$P$E\$P$G`: the usual prompt (`C:\folder>`) preceded by the sequence that reports the folder. cmd doesn't report when a command starts or ends.

### Git Bash

Beauty Shell sets `PROMPT_COMMAND` so bash reports the folder with OSC 7 (`file://host/path`) before each prompt.

### WSL

WSL opens your distribution unchanged. The folder comes from the title your shell sets, if it's a path.

## Environment variables

Each terminal starts with these variables, on top of yours:

| Variable | Value | What for |
| --- | --- | --- |
| `TERM` | `xterm-256color` | So programs know which sequences they can use. |
| `COLORTERM` | `truecolor` | So they use 24-bit colors. |
| `TERM_PROGRAM` | `BeautyShell` | So a script knows it's running in Beauty Shell. |
| `TERM_PROGRAM_VERSION` | The app's version | The same, with the version. |
| `VIDRIO_SESSION` | This terminal's id | So an agent can identify itself to the [MCP server](/en/shell/docs/mcp/). |
| `VIDRIO_MCP_PORT` | The MCP server's port | Where to find it (from `47437`). |

For example, to do something only inside Beauty Shell in your PowerShell profile:

```powershell
if ($env:TERM_PROGRAM -eq 'BeautyShell') {
  # whatever you want
}
```

## The pseudoconsole

Every shell runs on **ConPTY**, the Windows pseudoconsole, just like in Windows Terminal. The terminal is drawn with xterm.js, configured for ConPTY's behavior. Details in [Architecture](/en/shell/docs/architecture/).

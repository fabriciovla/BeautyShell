---
lang: en
id: agents
description: "How Beauty Shell detects, installs and follows coding agents like Claude Code, Codex or Gemini CLI."
lead: "Coding agents spend minutes working, ask for permissions and ask questions. Beauty Shell pays attention to all of it."
---

## Agents it recognizes

In **Settings → Agents**, Beauty Shell looks for these agents on your computer:

| Agent | Command |
| --- | --- |
| Claude Code | `claude` |
| Codex | `codex` |
| Gemini CLI | `gemini` |
| GitHub Copilot | `copilot` |
| Cursor Agent | `cursor-agent` |
| OpenCode | `opencode` |
| Qwen Code | `qwen` |
| Kimi CLI | `kimi` |
| Amp | `amp` |
| Aider | `aider` |
| Goose | `goose` |
| Crush | `crush` |

It looks in `PATH` and also in the folders where their installers put them (Claude Code's, npm, bun, cargo, pipx…), so it finds them even if you installed one with the app open. It tries each executable extension (`.exe`, `.cmd`, `.bat`) in order, like cmd. **Search again** repeats the search.

## Install an agent

The ones you don't have show **Install**: the button opens a new terminal and runs that agent's official install command there, so you can see what happens. For example, Claude Code installs with:

```powershell
irm https://claude.ai/install.ps1 | iex
```

If an agent has no reliable command for Windows, the button says **How to install it** and opens its page.

## Status in the sidebar

Type any agent's command in a terminal and Beauty Shell follows its status:

- **working…** while it runs.
- **waiting for reply** when it asks you something. Beauty Shell detects it when the program:
  - sends a terminal notification (OSC 9 with text, iTerm2-style, or OSC 777;notify, kitty- and Ghostty-style), or
  - rings the **bell** (the BEL character), which is what Claude Code does when it waits.
- If you're in another window, a **Windows notification** with the program's message also arrives.

## Glass and agents

With the terminal background set to **Glass**, only the "default" background lets the acrylic through. Claude Code paints the box where you type with the same color as the terminal background, which left a solid rectangle on the glass. Beauty Shell fixes this: backgrounds equal to the terminal's are rewritten as "default" before being drawn. Backgrounds of other colors (a diff's, a selection's or a highlight's) stay as they are.

Also, when a program asks for the background color (OSC 11) to pick its colors, Beauty Shell answers with the theme's color and not "transparent".

## Agents that talk to each other

An agent running in one terminal can **see the others, read their screen and write to them**, and also open and read pages in the built-in browser. All of that goes through Beauty Shell's local [MCP server](/en/shell/docs/mcp/).

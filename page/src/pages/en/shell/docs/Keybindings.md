---
lang: en
id: keys
description: "Every Beauty Shell keybinding, for tabs, panes, the terminal, the browser and the window."
lead: "The same as Chrome, plus a terminal's own. You'll also find them in Settings → Keybindings."
---

## Tabs

| Action | Shortcut |
| --- | --- |
| New terminal in the same folder | <kbd>Ctrl+T</kbd> |
| Close tab | <kbd>Ctrl+Shift+W</kbd> |
| Reopen the last closed | <kbd>Ctrl+Shift+T</kbd> |
| Next tab | <kbd>Ctrl+Tab</kbd> or <kbd>Ctrl+PgDn</kbd> |
| Previous tab | <kbd>Ctrl+Shift+Tab</kbd> or <kbd>Ctrl+PgUp</kbd> |
| Go to tab 1…8 | <kbd>Ctrl+1</kbd> … <kbd>Ctrl+8</kbd> |
| Go to the last tab | <kbd>Ctrl+9</kbd> |

## Panes

| Action | Shortcut |
| --- | --- |
| Split right | <kbd>Ctrl+Shift+D</kbd> |
| Split down | <kbd>Ctrl+Shift+E</kbd> |
| Enlarge or shrink the pane | <kbd>Ctrl+Shift+Z</kbd> |
| Close pane | <kbd>Ctrl+W</kbd> |
| Move between panes | <kbd>Alt</kbd> + arrows |

## Terminal

| Action | Shortcut |
| --- | --- |
| Search | <kbd>Ctrl+F</kbd> |
| Go to the previous or next command (PowerShell) | <kbd>Ctrl+↑</kbd> / <kbd>Ctrl+↓</kbd> |
| Copy the selection | <kbd>Ctrl+C</kbd> or <kbd>Ctrl+Shift+C</kbd> |
| Paste | <kbd>Ctrl+V</kbd> or <kbd>Ctrl+Shift+V</kbd> |
| Accept the suggestion | <kbd>Tab</kbd> or <kbd>→</kbd> |
| Open a link or path | <kbd>Ctrl</kbd> + click |
| Bigger font | <kbd>Ctrl+=</kbd> |
| Smaller font | <kbd>Ctrl+-</kbd> |
| Original size | <kbd>Ctrl+0</kbd> |

## Built-in browser

| Action | Shortcut |
| --- | --- |
| Open a browser | <kbd>Ctrl+Shift+O</kbd> |
| Go to the address | <kbd>Ctrl+L</kbd> |
| Reload | <kbd>Ctrl+R</kbd> or <kbd>F5</kbd> |
| Back / forward | <kbd>Alt+←</kbd> / <kbd>Alt+→</kbd> |

## Window

| Action | Shortcut |
| --- | --- |
| Command palette | <kbd>Ctrl+Shift+P</kbd> |
| Show or hide the sidebar | <kbd>Ctrl+Shift+B</kbd> |
| Quake mode, from any program | <kbd>Win+`</kbd> |
| Full screen | <kbd>F11</kbd> |
| Settings | <kbd>Ctrl+,</kbd> |
| Search settings | <kbd>Ctrl+F</kbd>, with settings open |
| Close settings or menus | <kbd>Esc</kbd> |

## With the mouse

| Action | How |
| --- | --- |
| Rename a tab or pane | Double-click |
| Close a tab | Middle click |
| New terminal | Double-click the sidebar's empty space |
| Choose a shell or folder for the new terminal | Right-click **New terminal** |
| Copy or paste | Right-click on the terminal |
| Split | Drag a tab over the terminal |
| Maximize the window | Double-click the top strip |

## What Beauty Shell takes

<kbd>Ctrl+W</kbd> and <kbd>Ctrl+F</kbd> are used by Beauty Shell, so they don't reach the program running in the terminal. In bash, for example, <kbd>Ctrl+W</kbd> deletes the previous word and <kbd>Ctrl+F</kbd> moves forward one character: use <kbd>Alt+Backspace</kbd> and <kbd>→</kbd> there instead.

The app's shortcuts are handled before the terminal sees the key. Everything else reaches the program as is.

---
lang: en
id: panes
description: "How to split a Beauty Shell tab into several panes, move them, resize them, enlarge them and type into all of them at once."
lead: "A tab can have several panes, each with its own terminal or page. Here's how to split, move and manage them."
---

## Split

There are two ways:

- **With the keyboard**: <kbd>Ctrl+Shift+D</kbd> splits the active pane to the right and <kbd>Ctrl+Shift+E</kbd> splits it down. The new pane opens the same shell in the same folder.
- **By dragging**: grab a tab from the sidebar and drop it **over the terminal**, toward the edge where you want it (left, right, top or bottom). While you drag, a box shows you where it will land.

Next to a browser page, the new pane opens your default shell.

## Move around and resize

- <kbd>Alt</kbd> + arrows moves to the neighboring pane in that direction.
- Drag the **divider** between two panes to change how much space each one takes.
- The pane you're typing in has a dot in its header.

## Enlarge a pane

<kbd>Ctrl+Shift+Z</kbd> enlarges the active pane to fill the whole tab, covering the others. The others keep running behind it. The same shortcut puts it back.

## Type into all panes

From the tab's menu or the [palette](/en/shell/docs/tools/), **Type into all panes** sends what you type to every pane in the tab at once. It's useful, for example, to run the same command on several machines over SSH. The tab shows it and each pane is marked. You turn it off from the same place.

## Split a pane off

To move a pane back to its own tab:

- Choose **Move to another tab** in the pane's menu (right-click its row in the sidebar).
- Or drag its row in the sidebar and drop it on the sidebar.
- Or, while dragging it, drop it on **New tab** in the folder panel that slides up from the bottom. This works even if the terminal is busy.

## In the sidebar

A split tab shows **N panes** and, below it, its panes hanging like a tree. The active pane is in bold. Each row shows the loading circle if that pane is working, or a dot if it's waiting for your reply. From the row you can rename, close (<kbd>Ctrl+W</kbd>) or drag that pane alone.

## Close

<kbd>Ctrl+W</kbd> closes the active pane. If it was the last one, the tab closes. <kbd>Ctrl+Shift+W</kbd> closes the whole tab, with all its panes.

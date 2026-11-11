---
lang: en
id: suggestions
description: "How Beauty Shell chooses the gray suggestion that appears as you type in PowerShell."
lead: "As you type in PowerShell, the rest of the command appears in gray after the cursor. Unlike PSReadLine's, these know which folder you're in."
---

## How to use them

- Type the start of a command. If there's a suggestion, it appears in gray.
- <kbd>Tab</kbd> or <kbd>→</kbd> accept it.
- If there's no suggestion, <kbd>Tab</kbd> completes files and commands as usual.
- Typing more changes it or makes it disappear.

They work in **PowerShell 7 and Windows PowerShell**. Turn them off in **Settings → Terminal → Typing → Suggest as you type**.

## Why not PSReadLine's

PowerShell has its own suggestions (PSReadLine), but they offer any command from history that starts the same way, **regardless of where you are**. You type `cd ws` in one folder and it suggests `cd wsp-crm`, which only exists somewhere else. That's why Beauty Shell turns them off and draws its own.

## How it chooses

Every command you run is saved **together with the folder you ran it in** and the shell. To choose what to suggest:

1. **Failed commands aren't saved.** Beauty Shell knows how each command ended from its exit code (OSC 133;D), so a command with a typo isn't offered again.
2. **What you used in this folder wins.** Among the commands that start the same way, the ones you ran here come first.
3. **Then the most used and most recent**, from any folder.
4. **Finally, the history PowerShell already had** on your computer (PSReadLine's, without folders), so suggestions are useful from day one.

And a few rules so it doesn't get in the way:

- With **a single letter** typed, nothing is suggested.
- What comes **from other folders** only appears with three letters or more.
- A command that **depends on where it ran** (a relative `cd` or path) is never suggested from another folder.

## `cd` commands

In a `cd` (and `Set-Location`, `pushd` and their variants), **the folders that really exist where you are** take over. Beauty Shell lists them on the spot, so it only suggests a `cd` to a folder that's there. With nothing typed after the `cd`, it suggests nothing, because there's no way to guess.

## Where they're kept

The history with folders stays on your computer, along with the rest of the app's data (see [Installation](/en/shell/docs/installation/)). It isn't sent anywhere.

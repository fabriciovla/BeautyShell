---
lang: en
kind: legal
alt: /privacidad/
title: Privacy policy
description: What data Beauty Shell handles, where it stays and what the app connects to.
eyebrow: Legal
lead: The short version is that Beauty Shell has no accounts, doesn't track what you do and doesn't send what happens in your terminals to any server of ours. Here's the long version.
updated: October 22, 2026
---

## What we don't do

- **There are no accounts.** You use the app without signing up or logging in.
- **There's no analytics or telemetry.** Beauty Shell doesn't count how often you open it, which features you use or how long you spend in it.
- **We don't read your terminals.** What you type, the commands you run and what your terminals show stay on your computer. There's no Beauty Shell server that receives them.
- **We don't sell or share data**, because we don't collect it.

## What's stored on your computer

To work, the app saves a few things in your Windows user profile, in the `%LOCALAPPDATA%\dev.vidrio.terminal` folder. None of this leaves your computer:

- **Your settings**: theme, font, default shell and the rest of your preferences.
- **Your sessions**, to restore them when you reopen the app: the tabs, how panes are split, which folder each one is in and their names. If you turn off **Restore sessions** in Settings, they don't reopen.
- **History for suggestions**: each command you ran in PowerShell together with the folder you ran it in, so the ones you used there are suggested first. Commands that failed aren't saved. The app also reads the history PowerShell already keeps on your computer (PSReadLine's), only to make suggestions.
- **Your workspaces**, if you save any: the tabs, the folders and the command that was running in each pane.
- **Whether you've seen the welcome screen**, and your notification preferences.

If you uninstall the app and delete that folder, nothing is left.

## What the app connects to

Beauty Shell only connects to the internet in these cases:

- **To check for updates.** The app asks GitHub whether there's a new version and, if there is, downloads it from there. As with any download, GitHub receives your IP address and the technical details of the connection, under its own privacy policy. We don't send any of your data in that request.
- **When you use the built-in browser.** The pages you open receive the same as they would from any browser, and anything you type in the bar that isn't an address is searched on Google. The built-in browser uses WebView2, the Microsoft Edge engine that ships with Windows.
- **When something you run asks for it.** The programs and agents you open in your terminals connect wherever they want: Claude Code, for example, talks to Anthropic. That's governed by each one's policy, not this one.
- **When you install an agent from Settings.** The app runs, in a terminal, that agent's official install command, which downloads it from its site.

## The local server for agents

So that agents running in one terminal can talk to the others, Beauty Shell opens a small server on your computer, at `127.0.0.1`. That address only exists inside your computer: the server can't be reached from the internet or from other devices on your network.

Through it, a connected agent can see the list of your terminals, read what they show, type into them and open or read pages in the built-in browser. Only the agents you connect use it, for example with **Connect Claude Code** in Settings. What an agent reads from your terminals may travel to whoever makes it (for example Anthropic, in the case of Claude Code), under their policy.

## Notifications

When a long command finishes or an agent is waiting for your answer, the app shows a Windows notification. Those notifications are created on your computer and don't go through any server of ours.

## This website

This site doesn't use cookies, has no analytics and has no forms. Fonts are loaded from Google Fonts, so Google receives your IP address and the technical details of that download, under its privacy policy.

## If this changes

If the app ever starts handling data differently, we'll say so here first, and the date at the top will change. You can also read the [terms and conditions](/en/terms/).

---
lang: en
app: screenshot
id: install
description: "How to install, update and uninstall Beauty Screenshot on Windows, and where it keeps its files."
lead: "How to install Beauty Screenshot, how it updates and what stays on your computer."
---

## Requirements

- **Windows 10 or 11.**
- Nothing else: it uses .NET Framework, which comes with Windows.

You don't need an account or an internet connection to use it.

## Install

1. Download the installer from the **Download** button on this site.
2. Open it. If Windows shows “Windows protected your PC”, click **More info** and then **Run anyway** (see [why](/en/screenshot/docs/troubleshooting/#my-antivirus-or-windows-says-its-dangerous)).
3. Choose whether it should **start with Windows** and click **Instalar** (Install). It installs **for your user**, so it doesn't ask for administrator rights.

When it's done, Beauty Screenshot opens in the **system tray** (next to the clock) and tells you which shortcut to use. It also shows up in the Start menu as **Beauty Screenshot**.

## Update

Beauty Screenshot doesn't update itself. To get a new version, download the installer again and open it: it notices it's already installed, closes the old version, installs the new one and opens it again. Your settings are kept.

## Uninstall

From **Windows Settings → Apps → Installed apps**, find Beauty Screenshot and choose **Uninstall**.

It removes the program, your settings, the Start menu shortcut and the start-with-Windows entry. **The screenshots you saved are never touched.**

## Where it keeps its files

| What | Where |
| --- | --- |
| The program | `%LOCALAPPDATA%\Programs\BeautyScreenshot` |
| Settings | In the registry, under `HKEY_CURRENT_USER\Software\BeautyScreenshot` |
| Screenshots | Your **Pictures** folder, unless you pick another one in [Settings](/en/screenshot/docs/settings/) |
| Error log | `%LOCALAPPDATA%\BeautyScreenshot\error.log` (only if something failed) |

None of this leaves your computer. See the [privacy policy](/en/privacy/).

---
lang: en
app: screenshot
id: troubleshooting
description: "Fixes for the most common Beauty Screenshot problems."
lead: "What usually happens and how to fix it."
---

## My antivirus or Windows says it's dangerous

It's a false alarm. To take screenshots, Beauty Screenshot has to do things that, from the outside, look like what spyware does, and some antivirus programs flag it just in case. Upload it to VirusTotal and a few will flag it while the vast majority find nothing.

| What it does | Why |
| --- | --- |
| Listens to the keyboard | So your shortcut works from any app. It only reacts to that shortcut, and to the capture keys while you're capturing. |
| Looks at the screen | That's what a screenshot is. |
| Uses the clipboard | To leave the capture copied. |
| Starts with Windows | Only if you leave that on. |
| Has no digital signature | Not yet: it lacks the paid certificate Windows and antivirus programs use to recognize who made each program. |

What it does **not** do: it doesn't connect to the internet or send anything anywhere. Your screenshots stay on your computer.

- If Windows shows **“Windows protected your PC”**, click **More info** and then **Run anyway**.
- If your antivirus put it in **quarantine**, restore it from the antivirus and add it to the exceptions.

## Print Screen does nothing, or opens something else

- Check that Beauty Screenshot is running: its icon should be in the tray. If not, open it from the Start menu.
- Another screenshot program may be using the same key. Close it, or change the shortcut in [Settings](/en/screenshot/docs/settings/).
- If it says **“Hacé clic en el ícono de la bandeja para capturar”** (Click the tray icon to capture) when it opens, it couldn't take the keyboard. Meanwhile you can capture by clicking the icon. Try quitting it (right-click the icon → **Salir**) and opening it again.

## “No se pudo copiar” (Couldn't copy)

Another program was using the clipboard at that exact moment. Try again.

## “No se pudo guardar” (Couldn't save)

The screenshots folder doesn't exist or can't be written to (a drive that's no longer connected, for example). Pick another one in **Ajustes → Guardado → Carpeta**.

## I can't find the icon

Windows hides some icons under the **^** arrow in the tray. Open it and drag Beauty Screenshot's icon out so it's always visible.

## I want to report a bug

If something failed, Beauty Screenshot writes it to `%LOCALAPPDATA%\BeautyScreenshot\error.log`. When you report the bug, include that file and say what you were doing.

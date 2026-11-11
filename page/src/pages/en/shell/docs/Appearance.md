---
lang: en
id: appearance
description: "Beauty Shell's theme, glass, terminal background, fonts and cursor."
lead: "Everything that changes how Beauty Shell looks is in Settings → Appearance, and every change applies on the spot."
---

## Theme

- **Light**: white background, black ink.
- **Dark**: black background, white ink.
- **Like Windows**: follows the Windows mode and changes when you change it in the system.

The interface is deliberately **monochrome**: black, grays and white. Whatever marks a value (a toggle, a selection) uses the theme's ink. Color is left for what runs in your terminals.

## The window's glass

The window has no title bar or Windows borders: it's transparent and, behind it, Windows draws a material.

| Option | How it looks |
| --- | --- |
| **Acrylic** | A frosted glass that shows, blurred, what's behind the window. It's the one Windows 11 uses in its menus. |
| **Mica** | A calmer material that takes on the tone of your desktop background. |
| **Solid** | No transparency. |

With Acrylic or Mica, **Glass** controls how strong the effect is: the sheen falling from the top, the rim of light on the edge and how much the window's tint covers.

## The terminal background

| Option | How it looks |
| --- | --- |
| **Pure** | Black or white, depending on the theme. |
| **Gray** | The gray of Windows 11 windows. |
| **Glass** | The terminal also lets the glass behind it through. **Opacity** controls how much it covers, from 30% to 100%. |

With **Glass**, Beauty Shell makes two adjustments so programs look right: it rewrites as transparent the backgrounds they paint with the same color as the terminal (see [Agents](/en/shell/docs/agents/)) and, if a program asks for the background color, it answers with the theme's.

## Tabs

**On the side**, grouped by folder in the sidebar, or **Top**, in a strip like Chrome's. See [Tabs and folders](/en/shell/docs/tabs/).

## Text

Above these options there's a sample terminal drawn with what you choose.

### Font

The fonts **ship with the app**, so they work offline. Almost all are variable, with every weight, and carry their real italic when the family has one.

JetBrains Mono (the default), Cascadia Code, Consolas, Fira Code, Geist Mono, IBM Plex Mono, Source Code Pro, Roboto Mono, Red Hat Mono, Victor Mono, Intel One Mono, Azeret Mono, Martian Mono, Reddit Mono and Inconsolata.

Cascadia Code and Consolas ship with Windows and aren't bundled.

### Size, weight and line height

- **Font size**: from 9 to 28 points (13 by default). Also with <kbd>Ctrl+=</kbd>, <kbd>Ctrl+-</kbd> and <kbd>Ctrl+0</kbd>.
- **Weight**: Thin (300), Normal (400), Medium (500), Semi (600) or Bold (700). The terminal's bold is 300 heavier than the chosen weight. With the background set to Glass, letters are drawn without ClearType (in grayscale) and would look thin, so Beauty Shell makes them 100 heavier on its own to compensate.
- **Line height**: the space between one line and the next, from 1.00 to 1.60.

## Cursor

In **Settings → Terminal → Cursor**: a **bar**, **block** or **underline** shape, and whether it **blinks**.

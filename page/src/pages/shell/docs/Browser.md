---
lang: es
id: browser
description: "El navegador integrado de Beauty Shell, para ver tus servidores locales al lado de la terminal."
lead: "Beauty Shell trae un navegador adentro, para ver tu servidor de desarrollo al lado de la terminal que lo corre."
---

## Abrir una página

- Hacé **clic en una dirección local** que aparezca en la terminal, como el `http://localhost:5173` que imprime `npm run dev`. Se abre adentro, en su propia pestaña. Las direcciones `0.0.0.0` (las que imprime `vite --host`) se abren como `localhost`.
- <kbd>Ctrl+Shift+O</kbd> abre una pestaña de navegador vacía.
- En la [paleta](/shell/docs/herramientas/): **Abrir navegador** o **Abrir página…**
- Con clic derecho en **Nueva terminal**: **Navegador**.

Las direcciones que no son locales no se abren adentro: <kbd>Ctrl</kbd>+clic las abre en tu navegador de siempre.

## La barra

Cada página lleva su barra con **atrás**, **adelante**, **recargar**, la **dirección**, **abrir en tu navegador** y **cerrar**.

En la dirección podés escribir:

- Una dirección completa (`https://…`, `file://…`).
- Un servidor local, sin `http://`: `localhost:3000`, `127.0.0.1:8080`.
- Un dominio: `github.com` se abre como `https://github.com`.
- Cualquier otra cosa se busca en Google.

Mientras escribís, te sugiere los servidores locales que aparecieron en tus terminales.

| Para | Atajo |
| --- | --- |
| Ir a la dirección | <kbd>Ctrl+L</kbd> |
| Recargar | <kbd>Ctrl+R</kbd> o <kbd>F5</kbd> |
| Atrás / adelante | <kbd>Alt+←</kbd> / <kbd>Alt+→</kbd> |
| Abrir un navegador | <kbd>Ctrl+Shift+O</kbd> |
| Cerrar | <kbd>Ctrl+W</kbd> |

Los enlaces que piden otra ventana (`target="_blank"`) se abren en una pestaña nueva del navegador integrado.

## Es un panel más

Una página se comporta igual que una terminal: va en su pestaña, se arrastra, se divide al lado de una terminal (para tener el servidor y la página juntos), se separa y se renombra. Al restaurar la sesión, vuelve con su dirección.

## Cómo está hecho

Cada página es una vista **WebView2** (el motor de Microsoft Edge) que Beauty Shell pone sobre el hueco del panel. Una vista nativa se dibuja por encima de todo lo demás, así que:

- Mientras hay un menú, la paleta, los ajustes o un arrastre en pantalla, la página se esconde para no taparlos.
- Cuando la barra lateral escondida se asoma por encima, Beauty Shell saca antes una **foto de la página** y la pone en su lugar, así la barra pasa por encima de la foto. Mientras tanto la página queda congelada; al irse la barra vuelve la real.

Los detalles están en [Arquitectura](/shell/docs/arquitectura/).

## Lo usan los agentes

Los agentes conectados al [servidor MCP](/shell/docs/mcp/) pueden **abrir** una página para mostrarte su trabajo (`open_browser`) y **leer** su texto para revisarlo (`read_browser`).

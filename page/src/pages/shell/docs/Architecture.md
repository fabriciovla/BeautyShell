---
lang: es
id: architecture
description: "Cómo está hecha Beauty Shell por dentro, de Tauri y Rust a ConPTY, xterm.js y WebView2."
lead: "Beauty Shell es una app de Tauri 2: la interfaz en TypeScript sobre WebView2 y el núcleo en Rust. Así se reparte el trabajo."
---

## El conjunto

| Capa | Qué usa | Qué hace |
| --- | --- | --- |
| Ventana | Tauri 2 | Una ventana sin bordes, transparente, con el efecto acrílico o Mica de Windows detrás. |
| Interfaz | TypeScript sin framework, CSS a mano | Pestañas, barra lateral, paneles, ajustes, paleta y navegador. Corre en **WebView2**, el motor de Edge que ya trae Windows. |
| Terminal | xterm.js 6 con WebGL | Dibuja cada terminal en la placa de video. |
| Pseudoconsola | ConPTY, vía `portable-pty` | Corre las shells como si hablaran con una consola de verdad. |
| Núcleo | Rust | Shells, vistas del navegador, servidor MCP, modo Quake, búsqueda de agentes y rutas. |

No usa Electron: en vez de llevar un Chromium propio, usa el WebView2 del sistema. La app es más liviana y arranca más rápido. En total son unas 13.600 líneas entre TypeScript, CSS y Rust.

## Cómo viaja una tecla

1. Tipeás en un panel. xterm.js convierte la tecla en los bytes que espera una terminal (por ejemplo, `ESC [ A` para la flecha arriba).
2. La interfaz se los pasa a Rust con un comando de Tauri.
3. En Rust, cada sesión tiene **tres hilos**: uno **escribe** la entrada en orden en la pseudoconsola, otro **lee** la salida y otro **espera** a que el proceso termine para informar su código de salida.
4. La salida vuelve a la interfaz por un **canal** de Tauri, en trozos de hasta 64 KB. Rust corta siempre en un borde de carácter UTF-8, para no partir una letra al medio.
5. xterm.js interpreta la salida (colores, movimientos del cursor, [secuencias OSC](/shell/docs/secuencias/)) y la dibuja con WebGL.

Escribir nunca bloquea el hilo principal: si la shell está ocupada, la entrada espera en su propio hilo.

## La terminal

Cada panel es una instancia de xterm.js con estos complementos:

- **WebGL**: dibuja las letras desde un atlas en la GPU. Al prender o apagar la terminal translúcida, el atlas se vuelve a crear porque se arma distinto con y sin transparencia.
- **Fit**: ajusta columnas y filas al tamaño del panel, y Rust se lo informa a ConPTY.
- **Unicode 11**: anchos correctos para emojis y caracteres anchos.
- **Search**: el buscador de <kbd>Ctrl+F</kbd>.
- **Web links**: los enlaces clicables. Las rutas de archivo las detecta Beauty Shell, y Rust confirma cuáles existen.

xterm.js se configura para el comportamiento de ConPTY (el modo de pseudoconsola de Windows), que maneja distinto el ajuste de líneas al redimensionar.

### Cuando la ventana cambia de tamaño

Cuando la terminal crece, ConPTY agrega las filas nuevas abajo y el prompt quedaría a mitad de pantalla. En PowerShell, Beauty Shell manda una combinación de teclas que nadie tipea (<kbd>Ctrl+Alt+Shift+F12</kbd>) y la integración responde bajando el contenido y avisándole a PSReadLine dónde quedó su prompt, sin borrar nada.

La franja de los controles de Windows tampoco cambia el tamaño de las terminales: si se achicaran y volvieran a crecer, ConPTY dejaría filas vacías en cada pasada del mouse. En cambio, se recorta el borde de arriba de los paneles dentro del margen que ya tienen.

## Las shells

Al abrir una shell, Rust le agrega la [integración](/shell/docs/shells/) que informa la carpeta y marca los comandos, y las variables de entorno (`TERM`, `VIDRIO_SESSION`…). Si la shell elegida no existe, abre Windows PowerShell.

## El navegador integrado

Cada página es una **vista WebView2 hija** de la ventana, que Rust crea y ubica sobre el hueco del panel. La interfaz le informa dónde va cada vez que el panel se mueve o cambia de tamaño.

Una vista nativa se dibuja por encima de todo el HTML, y eso obliga a varias cosas:

- **Se esconde** mientras un menú, la paleta, los ajustes o un arrastre tienen que verse encima.
- **Se cambia por una foto** cuando la barra lateral escondida se asoma: Rust le pide a WebView2 una captura (`CapturePreview`, en JPEG), la interfaz la pone en el hueco y recién entonces esconde la vista. La barra espera la foto como mucho 250 ms.
- **Espera a estar lista**: la vista se crea de forma asíncrona, y lo que cambie mientras tanto (lugar, tamaño, si se ve) se aplica cuando termina de crearse.
- **Se limpia al arrancar**: las vistas nativas sobreviven a una recarga de la interfaz, así que al arrancar se cierran las que hayan quedado de antes.

## El servidor MCP

Rust abre un servidor HTTP en `127.0.0.1` (desde el puerto 47437) que habla [MCP](/shell/docs/mcp/). Cuando un agente llama a una herramienta, Rust le pasa el pedido a la interfaz, que es la que conoce las terminales, su pantalla y la animación de la burbuja, y espera la respuesta hasta 20 segundos.

## Persistencia

Los ajustes, las sesiones, el historial de sugerencias y los espacios de trabajo se guardan en el almacenamiento local de WebView2, en `%LOCALAPPDATA%\dev.vidrio.terminal`. Rust lee además, solo para sugerir, el historial que PowerShell ya tiene en tu equipo.

## Actualizaciones

El plugin de actualizaciones de Tauri consulta un `latest.json` publicado en GitHub. El instalador viene firmado con minisign y la app lo rechaza si la firma no coincide con la clave pública que trae. La actualización se descarga sola y se instala cuando la persona lo decide.

## El código

```
src/                 la interfaz (TypeScript)
  main.ts            arranque, pestañas, arrastrar y soltar, atajos, ventana
  session.ts         un panel de terminal: xterm.js + la sesión, título, carpeta, estado
  browser.ts         un panel de navegador
  layout.ts          el árbol de paneles divididos
  sidebar.ts         la barra lateral agrupada por carpeta
  tabstrip.ts        las pestañas arriba
  predict.ts         las sugerencias
  settings.ts        los ajustes y su página
src-tauri/src/       el núcleo (Rust)
  pty.rs             ConPTY: abrir, escribir, redimensionar, cerrar
  browser.rs         las vistas WebView2 del navegador
  mcp.rs             el servidor MCP
  agents.rs          buscar agentes instalados
  editor.rs          rutas que existen y abrirlas en VS Code
  quake.rs           el modo Quake
  predict.rs         el historial de PowerShell y las carpetas para los cd
```

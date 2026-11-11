---
lang: es
id: tools
description: "La paleta de comandos, los espacios de trabajo, las sesiones restauradas, el modo Quake, las rutas clicables y los avisos de Beauty Shell."
lead: "Las herramientas que hacen más rápido el día a día: la paleta de comandos, los espacios de trabajo, el modo Quake y varios detalles más."
---

## Paleta de comandos

<kbd>Ctrl+Shift+P</kbd> abre un buscador con **todas las acciones** de la app y **todas las terminales abiertas**. Escribí parte de lo que buscás y presioná <kbd>Enter</kbd>. La búsqueda no distingue mayúsculas ni tildes: "agrandar" encuentra "Agrandá".

Lo que encontrás ahí:

- **Abrir**: nueva terminal, nueva terminal con cada shell instalada, abrir en carpeta, abrir navegador, abrir página.
- **Paneles**: dividir a la derecha o abajo, agrandar o achicar el panel, escribir en todos los paneles.
- **Terminal**: buscar, ir al comando anterior o siguiente, renombrar.
- **Cerrar**: el panel, la pestaña, y reabrir lo último cerrado.
- **Espacios de trabajo**: guardar, abrir y borrar.
- **Ventana**: avisos al terminar, fijar u ocultar la barra lateral, pestañas al costado o arriba, ajustes, pantalla completa, tamaño de letra y salir del modo Quake.
- **Ir a**: cada terminal y página abierta, con su carpeta al lado.

## Espacios de trabajo

Un espacio de trabajo guarda tus pestañas **con sus paneles, sus carpetas y el comando que corría en cada uno** (`npm run dev`, `claude`, `docker compose up`). Al abrirlo, se arma todo de nuevo y cada comando vuelve a correr.

- **Guardar**: en la paleta, **Guardar espacio de trabajo…**, y elegí un nombre.
- **Abrir**: **Abrir espacio: *nombre***, en la paleta. Se abren en pestañas nuevas, junto a las que ya tenías.
- **Borrar**: **Borrar espacio: *nombre***.

Beauty Shell sabe qué comando corría en cada panel gracias a la [integración con la shell](/shell/docs/shells/), así que funciona en PowerShell, cmd y Git Bash.

## Sesiones restauradas

Con **Restaurar al abrir** prendido (viene así), al volver a abrir Beauty Shell reaparecen tus pestañas, los paneles divididos, las carpetas, los nombres y las páginas del navegador. Lo que corría no se vuelve a ejecutar (para eso están los espacios de trabajo): cada panel abre su shell en su carpeta.

## Modo Quake

<kbd>Win+`</kbd>, desde cualquier programa, hace bajar Beauty Shell desde arriba de la pantalla donde está el mouse, a todo el ancho y la mitad del alto. El mismo atajo la vuelve a esconder. Para devolver la ventana a su lugar de antes, elegí **Salir del modo Quake** en la paleta.

Si el atajo no responde, puede que otro programa lo tenga tomado (Windows Terminal usa el mismo para su propio modo Quake).

## Rutas y enlaces clicables

- **Rutas de archivo**: <kbd>Ctrl</kbd>+clic en una ruta de la salida la abre en **VS Code, en la línea y columna** indicadas. Entiende los formatos que dejan los compiladores: `src\main.ts:363`, `C:\x\a.rs:10:5`, `./lib/b.py(12,3)`. Solo se subrayan las rutas que existen de verdad. Una carpeta, o un archivo si no tenés VS Code, se abre con el programa predeterminado de Windows.
- **Enlaces**: <kbd>Ctrl</kbd>+clic abre un enlace en tu navegador. Los locales (`localhost`) se abren con un clic en el [navegador integrado](/shell/docs/navegador/).

## Copiar, pegar y soltar

- **Copiar**: <kbd>Ctrl+C</kbd> con texto seleccionado copia (sin selección, manda Ctrl+C a la terminal como siempre). También <kbd>Ctrl+Shift+C</kbd>. Con **Copiar al seleccionar** prendido, seleccionar ya copia.
- **Pegar**: <kbd>Ctrl+V</kbd> o <kbd>Ctrl+Shift+V</kbd>.
- **Clic derecho** sobre la terminal: copia si hay selección y, si no, pega.
- **Soltar archivos** sobre la terminal escribe sus rutas, separadas por espacios y entre comillas si tienen espacios.

## Buscar en la terminal

<kbd>Ctrl+F</kbd> abre el buscador del panel activo, con el número de resultados. <kbd>Enter</kbd> va al siguiente, <kbd>Shift+Enter</kbd> al anterior y <kbd>Esc</kbd> lo cierra.

## Saltar entre comandos

En PowerShell, <kbd>Ctrl+↑</kbd> y <kbd>Ctrl+↓</kbd> llevan al comando anterior o al siguiente de la salida, sin tener que buscarlos con la rueda del mouse.

## Avisos

- **Al terminar**: si un comando o un agente trabajó más de **10 segundos** y Beauty Shell no está al frente, Windows te avisa y el ícono de la barra de tareas parpadea. Se apagan desde la paleta o en **Ajustes → Terminal → Avisos**.
- **Esperando respuesta**: cuando un programa pide tu atención (un agente que necesita un permiso, por ejemplo), la pestaña lo marca y llega un aviso. Ver [Agentes](/shell/docs/agentes/).

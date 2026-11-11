---
lang: es
id: troubleshooting
description: "Soluciones a los problemas más comunes de Beauty Shell."
lead: "Lo que suele pasar y cómo resolverlo."
---

## No aparecen sugerencias al escribir

- Las sugerencias funcionan en **PowerShell** (7 y 5.1), no en cmd, Git Bash ni WSL.
- Revisá que esté prendido **Ajustes → Terminal → Escritura → Sugerir al escribir**.
- Con una sola letra no se sugiere nada, y lo que viene de otras carpetas recién aparece con tres. Ver [Sugerencias](/shell/docs/sugerencias/).

## Ctrl+W o Ctrl+F no le llegan a mi programa

Beauty Shell los usa para cerrar el panel y buscar. En bash, en vez de <kbd>Ctrl+W</kbd> (borrar la palabra anterior) usá <kbd>Alt+Retroceso</kbd>, y en vez de <kbd>Ctrl+F</kbd> (avanzar un carácter) usá <kbd>→</kbd>.

## Win+` no abre el modo Quake

Otro programa tiene tomado el atajo. Lo más común es Windows Terminal, que usa el mismo para su propio modo Quake: desactivalo en su configuración o cerralo.

## La pestaña no se agrupa por carpeta

Beauty Shell sabe la carpeta porque la shell se la informa. Si no se agrupa:

- En **WSL** la carpeta sale del título, así que depende de que tu shell ponga la ruta en el título.
- En **Git Bash**, si tu `.bashrc` reemplaza `PROMPT_COMMAND`, agregale la línea de OSC 7 (está en [Secuencias de escape](/shell/docs/secuencias/)).
- En **cmd**, si cambiás `PROMPT`, empezalo con `$E]9;9;$P$E\`.

## Los mensajes entre sesiones no funcionan

1. En **Ajustes → Agentes**, revisá que Claude Code diga **Conectado** y que el servidor MCP tenga un puerto.
2. **Reiniciá** las sesiones de Claude Code que estaban abiertas antes de conectar.
3. En una terminal, `claude mcp list` tiene que mostrar el servidor `vidrio`.

Si sigue sin andar, **Volver a conectar** lo registra de nuevo. Ver [Servidor MCP](/shell/docs/mcp/).

## No me llegan los avisos

- Revisá **Ajustes → Terminal → Avisos → Avisar al terminar**, o *Activar avisos al terminar* en la paleta.
- Los avisos llegan solo si Beauty Shell **no está al frente** y el comando tardó más de 10 segundos.
- Revisá que Windows no tenga **No molestar** activado y que Beauty Shell tenga permitidas las notificaciones en **Configuración → Sistema → Notificaciones**.

## Con el fondo en vidrio, un programa deja un rectángulo oscuro

Beauty Shell vuelve transparentes los fondos que un programa pinta con el mismo color que la terminal. Un rectángulo que queda es un fondo de **otro** color, que el programa eligió a propósito (un diff, una selección). Si molesta, probá el fondo **Puro** o **Gris**.

## El prompt quedó a mitad de pantalla

En PowerShell, Beauty Shell lo corrige solo al agrandar la ventana. En otras shells, `cls` (o `clear`) lo vuelve a llevar arriba.

## Una página del navegador queda encima de todo

La página se esconde sola mientras hay un menú, la paleta o un arrastre en pantalla. Si alguna vez quedara encima de algo, cerrá y volvé a abrir esa pestaña.

## Quiero empezar de cero

Cerrá Beauty Shell y borrá la carpeta `%LOCALAPPDATA%\dev.vidrio.terminal`. La próxima vez que la abras va a estar como recién instalada, con la bienvenida incluida.

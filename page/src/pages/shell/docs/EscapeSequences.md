---
lang: es
id: sequences
description: "Las secuencias de escape (VT y OSC) que entiende Beauty Shell y cómo usarlas desde tus scripts y prompts."
lead: "Además de lo que entiende cualquier terminal compatible con xterm, Beauty Shell escucha algunas secuencias OSC para saber dónde está cada terminal, qué corre y cuándo te necesita."
---

## La base: compatible con xterm

La terminal es **xterm.js**, el mismo motor que usa VS Code. Emula una terminal compatible con xterm, así que los programas de consola funcionan como esperan: colores de 256 y de 24 bits (*truecolor*), pantalla alternativa (la que usan `vim`, `less` o `htop`), seguimiento del mouse, pegado entre corchetes (*bracketed paste*), estilos de texto y anchos de caracteres de **Unicode 11** (emojis y caracteres anchos ocupan dos celdas).

Cada terminal anuncia `TERM=xterm-256color` y `COLORTERM=truecolor` (ver [Shells](/shell/docs/shells/)).

## Secuencias que escucha Beauty Shell

Una secuencia OSC empieza con `ESC ]` y termina con `BEL` (`\a`, el carácter 7) o con `ESC \`. Estas son las que Beauty Shell usa:

| Secuencia | Para qué |
| --- | --- |
| `OSC 0 ; título` / `OSC 2 ; título` | El título de la terminal. Si es una ruta, también dice la carpeta. |
| `OSC 7 ; file://equipo/ruta` | La carpeta actual, al estilo de bash y zsh. La usa Git Bash. |
| `OSC 9 ; 9 ; ruta` | La carpeta actual, al estilo de Windows Terminal. La usan PowerShell y cmd. |
| `OSC 9 ; texto` | Una notificación (al estilo de iTerm2): la pestaña pasa a **esperando respuesta** con ese texto. |
| `OSC 777 ; notify ; título ; cuerpo` | Una notificación (al estilo de kitty y Ghostty): igual que la anterior. |
| `OSC 11 ; ?` | Pregunta el color de fondo. Con la terminal en Vidrio, Beauty Shell responde el color del tema y no "transparente", para que el programa elija bien sus colores. |
| `OSC 133 ; A` | Empieza el prompt. |
| `OSC 133 ; B` | Termina el prompt: empieza lo que escribe la persona. |
| `OSC 133 ; C` | Arranca el comando: la terminal pasa a **trabajando**. |
| `OSC 133 ; D ; código` | Terminó el comando, con su código de salida. |
| `OSC 7701 ; base64` | El texto del comando que va a correr, en base64 (UTF-8). Propia de Beauty Shell. |
| `BEL` suelto | La campana. Si no estás mirando esa terminal, la marca como **esperando respuesta**. |

Las secuencias `OSC 9` con un número adelante (por ejemplo `OSC 9 ; 4`, la barra de progreso de Windows Terminal) se ignoran.

### Qué hace Beauty Shell con cada una

- **Carpeta** (OSC 7 y 9;9): agrupa la pestaña en la barra lateral, abre ahí las terminales nuevas y la guarda al restaurar.
- **Marcas** (OSC 133): saben cuándo una terminal está ocupada, cuánto tardó cada comando (para los [avisos](/shell/docs/herramientas/)), si falló (para las [sugerencias](/shell/docs/sugerencias/)) y dónde empieza cada comando (para <kbd>Ctrl+↑</kbd> y <kbd>Ctrl+↓</kbd>).
- **Texto del comando** (OSC 7701): el subtítulo de la pestaña y lo que se guarda en un [espacio de trabajo](/shell/docs/herramientas/).
- **Notificaciones** (OSC 9, 777 y BEL): el estado **esperando respuesta** y el aviso de Windows.

## Usarlas desde tus scripts

### Avisar cuando termina algo

Desde PowerShell 7, al final de un script largo:

```powershell
Write-Host -NoNewline "`e]9;Terminó el build`a"
```

Desde bash:

```bash
printf '\e]777;notify;Build;Terminó sin errores\a'
```

Si estás en otra pestaña o en otra ventana, la pestaña se marca y llega un aviso de Windows con ese texto.

### Informar la carpeta desde un prompt propio

Si tu `.bashrc` reemplaza `PROMPT_COMMAND`, agregale la secuencia para que Beauty Shell siga sabiendo dónde estás:

```bash
PROMPT_COMMAND='printf "\e]7;file://%s%s\e\\" "$HOSTNAME" "$PWD"'
```

En cmd, si cambiás `PROMPT`, empezalo con `$E]9;9;$P$E\`:

```bat
set PROMPT=$E]9;9;$P$E\$P$G
```

En PowerShell no hace falta: Beauty Shell envuelve tu función `prompt`, sea cual sea.

### Marcar comandos en otra shell

Una shell que emita las marcas OSC 133 en su prompt (como hacen las integraciones de VS Code y Windows Terminal) obtiene en Beauty Shell el estado **trabajando**, los avisos al terminar y el salto entre comandos:

```bash
# antes del prompt (con el código del último comando):
printf '\e]133;D;%s\a' "$?"
printf '\e]133;A\a'
# al final del prompt:
printf '\e]133;B\a'
# justo antes de correr el comando:
printf '\e]133;C\a'
```

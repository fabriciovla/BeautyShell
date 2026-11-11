---
lang: es
id: shells
description: "Las shells que abre Beauty Shell, dónde las busca, cómo se integra con cada una y qué variables de entorno reciben."
lead: "Beauty Shell abre las shells que ya tenés instaladas y se integra con cada una para saber dónde está y qué está haciendo."
---

## Shells compatibles

| Shell | Id | Dónde la busca |
| --- | --- | --- |
| PowerShell 7 | `pwsh` | En el `PATH`, en `C:\Program Files\PowerShell\7\` y en la versión de la Microsoft Store. |
| Windows PowerShell 5.1 | `powershell` | `%SystemRoot%\System32\WindowsPowerShell\v1.0\` (viene con Windows). |
| Símbolo del sistema | `cmd` | `%SystemRoot%\System32\cmd.exe` |
| Git Bash | `gitbash` | `C:\Program Files\Git\bin\bash.exe`, con `--login -i`. |
| WSL | `wsl` | `%SystemRoot%\System32\wsl.exe`, con tu distribución predeterminada. |

Solo aparecen las que están instaladas. La predeterminada se elige en **Ajustes → Terminal → Shell**; para abrir otra puntualmente, usá clic derecho en **Nueva terminal**. Si la elegida no está, Beauty Shell abre Windows PowerShell.

Recomendamos **PowerShell 7**: es la que tiene [sugerencias](/shell/docs/sugerencias/), saltar entre comandos y la integración más completa.

## Qué hace la integración

Para agrupar por carpeta, mostrar el estado de cada pestaña y guardar los comandos en los [espacios de trabajo](/shell/docs/herramientas/), la shell tiene que contarle a Beauty Shell lo que pasa. Lo hace con [secuencias de escape](/shell/docs/secuencias/) invisibles, que Beauty Shell agrega al arrancar cada shell sin tocar tus archivos de configuración.

### PowerShell 7 y Windows PowerShell

Beauty Shell abre PowerShell con `-NoLogo -NoExit` y un pequeño script que **envuelve tu función `prompt`**, incluso si usás oh-my-posh u otro tema: tu prompt se sigue viendo igual. En cada vuelta, el script:

- Informa la **carpeta actual** (OSC 9;9) y la pone como título de la ventana.
- Marca el **inicio del prompt, el inicio de lo que escribís, el comienzo del comando y su fin con el código de salida** (OSC 133 A, B, C y D).
- Antes de correr cada comando, manda su **texto** (OSC 7701, propia de Beauty Shell).

Además:

- **Apaga las sugerencias de PSReadLine**, porque Beauty Shell dibuja las suyas, que saben en qué carpeta estás.
- **Saca los colores de fábrica de PowerShell 7 en los listados** (carpetas con fondo azul, encabezados en verde) y los deja en negrita. Si tu perfil ya los cambió, no los toca.
- Hace que `cls` y <kbd>Ctrl+L</kbd> dejen el prompt **abajo de todo**, igual que al abrir la terminal.

### cmd

Beauty Shell define la variable `PROMPT` como `$E]9;9;$P$E\$P$G`: el prompt de siempre (`C:\carpeta>`) precedido por la secuencia que informa la carpeta. cmd no informa cuándo empieza o termina un comando.

### Git Bash

Beauty Shell define `PROMPT_COMMAND` para que bash informe la carpeta con OSC 7 (`file://equipo/ruta`) antes de cada prompt.

### WSL

WSL abre tu distribución sin cambios. La carpeta sale del título que pone tu shell, si es una ruta.

## Variables de entorno

Cada terminal arranca con estas variables, además de las tuyas:

| Variable | Valor | Para qué |
| --- | --- | --- |
| `TERM` | `xterm-256color` | Que los programas sepan qué secuencias pueden usar. |
| `COLORTERM` | `truecolor` | Que usen colores de 24 bits. |
| `TERM_PROGRAM` | `BeautyShell` | Que un script sepa que corre en Beauty Shell. |
| `TERM_PROGRAM_VERSION` | La versión de la app | Lo mismo, con la versión. |
| `VIDRIO_SESSION` | El id de esta terminal | Que un agente se identifique ante el [servidor MCP](/shell/docs/mcp/). |
| `VIDRIO_MCP_PORT` | El puerto del servidor MCP | Dónde encontrarlo (desde `47437`). |

Por ejemplo, para hacer algo solo dentro de Beauty Shell en tu perfil de PowerShell:

```powershell
if ($env:TERM_PROGRAM -eq 'BeautyShell') {
  # lo que quieras
}
```

## La pseudoconsola

Todas las shells corren sobre **ConPTY**, la pseudoconsola de Windows, igual que en Windows Terminal. La terminal se dibuja con xterm.js, que se configura para el comportamiento de ConPTY. Detalles en [Arquitectura](/shell/docs/arquitectura/).

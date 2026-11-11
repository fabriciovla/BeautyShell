---
lang: es
id: agents
description: "Cómo Beauty Shell detecta, instala y sigue a los agentes de código como Claude Code, Codex o Gemini CLI."
lead: "Los agentes de código pasan minutos trabajando, piden permisos y hacen preguntas. Beauty Shell está atenta a todo eso."
---

## Agentes que reconoce

En **Ajustes → Agentes**, Beauty Shell busca estos agentes en tu equipo:

| Agente | Comando |
| --- | --- |
| Claude Code | `claude` |
| Codex | `codex` |
| Gemini CLI | `gemini` |
| GitHub Copilot | `copilot` |
| Cursor Agent | `cursor-agent` |
| OpenCode | `opencode` |
| Qwen Code | `qwen` |
| Kimi CLI | `kimi` |
| Amp | `amp` |
| Aider | `aider` |
| Goose | `goose` |
| Crush | `crush` |

Los busca en el `PATH` y también en las carpetas donde sus instaladores los dejan (las de Claude Code, npm, bun, cargo, pipx…), así los encuentra aunque hayas instalado uno con la app abierta. Prueba cada extensión ejecutable (`.exe`, `.cmd`, `.bat`) en orden, como cmd. **Volver a buscar** repite la búsqueda.

## Instalar un agente

Los que no tenés muestran **Instalar**: el botón abre una terminal nueva y corre ahí el comando de instalación oficial de ese agente, para que veas lo que pasa. Por ejemplo, Claude Code se instala con:

```powershell
irm https://claude.ai/install.ps1 | iex
```

Si un agente no tiene un comando confiable para Windows, el botón dice **Cómo instalarlo** y abre su página.

## Estados en la barra lateral

Escribí el comando de cualquier agente en una terminal y Beauty Shell sigue su estado:

- **trabajando…** mientras corre.
- **esperando respuesta** cuando te pide algo. Beauty Shell lo detecta cuando el programa:
  - manda una notificación de terminal (OSC 9 con texto, al estilo de iTerm2, u OSC 777;notify, al estilo de kitty y Ghostty), o
  - toca la **campana** (el carácter BEL), que es lo que hace Claude Code al esperar.
- Si estás en otra ventana, llega además un **aviso de Windows** con el mensaje del programa.

## El vidrio y los agentes

Con el fondo de la terminal en **Vidrio**, solo el fondo "por defecto" deja ver el acrílico. Claude Code pinta el cuadro donde escribís con el mismo color que el fondo de la terminal, y eso dejaba un rectángulo macizo sobre el vidrio. Beauty Shell corrige esto: los fondos que son iguales al de la terminal se reescriben como "por defecto" antes de dibujarse. Los fondos de otro color (los de un diff, una selección o un resaltado) quedan como están.

Además, cuando un programa pregunta el color de fondo (OSC 11) para elegir sus colores, Beauty Shell le responde el color del tema y no "transparente".

## Agentes que se hablan

Un agente que corre en una terminal puede **ver las demás, leer su pantalla y escribirles**, y también abrir y leer páginas del navegador integrado. Todo eso pasa por el [servidor MCP](/shell/docs/mcp/) local de Beauty Shell.

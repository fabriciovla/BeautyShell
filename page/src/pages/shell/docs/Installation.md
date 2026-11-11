---
lang: es
id: install
description: "Cómo instalar, actualizar y desinstalar Beauty Shell en Windows, y dónde guarda sus archivos."
lead: "Cómo instalar Beauty Shell, cómo se actualiza y qué queda en tu equipo."
---

## Requisitos

- **Windows 11.** Beauty Shell está pensada para Windows 11: usa sus efectos de ventana (acrílico y Mica) y sus avisos.
- **WebView2**, el motor de Microsoft Edge que dibuja la interfaz. Ya viene con Windows 11; si faltara, el instalador lo descarga.
- **Al menos una shell.** PowerShell 7 es la recomendada (es la que tiene las sugerencias), pero también funcionan Windows PowerShell, cmd, Git Bash y WSL. Ver [Shells compatibles](/shell/docs/shells/).

No hace falta una cuenta ni conexión a internet para usarla.

## Instalar

1. Descargá el instalador desde el botón **Descargar** de este sitio.
2. Abrilo. Se instala **para tu usuario**, en `%LOCALAPPDATA%\Beauty Shell`, así que no pide permisos de administrador.
3. Al terminar, Beauty Shell se abre con la [bienvenida](/shell/docs/primeros-pasos/).

También aparece en el menú Inicio como **Beauty Shell**. Podés anclarla a la barra de tareas como cualquier app.

## Actualizaciones

Beauty Shell busca actualizaciones sola. Cuando hay una versión nueva:

1. La descarga en segundo plano, sin interrumpirte.
2. Recién entonces te avisa con un aviso flotante, y también lo ves en **Ajustes → Acerca de**.
3. La instalás cuando quieras. **Nunca se reinicia sola**: reiniciar cierra lo que corre en tus terminales, así que lo decidís vos. Si tenés [Restaurar al abrir](/shell/docs/ajustes/) prendido, al volver tus pestañas reaparecen como estaban.

Las actualizaciones se publican en GitHub y vienen **firmadas**. La app trae la clave pública y rechaza cualquier actualización cuya firma no coincida.

## Desinstalar

Desde **Configuración de Windows → Aplicaciones → Aplicaciones instaladas**, buscá Beauty Shell y elegí **Desinstalar**.

El desinstalador te ofrece borrar también los datos de la app. Si no lo marcaste y querés empezar de cero, borrá a mano la carpeta de datos (abajo).

## Dónde guarda sus cosas

| Qué | Dónde |
| --- | --- |
| El programa | `%LOCALAPPDATA%\Beauty Shell` |
| Ajustes, sesiones, historial de sugerencias y espacios de trabajo | `%LOCALAPPDATA%\dev.vidrio.terminal` |
| Configuración de Claude Code (si lo conectás) | `~\.claude.json`, en el servidor MCP `vidrio` |

Nada de esto sale de tu equipo. Ver la [política de privacidad](/privacidad/).

## Versión de la Microsoft Store

Beauty Shell también se puede empaquetar como MSIX para la Microsoft Store. En esa versión las actualizaciones las maneja la Store.

---
lang: es
id: settings
description: "Todos los ajustes de Beauty Shell, con sus valores posibles y su valor por defecto."
lead: "Cada opción de Ajustes (Ctrl+,), con sus valores posibles y el que trae de fábrica. Los cambios se aplican en el momento y se guardan solos."
---

## Cómo se guardan

Los ajustes se guardan en tu equipo apenas los cambiás, en la carpeta de datos de la app (ver [Instalación](/shell/docs/instalacion/)). No hay un archivo de configuración para editar a mano: todo se cambia desde **Ajustes**, que tiene un buscador (<kbd>Ctrl+F</kbd>) para encontrar cualquier opción.

## Apariencia

| Ajuste | Valores | Por defecto |
| --- | --- | --- |
| Tema | Claro, Oscuro, Como Windows | Claro |
| Fondo → Ventana | Acrílico, Mica, Sólido | Acrílico |
| Fondo → Vidrio | 0 a 100% (con Acrílico o Mica) | 75% |
| Fondo → Terminal | Puro, Gris, Vidrio | Puro |
| Fondo → Opacidad | 30 a 100% (con la terminal en Vidrio) | 72% |
| Pestañas | Al costado, Arriba | Al costado |
| Texto → Fuente | 15 tipografías (ver [Apariencia](/shell/docs/apariencia/)) | JetBrains Mono |
| Texto → Tamaño de letra | 9 a 28 | 13 |
| Texto → Grosor | Fina, Normal, Media, Semi, Negrita | Normal |
| Texto → Interlineado | 1,00 a 1,60, de a 0,05 | 1,00 |

## Terminal

| Ajuste | Valores | Por defecto |
| --- | --- | --- |
| Shell → Predeterminada | Las shells instaladas (ver [Shells](/shell/docs/shells/)) | PowerShell 7 |
| Cursor → Forma | Barra, Bloque, Subrayado | Barra |
| Cursor → Parpadeo | Sí, No | Sí |
| Escritura → Copiar al seleccionar | Sí, No | No |
| Escritura → Sugerir al escribir | Sí, No | Sí |
| Historial → Líneas de historial | 1.000, 2.000, 5.000, 10.000, 25.000, 50.000 o 100.000 | 10.000 |
| Historial → Restaurar al abrir | Sí, No | Sí |
| Avisos → Avisar al terminar | Sí, No | Sí |

**Líneas de historial** son las que se guardan por encima de la pantalla visible, en cada terminal. Más líneas usan más memoria.

**Avisar al terminar** avisa cuando un comando tardó más de 10 segundos y Beauty Shell no está al frente.

## Agentes

| Ajuste | Qué hace |
| --- | --- |
| Instalados | Muestra qué agentes encontró y dónde. **Volver a buscar** repite la búsqueda; **Instalar** corre el instalador oficial en una terminal. |
| Mensajes entre sesiones → Claude Code | **Conectar** registra Beauty Shell como servidor MCP en Claude Code. Ver [Servidor MCP](/shell/docs/mcp/). |
| Servidor MCP local | Muestra la dirección y el puerto del servidor (`127.0.0.1:47437` o el siguiente libre). |

## Atajos y Acerca de

**Atajos** muestra todos los atajos de teclado, agrupados (ver [Atajos de teclado](/shell/docs/atajos/)). **Acerca de** muestra la versión instalada y, si hay una actualización descargada, el botón para instalarla.

## Lo que se ajusta fuera de Ajustes

| Qué | Dónde | Por defecto |
| --- | --- | --- |
| Barra lateral fija o escondida | <kbd>Ctrl+Shift+B</kbd> o el botón al pie de la barra | Fija |
| Ancho de la barra lateral | Arrastrando su borde derecho, de 200 a 420 píxeles | 260 |
| Tamaño de letra | <kbd>Ctrl+=</kbd>, <kbd>Ctrl+-</kbd>, <kbd>Ctrl+0</kbd> | 13 |

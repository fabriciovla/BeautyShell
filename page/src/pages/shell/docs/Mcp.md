---
lang: es
id: mcp
description: "El servidor MCP local de Beauty Shell, cómo conectarlo con Claude Code y la referencia de sus cinco herramientas."
lead: "Beauty Shell abre un servidor MCP en tu equipo para que los agentes de una terminal vean las demás, les escriban y usen el navegador integrado."
---

## Qué es

**MCP** (Model Context Protocol) es el protocolo con el que los agentes de código reciben herramientas. Beauty Shell abre un servidor MCP **solo en `127.0.0.1`**: no se puede llegar a él desde internet ni desde otros equipos de tu red.

- **Puerto**: el primero libre desde `47437` (si hay dos Beauty Shell abiertas, la segunda usa el siguiente). Lo ves en **Ajustes → Agentes → Servidor MCP local**.
- **Transporte**: MCP sobre HTTP, respondiendo JSON directo (sin SSE).
- **Quién llama**: cada terminal recibe `VIDRIO_SESSION` (su id) y `VIDRIO_MCP_PORT`. La configuración que se registra en Claude Code los manda en la URL y en un encabezado, así Beauty Shell sabe desde qué terminal viene cada pedido.

## Conectar Claude Code

1. Abrí **Ajustes → Agentes**.
2. En **Mensajes entre sesiones**, presioná **Conectar** al lado de Claude Code.
3. **Reiniciá** las sesiones de Claude Code que ya estaban abiertas, para que tomen la conexión.

Por dentro, Beauty Shell corre:

```powershell
claude mcp add-json --scope user vidrio "<configuración>"
```

Es decir, se registra como el servidor MCP `vidrio` en tu configuración de usuario de Claude Code (`~\.claude.json`), así queda disponible en todas tus carpetas. **Volver a conectar** lo quita y lo vuelve a agregar. Para desconectarlo:

```powershell
claude mcp remove --scope user vidrio
```

Otros agentes que hablen MCP por HTTP se pueden conectar a mano con la misma dirección.

## Herramientas

### list_sessions

Lista las terminales abiertas: id, nombre, carpeta y si están trabajando. La del agente que llama aparece marcada.

Sin parámetros.

### read_screen

Devuelve las últimas líneas que muestra otra terminal.

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `session` | texto, obligatorio | Id de la sesión (de `list_sessions`) o parte de su nombre. |
| `lines` | entero, 1 a 400 | Cuántas líneas. Por defecto, 40. |

### send_to_session

Escribe un mensaje en el input de otra terminal y lo envía, como si lo tipeara el usuario. Sirve para hablar con el agente que corre ahí. El mensaje llega **firmado** con el nombre y el id de la sesión que lo manda.

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `to` | texto, obligatorio | Id de la sesión o parte de su nombre. |
| `text` | texto, obligatorio | El mensaje. Tiene que entenderse solo: el otro agente no conoce tu conversación. |
| `submit` | booleano | Presionar Enter después de escribir. Por defecto, sí. |

En pantalla, el mensaje sale como una **burbuja** de la terminal que lo manda, viaja en arco hasta el cuadro de texto de la que lo recibe y recién al llegar se escribe.

### open_browser

Abre una página en el [navegador integrado](/shell/docs/navegador/), en su propia pestaña, y se la muestra al usuario. Útil para mostrar un servidor de desarrollo o una documentación.

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `url` | texto, obligatorio | La dirección. Sin esquema se asume `https://` (o `http://` para `localhost`). |
| `background` | booleano | Abrirla sin cambiar de pestaña. Por defecto, no: se muestra. |

### read_browser

Devuelve el título, la dirección y el texto visible de una pestaña del navegador integrado. Sin indicar cuál, usa la última que se usó.

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `tab` | texto | Parte del título o de la dirección de la pestaña. |
| `max_chars` | entero, 200 a 50.000 | Cuánto texto como máximo. Por defecto, 8.000. |

## Límites

- Cada pedido espera la respuesta de la app hasta **20 segundos**. Leer una página espera hasta 10.
- Las herramientas las resuelve la interfaz de Beauty Shell, que es la que conoce los nombres de las terminales, su pantalla y la animación. Si la ventana no responde, el agente recibe un error.
- Un agente conectado puede leer y escribir en cualquier terminal de esa ventana. Conectá solo agentes en los que confíes.

---
lang: es
id: tabs
description: "Cómo Beauty Shell agrupa las pestañas por carpeta, qué significa cada estado y cómo moverlas, renombrarlas y cerrarlas."
lead: "Las terminales se ordenan solas por la carpeta en la que están. Acá está cómo funciona la barra lateral y la tira de pestañas."
---

## Agrupadas por carpeta

Cada pestaña de la barra lateral cae dentro de la **carpeta** en la que está su terminal, y cada carpeta es una lámina con su nombre arriba. No las ordenás vos: si en una terminal hacés `cd ..\otro-proyecto`, la pestaña se muda sola al grupo de esa carpeta (y lo crea si no existía).

Beauty Shell sabe en qué carpeta está cada terminal porque la shell se lo dice después de cada comando, con una [secuencia de escape](/shell/docs/secuencias/). Funciona en PowerShell, cmd y Git Bash; en WSL se usa el título de la ventana.

### Plegar una carpeta

Hacé clic en el nombre de la carpeta para plegarla. Plegada muestra cuántas pestañas tiene. La carpeta de la pestaña activa no se pliega nunca, para que no la pierdas de vista.

El **+** que aparece al señalar el nombre abre una terminal nueva en esa carpeta.

## Qué dice cada pestaña

Debajo del nombre, la pestaña muestra una segunda línea solo cuando hay algo que contar:

| Estado | Qué significa |
| --- | --- |
| **trabajando…** | Algún panel de la pestaña está corriendo un comando. |
| **esperando respuesta** | Un programa (por ejemplo un agente de código) te pide algo: un permiso, una respuesta. |
| **terminó · código N** | El proceso de la terminal terminó, con ese código de salida. |
| **actividad nueva** | Hubo salida nueva mientras mirabas otra pestaña. |
| **escribe en todos** | Lo que tipeás va a todos los paneles de la pestaña (ver [Paneles](/shell/docs/paneles/)). |
| **N paneles** | La pestaña está dividida; los paneles cuelgan debajo, como un árbol. |
| *una dirección* | En una pestaña de navegador, el sitio que está abierto. |

Mientras mantenés <kbd>Ctrl</kbd> apretado, cada pestaña muestra su número: <kbd>Ctrl+1</kbd> a <kbd>Ctrl+8</kbd> van a esa pestaña y <kbd>Ctrl+9</kbd> a la última.

## Renombrar, cerrar y reabrir

- **Renombrar**: doble clic sobre la pestaña, o *Renombrar* en su menú (clic derecho). El nombre se guarda con la sesión.
- **Cerrar**: la **×** que aparece al señalarla, clic con la rueda del mouse, o <kbd>Ctrl+Shift+W</kbd>. <kbd>Ctrl+W</kbd> cierra solo el panel activo.
- **Reabrir lo último cerrado**: <kbd>Ctrl+Shift+T</kbd>. Vuelve con sus paneles y su carpeta.

## Mover una terminal de carpeta

Arrastrá la pestaña y soltala sobre otra carpeta de la barra lateral: la terminal hace `cd` ahí y pasa a ese grupo.

Mientras arrastrás, abajo de la ventana sube además un panel de vidrio con **las carpetas abiertas** y **Otra carpeta…**, útil cuando la barra lateral está escondida. Si arrastrás un panel de una pestaña dividida, ese panel suma **Pestaña nueva**, que lo separa.

Una terminal **ocupada** (corriendo algo) no puede cambiar de carpeta: Beauty Shell te lo avisa en vez de escribir un `cd` encima de lo que corre.

## Esconder la barra lateral

<kbd>Ctrl+Shift+B</kbd> esconde la barra lateral (o el botón de abajo a la derecha de la barra). Escondida:

- **Aparece flotando** al llevar el mouse al borde izquierdo de la ventana.
- **Se va sola** cuando el mouse sale de ella, o a los dos segundos y medio si el mouse nunca llega a entrar.
- Al cambiar de pestaña con el teclado, arriba aparece un aviso breve con **la carpeta y la pestaña** a la que fuiste.

El ancho de la barra se cambia arrastrando su borde derecho.

## Pestañas arriba

Si preferís las pestañas en una tira horizontal, como en Chrome, elegí **Ajustes → Apariencia → Pestañas → Arriba** (o *Pestañas arriba* en la [paleta](/shell/docs/herramientas/)).

En la tira las pestañas no se agrupan por carpeta: quedan en el orden que elijas, y se reordenan arrastrándolas sobre la tira. Los controles de Windows quedan fijos a la derecha. Todo lo demás (dividir, arrastrar sobre la terminal, el menú de cada pestaña) funciona igual.

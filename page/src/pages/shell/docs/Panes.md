---
lang: es
id: panes
description: "Cómo dividir una pestaña de Beauty Shell en varios paneles, moverlos, redimensionarlos, agrandarlos y escribir en todos a la vez."
lead: "Una pestaña puede tener varios paneles, cada uno con su terminal o su página. Así se dividen, se mueven y se manejan."
---

## Dividir

Hay dos formas:

- **Con el teclado**: <kbd>Ctrl+Shift+D</kbd> divide el panel activo a la derecha y <kbd>Ctrl+Shift+E</kbd> lo divide abajo. El panel nuevo abre la misma shell en la misma carpeta.
- **Arrastrando**: agarrá una pestaña de la barra lateral y soltala **sobre la terminal**, hacia el borde donde la querés (izquierda, derecha, arriba o abajo). Mientras arrastrás, un recuadro te muestra dónde va a quedar.

Al lado de una página del navegador, el panel nuevo abre tu shell predeterminada.

## Moverse y redimensionar

- <kbd>Alt</kbd> + flechas pasa al panel de al lado en esa dirección.
- Arrastrá la **separación** entre dos paneles para cambiar cuánto ocupa cada uno.
- El panel donde estás escribiendo lleva un punto en su encabezado.

## Agrandar un panel

<kbd>Ctrl+Shift+Z</kbd> agranda el panel activo para que ocupe toda la pestaña, tapando a los demás. Los otros siguen corriendo detrás. El mismo atajo lo vuelve a su lugar.

## Escribir en todos los paneles

Desde el menú de la pestaña o la [paleta](/shell/docs/herramientas/), **Escribir en todos los paneles** manda lo que tipeás a todos los paneles de la pestaña a la vez. Sirve, por ejemplo, para correr el mismo comando en varias máquinas por SSH. La pestaña lo indica con **escribe en todos** y cada panel se marca. Se apaga desde el mismo lugar.

## Separar un panel

Para llevar un panel de vuelta a su propia pestaña:

- Elegí **Separar en otra pestaña** en el menú del panel (clic derecho sobre su fila en la barra lateral).
- O arrastrá su fila de la barra lateral y soltala sobre la barra.
- O, mientras lo arrastrás, soltalo sobre **Pestaña nueva** en el panel de carpetas que sube desde abajo. Esto funciona aunque la terminal esté ocupada.

## En la barra lateral

Una pestaña dividida muestra **N paneles** y, debajo, sus paneles colgados como un árbol. El panel activo va en negrita. Cada fila muestra el círculo de cargando si ese panel está trabajando, o un punto si espera tu respuesta. Desde la fila podés renombrar, cerrar (<kbd>Ctrl+W</kbd>) o arrastrar ese panel solo.

## Cerrar

<kbd>Ctrl+W</kbd> cierra el panel activo. Si era el último, se cierra la pestaña. <kbd>Ctrl+Shift+W</kbd> cierra la pestaña entera, con todos sus paneles.

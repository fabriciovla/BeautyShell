---
lang: es
id: appearance
description: "El tema, el vidrio, el fondo de la terminal, las letras y el cursor de Beauty Shell."
lead: "Todo lo que cambia cómo se ve Beauty Shell está en Ajustes → Apariencia, y cada cambio se aplica en el momento."
---

## Tema

- **Claro**: fondo blanco, tinta negra.
- **Oscuro**: fondo negro, tinta blanca.
- **Como Windows**: sigue el modo de Windows y cambia solo cuando lo cambiás en el sistema.

La interfaz es **monocromática** a propósito: negro, grises y blanco. Lo que marca un valor (un interruptor, una selección) va en la tinta del tema. El color queda para lo que corre en tus terminales.

## El vidrio de la ventana

La ventana no tiene barra de título ni bordes de Windows: es transparente y, detrás, Windows dibuja un material.

| Opción | Cómo se ve |
| --- | --- |
| **Acrílico** | Un vidrio esmerilado que deja ver, borroso, lo que hay detrás de la ventana. Es el de los menús de Windows 11. |
| **Mica** | Un material más quieto, que toma el tono de tu fondo de escritorio. |
| **Sólido** | Sin transparencia. |

Con Acrílico o Mica, **Vidrio** regula cuánto se nota el efecto: el brillo que cae desde arriba, el filo de luz del borde y cuánto tapa el tinte de la ventana.

## El fondo de la terminal

| Opción | Cómo se ve |
| --- | --- |
| **Puro** | Negro o blanco, según el tema. |
| **Gris** | El gris de las ventanas de Windows 11. |
| **Vidrio** | La terminal también deja ver el vidrio de atrás. **Opacidad** regula cuánto tapa, de 30% a 100%. |

Con **Vidrio**, Beauty Shell hace dos ajustes para que los programas se vean bien: reescribe como transparentes los fondos que pintan con el mismo color que la terminal (ver [Agentes](/shell/docs/agentes/)) y, si un programa pregunta el color de fondo, le responde el del tema.

## Pestañas

**Al costado**, agrupadas por carpeta en la barra lateral, o **Arriba**, en una tira como la de Chrome. Ver [Pestañas y carpetas](/shell/docs/pestanas/).

## Texto

Arriba de estas opciones hay una terminal de muestra que se dibuja con lo que elegís.

### Fuente

Las letras vienen **empaquetadas con la app**, así andan sin internet. Casi todas son variables, con todos los grosores, y llevan su itálica real cuando la familia la tiene.

JetBrains Mono (la predeterminada), Cascadia Code, Consolas, Fira Code, Geist Mono, IBM Plex Mono, Source Code Pro, Roboto Mono, Red Hat Mono, Victor Mono, Intel One Mono, Azeret Mono, Martian Mono, Reddit Mono e Inconsolata.

Cascadia Code y Consolas vienen con Windows y no se empaquetan.

### Tamaño, grosor e interlineado

- **Tamaño de letra**: de 9 a 28 puntos (13 por defecto). También con <kbd>Ctrl+=</kbd>, <kbd>Ctrl+-</kbd> y <kbd>Ctrl+0</kbd>.
- **Grosor**: Fina (300), Normal (400), Media (500), Semi (600) o Negrita (700). La negrita de la terminal va 300 más gruesa que el grosor elegido. Con el fondo en Vidrio, las letras se dibujan sin ClearType (en escala de grises) y se verían finitas, así que Beauty Shell las engrosa 100 sola para compensar.
- **Interlineado**: el aire entre una línea y la siguiente, de 1,00 a 1,60.

## Cursor

En **Ajustes → Terminal → Cursor**: forma de **barra**, **bloque** o **subrayado**, y si **parpadea**.

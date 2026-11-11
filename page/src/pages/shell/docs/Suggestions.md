---
lang: es
id: suggestions
description: "Cómo elige Beauty Shell la sugerencia gris que aparece al escribir en PowerShell."
lead: "Mientras escribís en PowerShell, el resto del comando aparece en gris después del cursor. A diferencia de las de PSReadLine, estas saben en qué carpeta estás."
---

## Cómo se usan

- Escribí el comienzo de un comando. Si hay una sugerencia, aparece en gris.
- <kbd>Tab</kbd> o <kbd>→</kbd> la aceptan.
- Si no hay sugerencia, <kbd>Tab</kbd> completa archivos y comandos como siempre.
- Seguir escribiendo la cambia o la hace desaparecer.

Funcionan en **PowerShell 7 y Windows PowerShell**. Se apagan en **Ajustes → Terminal → Escritura → Sugerir al escribir**.

## Por qué no las de PSReadLine

PowerShell trae sugerencias propias (PSReadLine), pero ofrecen cualquier comando del historial que empiece igual, **sin mirar dónde estás**. Escribís `cd ws` en una carpeta y te sugiere `cd wsp-crm`, que solo existe en otra. Por eso Beauty Shell las apaga y dibuja las suyas.

## Cómo elige

Cada comando que corrés se guarda **junto con la carpeta donde lo corriste** y la shell. Para elegir qué sugerir:

1. **Los que fallaron no se guardan.** Beauty Shell sabe cómo terminó cada comando por su código de salida (OSC 133;D), así que un comando con un error de tipeo no te lo vuelve a ofrecer.
2. **Gana lo que usaste en esta carpeta.** Entre los comandos que empiezan igual, primero van los que corriste acá.
3. **Después, lo más usado y lo más reciente**, de cualquier carpeta.
4. **Al final, el historial que ya tenía PowerShell** en tu equipo (el de PSReadLine, sin carpetas), para que las sugerencias sirvan desde el primer día.

Y unas reglas para no molestar:

- Con **una sola letra** escrita no se sugiere nada.
- Lo que viene **de otras carpetas** recién aparece con tres letras o más.
- Nunca se sugiere desde otra carpeta un comando que **depende de dónde se corrió**: un `cd` o una ruta relativa.

## Los `cd`

En un `cd` (y en `Set-Location`, `pushd` y sus variantes) mandan **las carpetas que existen de verdad donde estás**. Beauty Shell las lista en el momento, así que solo te sugiere un `cd` a una carpeta que está ahí. Sin nada escrito después del `cd` no sugiere nada, porque no hay cómo adivinar.

## Dónde se guardan

El historial con carpetas queda en tu equipo, junto con los demás datos de la app (ver [Instalación](/shell/docs/instalacion/)). No se manda a ningún lado.

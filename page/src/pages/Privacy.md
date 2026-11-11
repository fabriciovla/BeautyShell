---
lang: es
kind: legal
alt: /en/privacy/
title: Política de privacidad
description: Qué datos maneja Beauty Shell, dónde quedan y con quién se conecta la app.
eyebrow: Legal
lead: La versión corta es que Beauty Shell no tiene cuentas, no mide lo que hacés y no manda lo que pasa en tus terminales a ningún servidor nuestro. Acá está la versión larga.
updated: 22 de octubre de 2026
---

## Lo que no hacemos

- **No hay cuentas.** La app se usa sin registrarse y sin iniciar sesión.
- **No hay analíticas ni telemetría.** Beauty Shell no cuenta cuántas veces la abrís, qué funciones usás ni cuánto tiempo pasás en ella.
- **No leemos tus terminales.** Lo que escribís, los comandos que corrés y lo que muestran tus terminales se quedan en tu equipo. No hay un servidor de Beauty Shell que los reciba.
- **No vendemos ni compartimos datos**, porque no los juntamos.

## Lo que se guarda en tu equipo

Para funcionar, la app guarda algunas cosas en tu usuario de Windows, en la carpeta `%LOCALAPPDATA%\dev.vidrio.terminal`. Nada de esto sale de tu equipo:

- **Tus ajustes**: el tema, la letra, la shell predeterminada y las demás preferencias.
- **Tus sesiones**, para restaurarlas al volver a abrir: las pestañas, cómo están divididos los paneles, en qué carpeta está cada una y sus nombres. Si apagás **Restaurar sesiones** en Ajustes, no se vuelven a abrir.
- **El historial para las sugerencias**: cada comando que corriste en PowerShell junto con la carpeta donde lo corriste, para sugerirte primero los que usaste ahí. Los comandos que fallaron no se guardan. La app también lee el historial que ya tiene PowerShell en tu equipo (el de PSReadLine), solo para sugerir.
- **Tus espacios de trabajo**, si guardás alguno: las pestañas, las carpetas y el comando que corría en cada panel.
- **Si ya viste la bienvenida** y tus preferencias de avisos.

Si desinstalás la app y borrás esa carpeta, no queda nada.

## Con quién se conecta la app

Beauty Shell solo se conecta a internet en estos casos:

- **Para buscar actualizaciones.** La app consulta en GitHub si hay una versión nueva y, si la hay, la descarga de ahí. Como en cualquier descarga, GitHub recibe tu dirección IP y los datos técnicos de la conexión, según su propia política de privacidad. No mandamos ningún dato tuyo en esa consulta.
- **Cuando usás el navegador integrado.** Las páginas que abrís reciben lo mismo que recibirían desde cualquier navegador, y lo que escribís en la barra que no sea una dirección se busca en Google. El navegador integrado usa WebView2, el motor de Microsoft Edge que viene con Windows.
- **Cuando lo pide algo que corrés.** Los programas y agentes que abrís en tus terminales se conectan a donde ellos quieran: Claude Code, por ejemplo, habla con Anthropic. Eso se rige por la política de cada uno, no por esta.
- **Cuando instalás un agente desde Ajustes.** La app corre en una terminal el comando de instalación oficial de ese agente, que lo descarga de su sitio.

## El servidor local para los agentes

Para que los agentes que corren en una terminal puedan hablar con las demás, Beauty Shell abre un pequeño servidor en tu equipo, en `127.0.0.1`. Esa dirección solo existe dentro de tu computadora: no se puede llegar a ese servidor desde internet ni desde otros equipos de tu red.

A través de él, un agente conectado puede ver la lista de tus terminales, leer lo que muestran, escribirles y abrir o leer páginas del navegador integrado. Solo lo usan los agentes que vos conectás, por ejemplo con **Conectar Claude Code** en Ajustes. Lo que un agente lee de tus terminales puede viajar a quien lo hace (por ejemplo, Anthropic en el caso de Claude Code), según su política.

## Los avisos

Cuando un comando largo termina o un agente espera tu respuesta, la app muestra un aviso de Windows. Esos avisos se generan en tu equipo y no pasan por ningún servidor nuestro.

## Este sitio web

Este sitio no usa cookies, no tiene analíticas y no tiene formularios. Las letras se cargan desde Google Fonts, así que Google recibe tu dirección IP y los datos técnicos de esa descarga, según su política de privacidad.

## Si esto cambia

Si en algún momento la app empieza a manejar datos de otra forma, lo vamos a decir acá antes, y cambia la fecha de arriba. También podés leer los [términos y condiciones](/terminos/).

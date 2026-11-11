---
lang: es
app: screenshot
id: troubleshooting
description: "Soluciones a los problemas más comunes de Beauty Screenshot."
lead: "Lo que suele pasar y cómo resolverlo."
---

## Mi antivirus o Windows dice que es peligrosa

Es una falsa alarma. Para sacar capturas, Beauty Screenshot tiene que hacer cosas que, vistas de afuera, se parecen a las de un programa espía, y algunos antivirus la marcan por las dudas. Si la subís a VirusTotal, unos pocos la marcan y la gran mayoría no encuentra nada.

| Lo que hace | Para qué |
| --- | --- |
| Escucha el teclado | Para que tu atajo funcione desde cualquier app. Solo reacciona a ese atajo, y a las teclas de la captura mientras estás capturando. |
| Mira la pantalla | Es lo que hace una captura. |
| Usa el portapapeles | Para dejar la captura copiada. |
| Arranca con Windows | Solo si lo dejás activado. |
| No tiene firma digital | Todavía no tiene el certificado pago con el que Windows y los antivirus reconocen quién hizo cada programa. |

Lo que **no** hace: no se conecta a internet ni manda nada a ningún lado. Tus capturas quedan en tu PC.

- Si Windows muestra **«Windows protegió tu PC»**, tocá **Más información** y después **Ejecutar de todos modos**.
- Si tu antivirus la mandó a **cuarentena**, restaurala desde el antivirus y agregala a sus excepciones.

## Impr Pant no hace nada, o abre otra cosa

- Fijate que Beauty Screenshot esté abierta: tiene que estar su ícono en la bandeja. Si no, abrila desde el menú Inicio.
- Otro programa de capturas puede estar usando la misma tecla. Cerralo, o cambiá el atajo en [Ajustes](/screenshot/docs/ajustes/).
- Si al abrirse te avisa **«Hacé clic en el ícono de la bandeja para capturar»**, no pudo tomar el teclado. Mientras tanto podés capturar con un clic en el ícono. Probá cerrarla (clic derecho en el ícono → **Salir**) y volver a abrirla.

## «No se pudo copiar»

Otro programa estaba usando el portapapeles justo en ese momento. Probá de nuevo.

## «No se pudo guardar»

La carpeta de capturas no existe o no se puede escribir en ella (por ejemplo, un disco que ya no está conectado). Elegí otra en **Ajustes → Guardado → Carpeta**.

## No encuentro el ícono

Windows esconde algunos íconos en la flecha **^** de la bandeja. Abrila y arrastrá el de Beauty Screenshot afuera para que quede siempre a la vista.

## Quiero avisar de un error

Si algo falló, Beauty Screenshot lo anota en `%LOCALAPPDATA%\BeautyScreenshot\error.log`. Cuando avises del error, sumá ese archivo y contá qué estabas haciendo.

---
lang: es
app: screenshot
id: install
description: "Cómo instalar, actualizar y desinstalar Beauty Screenshot en Windows, y dónde guarda sus archivos."
lead: "Cómo instalar Beauty Screenshot, cómo se actualiza y qué queda en tu equipo."
---

## Requisitos

- **Windows 10 u 11.**
- Nada más: usa .NET Framework, que ya viene con Windows.

No hace falta una cuenta ni conexión a internet para usarla.

## Instalar

1. Descargá el instalador desde el botón **Descargar** de este sitio.
2. Abrilo. Si Windows muestra «Windows protegió tu PC», tocá **Más información** y después **Ejecutar de todos modos** (ver [por qué](/screenshot/docs/problemas/#mi-antivirus-o-windows-dice-que-es-peligrosa)).
3. Elegí si querés que **inicie con Windows** y tocá **Instalar**. Se instala **para tu usuario**, así que no pide permisos de administrador.

Al terminar, Beauty Screenshot se abre en la **bandeja del sistema** (al lado del reloj) y te avisa qué atajo usar. También aparece en el menú Inicio como **Beauty Screenshot**.

## Actualizar

Beauty Screenshot no se actualiza sola. Para pasar a una versión nueva, descargá el instalador de nuevo y abrilo: se da cuenta de que ya está instalada, cierra la versión anterior, instala la nueva y la vuelve a abrir. Tus ajustes se mantienen.

## Desinstalar

Desde **Configuración de Windows → Aplicaciones → Aplicaciones instaladas**, buscá Beauty Screenshot y elegí **Desinstalar**.

Se borran el programa, tus ajustes, el acceso del menú Inicio y el inicio con Windows. **Las capturas que guardaste no se tocan.**

## Dónde guarda sus cosas

| Qué | Dónde |
| --- | --- |
| El programa | `%LOCALAPPDATA%\Programs\BeautyScreenshot` |
| Ajustes | En el registro, en `HKEY_CURRENT_USER\Software\BeautyScreenshot` |
| Capturas | En tu carpeta **Imágenes**, salvo que elijas otra en [Ajustes](/screenshot/docs/ajustes/) |
| Registro de errores | `%LOCALAPPDATA%\BeautyScreenshot\error.log` (solo si algo falló) |

Nada de esto sale de tu equipo. Ver la [política de privacidad](/privacidad/).

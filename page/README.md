# Beauty Shell site

Sitio estático hecho con Vue: cada ruta sale como su propio HTML (vite-ssg) y en el navegador
Vue toma esa página. Las páginas están en `src/pages` (las portadas en `.vue`, la
documentación y lo legal en Markdown).

```powershell
npm install --prefix page
npm run site:dev
```

Para compilar y previsualizar el sitio:

```powershell
npm run site:build
npm run site:preview
```

## Estilos

No hay framework de CSS: las clases están escritas a mano en `src/assets/styles`.

- `Base.css`: las variables, el reinicio y las animaciones.
- `utilities/`: las utilidades, un archivo por tema (`Padding.css`, `Colors.css`, `Responsive.css`...), que `Utilities.css` junta en orden. Se combinan en el HTML (`<div class="flex centrar gap-16 p-24">`). Los números son píxeles (`gap-16` es 16px, `text-14-5` es 14.5px) y la terminación `p` es porcentaje (`w-46p` es 46%). Los prefijos aplican la clase solo en un estado o tamaño: `hover:` al pasar el mouse, `group-hover:` al pasar el mouse por el contenedor con la clase `group`, `tablet:` hasta 900px, `phone:` hasta 640px y `narrow:` hasta 440px. Solo están las que el sitio usa: si hace falta otro valor, se agrega ahí.
- `Content.css`: lo único que no puede llevar clases, el HTML que sale del Markdown.

## Nombres de archivo

En inglés y en PascalCase (`FirstSteps.md`, `DocsNav.js`), salvo los que una herramienta espera con su nombre (`index.html`, `package.json`, `vite.config.js`, `apple-touch-icon.png`). Las páginas en español se llaman igual que su par en inglés y su URL en español sale del slug de `src/DocsNav.js` (lo legal, de `src/Routes.js`): `src/pages/shell/docs/FirstSteps.md` es `/shell/docs/primeros-pasos/`.

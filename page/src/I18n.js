export const routes = {
  es: {
    home: "/",
    browser: "/navegador/",
    shell: "/shell/",
    screenshot: "/screenshot/",
    docs: { shell: "/shell/docs/", screenshot: "/screenshot/docs/" },
    terms: "/terminos/",
    privacy: "/privacidad/",
  },
  en: {
    home: "/en/",
    browser: "/en/browser/",
    shell: "/en/shell/",
    screenshot: "/en/screenshot/",
    docs: { shell: "/en/shell/docs/", screenshot: "/en/screenshot/docs/" },
    terms: "/en/terms/",
    privacy: "/en/privacy/",
  },
};

export const chrome = {
  es: {
    home: "Beauty Apps, inicio",
    apps: "Apps",
    download: "Descargar",
    soon: "Próximamente",
    tagline: "Apps simples y lindas para Windows.",
    footerNav: "Enlaces del sitio",
    docs: "Documentación",
    terms: "Términos y condiciones",
    privacy: "Privacidad",
    otherLang: "English",
  },
  en: {
    home: "Beauty Apps, home",
    apps: "Apps",
    download: "Download",
    soon: "Coming soon",
    tagline: "Simple, beautiful apps for Windows.",
    footerNav: "Site links",
    docs: "Documentation",
    terms: "Terms and conditions",
    privacy: "Privacy",
    otherLang: "Español",
  },
};

export const apps = {
  browser: {
    name: "Beauty Browser",
    logo: "/BeautyBrowserLogo.png",
    download: "https://github.com/fabriciovla/BeautyBrowser/releases/latest/download/BeautyBrowserSetup.exe",
  },
  shell: {
    name: "Beauty Shell",
    logo: "/BeautyShellLogo.png",
    download: "https://github.com/fabriciovla/BeautyShell/releases/latest/download/BeautyShellSetup.exe",
  },
  screenshot: {
    name: "Beauty Screenshot",
    logo: "/BeautyScreenshotLogo.png",
    download: "https://github.com/fabriciovla/BeautyScreenshot/releases/latest/download/BeautyScreenshot.exe",
  },
};

export const downloadUrl = apps.shell.download;

export const other = (lang) => (lang === "es" ? "en" : "es");

export const appsLogo = "/BeautyAppsLogo.png";

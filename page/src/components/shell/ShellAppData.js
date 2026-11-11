const texts = {
  es: {
    region: "Demo de Beauty Shell",
    newTerminal: "Nueva terminal",
    settings: "Ajustes",
    pin: "Ocultar o fijar la barra lateral (Ctrl+Shift+B)",
    closeTab: "Cerrar pestaña",
    closePane: "Cerrar panel",
    newHere: "Nueva terminal en esta carpeta",
    working: "trabajando…",
    waiting: "Esperando respuesta",
    finished: "terminó",
    back: "Volver",
    palettePlaceholder: "Buscá una acción o una terminal…",
    paletteEmpty: "Nada coincide",
    actions: {
      newTerminal: "Nueva terminal",
      splitRight: "Dividir a la derecha",
      splitDown: "Dividir abajo",
      toggleSidebar: "Mostrar u ocultar la barra lateral",
      settings: "Ajustes",
      dark: "Tema oscuro",
      light: "Tema claro",
      clear: "Limpiar la terminal",
    },
    sections: {
      appearance: ["Apariencia", "El tema, el vidrio de la ventana y el texto."],
      terminal: ["Terminal", "La shell, el cursor y cómo se escribe."],
      agents: ["Agentes", "Los agentes de código que tenés instalados y cómo se hablan entre sesiones."],
      shortcuts: ["Atajos", "Los mismos que Chrome, más los propios de una terminal."],
      about: ["Acerca de", "La versión de Beauty Shell."],
    },
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    background: "Fondo",
    windowBg: "Ventana",
    acrylic: "Acrílico",
    mica: "Mica",
    solid: "Sólido",
    terminalBg: "Terminal",
    pure: "Puro",
    gray: "Gris",
    glass: "Vidrio",
    text: "Texto",
    textDesc: "En las terminales. El tamaño también cambia con Ctrl + y Ctrl −.",
    font: "Fuente",
    fontSize: "Tamaño de letra",
    shell: "Shell",
    shellDesc: "Cada terminal nueva abre esta shell en la carpeta de la pestaña actual.",
    defaultShell: "Predeterminada",
    cursor: "Cursor",
    shape: "Forma",
    bar: "Barra",
    block: "Bloque",
    underline: "Subrayado",
    blink: "Parpadeo",
    typing: "Escritura",
    suggest: "Sugerir al escribir",
    suggestDesc: "Mientras escribís aparece en gris un comando del historial que empieza igual; → o Tab lo aceptan.",
    installed: "Instalado",
    notInstalled: "No instalado",
    connect: "Mensajes entre sesiones",
    connectDesc: "Los agentes ven las demás sesiones, leen su pantalla y les escriben.",
    connected: "Conectado",
    version: "Versión",
    or: "o",
    sample: "Así se ve el texto",
  },
  en: {
    region: "Beauty Shell demo",
    newTerminal: "New terminal",
    settings: "Settings",
    pin: "Hide or pin the sidebar (Ctrl+Shift+B)",
    closeTab: "Close tab",
    closePane: "Close pane",
    newHere: "New terminal in this folder",
    working: "working…",
    waiting: "Waiting for reply",
    finished: "finished",
    back: "Back",
    palettePlaceholder: "Search an action or a terminal…",
    paletteEmpty: "Nothing matches",
    actions: {
      newTerminal: "New terminal",
      splitRight: "Split right",
      splitDown: "Split down",
      toggleSidebar: "Show or hide the sidebar",
      settings: "Settings",
      dark: "Dark theme",
      light: "Light theme",
      clear: "Clear the terminal",
    },
    sections: {
      appearance: ["Appearance", "The theme, the window glass and the text."],
      terminal: ["Terminal", "The shell, the cursor and typing."],
      agents: ["Agents", "The coding agents you have installed and how they talk between sessions."],
      shortcuts: ["Shortcuts", "The same as Chrome, plus the ones a terminal needs."],
      about: ["About", "The Beauty Shell version."],
    },
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    background: "Background",
    windowBg: "Window",
    acrylic: "Acrylic",
    mica: "Mica",
    solid: "Solid",
    terminalBg: "Terminal",
    pure: "Pure",
    gray: "Gray",
    glass: "Glass",
    text: "Text",
    textDesc: "In the terminals. The size also changes with Ctrl + and Ctrl −.",
    font: "Font",
    fontSize: "Font size",
    shell: "Shell",
    shellDesc: "Every new terminal opens this shell in the current tab's folder.",
    defaultShell: "Default",
    cursor: "Cursor",
    shape: "Shape",
    bar: "Bar",
    block: "Block",
    underline: "Underline",
    blink: "Blink",
    typing: "Typing",
    suggest: "Suggest as you type",
    suggestDesc: "As you type, a history command that starts the same shows up in gray; → or Tab accept it.",
    installed: "Installed",
    notInstalled: "Not installed",
    connect: "Messages between sessions",
    connectDesc: "Agents see the other sessions, read their screen and write to them.",
    connected: "Connected",
    version: "Version",
    or: "or",
    sample: "This is how text looks",
  },
};

const shortcuts = {
  es: [
    ["Pestañas", [["Nueva terminal en la misma carpeta", "Ctrl T"], ["Cerrar pestaña", "Ctrl Shift W"], ["Reabrir lo último cerrado", "Ctrl Shift T"], ["Pestaña siguiente", "Ctrl Tab"], ["Ir a la pestaña 1…8", "Ctrl 1…8"]]],
    ["Paneles", [["Dividir a la derecha", "Ctrl Shift D"], ["Dividir abajo", "Ctrl Shift E"], ["Agrandar o achicar el panel", "Ctrl Shift Z"], ["Cerrar panel", "Ctrl W"]]],
    ["Terminal", [["Buscar", "Ctrl F"], ["Ir al comando anterior o siguiente", "Ctrl ↑ / Ctrl ↓"], ["Abrir enlace", "Ctrl Clic"], ["Agrandar la letra", "Ctrl +"]]],
    ["Ventana", [["Paleta de comandos", "Ctrl Shift P"], ["Mostrar u ocultar la barra lateral", "Ctrl Shift B"], ["Modo Quake, desde cualquier programa", "Win `"], ["Ajustes", "Ctrl ,"]]],
  ],
  en: [
    ["Tabs", [["New terminal in the same folder", "Ctrl T"], ["Close tab", "Ctrl Shift W"], ["Reopen what you last closed", "Ctrl Shift T"], ["Next tab", "Ctrl Tab"], ["Go to tab 1…8", "Ctrl 1…8"]]],
    ["Panes", [["Split right", "Ctrl Shift D"], ["Split down", "Ctrl Shift E"], ["Zoom the pane in or out", "Ctrl Shift Z"], ["Close pane", "Ctrl W"]]],
    ["Terminal", [["Find", "Ctrl F"], ["Go to the previous or next command", "Ctrl ↑ / Ctrl ↓"], ["Open link", "Ctrl Click"], ["Bigger text", "Ctrl +"]]],
    ["Window", [["Command palette", "Ctrl Shift P"], ["Show or hide the sidebar", "Ctrl Shift B"], ["Quake mode, from any program", "Win `"], ["Settings", "Ctrl ,"]]],
  ],
};

export const shells = [
  { id: "pwsh", name: "PowerShell 7" },
  { id: "powershell", name: "Windows PowerShell" },
  { id: "cmd", name: "Command Prompt" },
  { id: "bash", name: "Git Bash" },
  { id: "wsl", name: "Ubuntu (WSL)" },
];

export const fonts = ["JetBrains Mono", "Cascadia Code", "Geist Mono", "Consolas"];

export const agents = [
  { name: "Claude Code", installed: true },
  { name: "Codex", installed: true },
  { name: "Gemini CLI", installed: false },
  { name: "GitHub Copilot CLI", installed: false },
];

export function prompt(shell, folder) {
  if (shell === "cmd") return `C:\\Users\\ana\\${folder}&gt;`;
  if (shell === "bash") return `<span class="c-green">ana@PC</span> <span class="c-magenta">MINGW64</span> <span class="c-yellow">~/${folder}</span>\n$`;
  if (shell === "wsl") return `<span class="c-green c-bold">ana@PC</span>:<span class="c-blue c-bold">~/${folder}</span>$`;
  return `PS C:\\Users\\ana\\${folder}&gt;`;
}

const files = {
  "beauty-shell": [["d", "src"], ["d", "src-tauri"], ["d", "page"], ["f", "package.json"], ["f", "README.md"]],
  "sitio-web": [["d", "public"], ["d", "src"], ["f", "astro.config.mjs"], ["f", "package.json"]],
  notas: [["f", "ideas.md"], ["f", "compras.txt"]],
};

export function getShellApp(lang) {
  const say = texts[lang];
  const es = lang === "es";

  return {
    say,
    shortcuts: shortcuts[lang],
    history: ["npm run dev", "git status", "git log --oneline -5", "claude", "cd sitio-web", "ls"],
    folders: ["beauty-shell", "sitio-web"],

    help: [
      es ? "Comandos de esta demo:" : "Commands in this demo:",
      `  <span class="c-bold">ls</span>             ${es ? "lo que hay en la carpeta" : "what's in the folder"}`,
      `  <span class="c-bold">cd</span> <span class="c-faint">carpeta</span>     ${es ? "cambia de carpeta (la pestaña se muda de grupo)" : "changes folder (the tab moves to that group)"}`,
      `  <span class="c-bold">npm run dev</span>    ${es ? "levanta un servidor; Ctrl+clic en el enlace lo abre al lado" : "starts a server; Ctrl+click the link opens it alongside"}`,
      `  <span class="c-bold">claude</span>         ${es ? "abre Claude Code en esta terminal" : "opens Claude Code in this terminal"}`,
      `  <span class="c-bold">git status</span>     ${es ? "y" : "and"} <span class="c-bold">git log</span>`,
      `  <span class="c-bold">echo</span>, <span class="c-bold">date</span>, <span class="c-bold">whoami</span>, <span class="c-bold">clear</span>, <span class="c-bold">exit</span>`,
      "",
      `<span class="c-faint">${es ? "Ctrl+Shift+P abre la paleta · Ctrl+Shift+D divide · Ctrl+, abre los ajustes · arrastrá una pestaña sobre la terminal para dividir" : "Ctrl+Shift+P opens the palette · Ctrl+Shift+D splits · Ctrl+, opens settings · drag a tab onto the terminal to split"}</span>`,
    ],

    ls(folder, shell) {
      const list = files[folder] ?? [];
      if (!list.length) return [];
      if (shell === "bash" || shell === "wsl") return [list.map(([k, n]) => (k === "d" ? `<span class="c-blue c-bold">${n}</span>` : n)).join("  ")];
      if (shell === "cmd") return list.map(([k, n]) => `10/11/2026  15:42    ${k === "d" ? "&lt;DIR&gt;         " : "          1.204 "}${n}`);
      return [
        "",
        `    ${es ? "Directorio" : "Directory"}: C:\\Users\\ana\\${folder}`,
        "",
        '<span class="c-green">Mode                 LastWriteTime         Length Name</span>',
        '<span class="c-green">----                 -------------         ------ ----</span>',
        ...list.map(([k, n]) => (k === "d" ? `d----          10/11/2026    15:42                <span class="c-blue c-bold">${n}</span>` : `-a---          10/11/2026    15:42           1204 ${n}`)),
        "",
      ];
    },

    gitStatus: [
      "On branch <span class=\"c-bold\">main</span>",
      "Your branch is up to date with '<span class=\"c-red\">origin/main</span>'.",
      "",
      "Changes not staged for commit:",
      '        <span class="c-red">modified:   src/session.ts</span>',
      '        <span class="c-red">modified:   src/styles.css</span>',
      "",
    ],
    gitLog: [
      '<span class="c-yellow">a1f3c2e</span> Sidebar folders wrap their tabs',
      '<span class="c-yellow">9b2e07d</span> Snapshot the page under the sidebar',
      '<span class="c-yellow">4c8d1aa</span> New app icon',
      '<span class="c-yellow">e71f5b3</span> Remove the prompt box',
      '<span class="c-yellow">2d09c6f</span> Close the sidebar after a pause',
    ],
    devServer: (folder) =>
      folder === "sitio-web"
        ? [
            "",
            ' <span class="c-bold c-magenta">astro</span>  v6.0.0 <span class="c-faint">ready in 212 ms</span>',
            "",
            '┃ Local    <span class="link" data-url="http://localhost:4321/">http://localhost:4321/</span>',
            '┃ Network  <span class="c-faint">use --host to expose</span>',
            "",
          ]
        : [
            "",
            `<span class="c-faint">&gt; ${folder}@0.1.2 dev</span>`,
            '<span class="c-faint">&gt; vite</span>',
            "",
            '  <span class="c-green c-bold">VITE</span> <span class="c-green">v8.3.4</span>  <span class="c-faint">ready in</span> <span class="c-bold">164</span> <span class="c-faint">ms</span>',
            "",
            '  <span class="c-green">➜</span>  <span class="c-bold">Local</span>:   <span class="link" data-url="http://localhost:1420/">http://localhost:1420/</span>',
            '  <span class="c-green">➜</span>  <span class="c-faint">Network: use</span> <span class="c-bold">--host</span> <span class="c-faint">to expose</span>',
            "",
          ],
    claudeAnswer: (text) => {
      const q = text.toLowerCase();
      if (/hola|hello|hi\b/.test(q)) return es ? "¡Hola! ¿En qué te ayudo con este proyecto?" : "Hi! How can I help with this project?";
      if (/test|prueba/.test(q)) return es ? "Corrí los tests: 42 pasaron, ninguno falló." : "I ran the tests: 42 passed, none failed.";
      if (/demo|web|sitio|site/.test(q)) return es ? "Listo: la demo de la web ahora es interactiva, con paneles, ajustes y paleta." : "Done: the website demo is interactive now, with panes, settings and the palette.";
      return es ? `Listo. Hice lo que pediste: «${text}». Revisé los cambios y compila.` : `Done. I did what you asked: “${text}”. I checked the changes and it builds.`;
    },
    claudeTools: es ? ["Read(src/session.ts)", "Edit(src/styles.css)", "Bash(npm run build)"] : ["Read(src/session.ts)", "Edit(src/styles.css)", "Bash(npm run build)"],
    notFound: (cmd, shell) =>
      shell === "cmd"
        ? `'${cmd}' ${es ? "no se reconoce como un comando interno o externo." : "is not recognized as an internal or external command."}`
        : shell === "bash" || shell === "wsl"
          ? `bash: ${cmd}: command not found`
          : `<span class="c-red">${cmd}: ${es ? "El término no se reconoce como nombre de un cmdlet, función o programa ejecutable." : "The term is not recognized as a name of a cmdlet, function or executable program."}</span>\n<span class="c-faint">${es ? "Es una demo: probá con" : "It's a demo: try"} help.</span>`,
  };
}

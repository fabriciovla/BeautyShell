export const prompt = (folder) => `PS C:\\Users\\Ana\\${folder}&gt;`;

const texts = {
  es: {
    newTerminal: "Nueva terminal",
    settings: "Ajustes",
    closeTab: "Cerrar pestaña",
    waiting: "Esperando respuesta",
    region: "Demo interactiva de Beauty Shell: elegí una pestaña, abrí una nueva o escribí en una terminal",
    input: "Escribir en la terminal de la demo",
    hint: "Hacé clic en una terminal y escribí. Probá con <b class=\"text-white font-mono font-500\">help</b>.",
    claudeAsk: "Hacé que la demo de la web sea interactiva",
    claudeDone: "Listo: las pestañas se pueden elegir y en las terminales se puede escribir.",
    help: [
      "Comandos de esta demo:",
      "  <b>help</b>     esta ayuda",
      "  <b>ls</b>       lo que hay en la carpeta",
      "  <b>echo</b>     repite lo que escribas",
      "  <b>date</b>     la fecha de hoy",
      "  <b>clear</b>    limpia la pantalla",
      '<span class="text-faint">Ctrl+C corta lo que esté corriendo.</span>',
    ],
    notFound: "{cmd}: no existe en la demo. Probá con <b>help</b>, o descargá Beauty Shell para usarlo de verdad.",
  },
  en: {
    newTerminal: "New terminal",
    settings: "Settings",
    closeTab: "Close tab",
    waiting: "Waiting for reply",
    region: "Interactive Beauty Shell demo: pick a tab, open a new one or type in a terminal",
    input: "Type in the demo terminal",
    hint: "Click a terminal and type. Try <b class=\"text-white font-mono font-500\">help</b>.",
    claudeAsk: "Make the website demo interactive",
    claudeDone: "Done: tabs are clickable and you can type in the terminals.",
    help: [
      "Commands in this demo:",
      "  <b>help</b>     this help",
      "  <b>ls</b>       what's in the folder",
      "  <b>echo</b>     repeats what you type",
      "  <b>date</b>     today's date",
      "  <b>clear</b>    clears the screen",
      '<span class="text-faint">Ctrl+C stops whatever is running.</span>',
    ],
    notFound: "{cmd}: not available in the demo. Try <b>help</b>, or download Beauty Shell to use it for real.",
  },
};

export function getShellDemo(lang) {
  const say = texts[lang];

  return {
    lang,
    ui: { newTerminal: say.newTerminal, closeTab: say.closeTab },
    commands: {
      help: say.help,
      ls: [
        '<span class="text-faint">Mode     Name</span>',
        '<span class="text-faint">d-----</span>   src',
        '<span class="text-faint">d-----</span>   src-tauri',
        '<span class="text-faint">-a----</span>   package.json',
        '<span class="text-faint">-a----</span>   README.md',
      ],
      notFound: say.notFound,
    },
    tabs: [
      {
        folder: "beauty-shell",
        icon: "terminal",
        title: "PowerShell",
        sub: "npm run dev",
        panes: [
          {
            head: "PowerShell",
            cmd: "npm run dev",
            running: true,
            out: [
              '<span class="text-faint">&gt; beauty-shell@0.1.2 dev</span>',
              '<span class="text-faint">&gt; vite</span>',
              "",
              '<b>VITE</b> v8.3.4  <span class="text-faint">ready in 164 ms</span>',
              "",
              '<span class="text-faint">➜</span>  Local:   <u>http://localhost:1420/</u>',
              '<span class="text-faint">➜</span>  Network: <span class="text-faint">use --host to expose</span>',
            ],
          },
          {
            head: "Git",
            cmd: "git status",
            out: [
              "On branch <b>main</b>",
              "<span class=\"text-faint\">Your branch is up to date with 'origin/main'.</span>",
              "",
              "Changes not staged for commit:",
              '<span class="text-faint">  modified:   src/session.ts</span>',
              '<span class="text-faint">  modified:   src/styles.css</span>',
            ],
          },
        ],
      },
      {
        folder: "beauty-shell",
        icon: "sparkle",
        title: "Claude Code",
        sub: say.waiting,
        panes: [
          {
            head: "Claude Code",
            cmd: "claude",
            running: true,
            quiet: true,
            out: [
              "<b>✻</b> Welcome to Claude Code!",
              '<span class="text-faint">  /help for help · cwd: ~\\beauty-shell</span>',
              "",
              `<span class="text-faint">›</span> ${say.claudeAsk}`,
              "",
              `<b>●</b> ${say.claudeDone}`,
              "",
              '<span class="text-faint">›</span>',
            ],
          },
        ],
      },
      {
        folder: "beauty-shell",
        icon: "branch",
        title: "Git",
        sub: "",
        panes: [
          {
            head: "Git",
            cmd: "git log --oneline -5",
            out: [
              '<span class="text-faint">a1f3c2e</span> Sidebar folders wrap their tabs',
              '<span class="text-faint">9b2e07d</span> Snapshot the page under the sidebar',
              '<span class="text-faint">4c8d1aa</span> New app icon',
              '<span class="text-faint">e71f5b3</span> Remove the prompt box',
              '<span class="text-faint">2d09c6f</span> Close the sidebar after a pause',
            ],
          },
        ],
      },
      {
        folder: "sitio-web",
        icon: "terminal",
        title: "PowerShell",
        sub: "pnpm dev",
        panes: [
          {
            head: "PowerShell",
            cmd: "pnpm dev",
            running: true,
            out: [
              "",
              ' <b>astro</b>  v6.0.0 <span class="text-faint">ready in 212 ms</span>',
              "",
              "┃ Local    <u>http://localhost:4321/</u>",
              '┃ Network  <span class="text-faint">use --host to expose</span>',
              "",
              '<span class="text-faint">watching for file changes...</span>',
            ],
          },
        ],
      },
    ],
    text: { settings: say.settings, region: say.region, input: say.input, hint: say.hint },
  };
}

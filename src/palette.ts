import { esc } from "./settings";
import { t } from "./lang";

export interface Command {
  label: string;

  detail?: string;

  hint?: string;
  run(): void;
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function score(query: string, text: string): number {
  if (!query) return 0;
  let total = 0;
  let at = 0;
  let streak = 0;
  for (const ch of query) {
    if (ch === " ") continue;
    const found = text.indexOf(ch, at);
    if (found < 0) return -1;
    streak = found === at && total > 0 ? streak + 1 : 0;
    const wordStart = found === 0 || /[\s:\\/._-]/.test(text[found - 1]);
    total += 1 + streak * 2 + (wordStart ? 3 : 0) - Math.min(found - at, 4) * 0.2;
    at = found + 1;
  }
  return total;
}

export class Palette {
  private readonly el: HTMLDivElement;
  private readonly input: HTMLInputElement;
  private readonly list: HTMLDivElement;
  private commands: Command[] = [];
  private shown: Command[] = [];
  private selected = 0;
  private answer: ((value: string | null) => void) | null = null;

  constructor(private readonly onClose: () => void) {
    this.el = document.createElement("div");
    this.el.className = "palette glass";
    this.el.hidden = true;
    this.el.innerHTML = `<input type="text" spellcheck="false"><div class="palette-list"></div>`;
    document.body.append(this.el);
    this.input = this.el.querySelector("input")!;
    this.list = this.el.querySelector(".palette-list")!;

    this.input.addEventListener("input", () => this.filter());
    this.input.addEventListener("keydown", (e) => this.key(e));
    this.list.addEventListener("mousemove", (e) => {
      const i = this.rowIndex(e.target);
      if (i >= 0 && i !== this.selected) this.select(i);
    });
    this.list.addEventListener("click", (e) => {
      const i = this.rowIndex(e.target);
      if (i >= 0) this.run(i);
    });
    document.addEventListener("mousedown", (e) => {
      if (!this.el.hidden && !this.el.contains(e.target as Node)) this.close();
    });
  }

  get isOpen() {
    return !this.el.hidden;
  }

  open(commands: Command[]) {
    this.finishAsk(null);
    this.commands = commands;
    this.show(t("Buscá un comando o una terminal", "Search for a command or a terminal"), "");
    this.filter();
  }

  ask(placeholder: string, initial = ""): Promise<string | null> {
    this.finishAsk(null);
    this.commands = [];
    this.list.innerHTML = "";
    this.show(placeholder, initial);
    return new Promise((resolve) => (this.answer = resolve));
  }

  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.finishAsk(null);
    this.onClose();
  }

  private show(placeholder: string, value: string) {
    this.input.placeholder = placeholder;
    this.input.value = value;
    this.el.hidden = false;
    this.input.focus();
    this.input.select();
  }

  private finishAsk(value: string | null) {
    const answer = this.answer;
    this.answer = null;
    answer?.(value);
  }

  private filter() {
    if (this.answer) return;
    const query = fold(this.input.value.trim());
    this.shown = this.commands
      .map((c, i) => ({ c, i, s: Math.max(score(query, fold(c.label)), score(query, fold(`${c.label} ${c.detail ?? ""}`)) - 1) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .slice(0, 60)
      .map((r) => r.c);
    this.list.innerHTML = this.shown.length
      ? this.shown
          .map(
            (c, i) => `<div class="palette-row" data-i="${i}">
              <span class="palette-label">${esc(c.label)}</span>
              ${c.detail ? `<span class="palette-detail">${esc(c.detail)}</span>` : ""}
              ${c.hint ? `<span class="hint">${esc(c.hint)}</span>` : ""}
            </div>`,
          )
          .join("")
      : `<div class="palette-empty">${t("Nada coincide", "Nothing matches")}</div>`;
    this.select(0);
  }

  private select(i: number) {
    this.selected = i;
    this.list.querySelectorAll(".palette-row").forEach((row, j) => row.classList.toggle("selected", j === i));
    this.list.querySelector(".selected")?.scrollIntoView({ block: "nearest" });
  }

  private rowIndex(target: EventTarget | null): number {
    const row = (target as HTMLElement).closest<HTMLElement>(".palette-row");
    return row ? Number(row.dataset.i) : -1;
  }

  private run(i: number) {
    const command = this.shown[i];
    if (!command) return;
    this.el.hidden = true;
    this.onClose();
    command.run();
  }

  private key(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (this.answer) {
        const value = this.input.value.trim();
        this.el.hidden = true;
        this.finishAsk(value || null);
        this.onClose();
      } else this.run(this.selected);
    } else if (!this.answer && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const n = this.shown.length;
      if (n) this.select((this.selected + (e.key === "ArrowDown" ? 1 : -1) + n) % n);
    }
  }
}

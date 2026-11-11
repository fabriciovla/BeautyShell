import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { normalizeUrl } from "./browser";
import { flyBubble, type Point } from "./bubble";
import { t } from "./lang";
import type { Session } from "./session";

interface ToolRequest {
  id: number;
  tool: string;
  args: Record<string, unknown>;

  from: number;
}

export interface AgentContext {
  sessions(): Session[];

  anchor(session: Session | undefined): Point;

  openBrowser(url: string, background: boolean): string;

  readBrowser(query: string | undefined, maxChars: number): Promise<string>;
}

export function startAgentBridge(ctx: AgentContext) {
  void listen<ToolRequest>("agent-tool", async ({ payload }) => {
    let text: string;
    let isError = false;
    try {
      text = await run(ctx, payload);
    } catch (e) {
      text = e instanceof Error ? e.message : String(e);
      isError = true;
    }
    invoke("agent_reply", { id: payload.id, text, isError }).catch(() => {});
  });
}

const describe = (s: Session) => `${s.ptyId} "${s.label}"`;

function find(ctx: AgentContext, query: unknown): Session {
  const q = String(query ?? "").trim();
  if (!q) throw new Error(t("Falta indicar la sesión.", "The session is missing."));
  const all = ctx.sessions();
  const byId = all.find((s) => String(s.ptyId) === q);
  if (byId) return byId;
  const lower = q.toLowerCase();
  const exact = all.filter((s) => s.label.toLowerCase() === lower);
  if (exact.length === 1) return exact[0];
  const partial = all.filter((s) => s.label.toLowerCase().includes(lower));
  if (partial.length === 1) return partial[0];
  if (!partial.length) throw new Error(t(`No hay ninguna sesión llamada "${q}". Usá list_sessions para ver las que hay.`, `There is no session called "${q}". Use list_sessions to see the ones there are.`));
  const matches = partial.map(describe).join(", ");
  throw new Error(t(`"${q}" coincide con varias sesiones: ${matches}. Usá el id.`, `"${q}" matches several sessions: ${matches}. Use the id.`));
}

function status(s: Session): string {
  if (s.exited) return t("terminada", "exited");
  return s.busy ? t("trabajando", "working") : t("en espera", "idle");
}

async function run(ctx: AgentContext, req: ToolRequest): Promise<string> {
  const from = ctx.sessions().find((s) => s.ptyId === req.from);
  switch (req.tool) {
    case "list_sessions": {
      const lines = ctx.sessions().map(
        (s) => `${s.ptyId ?? "-"} · "${s.label}" · ${s.cwd} · ${status(s)}${s === from ? t(" · (vos)", " · (you)") : ""}`,
      );
      return lines.join("\n") || t("No hay sesiones abiertas.", "There are no open sessions.");
    }
    case "send_to_session": {
      const target = find(ctx, req.args.to);
      if (target === from) throw new Error(t("Esa es tu propia sesión.", "That is your own session."));
      const text = String(req.args.text ?? "").trim();
      if (!text) throw new Error(t("El mensaje está vacío.", "The message is empty."));
      const signed = from
        ? t(`Mensaje de "${from.label}" (sesión ${from.ptyId}): ${text}`, `Message from "${from.label}" (session ${from.ptyId}): ${text}`)
        : t(`Mensaje de un agente fuera de Beauty Shell: ${text}`, `Message from an agent outside Beauty Shell: ${text}`);
      await flyBubble(ctx.anchor(from), ctx.anchor(target), target.label, signed);
      await target.deliver(signed, req.args.submit !== false);
      return t(`Entregado a "${target.label}" (sesión ${target.ptyId}).`, `Delivered to "${target.label}" (session ${target.ptyId}).`);
    }
    case "read_screen": {
      const target = find(ctx, req.args.session);
      const lines = Math.min(400, Math.max(1, Number(req.args.lines) || 40));
      return target.readScreen(lines) || t("(la pantalla está vacía)", "(the screen is empty)");
    }
    case "open_browser": {
      const url = normalizeUrl(String(req.args.url ?? ""));
      if (!url) throw new Error(t("Falta la dirección.", "The address is missing."));
      const background = req.args.background === true;
      ctx.openBrowser(url, background);
      return background
        ? t(`Abierta en una pestaña de fondo del navegador de Beauty Shell: ${url}`, `Opened in a background tab of the Beauty Shell browser: ${url}`)
        : t(
            `Abierta y a la vista en el navegador de Beauty Shell: ${url}. Con read_browser podés leerla cuando termine de cargar.`,
            `Opened and shown in the Beauty Shell browser: ${url}. With read_browser you can read it once it finishes loading.`,
          );
    }
    case "read_browser": {
      const max = Math.min(50000, Math.max(200, Number(req.args.max_chars) || 8000));
      return ctx.readBrowser(req.args.tab ? String(req.args.tab) : undefined, max);
    }
    default:
      throw new Error(t(`Herramienta desconocida: ${req.tool}`, `Unknown tool: ${req.tool}`));
  }
}

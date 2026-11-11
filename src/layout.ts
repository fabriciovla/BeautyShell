import type { BrowserPane } from "./browser";
import type { Session, SessionInit } from "./session";

export type Pane = Session | BrowserPane;

export interface Tab {
  id: number;
  root: Node;
  focus: Pane;

  zoomed?: Pane | null;

  broadcast?: boolean;
}

export type Edge = "left" | "right" | "top" | "bottom";
export type Node = Leaf | Split;

export interface Leaf {
  type: "leaf";
  session: Pane;
}

export interface Split {
  type: "split";
  dir: "row" | "col";
  ratio: number;
  a: Node;
  b: Node;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Divider {
  split: Split;
  rect: Rect;
  area: Rect;
}

export type SavedNode =
  | { type: "leaf"; init: SessionInit }
  | { type: "split"; dir: "row" | "col"; ratio: number; a: SavedNode; b: SavedNode };

export const leaf = (session: Pane): Leaf => ({ type: "leaf", session });

export function sessionsOf(node: Node): Pane[] {
  return node.type === "leaf" ? [node.session] : [...sessionsOf(node.a), ...sessionsOf(node.b)];
}

export function removeSession(node: Node, session: Pane): Node | null {
  if (node.type === "leaf") return node.session === session ? null : node;
  const a = removeSession(node.a, session);
  const b = removeSession(node.b, session);
  if (!a) return b;
  if (!b) return a;
  node.a = a;
  node.b = b;
  return node;
}

export function insertAt(node: Node, target: Pane, edge: Edge, sub: Node): Node {
  if (node.type === "leaf") {
    if (node.session !== target) return node;
    const dir = edge === "left" || edge === "right" ? "row" : "col";
    const first = edge === "left" || edge === "top";
    return { type: "split", dir, ratio: 0.5, a: first ? sub : node, b: first ? node : sub };
  }
  node.a = insertAt(node.a, target, edge, sub);
  node.b = insertAt(node.b, target, edge, sub);
  return node;
}

export function computeLayout(node: Node, area: Rect, gap: number, rects: Map<Pane, Rect>, dividers: Divider[]) {
  if (node.type === "leaf") {
    rects.set(node.session, area);
    return;
  }
  const row = node.dir === "row";
  const total = Math.max(0, (row ? area.w : area.h) - gap);
  const first = Math.round(total * node.ratio);
  const second = total - first;
  const a: Rect = row ? { ...area, w: first } : { ...area, h: first };
  const b: Rect = row
    ? { x: area.x + first + gap, y: area.y, w: second, h: area.h }
    : { x: area.x, y: area.y + first + gap, w: area.w, h: second };
  const rect: Rect = row
    ? { x: area.x + first, y: area.y, w: gap, h: area.h }
    : { x: area.x, y: area.y + first, w: area.w, h: gap };
  dividers.push({ split: node, rect, area });
  computeLayout(node.a, a, gap, rects, dividers);
  computeLayout(node.b, b, gap, rects, dividers);
}

export function edgeAt(rect: Rect, x: number, y: number): Edge {
  const dx = (x - rect.x) / rect.w - 0.5;
  const dy = (y - rect.y) / rect.h - 0.5;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "top" : "bottom";
}

export function halfRect(rect: Rect, edge: Edge): Rect {
  switch (edge) {
    case "left": return { ...rect, w: rect.w / 2 };
    case "right": return { ...rect, x: rect.x + rect.w / 2, w: rect.w / 2 };
    case "top": return { ...rect, h: rect.h / 2 };
    case "bottom": return { ...rect, y: rect.y + rect.h / 2, h: rect.h / 2 };
  }
}

export function neighbor(rects: Map<Pane, Rect>, from: Pane, edge: Edge): Pane | null {
  const r = rects.get(from);
  if (!r) return null;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  let best: Pane | null = null;
  let bestDistance = Infinity;
  for (const [session, o] of rects) {
    if (session === from) continue;
    const ahead =
      (edge === "left" && o.x + o.w <= r.x) ||
      (edge === "right" && o.x >= r.x + r.w) ||
      (edge === "top" && o.y + o.h <= r.y) ||
      (edge === "bottom" && o.y >= r.y + r.h);
    const overlaps =
      edge === "left" || edge === "right" ? o.y < r.y + r.h && o.y + o.h > r.y : o.x < r.x + r.w && o.x + o.w > r.x;
    if (!ahead || !overlaps) continue;
    const distance = Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = session;
    }
  }
  return best;
}

export function saveNode(node: Node, withCommands = false): SavedNode {
  if (node.type === "leaf") return { type: "leaf", init: node.session.serialize(withCommands) };
  return {
    type: "split",
    dir: node.dir,
    ratio: node.ratio,
    a: saveNode(node.a, withCommands),
    b: saveNode(node.b, withCommands),
  };
}

export function loadNode(saved: SavedNode, create: (init: SessionInit) => Pane): Node {
  if (saved.type === "leaf") return leaf(create(saved.init));
  return { type: "split", dir: saved.dir, ratio: saved.ratio, a: loadNode(saved.a, create), b: loadNode(saved.b, create) };
}

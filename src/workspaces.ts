import type { SavedNode } from "./layout";

export interface Workspace {
  name: string;
  tabs: SavedNode[];
}

const KEY = "vidrio.workspaces";

export function loadWorkspaces(): Workspace[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function store(list: Workspace[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
  }
}

export function saveWorkspace(workspace: Workspace) {
  const key = workspace.name.toLowerCase();
  store([...loadWorkspaces().filter((w) => w.name.toLowerCase() !== key), workspace]);
}

export function deleteWorkspace(name: string) {
  store(loadWorkspaces().filter((w) => w.name !== name));
}

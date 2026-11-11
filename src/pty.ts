import { Channel, invoke } from "@tauri-apps/api/core";

export interface ShellInfo {
  id: string;
  name: string;
}

export interface SpawnOptions {
  shell: string;
  cwd: string | null;
  cols: number;
  rows: number;
  onData: (data: string) => void;
}

export function spawnPty({ shell, cwd, cols, rows, onData }: SpawnOptions): Promise<number> {
  const channel = new Channel<string>();
  channel.onmessage = onData;
  return invoke<number>("pty_spawn", { shell, cwd, cols, rows, onData: channel });
}

export const writePty = (id: number, data: string) => invoke<void>("pty_write", { id, data });
export const resizePty = (id: number, cols: number, rows: number) => invoke<void>("pty_resize", { id, cols, rows });
export const killPty = (id: number) => invoke<void>("pty_kill", { id });
export const listShells = () => invoke<ShellInfo[]>("list_shells");
export const homeDir = () => invoke<string>("home_dir");

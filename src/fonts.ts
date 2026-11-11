import { t } from "./lang";
import "@fontsource-variable/fira-code";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/geist-mono/wght-italic.css";
import "@fontsource-variable/source-code-pro";
import "@fontsource-variable/source-code-pro/wght-italic.css";
import "@fontsource-variable/roboto-mono";
import "@fontsource-variable/roboto-mono/wght-italic.css";
import "@fontsource-variable/red-hat-mono";
import "@fontsource-variable/red-hat-mono/wght-italic.css";
import "@fontsource-variable/martian-mono";
import "@fontsource-variable/inconsolata";
import "@fontsource-variable/azeret-mono";
import "@fontsource-variable/azeret-mono/wght-italic.css";
import "@fontsource-variable/victor-mono";
import "@fontsource-variable/victor-mono/wght-italic.css";
import "@fontsource-variable/intel-one-mono";
import "@fontsource-variable/intel-one-mono/wght-italic.css";
import "@fontsource-variable/reddit-mono";
import "@fontsource/ibm-plex-mono/300.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/400-italic.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/700.css";
import "@fontsource/ibm-plex-mono/700-italic.css";

const FALLBACK = '"Cascadia Code", Consolas, "DejaVu Sans Mono", "Noto Sans Mono", monospace';

export const FONTS = [
  { id: "jetbrains", name: "JetBrains Mono", family: `"JetBrains Mono", ${FALLBACK}` },
  { id: "cascadia", name: "Cascadia Code", family: '"Cascadia Code", "Cascadia Mono", Consolas, monospace', windowsOnly: true },
  { id: "consolas", name: "Consolas", family: "Consolas, monospace", windowsOnly: true },
  { id: "fira", name: "Fira Code", family: `"Fira Code Variable", ${FALLBACK}` },
  { id: "geist", name: "Geist Mono", family: `"Geist Mono Variable", ${FALLBACK}` },
  { id: "plex", name: "IBM Plex Mono", family: `"IBM Plex Mono", ${FALLBACK}` },
  { id: "source", name: "Source Code Pro", family: `"Source Code Pro Variable", ${FALLBACK}` },
  { id: "roboto", name: "Roboto Mono", family: `"Roboto Mono Variable", ${FALLBACK}` },
  { id: "redhat", name: "Red Hat Mono", family: `"Red Hat Mono Variable", ${FALLBACK}` },
  { id: "victor", name: "Victor Mono", family: `"Victor Mono Variable", ${FALLBACK}` },
  { id: "intel", name: "Intel One Mono", family: `"Intel One Mono Variable", ${FALLBACK}` },
  { id: "azeret", name: "Azeret Mono", family: `"Azeret Mono Variable", ${FALLBACK}` },
  { id: "martian", name: "Martian Mono", family: `"Martian Mono Variable", ${FALLBACK}` },
  { id: "reddit", name: "Reddit Mono", family: `"Reddit Mono Variable", ${FALLBACK}` },
  { id: "inconsolata", name: "Inconsolata", family: `"Inconsolata Variable", ${FALLBACK}` },
] as const;

export type FontPref = (typeof FONTS)[number]["id"];

export const WEIGHTS = {
  light: { label: t("Fina", "Light"), value: 300 },
  regular: { label: "Normal", value: 400 },
  medium: { label: t("Media", "Medium"), value: 500 },
  bold: { label: t("Semi", "Semibold"), value: 600 },
  black: { label: t("Negrita", "Bold"), value: 700 },
} as const;

export type FontWeightPref = keyof typeof WEIGHTS;

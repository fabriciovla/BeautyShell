export const ES = navigator.language.toLowerCase().startsWith("es");

export const t = (es: string, en: string) => (ES ? es : en);

export function translatePage(root: ParentNode, spanish: Record<string, string>) {
  if (!ES) return;
  document.documentElement.lang = "es";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue?.trim();
    if (text && spanish[text]) node.nodeValue = node.nodeValue!.replace(text, spanish[text]);
  }
  root.querySelectorAll<HTMLElement>("[title], [aria-label], [placeholder]").forEach((el) => {
    for (const attr of ["title", "aria-label", "placeholder"]) {
      const value = el.getAttribute(attr);
      if (value && spanish[value]) el.setAttribute(attr, spanish[value]);
    }
  });
}

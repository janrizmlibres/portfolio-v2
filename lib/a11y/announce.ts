/** Says `text` to screen readers, politely, through one live region shared by everything that announces. */
let live: HTMLElement | null = null;
export function announce(text: string) {
  if (!live) {
    live = document.createElement("p");
    live.className = "sr-only";
    live.setAttribute("aria-live", "polite");
    document.body.append(live);
  }
  live.textContent = text;
}

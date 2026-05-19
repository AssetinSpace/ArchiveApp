/** Otvorí fotku v úzkom okne vpravo — tabuľka ostane vľavo na porovnanie. */
export function openPhotoBeside(url: string): void {
  const w = Math.round(window.screen.availWidth * 0.44);
  const h = Math.round(window.screen.availHeight * 0.88);
  const left = Math.round(window.screen.availWidth - w - 12);
  const top = Math.round((window.screen.availHeight - h) / 2);
  window.open(
    url,
    `archive-photo-${Date.now()}`,
    [
      "popup=yes",
      `width=${w}`,
      `height=${h}`,
      `left=${left}`,
      `top=${top}`,
      "noopener",
      "noreferrer",
    ].join(","),
  );
}

export function photoCountLabel(count: number): string {
  if (count === 1) return "1 fotka";
  if (count >= 2 && count <= 4) return `${count} fotky`;
  return `${count} fotiek`;
}

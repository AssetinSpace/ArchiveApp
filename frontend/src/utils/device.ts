export function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android|Mobile|Tablet/i.test(navigator.userAgent);
}

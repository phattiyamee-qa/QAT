export const PRIORITY_STYLE: Record<string, { bg: string; fg: string }> = {
  P0: { bg: "var(--shopee-color-error-bg)", fg: "var(--shopee-color-error)" },
  P1: { bg: "var(--shopee-color-warning-bg-strong)", fg: "var(--shopee-color-warning-icon)" },
  P2: { bg: "var(--shopee-color-info-bg)", fg: "var(--shopee-color-info)" },
  P3: { bg: "var(--shopee-color-fill-tertiary)", fg: "var(--shopee-color-text-secondary)" },
};

export function priorityStyle(priority: string | null | undefined) {
  return PRIORITY_STYLE[priority ?? ""] ?? PRIORITY_STYLE.P3;
}

export type PrintPriceInput = { pages: number | null; copies: number; printMode: "BW" | "COLOR"; paperSize: "A4" | "A3"; duplex: boolean; finishing: string };
export type PrintPriceRules = { active: boolean; rateBwA4Mmk: number | null; rateColorA4Mmk: number | null; a3MultiplierBps: number; duplexDiscountBps: number; stapleMmk: number; spiralMmk: number; minimumChargeMmk: number };
export function estimatePrintPrice(input: PrintPriceInput, rules: PrintPriceRules): { status: "ESTIMATE" | "QUOTE_REQUIRED"; totalMmk: number | null } {
  if (!rules.active || input.pages === null || input.pages < 1) return { status: "QUOTE_REQUIRED", totalMmk: null };
  const rate = input.printMode === "BW" ? rules.rateBwA4Mmk : rules.rateColorA4Mmk;
  if (!rate || rate <= 0) return { status: "QUOTE_REQUIRED", totalMmk: null };
  const paperFactor = input.paperSize === "A3" ? rules.a3MultiplierBps : 10000;
  const duplexFactor = input.duplex ? Math.max(0, 10000 - rules.duplexDiscountBps) : 10000;
  const perCopy = Math.ceil(input.pages * rate * paperFactor * duplexFactor / 100_000_000);
  const finishing = input.finishing === "Staple" ? rules.stapleMmk : input.finishing === "Spiral binding" ? rules.spiralMmk : 0;
  return { status: "ESTIMATE", totalMmk: Math.max(rules.minimumChargeMmk, perCopy * input.copies + finishing * input.copies) };
}

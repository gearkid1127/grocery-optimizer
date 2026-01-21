import type { StoreProduct } from "./types";

export function unitMultiplier(unit: "oz" | "lb" | "ct"): number {
  // normalize weight to ounces for $/oz comparisons
  if (unit === "lb") return 16;
  return 1; // oz and ct handled differently
}

export function unitPrice(product: StoreProduct): number {
  const { value, unit } = product.size;

  // Count-based items: price per item
  if (unit === "ct") return product.price / Math.max(value, 1);

  // Weight/volume: convert lb -> oz, then price per oz
  const normalizedAmount = value * unitMultiplier(unit);
  return product.price / Math.max(normalizedAmount, 0.0001);
}

export function sizeWithinTolerance(
  desired: { value: number; unit: "oz" | "lb" | "ct" },
  actual: { value: number; unit: "oz" | "lb" | "ct" },
  tolerancePct: number = 0.25
): boolean {
  // only compare same unit types for now
  if (desired.unit !== actual.unit) return false;

  const min = desired.value * (1 - tolerancePct);
  const max = desired.value * (1 + tolerancePct);
  return actual.value >= min && actual.value <= max;
}

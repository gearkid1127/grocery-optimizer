import type { PricingProvider } from "../provider";
import type {
  GroceryItem,
  LineItemMatch,
  StoreId,
  StoreProduct,
  StoreQuote,
} from "@/lib/domain/types";
import { sizeWithinTolerance, unitPrice } from "@/lib/domain/normalize";
import { searchProducts } from "@/lib/data/productDatabase";

async function loadJson(storeId: StoreId): Promise<StoreProduct[]> {
  // This will load: lib/providers/mock/data/<storeId>.json
  const data = await import(`./data/${storeId}.json`);
  return data.default as StoreProduct[];
}

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 2);
}

function expandToken(token: string): string[] {
  const variants = new Set([token]);
  if (token.endsWith("s") && token.length > 3) {
    variants.add(token.slice(0, -1));
  }
  return Array.from(variants);
}

function queryMatches(hay: string, query: string): boolean {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return false;

  const hayTokens = tokenize(hay);

  if (queryTokens.length === 1) {
    const token = queryTokens[0];
    return expandToken(token).some((variant) => hayTokens.includes(variant));
  }

  if (hay.includes(query)) return true;

  const matchedCount = queryTokens.filter((token) =>
    expandToken(token).some((variant) => hayTokens.includes(variant))
  ).length;

  return matchedCount >= Math.min(2, queryTokens.length);
}

function mapCategoryToStore(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes("dairy") || cat.includes("milk") || cat.includes("cheese") || cat.includes("egg")) return "dairy";
  if (cat.includes("produce") || cat.includes("fruit") || cat.includes("vegetable")) return "produce";
  if (cat.includes("meat") || cat.includes("seafood") || cat.includes("poultry")) return "meat";
  if (cat.includes("bread") || cat.includes("bakery")) return "bakery";
  return "pantry";
}

function normalizeSize(size: { value: number; unit: string }): { value: number; unit: "oz" | "lb" | "ct" } {
  if (size.unit === "oz" || size.unit === "lb" || size.unit === "ct") return size as { value: number; unit: "oz" | "lb" | "ct" };
  if (size.unit === "gal") return { value: size.value * 128, unit: "oz" };
  if (size.unit === "l") return { value: Math.round(size.value * 33.814 * 10) / 10, unit: "oz" };
  if (size.unit === "ml") return { value: Math.round(size.value * 0.033814 * 10) / 10, unit: "oz" };
  return { value: size.value, unit: "ct" };
}

function priceMultiplier(storeId: StoreId): number {
  switch (storeId) {
    case "walmart":
      return 1.0;
    case "target":
      return 1.08;
    case "marianos":
      return 1.06;
    case "jewel":
      return 1.04;
    case "butera":
      return 1.02;
    case "caputos":
      return 1.05;
    case "petes":
      return 0.98;
    default:
      return 1.0;
  }
}

function fallbackProduct(item: GroceryItem, storeId: StoreId): StoreProduct | undefined {
  const [match] = searchProducts(item.query, 1);
  if (!match) return undefined;

  return {
    sku: `fallback-${storeId}-${match.id}`,
    name: match.name,
    brand: match.brand,
    category: mapCategoryToStore(match.category),
    size: normalizeSize(match.size),
    price: Math.round(match.basePrice * priceMultiplier(storeId) * 100) / 100,
    inStock: true,
  };
}

function matchProduct(
  products: StoreProduct[],
  item: GroceryItem,
  storeId: StoreId
): { product?: StoreProduct; status: LineItemMatch["status"]; reason?: string } {
  const q = normalizeText(item.query);
  const inStock = products.filter((p) => p.inStock);

  // Brand-specific mode (flexible=false): prefer brand + query match
  if (!item.flexible) {
    const brand = item.brand ? normalizeText(item.brand) : "";

    const candidates = inStock.filter((p) => {
      const hay = normalizeText(`${p.brand ?? ""} ${p.name}`);
      const brandOk = brand ? hay.includes(brand) : true;

      const queryOk = queryMatches(hay, q);

      const sizeOk = item.desiredSize ? sizeWithinTolerance(item.desiredSize, p.size) : true;

      return brandOk && queryOk && sizeOk;
    });

    if (candidates.length > 0) return { product: candidates[0], status: "matched" };

    const oosCandidates = products
      .filter((p) => !p.inStock)
      .filter((p) => queryMatches(normalizeText(`${p.brand ?? ""} ${p.name}`), q));

    if (oosCandidates.length > 0) {
      return { product: oosCandidates[0], status: "out_of_stock", reason: "Matched item is out of stock" };
    }

    const fallback = !item.brand ? fallbackProduct(item, storeId) : undefined;
    if (fallback) {
      return { product: fallback, status: "substituted", reason: "Used common product fallback" };
    }

    return { status: "missing", reason: "No matching brand-specific item found" };
  }

  // Flexible mode: pick lowest unit price among comparable candidates
  const candidates = inStock.filter((p) => {
    const hay = normalizeText(`${p.brand ?? ""} ${p.name} ${p.category}`);

    const queryOk = queryMatches(hay, q);
    const sizeOk = item.desiredSize ? sizeWithinTolerance(item.desiredSize, p.size) : true;

    return queryOk && sizeOk;
  });

  if (candidates.length === 0) {
    const oos = products
      .filter((p) => !p.inStock)
      .filter((p) => queryMatches(normalizeText(`${p.name} ${p.category}`), q));

    if (oos.length > 0) {
      return { product: oos[0], status: "out_of_stock", reason: "Comparable item is out of stock" };
    }

    const fallback = fallbackProduct(item, storeId);
    if (fallback) {
      return { product: fallback, status: "substituted", reason: "Used common product fallback" };
    }

    return { status: "missing", reason: "No comparable item found" };
  }

  candidates.sort((a, b) => unitPrice(a) - unitPrice(b));
  return {
    product: candidates[0],
    status: "substituted",
    reason: "Chose lowest unit price comparable item",
  };
}

export class MockProvider implements PricingProvider {
  storeId: StoreId;

  constructor(storeId: StoreId) {
    this.storeId = storeId;
  }

  async listProducts(): Promise<StoreProduct[]> {
    return loadJson(this.storeId);
  }

  async quote(items: GroceryItem[], storeLocationId?: string): Promise<StoreQuote> {
    const products = await this.listProducts();

    const matches: LineItemMatch[] = items.map((item) => {
      const m = matchProduct(products, item, this.storeId);

      if (!m.product && m.status === "missing") {
        return { itemId: item.id, storeId: this.storeId, status: "missing", reason: m.reason };
      }

      if (m.product && m.status === "out_of_stock") {
        return {
          itemId: item.id,
          storeId: this.storeId,
          status: "out_of_stock",
          chosenProduct: m.product,
          reason: m.reason,
        };
      }

      if (m.product) {
        return {
          itemId: item.id,
          storeId: this.storeId,
          status: m.status,
          chosenProduct: m.product,
          reason: m.reason,
          lineTotal: m.product.price,
        };
      }

      return { itemId: item.id, storeId: this.storeId, status: "missing", reason: m.reason ?? "Unknown" };
    });

    const subtotal = matches.reduce((sum, li) => sum + (li.lineTotal ?? 0), 0);

    return {
      storeId: this.storeId,
      subtotal: Math.round(subtotal * 100) / 100,
      matches,
      missingCount: matches.filter((m) => m.status === "missing").length,
      outOfStockCount: matches.filter((m) => m.status === "out_of_stock").length,
      lastUpdatedISO: new Date().toISOString(),
    };
  }
}

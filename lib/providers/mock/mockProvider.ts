import type { PricingProvider } from "../provider";
import type {
  GroceryItem,
  LineItemMatch,
  StoreId,
  StoreProduct,
  StoreQuote,
} from "@/lib/domain/types";
import { sizeWithinTolerance, unitPrice } from "@/lib/domain/normalize";

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

function matchProduct(
  products: StoreProduct[],
  item: GroceryItem
): { product?: StoreProduct; status: LineItemMatch["status"]; reason?: string } {
  const q = normalizeText(item.query);
  const inStock = products.filter((p) => p.inStock);

  // Brand-specific mode (flexible=false): prefer brand + query match
  if (!item.flexible) {
    const brand = item.brand ? normalizeText(item.brand) : "";

    const candidates = inStock.filter((p) => {
      const hay = normalizeText(`${p.brand ?? ""} ${p.name}`);
      const brandOk = brand ? hay.includes(brand) : true;

      // simple match: full query OR any word in query
      const queryOk = hay.includes(q) || q.split(" ").some((w) => hay.includes(w));

      const sizeOk = item.desiredSize ? sizeWithinTolerance(item.desiredSize, p.size) : true;

      return brandOk && queryOk && sizeOk;
    });

    if (candidates.length > 0) return { product: candidates[0], status: "matched" };

    const oosCandidates = products
      .filter((p) => !p.inStock)
      .filter((p) => normalizeText(`${p.brand ?? ""} ${p.name}`).includes(q));

    if (oosCandidates.length > 0) {
      return { product: oosCandidates[0], status: "out_of_stock", reason: "Matched item is out of stock" };
    }

    return { status: "missing", reason: "No matching brand-specific item found" };
  }

  // Flexible mode: pick lowest unit price among comparable candidates
  const candidates = inStock.filter((p) => {
    const hay = normalizeText(`${p.brand ?? ""} ${p.name} ${p.category}`);

    const queryOk = q.split(" ").some((w) => hay.includes(w)) || hay.includes(q);
    const sizeOk = item.desiredSize ? sizeWithinTolerance(item.desiredSize, p.size) : true;

    return queryOk && sizeOk;
  });

  if (candidates.length === 0) {
    const oos = products
      .filter((p) => !p.inStock)
      .filter((p) => normalizeText(`${p.name} ${p.category}`).includes(q));

    if (oos.length > 0) {
      return { product: oos[0], status: "out_of_stock", reason: "Comparable item is out of stock" };
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
      const m = matchProduct(products, item);

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

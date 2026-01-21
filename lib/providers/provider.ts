import type { GroceryItem, StoreId, StoreProduct, StoreQuote } from "@/lib/domain/types";

export interface PricingProvider {
  storeId: StoreId;

  // Later: for real stores this can fetch/cache data
  listProducts(): Promise<StoreProduct[]>;

  // Main function: returns a quote for the full grocery list
  quote(items: GroceryItem[], storeLocationId?: string): Promise<StoreQuote>;
}

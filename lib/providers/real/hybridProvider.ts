// Hybrid provider that tries real APIs first, falls back to mock data
import { MockProvider } from "../mock/mockProvider";
import { WalmartProvider } from "./walmartProvider";
import { TargetProvider } from "./targetProvider";
import type { PricingProvider } from "../provider";
import type { GroceryItem, StoreId, StoreProduct, StoreQuote } from "@/lib/domain/types";

export class HybridProvider implements PricingProvider {
  private realProvider: PricingProvider;
  private mockProvider: PricingProvider;

  constructor(storeId: StoreId) {
    // Initialize real providers
    if (storeId === "walmart") {
      this.realProvider = new WalmartProvider();
    } else if (storeId === "target") {
      this.realProvider = new TargetProvider();
    } else {
      throw new Error(`Unsupported store: ${storeId}`);
    }

    // Initialize mock fallback
    this.mockProvider = new MockProvider(storeId);
  }

  get storeId(): StoreId {
    return this.realProvider.storeId;
  }

  async listProducts(): Promise<StoreProduct[]> {
    try {
      const products = await this.realProvider.listProducts();
      if (products.length > 0) {
        return products;
      }
    } catch (error) {
      console.warn(`Real provider failed for ${this.storeId}, falling back to mock:`, error);
    }

    return this.mockProvider.listProducts();
  }

  async quote(items: GroceryItem[], storeLocationId?: string): Promise<StoreQuote> {
    try {
      const quote = await this.realProvider.quote(items, storeLocationId);
      
      // Check if we got reasonable results (at least some matches)
      const hasMatches = quote.matches.some(m => 
        m.status === "matched" || m.status === "substituted"
      );

      if (hasMatches) {
        // Add indicator that this is real data
        return {
          ...quote,
          lastUpdatedISO: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn(`Real provider failed for ${this.storeId}, falling back to mock:`, error);
    }

    // Fallback to mock data
    console.log(`Using mock data for ${this.storeId}`);
    const mockQuote = await this.mockProvider.quote(items, storeLocationId);
    
    // Mark as mock data in the response
    return {
      ...mockQuote,
      lastUpdatedISO: mockQuote.lastUpdatedISO + " (mock data)",
    };
  }
}
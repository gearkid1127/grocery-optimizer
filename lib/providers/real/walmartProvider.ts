// Real Walmart API integration
import type { PricingProvider } from "../provider";
import type {
  GroceryItem,
  LineItemMatch,
  StoreId,
  StoreProduct,
  StoreQuote,
} from "@/lib/domain/types";

export class WalmartProvider implements PricingProvider {
  storeId: StoreId = "walmart";

  async listProducts(): Promise<StoreProduct[]> {
    // For now, return cached results
    return [];
  }

  async quote(items: GroceryItem[], storeLocationId?: string): Promise<StoreQuote> {
    const matches: LineItemMatch[] = [];
    let subtotal = 0;
    let missingCount = 0;
    let outOfStockCount = 0;

    for (const item of items) {
      const match = await this.searchProduct(item, storeLocationId);
      matches.push(match);

      if (match.status === "missing") {
        missingCount++;
      } else if (match.status === "out_of_stock") {
        outOfStockCount++;
      } else if (match.lineTotal) {
        subtotal += match.lineTotal;
      }
    }

    return {
      storeId: this.storeId,
      subtotal,
      matches,
      missingCount,
      outOfStockCount,
      lastUpdatedISO: new Date().toISOString(),
    };
  }

  private async searchProduct(item: GroceryItem, storeLocationId?: string): Promise<LineItemMatch> {
    try {
      // Search via Walmart API
      const products = await this.searchWalmartAPI(item.query, storeLocationId);
      
      if (products.length > 0) {
        // Find best match
        const bestMatch = this.findBestMatch(products, item);
        return this.createMatch(item, bestMatch);
      }

      return {
        itemId: item.id,
        storeId: this.storeId,
        status: "missing",
        reason: "No products found matching criteria",
      };
    } catch (error) {
      console.error(`Error searching for ${item.query}:`, error);
      return {
        itemId: item.id,
        storeId: this.storeId,
        status: "missing",
        reason: "API error - service unavailable",
      };
    }
  }

  private async searchWalmartAPI(query: string, storeLocationId?: string): Promise<any[]> {
    try {
      // Using Walmart's public search API
      // Note: Using localhost URL for server-side fetch
      let apiUrl = `http://localhost:3000/api/walmart/search?query=${encodeURIComponent(query)}`;
      if (storeLocationId) {
        apiUrl += `&storeId=${encodeURIComponent(storeLocationId)}`;
      }
      
      const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Walmart API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformWalmartResponse(data);
    } catch (error) {
      console.error('Walmart API error:', error);
      return [];
    }
  }

  private transformWalmartResponse(data: { items?: unknown[] }): StoreProduct[] {
    if (!data?.items || !Array.isArray(data.items)) return [];

    return data.items.map((item: unknown) => {
      const walmartItem = item as Record<string, unknown>;
      // Parse size from item name or use default
      const size = this.extractSize(String(walmartItem.name || '')) || { value: 1, unit: "ct" as const };
      
      return {
        sku: String(walmartItem.itemId || walmartItem.upc || 'unknown'),
        name: String(walmartItem.name || 'Unknown Product'),
        brand: walmartItem.brandName ? String(walmartItem.brandName) : undefined,
        category: this.mapCategory(String(walmartItem.categoryPath || '')),
        size,
        price: Number(walmartItem.salePrice || walmartItem.msrp || 0),
        inStock: walmartItem.availableOnline !== false && walmartItem.stock !== 'Not available',
      } as StoreProduct;
    });
  }

  private extractSize(name: string): { value: number; unit: "oz" | "lb" | "ct" } | null {
    // Try to extract size from product name
    const ozMatch = name.match(/(\d+(?:\.\d+)?)\s*oz/i);
    if (ozMatch) return { value: parseFloat(ozMatch[1]), unit: "oz" };

    const lbMatch = name.match(/(\d+(?:\.\d+)?)\s*lb/i);
    if (lbMatch) return { value: parseFloat(lbMatch[1]), unit: "lb" };

    const ctMatch = name.match(/(\d+)\s*ct/i);
    if (ctMatch) return { value: parseInt(ctMatch[1]), unit: "ct" };

    return null;
  }

  private mapCategory(categoryPath: string): string {
    const path = categoryPath.toLowerCase();
    if (path.includes('dairy')) return 'dairy';
    if (path.includes('produce') || path.includes('fruit') || path.includes('vegetable')) return 'produce';
    if (path.includes('meat') || path.includes('seafood')) return 'meat';
    if (path.includes('bakery') || path.includes('bread')) return 'bakery';
    return 'pantry';
  }

  private findBestMatch(products: StoreProduct[], item: GroceryItem): StoreProduct | undefined {
    const inStock = products.filter(p => p.inStock);
    if (inStock.length === 0) return products[0]; // Return first even if out of stock

    if (!item.flexible && item.brand) {
      // Try to match brand preference
      const brandMatch = inStock.find(p => 
        p.brand?.toLowerCase().includes(item.brand!.toLowerCase())
      );
      if (brandMatch) return brandMatch;
    }

    // Return first in-stock item
    return inStock[0];
  }

  private createMatch(item: GroceryItem, product: StoreProduct | undefined): LineItemMatch {
    if (!product) {
      return {
        itemId: item.id,
        storeId: this.storeId,
        status: "missing",
      };
    }

    if (!product.inStock) {
      return {
        itemId: item.id,
        storeId: this.storeId,
        status: "out_of_stock",
        chosenProduct: product,
      };
    }

    return {
      itemId: item.id,
      storeId: this.storeId,
      status: "matched",
      chosenProduct: product,
      lineTotal: product.price,
    };
  }
}
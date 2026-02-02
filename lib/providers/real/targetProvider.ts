// Real Target API integration using web scraping approach
import type { PricingProvider } from "../provider";
import type {
  GroceryItem,
  LineItemMatch,
  StoreId,
  StoreProduct,
  StoreQuote,
} from "@/lib/domain/types";

export class TargetProvider implements PricingProvider {
  storeId: StoreId = "target";

  async listProducts(): Promise<StoreProduct[]> {
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
      const products = await this.searchTargetAPI(item.query, storeLocationId);
      
      if (products.length > 0) {
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

  private async searchTargetAPI(query: string, storeLocationId?: string): Promise<any[]> {
    try {
      // Using Target's search API via relative URL (server-side proxy)
      let apiUrl = `/api/target/search?query=${encodeURIComponent(query)}`;
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
        throw new Error(`Target API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformTargetResponse(data);
    } catch (error) {
      console.error('Target API error:', error);
      return [];
    }
  }

  private transformTargetResponse(data: { search_response?: { items?: { results?: unknown[] } } }): StoreProduct[] {
    if (!data?.search_response?.items?.results || !Array.isArray(data.search_response.items.results)) return [];

    return data.search_response.items.results.map((item: unknown) => {
      const targetItem = item as Record<string, unknown>;
      const itemData = (targetItem.item as Record<string, unknown>) || {};
      const productDescription = (itemData.product_description as Record<string, unknown>) || {};
      const productBrand = (itemData.product_brand as Record<string, unknown>) || {};
      const productClassification = (itemData.product_classification as Record<string, unknown>) || {};
      const pricing = (targetItem.price as Record<string, unknown>) || {};
      const inventories = (targetItem.inventories as Array<Record<string, unknown>>) || [];
      
      const size = this.extractSize(String(productDescription.title || '')) || 
                   { value: 1, unit: "ct" as const };
      
      // Get price information
      const currentPrice = Number(pricing.current_retail || pricing.reg_retail || 0);

      return {
        sku: String(targetItem.tcin || itemData.dpci || 'unknown'),
        name: String(productDescription.title || 'Unknown Product'),
        brand: productBrand.name ? String(productBrand.name) : undefined,
        category: this.mapCategory(String(productClassification.product_type || '')),
        size,
        price: currentPrice,
        inStock: inventories[0]?.availability !== 'OUT_OF_STOCK',
      } as StoreProduct;
    });
  }

  private extractSize(name: string): { value: number; unit: "oz" | "lb" | "ct" } | null {
    const ozMatch = name.match(/(\d+(?:\.\d+)?)\s*oz/i);
    if (ozMatch) return { value: parseFloat(ozMatch[1]), unit: "oz" };

    const lbMatch = name.match(/(\d+(?:\.\d+)?)\s*lb/i);
    if (lbMatch) return { value: parseFloat(lbMatch[1]), unit: "lb" };

    const ctMatch = name.match(/(\d+)\s*ct/i);
    if (ctMatch) return { value: parseInt(ctMatch[1]), unit: "ct" };

    return null;
  }

  private mapCategory(type: string): string {
    const category = type.toLowerCase();
    if (category.includes('dairy')) return 'dairy';
    if (category.includes('produce') || category.includes('fruit') || category.includes('vegetable')) return 'produce';
    if (category.includes('meat') || category.includes('seafood')) return 'meat';
    if (category.includes('bakery') || category.includes('bread')) return 'bakery';
    return 'pantry';
  }

  private findBestMatch(products: StoreProduct[], item: GroceryItem): StoreProduct | undefined {
    const inStock = products.filter(p => p.inStock);
    if (inStock.length === 0) return products[0];

    if (!item.flexible && item.brand) {
      const brandMatch = inStock.find(p => 
        p.brand?.toLowerCase().includes(item.brand!.toLowerCase())
      );
      if (brandMatch) return brandMatch;
    }

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
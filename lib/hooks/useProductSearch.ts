// Enhanced search hook with real-time product search and AI integration
import { useState, useRef, useCallback } from 'react';
import type { StoreProduct, StoreId } from '@/lib/domain/types';

export interface SearchSuggestion {
  id: string;
  type: 'product' | 'ai_suggestion' | 'recent';
  product?: StoreProduct;
  query?: string;
  storeId?: StoreId;
  confidence?: number;
  reasoning?: string;
}

export function useProductSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(async (query: string, stores: StoreId[]) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!query.trim() || stores.length === 0) {
        setSuggestions([]);
        return;
      }

      try {
        setIsSearching(true);

        // Search real products from stores
        const productPromises = stores.map(async (storeId) => {
          const response = await fetch(`/api/${storeId}/search?query=${encodeURIComponent(query)}`);
          if (!response.ok) return [];
          
          const data = await response.json();
          return transformToSuggestions(data, storeId, 'product');
        });

        // Get AI suggestions
        const aiPromise = getAISuggestions(query);

        const [productResults, aiSuggestions] = await Promise.all([
          Promise.all(productPromises),
          aiPromise
        ]);

        // Flatten and combine results
        const allProducts = productResults.flat();
        const combined = [...allProducts, ...aiSuggestions];

        // Sort by relevance
        const sorted = combined.sort((a, b) => {
          if (a.type === 'product' && b.type === 'product') {
            const aExact = a.product?.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
            const bExact = b.product?.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
            return bExact - aExact;
          }
          if (a.type === 'ai_suggestion' && b.type === 'ai_suggestion') {
            return (b.confidence || 0) - (a.confidence || 0);
          }
          if (a.type === 'product' && b.type === 'ai_suggestion') return -1;
          if (a.type === 'ai_suggestion' && b.type === 'product') return 1;
          return 0;
        });

        setSuggestions(sorted.slice(0, 10));
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(-1);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  const navigateSelection = (direction: 'up' | 'down') => {
    setSelectedIndex(prev => {
      if (direction === 'down') {
        return prev < suggestions.length - 1 ? prev + 1 : 0;
      } else {
        return prev > 0 ? prev - 1 : suggestions.length - 1;
      }
    });
  };

  const selectSuggestion = (index: number): SearchSuggestion | null => {
    return suggestions[index] || null;
  };

  return {
    isSearching,
    suggestions,
    selectedIndex,
    debouncedSearch,
    clearSuggestions,
    navigateSelection,
    selectSuggestion,
  };
}

function transformToSuggestions(data: unknown, storeId: StoreId, type: 'product'): SearchSuggestion[] {
  const products = extractProducts(data, storeId);
  
  return products.map((product, index) => ({
    id: `${storeId}-${product.sku}-${index}`,
    type,
    product,
    storeId,
  }));
}

function extractProducts(data: unknown, storeId: StoreId): StoreProduct[] {
  if (storeId === 'walmart' && data && typeof data === 'object' && 'items' in data) {
    const walmartData = data as { items?: unknown[] };
    if (!Array.isArray(walmartData.items)) return [];
    
    return walmartData.items.slice(0, 5).map((item: unknown) => {
      const wItem = item as Record<string, unknown>;
      return {
        sku: String(wItem.itemId || 'unknown'),
        name: String(wItem.name || 'Unknown Product'),
        brand: wItem.brandName ? String(wItem.brandName) : undefined,
        category: 'pantry',
        size: { value: 1, unit: 'ct' as const },
        price: Number(wItem.salePrice || wItem.msrp || 0),
        inStock: wItem.availableOnline !== false,
      };
    });
  }

  if (storeId === 'target' && data && typeof data === 'object') {
    const targetData = data as {
      search_response?: {
        items?: {
          results?: unknown[];
        };
      };
    };
    
    const results = targetData.search_response?.items?.results;
    if (!Array.isArray(results)) return [];
    
    return results.slice(0, 5).map((item: unknown) => {
      const tItem = item as Record<string, unknown>;
      const itemData = tItem.item as Record<string, unknown> || {};
      const productDesc = itemData.product_description as Record<string, unknown> || {};
      const productBrand = itemData.product_brand as Record<string, unknown> || {};
      const price = tItem.price as Record<string, unknown> || {};
      const inventories = tItem.inventories as Array<Record<string, unknown>> || [];
      
      return {
        sku: String(tItem.tcin || 'unknown'),
        name: String(productDesc.title || 'Unknown Product'),
        brand: productBrand.name ? String(productBrand.name) : undefined,
        category: 'pantry',
        size: { value: 1, unit: 'ct' as const },
        price: Number(price.current_retail || price.reg_retail || 0),
        inStock: inventories[0]?.availability !== 'OUT_OF_STOCK',
      };
    });
  }

  return [];
}

async function getAISuggestions(query: string): Promise<SearchSuggestion[]> {
  try {
    const response = await fetch('/api/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return [];
    
    const suggestions = await response.json();
    return suggestions.map((suggestion: {
      query: string;
      confidence: number;
      reasoning: string;
    }, index: number) => ({
      id: `ai-${index}`,
      type: 'ai_suggestion' as const,
      query: suggestion.query,
      confidence: suggestion.confidence,
      reasoning: suggestion.reasoning,
    }));
  } catch (error) {
    console.error('AI suggestions error:', error);
    return [];
  }
}
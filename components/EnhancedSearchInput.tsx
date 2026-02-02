// Enhanced search input component with autocomplete and AI suggestions
import { useState, useRef, useEffect } from 'react';
import type { SearchSuggestion } from '@/lib/hooks/useProductSearch';
import type { StoreId } from '@/lib/domain/types';
import type { Product } from '@/lib/data/productDatabase';

interface EnhancedSearchInputProps {
  onAddItem: (query: string, flexible: boolean, selectedProduct?: {
    sku: string;
    name: string;
    brand?: string;
    category: string;
    size: { value: number; unit: "oz" | "lb" | "ct" };
    price: number;
    inStock: boolean;
  }) => void;
  isFlexible: boolean;
  selectedStores: StoreId[];
  selectedStoreLocations?: {
    walmart: string;
    target: string;
  };
}

export function EnhancedSearchInput({ onAddItem, isFlexible, selectedStores, selectedStoreLocations }: EnhancedSearchInputProps) {
  // Mark selectedStoreLocations as unused to avoid linting error
  void selectedStoreLocations;
  const [query, setQuery] = useState('');
  const [manuallyHidden, setManuallyHidden] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derive showSuggestions state
  const showSuggestions = query.trim().length > 2 && 
                          suggestions.length > 0 && 
                          !manuallyHidden;

  // AI search for flexible mode - suggests alternatives and variations
  const performAISearch = async (searchQuery: string) => {
    try {
      setIsSearching(true);
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const aiSuggestions = await response.json();
        const suggestions: SearchSuggestion[] = aiSuggestions.map((suggestion: {
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
        setSuggestions(suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('AI search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Generic product search for building shopping list - no store/price info
  const performProductSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setIsSearching(true);
      
      // Search our product database for generic suggestions
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        console.warn('Product search API failed');
        setSuggestions([]);
        return;
      }
      
      const data = await response.json();
      console.log(`Found ${data.products?.length || 0} generic products`);
      
      // Transform to generic suggestions without store/price info
      const genericSuggestions = (data.products || []).map((product: Product) => ({
        id: `generic-${product.id}`,
        type: 'product' as const,
        query: product.name,
        product: {
          sku: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          size: product.size,
          price: 0, // No price shown in suggestions
          inStock: true
        },
        storeId: undefined, // No specific store
        reasoning: `${product.brand} ${product.name} - ${product.size.value}${product.size.unit}`
      }));

      setSuggestions(genericSuggestions.slice(0, 8));
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Product search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Mock product database for fallback
  const getMockProducts = (searchQuery: string, storeId: StoreId) => {
    const mockDatabase: Record<string, Array<{name: string, brand: string, basePrice: number}>> = {
      'eggs': [
        { name: 'Large Eggs, 12 ct', brand: 'Great Value', basePrice: 2.48 },
        { name: 'Organic Free Range Large Eggs, 12 ct', brand: 'Egglands Best', basePrice: 4.98 },
        { name: 'Pasture Raised Large Eggs, 12 ct', brand: 'Vital Farms', basePrice: 6.98 },
        { name: 'Large White Eggs, 18 ct', brand: 'Great Value', basePrice: 3.48 }
      ],
      'milk': [
        { name: 'Whole Milk, 1 Gallon', brand: 'Great Value', basePrice: 3.48 },
        { name: 'Organic Whole Milk, 64 oz', brand: 'Horizon Organic', basePrice: 4.98 },
        { name: '2% Reduced Fat Milk, 1 Gallon', brand: 'Great Value', basePrice: 3.48 },
        { name: 'Lactose Free Whole Milk, 64 oz', brand: 'Lactaid', basePrice: 4.28 }
      ],
      'bread': [
        { name: 'White Sandwich Bread, 20 oz', brand: 'Wonder', basePrice: 1.98 },
        { name: 'Whole Wheat Bread, 20 oz', brand: 'Natures Own', basePrice: 2.48 },
        { name: 'Organic Whole Grain Bread, 24 oz', brand: 'Daves Killer Bread', basePrice: 4.98 },
        { name: 'Honey Wheat Bread, 20 oz', brand: 'Pepperidge Farm', basePrice: 3.28 }
      ],
      'bananas': [
        { name: 'Bananas, per lb', brand: '', basePrice: 0.58 },
        { name: 'Organic Bananas, per lb', brand: '', basePrice: 0.78 }
      ]
    };

    // Find products that match the search query
    let matchedProducts: Array<{name: string, brand: string, basePrice: number}> = [];
    
    for (const [key, products] of Object.entries(mockDatabase)) {
      if (searchQuery.includes(key) || key.includes(searchQuery)) {
        matchedProducts = products;
        break;
      }
    }

    // If no exact match, try partial matching
    if (matchedProducts.length === 0) {
      for (const [, products] of Object.entries(mockDatabase)) {
        if (products.some(p => p.name.toLowerCase().includes(searchQuery))) {
          matchedProducts = products;
          break;
        }
      }
    }

    // Apply store-specific pricing
    const priceMultiplier = storeId === 'walmart' ? 1.0 : 1.15; // Target slightly more expensive
    
    return matchedProducts.map((product, index) => ({
      sku: `mock-${storeId}-${index}`,
      name: product.name,
      brand: product.brand || undefined,
      category: getProductCategory(product.name),
      size: extractSizeFromName(product.name) || { value: 1, unit: 'ct' as const },
      price: Math.round(product.basePrice * priceMultiplier * 100) / 100,
      inStock: true,
    }));
  };

  const getProductCategory = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('egg')) return 'dairy';
    if (lowerName.includes('milk')) return 'dairy';
    if (lowerName.includes('bread')) return 'bakery';
    if (lowerName.includes('banana')) return 'produce';
    return 'pantry';
  };

  // Helper function to extract size from product name
  const extractSizeFromName = (name: string): { value: number; unit: "oz" | "lb" | "ct" } | null => {
    const ozMatch = name.match(/(\d+(?:\.\d+)?)\s*oz/i);
    if (ozMatch) return { value: parseFloat(ozMatch[1]), unit: "oz" };

    const lbMatch = name.match(/(\d+(?:\.\d+)?)\s*lb/i);
    if (lbMatch) return { value: parseFloat(lbMatch[1]), unit: "lb" };

    const ctMatch = name.match(/(\d+)\s*ct/i);
    if (ctMatch) return { value: parseInt(ctMatch[1]), unit: "ct" };

    // Check for dozen
    if (name.toLowerCase().includes('dozen')) {
      return { value: 12, unit: "ct" };
    }

    return null;
  };

  // Helper function to map categories
  const mapCategory = (categoryPath: string): string => {
    const path = categoryPath.toLowerCase();
    if (path.includes('dairy') || path.includes('milk') || path.includes('cheese')) return 'dairy';
    if (path.includes('produce') || path.includes('fruit') || path.includes('vegetable')) return 'produce';
    if (path.includes('meat') || path.includes('seafood') || path.includes('poultry')) return 'meat';
    if (path.includes('bakery') || path.includes('bread')) return 'bakery';
    if (path.includes('egg')) return 'dairy';
    return 'pantry';
  };

  // Search when query changes based on mode
  useEffect(() => {
    if (query.trim().length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        if (isFlexible) {
          // Flexible mode: Get AI suggestions for alternatives and variations
          performAISearch(query);
        } else {
          // Specific mode: Get real store products
          performProductSearch(query);
        }
      }, 300);
      
      setManuallyHidden(false);
    } else {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setSuggestions([]);
      setManuallyHidden(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, isFlexible, selectedStores]);

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

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setManuallyHidden(true);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Check if a suggestion is selected
    if (selectedIndex >= 0) {
      const suggestion = selectSuggestion(selectedIndex);
      if (suggestion) {
        handleSuggestionSelect(suggestion);
        return;
      }
    }

    // Add as regular item
    onAddItem(trimmedQuery, isFlexible);
    setQuery('');
    setManuallyHidden(true);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product' && suggestion.product) {
      // Add specific product with all details
      onAddItem(suggestion.product.name, false, suggestion.product);
      setQuery('');
    } else if (suggestion.query) {
      // For AI suggestions, either add directly or set as new query
      if (isFlexible) {
        // In flexible mode, add the AI suggestion as a flexible item
        onAddItem(suggestion.query, true);
        setQuery('');
      } else {
        // Set as new search query for further refinement
        setQuery(suggestion.query);
      }
    }
    setManuallyHidden(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      navigateSelection('down');
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      navigateSelection('up');
    } else if (e.key === 'Escape') {
      setManuallyHidden(true);
    }
  };

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'product':
        return <span className="text-lg">🛒</span>;
      case 'ai_suggestion':
        return <span className="text-lg">🤖</span>;
      default:
        return <span className="text-lg">🔍</span>;
    }
  };

  return (
    <div className="relative">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length > 2 && suggestions.length > 0) {
                setManuallyHidden(false);
              }
            }}
            placeholder={
              isFlexible
                ? "Add grocery item (e.g. milk, bread) - AI will suggest alternatives"
                : "Search for specific products and brands (e.g. Horizon Organic milk)..."
            }
            className="input-modern pr-28"
          />
          
          {/* Search Loading Indicator */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Add Button (inside input) */}
          <button
            onClick={handleSubmit}
            disabled={!query.trim()}
            className="btn-secondary whitespace-nowrap disabled:opacity-50 absolute right-2 top-1/2 -translate-y-1/2"
          >
            <span className="sm:hidden">+</span>
            <span className="hidden sm:inline">Add Item</span>
          </button>
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-16 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-80 overflow-y-auto"
          style={{ zIndex: 99999 }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`relative z-50 px-4 py-3 cursor-pointer transition-all duration-150 ${
                index === selectedIndex
                  ? 'bg-blue-50/80 border-l-4 border-blue-500'
                  : 'hover:bg-slate-50/60'
              } ${
                index !== suggestions.length - 1 ? 'border-b border-slate-200/30' : ''
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{ zIndex: 99999 }}
            >
              <div className="flex items-center gap-3">
                {getSuggestionIcon(suggestion)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 truncate">
                      {suggestion.product?.name || suggestion.query}
                    </span>
                  </div>
                  
                  {/* Product Brand */}
                  {suggestion.product?.brand && (
                    <div className="text-xs text-slate-500 mt-1">
                      {suggestion.product.brand}
                    </div>
                  )}
                  
                  {/* Product Description */}
                  {suggestion.reasoning && (
                    <div className="text-xs text-slate-500 mt-1">
                      {suggestion.reasoning}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Suggestions Footer */}
          <div className="px-4 py-2 bg-linear-to-r from-blue-50/50 to-indigo-50/50 border-t border-slate-200/30">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {isFlexible ? (
                <>
                  <span>🤖</span>
                  <span>AI-powered suggestions for alternatives and variations</span>
                </>
              ) : (
                <>
                  <span>📝</span>
                  <span>Add products to your list - prices compared when you click &quot;Compare Stores&quot;</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
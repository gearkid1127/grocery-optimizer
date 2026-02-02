"use client";

import { useState, useEffect, useRef } from "react";
import AOS from "aos";
import { EnhancedSearchInput } from "@/components/EnhancedSearchInput";
import { StoreLocationSelector } from "@/components/StoreLocationSelector";
import { storeLocations } from "@/lib/data/storeLocations";
import { PRICING_LAST_UPDATED } from "@/lib/data/productDatabase";

type StoreId = "walmart" | "target" | "marianos" | "jewel" | "butera" | "caputos" | "petes";

type Item = {
  id: string;
  query: string;
  flexible: boolean;
  brand?: string;
  category?: string;
  desiredSize?: {
    value: number;
    unit: "oz" | "lb" | "ct";
  };
};

type GroceryItem = {
  id: string;
  query: string;
  flexible: boolean;
  brand?: string;
  category?: string;
  desiredSize?: {
    value: number;
    unit: "oz" | "lb" | "ct";
  };
};

type ChosenProduct = {
  name: string;
};

type Pick = {
  itemId: string;
  storeId: StoreId;
  lineTotal: number;
  chosenProduct?: ChosenProduct;
};

type BestPair = {
  stores: StoreId[];
  subtotal: number;
  savingsVsBestOneStore: number;
  picks: Pick[];
};

type BestOneStore = {
  storeId: StoreId;
  subtotal: number;
  missingCount: number;
  outOfStockCount: number;
  matches?: { 
    itemId: string; 
    chosenProduct?: { 
      name: string; 
      size?: { value: number; unit: string; }; 
    }; 
    status: string; 
    reason?: string; 
    lineTotal?: number; 
  }[];
};

type QuoteResponse = {
  result?: {
    bestOneStore?: BestOneStore;
    bestPair?: BestPair;
  };
  error?: string;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [isFlexible, setIsFlexible] = useState(true);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [selectedStores, setSelectedStores] = useState<StoreId[]>([
    "walmart",
    "marianos", 
    "petes",
  ]);
  
  // Store location state
  const [selectedStoreLocations, setSelectedStoreLocations] = useState<{
    walmart: string;
    target: string;
    marianos: string;
    jewel: string;
    butera: string;
    caputos: string;
    petes: string;
  }>({
    walmart: storeLocations.walmart[0]?.id || 'walmart-2844',
    target: storeLocations.target[0]?.id || 'target-1375',
    marianos: storeLocations.marianos[0]?.id || 'marianos-3001',
    jewel: storeLocations.jewel[0]?.id || 'jewel-3101',
    butera: storeLocations.butera[0]?.id || 'butera-3201',
    caputos: storeLocations.caputos[0]?.id || 'caputos-3301',
    petes: storeLocations.petes[0]?.id || 'petes-3401'
  });

  const [resp, setResp] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('grocery-optimizer-items');
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (error) {
        console.error('Error loading saved shopping list:', error);
      }
    }

    const savedStores = localStorage.getItem('grocery-optimizer-selected-stores');
    if (savedStores) {
      try {
        setSelectedStores(JSON.parse(savedStores));
      } catch (error) {
        console.error('Error loading saved stores:', error);
      }
    }

    const savedLocations = localStorage.getItem('grocery-optimizer-store-locations');
    if (savedLocations) {
      try {
        setSelectedStoreLocations(JSON.parse(savedLocations));
      } catch (error) {
        console.error('Error loading saved store locations:', error);
      }
    }

  }, []);

  // Save shopping list to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('grocery-optimizer-items', JSON.stringify(items));
  }, [items]);

  // Save selected stores to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('grocery-optimizer-selected-stores', JSON.stringify(selectedStores));
  }, [selectedStores]);

  // Save store locations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('grocery-optimizer-store-locations', JSON.stringify(selectedStoreLocations));
  }, [selectedStoreLocations]);

  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: "ease-out",
      once: true,
      offset: 80,
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [resp]);

  useEffect(() => {
    if (resp?.result && !error) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [resp, error]);

  async function compare() {
    setLoading(true);
    setResp(null);
    setError(null);

    try {
      const r = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          stores: selectedStores,
          storeLocations: selectedStoreLocations,
        }),
      });

      if (!r.ok) {
        const errorData = await r.json();
        throw new Error(errorData.error || `API error: ${r.status}`);
      }

      const json = await r.json();
      
      if (json.error) {
        throw new Error(json.error);
      }

      setResp(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compare stores. Please try again.';
      setError(message);
      console.error('Compare error:', err);
    } finally {
      setLoading(false);
    }
  }

  function addItem(query: string, flexible: boolean, selectedProduct?: {
    sku: string;
    name: string;
    brand?: string;
    category: string;
    size: { value: number; unit: "oz" | "lb" | "ct" };
    price: number;
    inStock: boolean;
  }) {
    const value = query.trim();
    if (!value) return;

    const newItem: GroceryItem = {
      id: crypto.randomUUID(),
      query: value,
      flexible,
    };

    // If a specific product was selected, add brand info
    if (selectedProduct && !flexible) {
      newItem.brand = selectedProduct.brand;
      newItem.category = selectedProduct.category;
      if (selectedProduct.size) {
        newItem.desiredSize = selectedProduct.size;
      }
    }

    setItems((prev) => [...prev, newItem]);
  }

  const bestOne = resp?.result?.bestOneStore;
  const bestTwo = resp?.result?.bestPair;

  return (
    <main className="min-h-screen p-6">
      {/* Invader Zim-style background food elements */}
      <div className="zim-background">
        {/* Right side food items (original order) - WITH VARIED HORIZONTAL POSITIONING */}
        <div className="zim-food zim-milk food-1" style={{position: 'absolute', top: '60px', right: '2rem'}}></div>
        <div className="zim-food zim-cereal food-2" style={{position: 'absolute', top: '180px', right: '8rem'}}></div>
        <div className="zim-food zim-apple food-3" style={{position: 'absolute', top: '300px', right: '1rem'}}></div>
        <div className="zim-food zim-soda food-4" style={{position: 'absolute', top: '420px', right: '11rem'}}></div>
        <div className="zim-food zim-chips food-5" style={{position: 'absolute', top: '540px', right: '0.5rem'}}></div>
        <div className="zim-food zim-banana food-6" style={{position: 'absolute', top: '660px', right: '6rem'}}></div>
        
        {/* Left side food items (reverse order) - WITH VARIED HORIZONTAL POSITIONING */}
        <div className="zim-food zim-banana food-7" style={{position: 'absolute', top: '60px', left: '3rem'}}></div>
        <div className="zim-food zim-chips food-8" style={{position: 'absolute', top: '180px', left: '9rem'}}></div>
        <div className="zim-food zim-soda food-9" style={{position: 'absolute', top: '300px', left: '0.75rem'}}></div>
        <div className="zim-food zim-apple food-10" style={{position: 'absolute', top: '420px', left: '12rem'}}></div>
        <div className="zim-food zim-cereal food-11" style={{position: 'absolute', top: '540px', left: '1.5rem'}}></div>
        <div className="zim-food zim-milk food-12" style={{position: 'absolute', top: '660px', left: '7rem'}}></div>
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center" data-aos="fade-up">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-linear-to-r from-blue-600/10 to-indigo-600/10 px-6 py-3 mb-6">
            <div className="h-8 w-8 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">&#128722;</span>
            </div>
            <span className="text-sm font-medium text-blue-700 bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600">
              Smart Shopping Platform
            </span>
          </div>
          
          <h1 className="mb-5 text-6xl font-bold leading-tight bg-linear-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Grocery Optimizer
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Find the best deals across multiple stores with our intelligent price comparison engine. 
            <span className="text-blue-600 font-medium"> Save money, save time.</span>
          </p>
          
          {/* Pricing data timestamp */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 rounded-lg backdrop-blur-sm">
            <span className="text-xs text-slate-500">📊</span>
            <span className="text-xs text-slate-600">
              Pricing data last updated: {new Date(PRICING_LAST_UPDATED).toLocaleDateString()}
            </span>
          </div>
          
          {/* Floating elements for visual appeal */}
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-linear-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-40 right-1/4 w-24 h-24 bg-linear-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
        </header>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-8">
            {/* Control Panel */}
            <section className="card-glass relative z-50" data-aos="fade-up">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              </div>

              {/* Store Selection */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-700">Choose Stores</span>
                  <div className="h-1 flex-1 bg-linear-to-r from-blue-200 to-transparent rounded-full"></div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(["walmart", "target", "marianos", "jewel", "butera", "caputos", "petes"] as StoreId[]).map((store) => {
                    const checked = selectedStores.includes(store);
                    const storeConfig = {
                      walmart: { name: "Walmart", color: "from-blue-500 to-blue-600" },
                      target: { name: "Target", color: "from-red-500 to-red-600" },
                      marianos: { name: "Mariano's", color: "from-green-500 to-green-600" },
                      jewel: { name: "Jewel-Osco", color: "from-amber-500 to-orange-500" },
                      butera: { name: "Butera", color: "from-purple-500 to-purple-600" },
                      caputos: { name: "Caputo's", color: "from-emerald-500 to-emerald-600" },
                      petes: { name: "Pete's", color: "from-indigo-500 to-indigo-600" }
                    };

                    return (
                      <label
                        key={store}
                        className={`store-card ${checked ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedStores((prev) => {
                              if (checked && prev.length === 1) return prev;
                              return checked
                                ? prev.filter((s) => s !== store)
                                : [...prev, store];
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className={`w-3 h-3 rounded-full bg-linear-to-r ${storeConfig[store].color}`}></div>
                        <span className="font-medium text-slate-700 text-sm">{storeConfig[store].name}</span>
                      </label>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                  <span className="text-amber-500">&#9888;&#65039;</span>
                  At least one store must be selected
                </p>
              </div>

              {/* Store Location Selection */}
              {selectedStores.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm font-semibold text-slate-700">Store Locations</span>
                    <div className="h-1 flex-1 bg-linear-to-r from-indigo-200 to-transparent rounded-full"></div>
                  </div>
                  
                  <div className="grid gap-4">
                    {selectedStores.includes('walmart') && (
                      <StoreLocationSelector
                        storeType="walmart"
                        selectedLocationId={selectedStoreLocations.walmart}
                        onLocationChange={(locationId) => 
                          setSelectedStoreLocations(prev => ({ ...prev, walmart: locationId }))
                        }
                      />
                    )}
                    {selectedStores.includes('target') && (
                      <StoreLocationSelector
                        storeType="target"
                        selectedLocationId={selectedStoreLocations.target}
                        onLocationChange={(locationId) => 
                          setSelectedStoreLocations(prev => ({ ...prev, target: locationId }))
                        }
                      />
                    )}
                    {selectedStores.includes('marianos') && (
                      <StoreLocationSelector
                        storeType="marianos"
                        selectedLocationId={selectedStoreLocations.marianos}
                        onLocationChange={(locationId) => 
                          setSelectedStoreLocations(prev => ({ ...prev, marianos: locationId }))
                        }
                      />
                    )}
                    {selectedStores.includes('jewel') && (
                      <StoreLocationSelector
                        storeType="jewel"
                        selectedLocationId={selectedStoreLocations.jewel}
                        onLocationChange={(locationId) => 
                          setSelectedStoreLocations(prev => ({ ...prev, jewel: locationId }))
                        }
                      />
                    )}
                    {selectedStores.includes('butera') && (
                      <StoreLocationSelector
                        storeType="butera"
                        selectedLocationId={selectedStoreLocations.butera}
                        onLocationChange={(locationId) => 
                          setSelectedStoreLocations(prev => ({ ...prev, butera: locationId }))
                        }
                      />
                    )}
                    {selectedStores.includes('caputos') && (
                      <StoreLocationSelector
                        storeType="caputos"
                        selectedLocationId={selectedStoreLocations.caputos}
                        onLocationChange={(locationId) => 
                          setSelectedStoreLocations(prev => ({ ...prev, caputos: locationId }))
                        }
                      />
                    )}
                    {selectedStores.includes('petes') && (
                      <StoreLocationSelector
                        storeType="petes"
                        selectedLocationId={selectedStoreLocations.petes}
                        onLocationChange={(locationId) => 
                          setSelectedStoreLocations(prev => ({ ...prev, petes: locationId }))
                        }
                      />
                    )}
                  </div>
                  
                  <div className="mt-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <span className="text-lg">&#127850;</span>
                      <span className="font-medium text-sm">Location-Based Inventory</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      Prices and availability will be based on your selected store locations for the most accurate comparison.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFlexible((prev) => !prev)}
                  aria-pressed={isFlexible}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-sm ${
                    isFlexible
                      ? "bg-green-100 text-green-700 ring-1 ring-green-200 hover:bg-green-200"
                      : "bg-blue-100 text-blue-700 ring-1 ring-blue-200 hover:bg-blue-200"
                  }`}
                >
                  {isFlexible ? (
                    <span className="flex items-center gap-1">
                      <span className="text-green-600">✓</span> Flexible
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="text-blue-600">🎯</span> Specific
                    </span>
                  )}
                </button>
                <button 
                  onClick={compare} 
                  className="btn-primary inline-flex items-center gap-2" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>&#10024;</span>
                      Compare Stores
                    </>
                  )}
                </button>
              </div>

              <EnhancedSearchInput 
                onAddItem={addItem}
                isFlexible={isFlexible}
                selectedStores={selectedStores}

              />
            </section>

            <section className="card-glass relative z-10" data-aos="fade-up" data-aos-delay="100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-xl">&#128221;</span>
                  Shopping List
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={item.id} className="list-item group">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-linear-to-r from-slate-200 to-slate-300 flex items-center justify-center text-xs font-medium text-slate-600">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-slate-800">{item.query}</span>
                        {item.brand && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Brand: {item.brand}
                          </div>
                        )}
                        {item.desiredSize && (
                          <div className="text-xs text-slate-500">
                            Size: {item.desiredSize.value} {item.desiredSize.unit}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id ? { ...i, flexible: !i.flexible } : i
                            )
                          )
                        }
                        aria-pressed={item.flexible}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 shadow-sm ${
                          item.flexible
                            ? "bg-green-100 text-green-700 ring-1 ring-green-200 hover:bg-green-200"
                            : "bg-amber-100 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-200"
                        }`}
                      >
                        {item.flexible ? "Flexible" : "Specific"}
                      </button>

                      <button
                        onClick={() =>
                          setItems((prev) => prev.filter((i) => i.id !== item.id))
                        }
                        className="btn-ghost opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label={`Remove ${item.query}`}
                      >
                        <span className="text-red-500">&#128465;&#65039;</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {items.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-4xl mb-3">&#128722;</div>
                    <p className="text-sm">Your shopping list is empty</p>
                    <p className="text-xs mt-1">Add some items to get started</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Results */}
          <div ref={resultsRef} className="space-y-6">
            {error && (
              <section className="card-glass bg-red-50 border border-red-200" data-aos="fade-up">
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0">⚠️</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-800 mb-1">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              </section>
            )}
            {bestOne && (
              <>
                {/* Best Single Store */}
                <section className="card-glass" data-aos="fade-up">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">&#129351;</span>
                    <h3 className="text-sm font-bold text-slate-800">Best Single Store</h3>
                  </div>
                  
                  <div className="text-center p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl mb-6">
                    <p className="text-2xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent capitalize">
                      {bestOne.storeId}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">
                      ${(bestOne.subtotal ?? 0).toFixed(2)}
                    </p>
                    
                    <div className="flex justify-center gap-4 mt-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <span className="text-red-500">&#128465;&#65039;</span>
                        <span>Missing: {bestOne.missingCount ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500">&#128230;</span>
                        <span>Out of stock: {bestOne.outOfStockCount ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Itemized breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">&#128203;</span>
                      Item Breakdown
                    </h4>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {bestOne.matches?.map((match, index) => {
                        // Find the original item to check if it was flexible
                        const originalItem = items.find(item => item.id === match.itemId);
                        const isFlexible = originalItem?.flexible ?? false;
                        
                        return (
                          <div key={match.itemId} className="flex items-center justify-between p-3 bg-white/30 rounded-lg border border-white/20">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                                {index + 1}
                              </span>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-slate-800 truncate">
                                    {originalItem?.query || match.itemId}
                                  </span>
                                  
                                  {/* Status indicator */}
                                  {match.status === "matched" && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full shrink-0">
                                      &#9989; Found
                                    </span>
                                  )}
                                  {match.status === "substituted" && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full shrink-0">
                                      &#128260; Substituted
                                    </span>
                                  )}
                                  {match.status === "out_of_stock" && (
                                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full shrink-0">
                                      &#128230; Out of Stock
                                    </span>
                                  )}
                                  {match.status === "missing" && (
                                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full shrink-0">
                                      &#10060; Missing
                                    </span>
                                  )}
                                </div>
                                
                                {/* Show specific product selected (especially useful for flexible items) */}
                                {match.chosenProduct && (
                                  <div className="text-xs text-slate-500">
                                    {isFlexible && (
                                      <span className="text-green-600 font-medium">Selected: </span>
                                    )}
                                    {match.chosenProduct.name}{match.chosenProduct.size ? ` - ${match.chosenProduct.size.value}${match.chosenProduct.size.unit}` : ''}
                                    {match.reason && match.status === "substituted" && (
                                      <span className="text-blue-600 ml-1">({match.reason})</span>
                                    )}
                                  </div>
                                )}
                                
                                {match.reason && match.status === "out_of_stock" && (
                                  <div className="text-xs text-amber-600">
                                    {match.reason}
                                  </div>
                                )}
                                
                                {match.reason && match.status === "missing" && (
                                  <div className="text-xs text-red-600">
                                    {match.reason}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Price */}
                            <div className="text-right shrink-0">
                              {match.lineTotal !== undefined ? (
                                <span className="text-sm font-semibold text-slate-900">
                                  ${match.lineTotal.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  N/A
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Best Two Stores */}
                <section className="card-glass" data-aos="fade-up" data-aos-delay="100">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">&#127942;</span>
                    <h3 className="text-sm font-bold text-slate-800">Best Multi-Store</h3>
                  </div>

                  {bestTwo ? (
                    (() => {
                      const grouped = bestTwo.picks.reduce((acc, pick) => {
                        (acc[pick.storeId] ||= []).push(pick);
                        return acc;
                      }, {} as Record<StoreId, Pick[]>);

                      return (
                        <>
                          <div className="text-center p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-xl mb-6">
                            <p className="text-lg font-semibold text-slate-800 capitalize">
                              {bestTwo.stores.join(" + ")}
                            </p>
                            <p className="text-3xl font-bold text-green-700 mt-2">
                              ${(bestTwo.subtotal ?? 0).toFixed(2)}
                            </p>
                            
                            <div className="mt-3 p-2 bg-green-100 rounded-lg">
                              <p className="text-sm font-medium text-green-800">
                                &#128176; Save ${(bestTwo.savingsVsBestOneStore ?? 0).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {bestTwo.stores.map((storeId) => {
                              const picks = grouped[storeId] ?? [];
                              const storeSubtotal = picks.reduce(
                                (sum, p) => sum + p.lineTotal,
                                0
                              );

                              return (
                                <div
                                  key={storeId}
                                  className="card-subtle"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-slate-800 capitalize flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${storeId === 'walmart' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                      {storeId} List
                                    </h4>
                                    <span className="text-sm font-bold text-slate-900">
                                      ${(storeSubtotal ?? 0).toFixed(2)}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {picks.map((p) => (
                                      <div
                                        key={p.itemId}
                                        className="flex items-center justify-between p-2 bg-white/50 rounded-lg"
                                      >
                                        <div className="text-xs">
                                          <span className="font-medium text-slate-800">
                                            {items.find((i) => i.id === p.itemId)?.query ?? "Item"}
                                          </span>
                                          <br />
                                          <span className="text-slate-500">
                                            {p.chosenProduct?.name ?? "Chosen item"}
                                          </span>
                                        </div>

                                        <span className="text-xs font-bold text-slate-700">
                                          ${(p.lineTotal ?? 0).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <div className="text-2xl mb-2">&#128717;&#65039;</div>
                      <p className="text-sm">Just one store is the cheapest option</p>
                    </div>
                  )}
                </section>
              </>
            )}
            
            {!bestOne && !loading && (
              <section className="card-glass text-center py-12">
                <div className="text-4xl mb-4 animate-pulse-slow">&#11088;</div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to optimize!</h3>
                <p className="text-sm text-slate-600">Click &ldquo;Compare Stores&rdquo; to see your results here</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

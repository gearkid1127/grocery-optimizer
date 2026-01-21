export type StoreId = "walmart" | "target" | "marianos" | "jewel" | "butera" | "caputos" | "petes";

export type GroceryItem = {
  id: string;              // local list id
  query: string;           // what user typed ("milk", "Skippy peanut butter")
  flexible: boolean;       // true = any comparable item, false = specific
  brand?: string;          // optional preference for non-flexible items
  category?: string;       // optional hint (can be blank for now)
  desiredSize?: {
    value: number;
    unit: "oz" | "lb" | "ct";
  };
};

export type StoreProduct = {
  sku: string;
  name: string;
  brand?: string;
  category: string;        // e.g. "dairy", "produce", "meat"
  size: { value: number; unit: "oz" | "lb" | "ct" };
  price: number;           // dollars
  inStock: boolean;
};

export type LineItemMatch = {
  itemId: string;
  storeId: StoreId;
  status: "matched" | "substituted" | "missing" | "out_of_stock";
  chosenProduct?: StoreProduct;
  reason?: string;
  lineTotal?: number;      // chosenProduct.price if matched/substituted
};

export type StoreQuote = {
  storeId: StoreId;
  subtotal: number;
  matches: LineItemMatch[];
  missingCount: number;
  outOfStockCount: number;
  lastUpdatedISO: string;
};

export type OptimizationResult = {
  bestOneStore: StoreQuote;
  bestPair?: {
    stores: [StoreId, StoreId];
    subtotal: number;
    picks: LineItemMatch[];   // one per item, chosen from either store
    savingsVsBestOneStore: number;
  };
};

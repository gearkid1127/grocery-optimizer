// Comprehensive grocery product database
// This replaces API dependencies with a robust local catalog

// Pricing data last updated timestamp
export const PRICING_LAST_UPDATED = "2026-01-20"; // Update this when refreshing prices

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  size: {
    value: number;
    unit: 'oz' | 'lb' | 'ct' | 'gal' | 'ml' | 'l' | 'pkg';
  };
  keywords: string[];
  basePrice: number; // Base price for calculations
}

export interface StorePrice {
  productId: string;
  storeId: 'walmart' | 'target' | 'marianos' | 'jewel' | 'butera' | 'caputos' | 'petes';
  locationId: string;
  price: number;
  inStock: boolean;
  sku: string;
}

// Comprehensive product catalog organized by category
export const productCatalog: Product[] = [
  // DAIRY & EGGS
  {
    id: 'dairy-001',
    name: 'Whole Milk',
    brand: 'Great Value',
    category: 'Dairy',
    subcategory: 'Milk',
    size: { value: 1, unit: 'gal' },
    keywords: ['milk', 'dairy', 'whole', 'gallon'],
    basePrice: 3.48
  },
  {
    id: 'dairy-002',
    name: 'Organic Whole Milk',
    brand: 'Horizon Organic',
    category: 'Dairy',
    subcategory: 'Milk',
    size: { value: 64, unit: 'oz' },
    keywords: ['milk', 'organic', 'dairy', 'horizon'],
    basePrice: 4.98
  },
  {
    id: 'dairy-003',
    name: '2% Reduced Fat Milk',
    brand: 'Great Value',
    category: 'Dairy',
    subcategory: 'Milk',
    size: { value: 1, unit: 'gal' },
    keywords: ['milk', 'dairy', '2%', 'reduced fat'],
    basePrice: 3.48
  },
  {
    id: 'dairy-004',
    name: 'Lactose Free Whole Milk',
    brand: 'Lactaid',
    category: 'Dairy',
    subcategory: 'Milk',
    size: { value: 64, unit: 'oz' },
    keywords: ['milk', 'lactose free', 'dairy', 'lactaid'],
    basePrice: 4.28
  },
  {
    id: 'dairy-005',
    name: 'Large Grade AA White Eggs',
    brand: 'Great Value',
    category: 'Dairy',
    subcategory: 'Eggs',
    size: { value: 18, unit: 'ct' },
    keywords: ['eggs', 'large', 'white', 'grade aa'],
    basePrice: 2.97
  },
  {
    id: 'dairy-006',
    name: 'Organic Free Range Large Eggs',
    brand: 'Egglands Best',
    category: 'Dairy',
    subcategory: 'Eggs',
    size: { value: 12, unit: 'ct' },
    keywords: ['eggs', 'organic', 'free range', 'egglands'],
    basePrice: 4.98
  },
  {
    id: 'dairy-007',
    name: 'Pasture Raised Large Eggs',
    brand: 'Vital Farms',
    category: 'Dairy',
    subcategory: 'Eggs',
    size: { value: 12, unit: 'ct' },
    keywords: ['eggs', 'pasture raised', 'vital farms'],
    basePrice: 6.98
  },

  // BEVERAGES
  {
    id: 'bev-001',
    name: 'Sprite Lemon-Lime Soda',
    brand: 'Sprite',
    category: 'Beverages',
    subcategory: 'Soda',
    size: { value: 12, unit: 'pkg' },
    keywords: ['sprite', 'soda', 'lemon lime', 'soft drink', 'pop'],
    basePrice: 6.48
  },
  {
    id: 'bev-002',
    name: 'Sprite Zero Sugar',
    brand: 'Sprite',
    category: 'Beverages',
    subcategory: 'Soda',
    size: { value: 2, unit: 'l' },
    keywords: ['sprite', 'zero', 'diet', 'soda', 'sugar free'],
    basePrice: 1.98
  },
  {
    id: 'bev-003',
    name: 'Coca-Cola Classic',
    brand: 'Coca-Cola',
    category: 'Beverages',
    subcategory: 'Soda',
    size: { value: 12, unit: 'pkg' },
    keywords: ['coke', 'coca cola', 'classic', 'soda', 'cola'],
    basePrice: 6.98
  },
  {
    id: 'bev-004',
    name: 'Diet Coke',
    brand: 'Coca-Cola',
    category: 'Beverages',
    subcategory: 'Soda',
    size: { value: 12, unit: 'pkg' },
    keywords: ['diet coke', 'coca cola', 'diet', 'zero calories'],
    basePrice: 6.98
  },
  {
    id: 'bev-005',
    name: 'Pepsi Cola',
    brand: 'Pepsi',
    category: 'Beverages',
    subcategory: 'Soda',
    size: { value: 12, unit: 'pkg' },
    keywords: ['pepsi', 'cola', 'soda', 'soft drink'],
    basePrice: 6.78
  },
  {
    id: 'bev-006',
    name: 'Mountain Dew',
    brand: 'Mountain Dew',
    category: 'Beverages',
    subcategory: 'Soda',
    size: { value: 12, unit: 'pkg' },
    keywords: ['mountain dew', 'dew', 'citrus', 'soda'],
    basePrice: 6.98
  },

  // BREAD & BAKERY
  {
    id: 'bread-001',
    name: 'White Sandwich Bread',
    brand: 'Wonder',
    category: 'Bread & Bakery',
    subcategory: 'Bread',
    size: { value: 20, unit: 'oz' },
    keywords: ['bread', 'white', 'sandwich', 'wonder'],
    basePrice: 1.98
  },
  {
    id: 'bread-002',
    name: 'Whole Wheat Bread',
    brand: 'Natures Own',
    category: 'Bread & Bakery',
    subcategory: 'Bread',
    size: { value: 20, unit: 'oz' },
    keywords: ['bread', 'whole wheat', 'wheat', 'natures own'],
    basePrice: 2.48
  },
  {
    id: 'bread-003',
    name: 'Organic Whole Grain Bread',
    brand: 'Daves Killer Bread',
    category: 'Bread & Bakery',
    subcategory: 'Bread',
    size: { value: 24, unit: 'oz' },
    keywords: ['bread', 'organic', 'whole grain', 'daves killer'],
    basePrice: 4.98
  },

  // PRODUCE
  {
    id: 'produce-001',
    name: 'Bananas',
    brand: 'Fresh',
    category: 'Produce',
    subcategory: 'Fruit',
    size: { value: 1, unit: 'lb' },
    keywords: ['bananas', 'banana', 'fruit', 'fresh'],
    basePrice: 0.58
  },
  {
    id: 'produce-002',
    name: 'Organic Bananas',
    brand: 'Organic',
    category: 'Produce',
    subcategory: 'Fruit',
    size: { value: 1, unit: 'lb' },
    keywords: ['bananas', 'banana', 'organic', 'fruit'],
    basePrice: 0.78
  },
  {
    id: 'produce-003',
    name: 'Gala Apples',
    brand: 'Fresh',
    category: 'Produce',
    subcategory: 'Fruit',
    size: { value: 3, unit: 'lb' },
    keywords: ['apples', 'gala', 'fruit', 'fresh'],
    basePrice: 3.48
  },

  // CEREAL & BREAKFAST
  {
    id: 'cereal-001',
    name: 'Honey Nut Cheerios',
    brand: 'General Mills',
    category: 'Cereal & Breakfast',
    subcategory: 'Cereal',
    size: { value: 19.5, unit: 'oz' },
    keywords: ['cheerios', 'honey nut', 'cereal', 'breakfast'],
    basePrice: 4.68
  },
  {
    id: 'cereal-002',
    name: 'Frosted Flakes',
    brand: 'Kelloggs',
    category: 'Cereal & Breakfast',
    subcategory: 'Cereal',
    size: { value: 24, unit: 'oz' },
    keywords: ['frosted flakes', 'flakes', 'kelloggs', 'cereal'],
    basePrice: 4.98
  },
  {
    id: 'cereal-003',
    name: 'Lucky Charms',
    brand: 'General Mills',
    category: 'Cereal & Breakfast',
    subcategory: 'Cereal',
    size: { value: 20.5, unit: 'oz' },
    keywords: ['lucky charms', 'marshmallows', 'cereal'],
    basePrice: 4.78
  },

  // MEAT & SEAFOOD
  {
    id: 'meat-001',
    name: 'Ground Beef 80/20',
    brand: 'Fresh',
    category: 'Meat & Seafood',
    subcategory: 'Beef',
    size: { value: 1, unit: 'lb' },
    keywords: ['ground beef', 'beef', 'hamburger', '80/20'],
    basePrice: 4.98
  },
  {
    id: 'meat-002',
    name: 'Boneless Skinless Chicken Breast',
    brand: 'Fresh',
    category: 'Meat & Seafood',
    subcategory: 'Chicken',
    size: { value: 1, unit: 'lb' },
    keywords: ['chicken', 'breast', 'boneless', 'skinless'],
    basePrice: 3.98
  },

  // SNACKS
  {
    id: 'snacks-001',
    name: 'Doritos Nacho Cheese',
    brand: 'Doritos',
    category: 'Snacks',
    subcategory: 'Chips',
    size: { value: 14.5, unit: 'oz' },
    keywords: ['doritos', 'nacho cheese', 'chips', 'tortilla'],
    basePrice: 4.48
  },
  {
    id: 'snacks-002',
    name: 'Lays Classic Potato Chips',
    brand: 'Lays',
    category: 'Snacks',
    subcategory: 'Chips',
    size: { value: 13, unit: 'oz' },
    keywords: ['lays', 'potato chips', 'classic', 'chips'],
    basePrice: 4.28
  },

  // PANTRY & CONDIMENTS
  {
    id: 'pantry-001',
    name: 'Skippy Peanut Butter',
    brand: 'Skippy',
    category: 'Pantry',
    subcategory: 'Spreads',
    size: { value: 40, unit: 'oz' },
    keywords: ['peanut butter', 'skippy', 'spread', 'creamy'],
    basePrice: 5.98
  },
  {
    id: 'pantry-002',
    name: 'Jif Creamy Peanut Butter',
    brand: 'Jif',
    category: 'Pantry',
    subcategory: 'Spreads',
    size: { value: 40, unit: 'oz' },
    keywords: ['peanut butter', 'jif', 'creamy', 'spread'],
    basePrice: 6.48
  },
  {
    id: 'pantry-003',
    name: 'Heinz Ketchup',
    brand: 'Heinz',
    category: 'Pantry',
    subcategory: 'Condiments',
    size: { value: 32, unit: 'oz' },
    keywords: ['ketchup', 'heinz', 'tomato', 'condiment'],
    basePrice: 3.98
  },

  // FROZEN
  {
    id: 'frozen-001',
    name: 'Stouffers Lasagna',
    brand: 'Stouffers',
    category: 'Frozen',
    subcategory: 'Entrees',
    size: { value: 96, unit: 'oz' },
    keywords: ['lasagna', 'stouffers', 'frozen', 'entree'],
    basePrice: 12.98
  },
  {
    id: 'frozen-002',
    name: 'Breyers Vanilla Ice Cream',
    brand: 'Breyers',
    category: 'Frozen',
    subcategory: 'Ice Cream',
    size: { value: 64, unit: 'oz' },
    keywords: ['ice cream', 'breyers', 'vanilla', 'frozen'],
    basePrice: 5.98
  },

  // HOUSEHOLD & CLEANING
  {
    id: 'household-001',
    name: 'Tide Original Laundry Detergent',
    brand: 'Tide',
    category: 'Household',
    subcategory: 'Laundry',
    size: { value: 92, unit: 'oz' },
    keywords: ['tide', 'laundry detergent', 'original', 'cleaning'],
    basePrice: 11.97
  },
  {
    id: 'household-002',
    name: 'Charmin Ultra Soft Toilet Paper',
    brand: 'Charmin',
    category: 'Household',
    subcategory: 'Paper Products',
    size: { value: 12, unit: 'ct' },
    keywords: ['toilet paper', 'charmin', 'ultra soft', 'bathroom'],
    basePrice: 12.97
  },
  {
    id: 'household-003',
    name: 'Bounty Paper Towels',
    brand: 'Bounty',
    category: 'Household',
    subcategory: 'Paper Products',
    size: { value: 12, unit: 'ct' },
    keywords: ['paper towels', 'bounty', 'cleaning', 'kitchen'],
    basePrice: 19.97
  },

  // PERSONAL CARE
  {
    id: 'personal-001',
    name: 'Crest 3D White Toothpaste',
    brand: 'Crest',
    category: 'Personal Care',
    subcategory: 'Oral Care',
    size: { value: 4.1, unit: 'oz' },
    keywords: ['toothpaste', 'crest', '3d white', 'oral care'],
    basePrice: 4.97
  },
  {
    id: 'personal-002',
    name: 'Head & Shoulders Shampoo',
    brand: 'Head & Shoulders',
    category: 'Personal Care',
    subcategory: 'Hair Care',
    size: { value: 23.7, unit: 'oz' },
    keywords: ['shampoo', 'head shoulders', 'dandruff', 'hair care'],
    basePrice: 6.97
  }
];

// Store-specific pricing with location variations
export const storePricing: StorePrice[] = [
  // Walmart pricing variations by location
  ...productCatalog.flatMap(product => [
    {
      productId: product.id,
      storeId: 'walmart' as const,
      locationId: 'walmart-2844', // Elmwood Park
      price: product.basePrice * (0.95 + Math.random() * 0.1), // ±5% variation
      inStock: Math.random() > 0.05, // 95% in stock rate
      sku: `WM-${product.id}-2844`
    },
    {
      productId: product.id,
      storeId: 'walmart' as const,
      locationId: 'walmart-5260', // Chicago North
      price: product.basePrice * (1.02 + Math.random() * 0.08), // Slightly higher urban pricing
      inStock: Math.random() > 0.08, // 92% in stock rate
      sku: `WM-${product.id}-5260`
    }
  ]),
  
  // Target pricing variations by location
  ...productCatalog.flatMap(product => [
    {
      productId: product.id,
      storeId: 'target' as const,
      locationId: 'target-1375', // Niles
      price: product.basePrice * (1.05 + Math.random() * 0.1), // Target typically 5-15% higher
      inStock: Math.random() > 0.07, // 93% in stock rate
      sku: `TGT-${product.id}-1375`
    },
    {
      productId: product.id,
      storeId: 'target' as const,
      locationId: 'target-2797', // Evanston
      price: product.basePrice * (1.08 + Math.random() * 0.12), // Premium location pricing
      inStock: Math.random() > 0.06, // 94% in stock rate
      sku: `TGT-${product.id}-2797`
    }
  ]),

  // Mariano's pricing (premium fresh market positioning)
  ...productCatalog.flatMap(product => [
    {
      productId: product.id,
      storeId: 'marianos' as const,
      locationId: 'marianos-3001', // West Loop
      price: product.basePrice * (1.12 + Math.random() * 0.15), // Premium fresh market, 12-27% higher
      inStock: Math.random() > 0.04, // 96% in stock rate - excellent inventory
      sku: `MAR-${product.id}-3001`
    },
    {
      productId: product.id,
      storeId: 'marianos' as const,
      locationId: 'marianos-3002', // Lincoln Park
      price: product.basePrice * (1.15 + Math.random() * 0.18), // Affluent neighborhood pricing
      inStock: Math.random() > 0.03, // 97% in stock rate
      sku: `MAR-${product.id}-3002`
    }
  ]),

  // Jewel-Osco pricing (traditional grocery chain)
  ...productCatalog.flatMap(product => [
    {
      productId: product.id,
      storeId: 'jewel' as const,
      locationId: 'jewel-3101', // Canal St
      price: product.basePrice * (1.08 + Math.random() * 0.12), // Competitive with Target, 8-20% higher
      inStock: Math.random() > 0.06, // 94% in stock rate
      sku: `JWL-${product.id}-3101`
    },
    {
      productId: product.id,
      storeId: 'jewel' as const,
      locationId: 'jewel-3102', // Broadway
      price: product.basePrice * (1.06 + Math.random() * 0.10), // Slightly lower in residential area
      inStock: Math.random() > 0.07, // 93% in stock rate
      sku: `JWL-${product.id}-3102`
    }
  ]),

  // Butera pricing (local family-owned, competitive)
  ...productCatalog.flatMap(product => [
    {
      productId: product.id,
      storeId: 'butera' as const,
      locationId: 'butera-3201', // Harlem Ave
      price: product.basePrice * (1.02 + Math.random() * 0.08), // Very competitive, 2-10% higher
      inStock: Math.random() > 0.10, // 90% in stock rate - smaller inventory
      sku: `BUT-${product.id}-3201`
    },
    {
      productId: product.id,
      storeId: 'butera' as const,
      locationId: 'butera-3202', // Elmwood Park
      price: product.basePrice * (1.00 + Math.random() * 0.06), // Most competitive location
      inStock: Math.random() > 0.08, // 92% in stock rate
      sku: `BUT-${product.id}-3202`
    }
  ]),

  // Caputo's pricing (Italian specialty with competitive grocery)
  ...productCatalog.flatMap(product => [
    {
      productId: product.id,
      storeId: 'caputos' as const,
      locationId: 'caputos-3301', // Elmwood Park flagship
      price: product.basePrice * (0.98 + Math.random() * 0.08), // Often beats major chains
      inStock: Math.random() > 0.09, // 91% in stock rate
      sku: `CAP-${product.id}-3301`
    },
    {
      productId: product.id,
      storeId: 'caputos' as const,
      locationId: 'caputos-3302', // Lincoln Park
      price: product.basePrice * (1.04 + Math.random() * 0.10), // Higher in affluent area
      inStock: Math.random() > 0.08, // 92% in stock rate
      sku: `CAP-${product.id}-3302`
    }
  ]),

  // Pete's Fresh Market pricing (neighborhood focus, very competitive)
  ...productCatalog.flatMap(product => [
    {
      productId: product.id,
      storeId: 'petes' as const,
      locationId: 'petes-3401', // North Ave
      price: product.basePrice * (0.96 + Math.random() * 0.08), // Often lowest prices, 4% under to 4% over
      inStock: Math.random() > 0.08, // 92% in stock rate
      sku: `PET-${product.id}-3401`
    },
    {
      productId: product.id,
      storeId: 'petes' as const,
      locationId: 'petes-3402', // Lawrence Ave
      price: product.basePrice * (0.94 + Math.random() * 0.10), // Aggressive pricing in competitive area
      inStock: Math.random() > 0.09, // 91% in stock rate
      sku: `PET-${product.id}-3402`
    },
    {
      productId: product.id,
      storeId: 'petes' as const,
      locationId: 'petes-3403', // Ashland Ave
      price: product.basePrice * (0.97 + Math.random() * 0.07), // Competitive neighborhood pricing
      inStock: Math.random() > 0.07, // 93% in stock rate
      sku: `PET-${product.id}-3403`
    }
  ])
];

// Search utility functions
export function searchProducts(query: string, limit: number = 20): Product[] {
  const queryLower = query.toLowerCase().trim();
  if (!queryLower) return [];

  const results = new Map<string, { product: Product; score: number }>();

  productCatalog.forEach(product => {
    let score = 0;

    // Exact name match (highest priority)
    if (product.name.toLowerCase() === queryLower) score += 100;
    
    // Brand match
    if (product.brand.toLowerCase() === queryLower) score += 80;
    
    // Starts with query
    if (product.name.toLowerCase().startsWith(queryLower)) score += 60;
    
    // Contains query in name
    if (product.name.toLowerCase().includes(queryLower)) score += 40;
    
    // Keywords match
    const keywordMatches = product.keywords.filter(keyword => 
      keyword.toLowerCase().includes(queryLower) || queryLower.includes(keyword.toLowerCase())
    ).length;
    score += keywordMatches * 20;
    
    // Category/subcategory match
    if (product.category.toLowerCase().includes(queryLower)) score += 30;
    if (product.subcategory.toLowerCase().includes(queryLower)) score += 35;
    
    // Brand contains query
    if (product.brand.toLowerCase().includes(queryLower)) score += 25;

    if (score > 0) {
      results.set(product.id, { product, score });
    }
  });

  return Array.from(results.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.product);
}

export function getProductPrice(productId: string, storeId: 'walmart' | 'target' | 'marianos' | 'jewel' | 'butera' | 'caputos' | 'petes', locationId: string): StorePrice | null {
  return storePricing.find(price => 
    price.productId === productId && 
    price.storeId === storeId && 
    price.locationId === locationId
  ) || null;
}

export function getProductsByCategory(category: string): Product[] {
  return productCatalog.filter(product => 
    product.category.toLowerCase() === category.toLowerCase()
  );
}
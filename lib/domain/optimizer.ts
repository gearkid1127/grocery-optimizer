import type { OptimizationResult, StoreId, StoreQuote, LineItemMatch } from "./types";

export function optimize(quotes: StoreQuote[], maxStores: 1 | 2): OptimizationResult {
  if (quotes.length === 0) throw new Error("No quotes provided");

  // Filter stores that can actually fulfill the shopping list (no missing items)
  // A store can be "best single store" only if you can get everything there
  const viableStores = quotes.filter(quote => quote.missingCount === 0);
  
  let bestOneStore: StoreQuote | undefined;
  
  if (viableStores.length > 0) {
    // Best 1-store from viable stores: lowest subtotal; tie-breaker = fewer out-of-stock items
    const sortedViable = [...viableStores].sort((a, b) => {
      if (a.subtotal !== b.subtotal) return a.subtotal - b.subtotal;
      return a.outOfStockCount - b.outOfStockCount;
    });
    bestOneStore = sortedViable[0];
  } else {
    // No store can fulfill the entire list, so pick the one with least missing items
    // and lowest subtotal for what they do have
    const sorted = [...quotes].sort((a, b) => {
      if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
      return a.subtotal - b.subtotal;
    });
    bestOneStore = sorted[0];
  }

  if (maxStores === 1 || quotes.length < 2) {
    return { bestOneStore };
  }

  // Best 2-store combo: try all store pairs O(N^2 * M)
  let bestPair:
    | { stores: [StoreId, StoreId]; subtotal: number; picks: LineItemMatch[]; missingCount: number; usedBothStores: boolean }
    | undefined;

  for (let i = 0; i < quotes.length; i++) {
    for (let j = i + 1; j < quotes.length; j++) {
      const a = quotes[i];
      const b = quotes[j];

      const mapA = new Map(a.matches.map((m) => [m.itemId, m]));
      const mapB = new Map(b.matches.map((m) => [m.itemId, m]));

      const allItemIds = new Set<string>([...mapA.keys(), ...mapB.keys()]);

      const picks: LineItemMatch[] = [];
      let subtotal = 0;
      let missingCount = 0;
      let usedStoreA = false;
      let usedStoreB = false;

      for (const itemId of allItemIds) {
        const ma = mapA.get(itemId);
        const mb = mapB.get(itemId);

        const candidates = [ma, mb].filter(Boolean) as LineItemMatch[];

        // Prefer matched/substituted > out_of_stock > missing, then cheaper price
        candidates.sort((x, y) => {
          const rank = (m: LineItemMatch) =>
            m.status === "matched"
              ? 0
              : m.status === "substituted"
              ? 1
              : m.status === "out_of_stock"
              ? 2
              : 3;

          const rx = rank(x);
          const ry = rank(y);
          if (rx !== ry) return rx - ry;

          const px = x.lineTotal ?? Number.POSITIVE_INFINITY;
          const py = y.lineTotal ?? Number.POSITIVE_INFINITY;
          return px - py;
        });

        const chosen = candidates[0];
        picks.push(chosen);
        subtotal += chosen.lineTotal ?? 0;
        
        // Track which stores are being used
        if (chosen.storeId === a.storeId) usedStoreA = true;
        if (chosen.storeId === b.storeId) usedStoreB = true;
        
        // Count missing items in this combination
        if (chosen.status === "missing") {
          missingCount++;
        }
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const usedBothStores = usedStoreA && usedStoreB;

      // Only consider this a valid "two-store" solution if:
      // 1. It uses both stores OR it has fewer missing items than single store
      // 2. It's better than current best pair
      const isValidTwoStore = usedBothStores || (bestOneStore && missingCount < bestOneStore.missingCount);
      
      if (isValidTwoStore && (
          !bestPair || 
          missingCount < bestPair.missingCount || 
          (missingCount === bestPair.missingCount && subtotal < bestPair.subtotal) ||
          (missingCount === bestPair.missingCount && subtotal === bestPair.subtotal && usedBothStores && !bestPair.usedBothStores)
        )) {
        bestPair = { stores: [a.storeId, b.storeId], subtotal, picks, missingCount, usedBothStores };
      }
    }
  }

  // Only return two-store result if it's actually better than single store
  if (!bestPair || 
      (!bestPair.usedBothStores && bestPair.subtotal >= bestOneStore.subtotal)) {
    return { bestOneStore };
  }

  return {
    bestOneStore,
    bestPair: {
      stores: bestPair.stores,
      subtotal: bestPair.subtotal,
      picks: bestPair.picks,
      savingsVsBestOneStore: Math.round((bestOneStore.subtotal - bestPair.subtotal) * 100) / 100,
    },
  };
}

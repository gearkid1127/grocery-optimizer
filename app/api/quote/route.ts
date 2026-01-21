import { NextResponse } from "next/server";
import { z } from "zod";
import { HybridProvider } from "@/lib/providers/real/hybridProvider";
import { MockProvider } from "@/lib/providers/mock/mockProvider";
import { optimize } from "@/lib/domain/optimizer";
import type { StoreId } from "@/lib/domain/types";

const ItemSchema = z.object({
  id: z.string(),
  query: z.string().min(1),
  flexible: z.boolean(),
  brand: z.string().optional(),
  category: z.string().optional(),
  desiredSize: z
    .object({
      value: z.number(),
      unit: z.enum(["oz", "lb", "ct"]),
    })
    .optional(),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1),
  stores: z.array(z.enum(["walmart", "target", "marianos", "jewel", "butera", "caputos", "petes"])).min(1),
  storeLocations: z.object({
    walmart: z.string().optional(),
    target: z.string().optional(),
  }).optional(),
  maxStores: z.union([z.literal(1), z.literal(2)]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, stores, storeLocations, maxStores } = parsed.data;

    const quotes = await Promise.all(
      stores.map(async (storeId: StoreId) => {
        try {
          // Get the specific location ID for this store (only for supported stores)
          const locationId = storeLocations && (storeId === 'walmart' || storeId === 'target') 
            ? storeLocations[storeId] 
            : undefined;
          
          // Use hybrid provider for Walmart and Target (real API + mock fallback)
          // Use mock provider for other stores that don't have APIs yet
          if (storeId === "walmart" || storeId === "target") {
            const provider = new HybridProvider(storeId);
            return provider.quote(items, locationId);
          } else {
            const provider = new MockProvider(storeId);
            return provider.quote(items);
          }
        } catch (error) {
          console.error(`Error getting quote for ${storeId}:`, error);
          // Return empty quote on error
          return {
            storeId,
            subtotal: 0,
            matches: [],
            missingCount: items.length,
            outOfStockCount: 0,
            lastUpdatedISO: new Date().toISOString(),
          };
        }
      })
    );

    const result = optimize(quotes, maxStores);
    
    // Ensure result has all required fields
    const safeResult = {
      ...result,
      bestOneStore: result.bestOneStore ? {
        ...result.bestOneStore,
        subtotal: result.bestOneStore.subtotal ?? 0,
        missingCount: result.bestOneStore.missingCount ?? 0,
        outOfStockCount: result.bestOneStore.outOfStockCount ?? 0,
      } : undefined,
      bestPair: result.bestPair ? {
        ...result.bestPair,
        subtotal: result.bestPair.subtotal ?? 0,
        savingsVsBestOneStore: result.bestPair.savingsVsBestOneStore ?? 0,
      } : undefined,
    };

    return NextResponse.json({ quotes, result: safeResult });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

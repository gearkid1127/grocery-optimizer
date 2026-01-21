// Pete's Fresh Market API using comprehensive product database
import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getProductPrice } from '@/lib/data/productDatabase';import { Product } from "@/lib/data/productDatabase";
// Transform products from our database to Pete's format
function transformToPetesFormat(products: Product[], storeId?: string) {
  return products.map(product => {
    const pricing = getProductPrice(product.id, 'petes', storeId || 'petes-3401');
    
    return {
      itemId: pricing?.sku || `petes-${product.id}`,
      name: `${product.brand} ${product.name}`,
      salePrice: pricing?.price || product.basePrice * 0.98, // Aggressive neighborhood pricing
      thumbnailImage: `https://example.com/petes/${product.name.replace(/[^a-zA-Z0-9]/g, '-')}_placeholder.jpeg`,
      shortDescription: `${product.brand} ${product.name} - ${product.size.value}${product.size.unit}`,
      storeLocation: storeId,
      category: product.category,
      subcategory: product.subcategory,
      inStock: pricing?.inStock ?? true,
      brand: product.brand
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const storeId = searchParams.get('storeId');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Pete's Fresh Market search for: "${query}" at store: ${storeId || 'default'}`);

    // Use our comprehensive product database
    const products = searchProducts(query, 20);
    
    if (products.length === 0) {
      return NextResponse.json({
        items: [],
        message: 'No products found',
        totalResults: 0
      });
    }

    // Transform to Pete's format
    const petes_products = transformToPetesFormat(products, storeId || undefined);

    return NextResponse.json({
      items: petes_products,
      totalResults: petes_products.length,
      query: query,
      store: 'petes'
    });

  } catch (error: unknown) {
    console.error('Pete\'s Fresh Market API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search Pete\'s Fresh Market products',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
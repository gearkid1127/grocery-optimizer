// Caputo's Fresh Markets API using comprehensive product database
import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getProductPrice } from '@/lib/data/productDatabase';import { Product } from "@/lib/data/productDatabase";
// Transform products from our database to Caputo's format
function transformToCaputosFormat(products: Product[], storeId?: string) {
  return products.map(product => {
    const pricing = getProductPrice(product.id, 'caputos', storeId || 'caputos-3301');
    
    return {
      itemId: pricing?.sku || `caputos-${product.id}`,
      name: `${product.brand} ${product.name}`,
      salePrice: pricing?.price || product.basePrice * 1.02, // Very competitive Italian specialty market
      thumbnailImage: `https://example.com/caputos/${product.name.replace(/[^a-zA-Z0-9]/g, '-')}_placeholder.jpeg`,
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
    const storeIdParam = searchParams.get('storeId');
    const storeId = storeIdParam || undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Caputo's Fresh Markets search for: "${query}" at store: ${storeId || 'default'}`);

    // Use our comprehensive product database
    const products = searchProducts(query, 20);
    
    if (products.length === 0) {
      return NextResponse.json({
        items: [],
        message: 'No products found',
        totalResults: 0
      });
    }

    // Transform to Caputo's format
    const caputos_products = transformToCaputosFormat(products, storeId || undefined);

    return NextResponse.json({
      items: caputos_products,
      totalResults: caputos_products.length,
      query: query,
      store: 'caputos'
    });

  } catch (error: unknown) {
    console.error('Caputo\'s Fresh Markets API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search Caputo\'s Fresh Markets products',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
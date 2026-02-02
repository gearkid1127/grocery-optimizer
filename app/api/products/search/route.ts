// Generic product search API for building shopping lists
import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/data/productDatabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Generic product search for: "${query}"`);

    // Search our product database for generic suggestions
    const products = searchProducts(query, 20);
    console.log(`Found ${products.length} products`);
    
    return NextResponse.json({
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        size: product.size,
        keywords: product.keywords
      }))
    });

  } catch (error) {
    console.error('Generic product search error:', error);
    
    return NextResponse.json({
      error: 'Search temporarily unavailable',
      products: []
    }, { status: 500 });
  }
}
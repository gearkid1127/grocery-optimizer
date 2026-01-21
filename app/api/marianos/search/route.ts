// Mariano's API using comprehensive product database
import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getProductPrice } from '@/lib/data/productDatabase';import { Product } from "@/lib/data/productDatabase";
// Transform products from our database to Mariano's format
function transformToMarianosFormat(products: Product[], storeId?: string) {
  return products.map(product => {
    const pricing = getProductPrice(product.id, 'marianos', storeId || 'marianos-3001');
    
    return {
      itemId: pricing?.sku || `marianos-${product.id}`,
      name: `${product.brand} ${product.name}`,
      salePrice: pricing?.price || product.basePrice * 1.15, // Premium pricing
      thumbnailImage: `https://example.com/marianos/${product.name.replace(/[^a-zA-Z0-9]/g, '-')}_placeholder.jpeg`,
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

    console.log(`Mariano's search for: "${query}" at store: ${storeId || 'default'}`);

    // Use our comprehensive product database
    const products = searchProducts(query, 20);
    
    if (products.length === 0) {
      return NextResponse.json({
        items: [],
        message: 'No products found',
        totalResults: 0
      });
    }

    // Transform to Mariano's format
    const marianos_products = transformToMarianosFormat(products, storeId || undefined);

    return NextResponse.json({
      items: marianos_products,
      totalResults: marianos_products.length,
      query: query,
      store: 'marianos'
    });

  } catch (error: unknown) {
    console.error('Mariano\'s API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search Mariano\'s products',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
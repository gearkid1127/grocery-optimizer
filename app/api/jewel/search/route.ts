// Jewel-Osco API using comprehensive product database
import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getProductPrice } from '@/lib/data/productDatabase';import { Product } from "@/lib/data/productDatabase";
// Transform products from our database to Jewel format
function transformToJewelFormat(products: Product[], storeId?: string) {
  return products.map(product => {
    const pricing = getProductPrice(product.id, 'jewel', storeId || 'jewel-3101');
    
    return {
      itemId: pricing?.sku || `jewel-${product.id}`,
      name: `${product.brand} ${product.name}`,
      salePrice: pricing?.price || product.basePrice * 1.10, // Traditional grocery pricing
      thumbnailImage: `https://example.com/jewel/${product.name.replace(/[^a-zA-Z0-9]/g, '-')}_placeholder.jpeg`,
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

    console.log(`Jewel-Osco search for: "${query}" at store: ${storeId || 'default'}`);

    // Use our comprehensive product database
    const products = searchProducts(query, 20);
    
    if (products.length === 0) {
      return NextResponse.json({
        items: [],
        message: 'No products found',
        totalResults: 0
      });
    }

    // Transform to Jewel format
    const jewel_products = transformToJewelFormat(products, storeId || undefined);

    return NextResponse.json({
      items: jewel_products,
      totalResults: jewel_products.length,
      query: query,
      store: 'jewel'
    });

  } catch (error: unknown) {
    console.error('Jewel-Osco API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search Jewel-Osco products',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
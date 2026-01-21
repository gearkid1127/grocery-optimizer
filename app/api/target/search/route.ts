// Target API proxy using comprehensive product database
import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getProductPrice } from '@/lib/data/productDatabase';

// Transform products from our database to Target API format
function transformToTargetFormat(products: any[], storeId?: string) {
  return products.map(product => {
    const pricing = getProductPrice(product.id, 'target', storeId || 'target-1375');
    
    return {
      tcin: pricing?.sku || `target-${product.id}`,
      item: {
        product_description: {
          title: `${product.brand} ${product.name} - ${product.size.value}${product.size.unit}`
        },
        product_brand: {
          name: product.brand
        },
        product_classification: {
          product_type: product.category
        },
        price: {
          current_retail: pricing?.price || product.basePrice,
          formatted_current_price: `$${(pricing?.price || product.basePrice).toFixed(2)}`
        },
        inventories: [{
          availability: pricing?.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK'
        }]
      },
      storeLocation: storeId
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const storeIdParam = searchParams.get('storeId'); // Optional store location
    const storeId = storeIdParam || undefined; // Convert null to undefined

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Target search for: "${query}" at store: ${storeId || 'default'}`);

    // Target doesn't have a publicly available API like Walmart
    // So we use our comprehensive product database directly
    const products = searchProducts(query, 10);
    console.log(`Found ${products.length} products from database`);
    
    const targetProducts = transformToTargetFormat(products, storeId);
    
    return NextResponse.json({
      items: targetProducts,
      source: 'database'
    });

  } catch (error) {
    console.error('Target search error:', error);
    
    return NextResponse.json({
      error: 'Search temporarily unavailable',
      items: []
    }, { status: 500 });
  }
}
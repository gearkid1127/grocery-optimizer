// Walmart API proxy to handle CORS and API key management
import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getProductPrice } from '@/lib/data/productDatabase';

const WALMART_API_KEY = process.env.WALMART_API_KEY;
const WALMART_BASE_URL = 'https://api.walmart.com/v1';

// Transform products from our database to Walmart API format
function transformToWalmartFormat(products: any[], storeId?: string) {
  return products.map(product => {
    const pricing = getProductPrice(product.id, 'walmart', storeId || 'walmart-2844');
    
    return {
      itemId: pricing?.sku || `walmart-${product.id}`,
      name: `${product.brand} ${product.name}`,
      salePrice: pricing?.price || product.basePrice,
      thumbnailImage: `https://i5.walmartimages.com/seo/${product.name.replace(/[^a-zA-Z0-9]/g, '-')}_placeholder.jpeg`,
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
    const storeIdParam = searchParams.get('storeId'); // Optional store location
    const storeId = storeIdParam || undefined; // Convert null to undefined

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Walmart search for: "${query}" at store: ${storeId || 'default'}`);

    // Try real Walmart API first if API key is available
    if (WALMART_API_KEY) {
      try {
        let searchUrl = `${WALMART_BASE_URL}/search?query=${encodeURIComponent(query)}`;
        
        if (storeId) {
          searchUrl += `&store=${encodeURIComponent(storeId)}`;
        }
        
        const response = await fetch(searchUrl, {
          headers: {
            'WM_SVC.NAME': 'Walmart Open API',
            'WM_CONSUMER.ID': WALMART_API_KEY,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.items?.length > 0) {
            console.log(`Found ${data.items.length} products from Walmart API`);
            return NextResponse.json(data);
          }
        }
      } catch (error) {
        console.warn('Walmart API failed, falling back to database:', error);
      }
    }

    // Use comprehensive product database
    const products = searchProducts(query, 10);
    console.log(`Found ${products.length} products from database`);
    
    const walmartProducts = transformToWalmartFormat(products, storeId);
    
    return NextResponse.json({
      items: walmartProducts,
      source: 'database'
    });

  } catch (error) {
    console.error('Walmart search error:', error);
    
    return NextResponse.json({
      error: 'Search temporarily unavailable',
      items: []
    }, { status: 500 });
  }
}
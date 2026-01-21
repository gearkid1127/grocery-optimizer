// AI-powered search suggestions API
import { NextRequest, NextResponse } from 'next/server';

interface SuggestionRequest {
  query: string;
}

interface AISuggestion {
  query: string;
  confidence: number;
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query }: SuggestionRequest = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Generate AI-powered suggestions
    const suggestions = await generateAISuggestions(query.trim());
    
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('AI suggestions error:', error);
    return NextResponse.json([]);
  }
}

async function generateAISuggestions(query: string): Promise<AISuggestion[]> {
  // For now, implement rule-based AI suggestions
  // In production, you could integrate with OpenAI, Claude, or other AI services
  
  const suggestions: AISuggestion[] = [];
  const lowerQuery = query.toLowerCase();

  // Brand suggestions
  const brandSuggestions = getBrandSuggestions(lowerQuery);
  suggestions.push(...brandSuggestions);

  // Category expansions
  const categorySuggestions = getCategorySuggestions(lowerQuery);
  suggestions.push(...categorySuggestions);

  // Common variations
  const variationSuggestions = getVariationSuggestions(lowerQuery);
  suggestions.push(...variationSuggestions);

  // Health/dietary alternatives
  const healthSuggestions = getHealthAlternatives(lowerQuery);
  suggestions.push(...healthSuggestions);

  // Sort by confidence and return top 5
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

function getBrandSuggestions(query: string): AISuggestion[] {
  const brandMap: Record<string, string[]> = {
    'milk': ['Horizon Organic', 'Fairlife', 'Great Value', 'Lactaid'],
    'peanut butter': ['Skippy', 'Jif', 'Adams', 'Great Value'],
    'cereal': ['Cheerios', 'Lucky Charms', 'Frosted Flakes', 'Honey Nut Cheerios'],
    'yogurt': ['Chobani', 'Dannon', 'Yoplait', 'Greek Gods'],
    'bread': ['Wonder', 'Pepperidge Farm', 'Daves Killer Bread', 'Great Value'],
    'eggs': ['Egglands Best', 'Great Value', 'Organic Valley', 'Cage Free'],
  };

  const suggestions: AISuggestion[] = [];
  
  for (const [category, brands] of Object.entries(brandMap)) {
    if (query.includes(category)) {
      brands.forEach(brand => {
        suggestions.push({
          query: `${brand} ${category}`,
          confidence: 0.8,
          reasoning: `Popular brand suggestion for ${category}`,
        });
      });
    }
  }

  return suggestions;
}

function getCategorySuggestions(query: string): AISuggestion[] {
  const categoryMap: Record<string, string[]> = {
    'organic': ['organic milk', 'organic eggs', 'organic apples', 'organic spinach'],
    'gluten free': ['gluten free bread', 'gluten free pasta', 'gluten free cookies'],
    'fresh': ['fresh berries', 'fresh herbs', 'fresh salmon'],
    'frozen': ['frozen vegetables', 'frozen fruit', 'frozen pizza'],
  };

  const suggestions: AISuggestion[] = [];

  for (const [modifier, items] of Object.entries(categoryMap)) {
    if (query.includes(modifier)) {
      items.forEach(item => {
        if (!query.includes(item)) {
          suggestions.push({
            query: item,
            confidence: 0.7,
            reasoning: `${modifier} category suggestion`,
          });
        }
      });
    }
  }

  return suggestions;
}

function getVariationSuggestions(query: string): AISuggestion[] {
  const variations: Record<string, string[]> = {
    'milk': ['whole milk', '2% milk', 'skim milk', 'oat milk', 'almond milk'],
    'apple': ['red apples', 'green apples', 'honeycrisp apples', 'granny smith apples'],
    'chicken': ['chicken breast', 'chicken thighs', 'rotisserie chicken'],
    'pasta': ['spaghetti', 'penne', 'linguine', 'whole wheat pasta'],
    'rice': ['brown rice', 'white rice', 'jasmine rice', 'wild rice'],
  };

  const suggestions: AISuggestion[] = [];

  for (const [base, vars] of Object.entries(variations)) {
    if (query.includes(base) && query !== base) {
      vars.forEach(variation => {
        if (!query.includes(variation)) {
          suggestions.push({
            query: variation,
            confidence: 0.6,
            reasoning: `Common variation of ${base}`,
          });
        }
      });
    }
  }

  return suggestions;
}

function getHealthAlternatives(query: string): AISuggestion[] {
  const healthMap: Record<string, Array<{ alt: string; reason: string }>> = {
    'white bread': [
      { alt: 'whole wheat bread', reason: 'Higher fiber and nutrients' },
      { alt: 'multigrain bread', reason: 'More complex carbohydrates' },
    ],
    'regular pasta': [
      { alt: 'whole wheat pasta', reason: 'Higher fiber content' },
      { alt: 'chickpea pasta', reason: 'Higher protein, gluten-free' },
    ],
    'soda': [
      { alt: 'sparkling water', reason: 'No added sugars' },
      { alt: 'kombucha', reason: 'Probiotics and less sugar' },
    ],
    'white rice': [
      { alt: 'brown rice', reason: 'More fiber and nutrients' },
      { alt: 'quinoa', reason: 'Complete protein source' },
    ],
  };

  const suggestions: AISuggestion[] = [];

  for (const [unhealthy, alternatives] of Object.entries(healthMap)) {
    if (query.includes(unhealthy)) {
      alternatives.forEach(({ alt, reason }) => {
        suggestions.push({
          query: alt,
          confidence: 0.5,
          reasoning: `Healthier alternative: ${reason}`,
        });
      });
    }
  }

  return suggestions;
}
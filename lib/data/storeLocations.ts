// Store location data for Walmart and Target locations
export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface StoreLocationsByChain {
  walmart: StoreLocation[];
  target: StoreLocation[];
  marianos: StoreLocation[];
  jewel: StoreLocation[];
  butera: StoreLocation[];
  caputos: StoreLocation[];
  petes: StoreLocation[];
}

// Sample store locations - in a real app, these would come from APIs
export const storeLocations: StoreLocationsByChain = {
  walmart: [
    {
      id: "walmart-2844",
      name: "Walmart Supercenter #2844",
      address: "7535 W North Ave",
      city: "Elmwood Park",
      state: "IL",
      zipCode: "60707",
      coordinates: { lat: 41.9094, lng: -87.8081 }
    },
    {
      id: "walmart-3420",
      name: "Walmart Supercenter #3420", 
      address: "4650 W North Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60639",
      coordinates: { lat: 41.9101, lng: -87.7425 }
    },
    {
      id: "walmart-5260",
      name: "Walmart Supercenter #5260",
      address: "8555 Golf Rd",
      city: "Niles",
      state: "IL", 
      zipCode: "60714",
      coordinates: { lat: 42.0364, lng: -87.8356 }
    },
    {
      id: "walmart-1339",
      name: "Walmart Supercenter #1339",
      address: "2500 W 95th St",
      city: "Evergreen Park",
      state: "IL",
      zipCode: "60805",
      coordinates: { lat: 41.7209, lng: -87.6936 }
    },
    {
      id: "walmart-4675",
      name: "Walmart Supercenter #4675",
      address: "1399 S Cannon Dr",
      city: "Palatine",
      state: "IL",
      zipCode: "60067",
      coordinates: { lat: 42.1103, lng: -88.0334 }
    }
  ],
  target: [
    {
      id: "target-1375",
      name: "Target T-1375",
      address: "2112 N Clybourn Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60614",
      coordinates: { lat: 41.9200, lng: -87.6650 }
    },
    {
      id: "target-2797", 
      name: "Target T-2797",
      address: "4466 W North Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60639",
      coordinates: { lat: 41.9101, lng: -87.7400 }
    },
    {
      id: "target-2863",
      name: "Target T-2863", 
      address: "2209 Howard St",
      city: "Evanston",
      state: "IL",
      zipCode: "60202",
      coordinates: { lat: 42.0450, lng: -87.6889 }
    },
    {
      id: "target-2767",
      name: "Target T-2767",
      address: "1816 W 95th St",
      city: "Chicago",
      state: "IL",
      zipCode: "60643",
      coordinates: { lat: 41.7209, lng: -87.6750 }
    },
    {
      id: "target-1832",
      name: "Target T-1832",
      address: "1500 S Kingery Hwy",
      city: "Willowbrook",
      state: "IL",
      zipCode: "60527",
      coordinates: { lat: 41.7700, lng: -87.9400 }
    }
  ],
  marianos: [
    {
      id: "marianos-3001",
      name: "Mariano's Fresh Market",
      address: "40 S Halsted St",
      city: "Chicago",
      state: "IL",
      zipCode: "60661",
      coordinates: { lat: 41.8817, lng: -87.6467 }
    },
    {
      id: "marianos-3002", 
      name: "Mariano's Fresh Market",
      address: "1615 N Wells St",
      city: "Chicago",
      state: "IL",
      zipCode: "60614",
      coordinates: { lat: 41.9120, lng: -87.6344 }
    },
    {
      id: "marianos-3003",
      name: "Mariano's Fresh Market", 
      address: "550 W Washington Blvd",
      city: "Chicago",
      state: "IL",
      zipCode: "60661",
      coordinates: { lat: 41.8836, lng: -87.6420 }
    },
    {
      id: "marianos-3004",
      name: "Mariano's Fresh Market",
      address: "2112 W Peterson Ave", 
      city: "Chicago",
      state: "IL",
      zipCode: "60659",
      coordinates: { lat: 41.9911, lng: -87.6833 }
    }
  ],
  jewel: [
    {
      id: "jewel-3101",
      name: "Jewel-Osco", 
      address: "1340 S Canal St",
      city: "Chicago",
      state: "IL",
      zipCode: "60607",
      coordinates: { lat: 41.8656, lng: -87.6397 }
    },
    {
      id: "jewel-3102",
      name: "Jewel-Osco",
      address: "3531 N Broadway",
      city: "Chicago", 
      state: "IL",
      zipCode: "60657",
      coordinates: { lat: 41.9475, lng: -87.6445 }
    },
    {
      id: "jewel-3103",
      name: "Jewel-Osco",
      address: "2940 N Ashland Ave",
      city: "Chicago",
      state: "IL", 
      zipCode: "60657",
      coordinates: { lat: 41.9344, lng: -87.6678 }
    },
    {
      id: "jewel-3104",
      name: "Jewel-Osco",
      address: "1224 S Wabash Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60605",
      coordinates: { lat: 41.8686, lng: -87.6256 }
    }
  ],
  butera: [
    {
      id: "butera-3201", 
      name: "Butera Market",
      address: "2929 N Harlem Ave",
      city: "Chicago",
      state: "IL", 
      zipCode: "60634",
      coordinates: { lat: 41.9356, lng: -87.8067 }
    },
    {
      id: "butera-3202",
      name: "Butera Market",
      address: "8015 W Grand Ave",
      city: "Elmwood Park",
      state: "IL",
      zipCode: "60707", 
      coordinates: { lat: 41.9139, lng: -87.8089 }
    },
    {
      id: "butera-3203",
      name: "Butera Market", 
      address: "2040 N Cicero Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60639",
      coordinates: { lat: 41.9189, lng: -87.7456 }
    }
  ],
  caputos: [
    {
      id: "caputos-3301",
      name: "Caputo's Fresh Markets",
      address: "2560 N Harlem Ave",
      city: "Elmwood Park", 
      state: "IL",
      zipCode: "60707",
      coordinates: { lat: 41.9278, lng: -87.8067 }
    },
    {
      id: "caputos-3302", 
      name: "Caputo's Fresh Markets",
      address: "1931 N Clybourn Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60614",
      coordinates: { lat: 41.9167, lng: -87.6650 }
    },
    {
      id: "caputos-3303",
      name: "Caputo's Fresh Markets",
      address: "14044 S Western Ave",
      city: "Blue Island",
      state: "IL", 
      zipCode: "60406",
      coordinates: { lat: 41.6400, lng: -87.6800 }
    }
  ],
  petes: [
    {
      id: "petes-3401",
      name: "Pete's Fresh Market",
      address: "4747 W North Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60639",
      coordinates: { lat: 41.9101, lng: -87.7444 }
    },
    {
      id: "petes-3402", 
      name: "Pete's Fresh Market", 
      address: "3827 W Lawrence Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60625",
      coordinates: { lat: 41.9689, lng: -87.7244 }
    },
    {
      id: "petes-3403",
      name: "Pete's Fresh Market",
      address: "1555 N Ashland Ave", 
      city: "Chicago",
      state: "IL",
      zipCode: "60622",
      coordinates: { lat: 41.9067, lng: -87.6678 }
    },
    {
      id: "petes-3404",
      name: "Pete's Fresh Market",
      address: "659 W 18th St",
      city: "Chicago",
      state: "IL",
      zipCode: "60616",
      coordinates: { lat: 41.8578, lng: -87.6433 }
    }
  ]
};

// Helper functions
export function getStoreLocationById(storeType: keyof StoreLocationsByChain, storeId: string): StoreLocation | undefined {
  return storeLocations[storeType].find(store => store.id === storeId);
}

export function getStoreDisplayName(storeType: keyof StoreLocationsByChain, storeId: string): string {
  const store = getStoreLocationById(storeType, storeId);
  return store ? `${store.name} - ${store.city}, ${store.state}` : storeId;
}
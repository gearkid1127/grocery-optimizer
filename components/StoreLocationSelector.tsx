"use client";

import { useState } from "react";
import { storeLocations, getStoreDisplayName, StoreLocation } from "@/lib/data/storeLocations";

interface StoreLocationSelectorProps {
  storeType: 'walmart' | 'target' | 'marianos' | 'jewel' | 'butera' | 'caputos' | 'petes';
  selectedLocationId: string;
  onLocationChange: (locationId: string) => void;
  disabled?: boolean;
}

export function StoreLocationSelector({ 
  storeType, 
  selectedLocationId, 
  onLocationChange, 
  disabled = false 
}: StoreLocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const stores = storeLocations[storeType];
  const selectedStore = stores.find(store => store.id === selectedLocationId);
  
  const storeConfig = {
    walmart: { name: 'Walmart', color: 'blue' },
    target: { name: 'Target', color: 'red' },
    marianos: { name: "Mariano's", color: 'green' },
    jewel: { name: 'Jewel-Osco', color: 'amber' },
    butera: { name: 'Butera Market', color: 'purple' },
    caputos: { name: "Caputo's Fresh Markets", color: 'emerald' },
    petes: { name: "Pete's Fresh Market", color: 'indigo' }
  };
  
  const storeDisplayName = storeConfig[storeType].name;
  const storeColor = storeConfig[storeType].color;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {storeDisplayName} Location
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full text-left px-4 py-3 border border-slate-300 rounded-xl bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-${storeColor}-500 focus:border-transparent transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">
                {selectedStore?.name || 'Select a location'}
              </div>
              {selectedStore && (
                <div className="text-sm text-slate-500 mt-1">
                  {selectedStore.address}, {selectedStore.city}, {selectedStore.state} {selectedStore.zipCode}
                </div>
              )}
            </div>
            <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => {
                  onLocationChange(store.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-${storeColor}-50 focus:bg-${storeColor}-50 focus:outline-none transition-colors ${
                  selectedLocationId === store.id ? `bg-${storeColor}-100` : ''
                }`}
              >
                <div className="font-medium text-slate-900">{store.name}</div>
                <div className="text-sm text-slate-500 mt-1">
                  {store.address}, {store.city}, {store.state} {store.zipCode}
                </div>
                {store.coordinates && (
                  <div className="text-xs text-slate-400 mt-1">
                    Lat: {store.coordinates.lat.toFixed(4)}, Lng: {store.coordinates.lng.toFixed(4)}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
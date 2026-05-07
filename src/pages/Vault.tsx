import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { assetService } from '../services/assetService';
import { AssetCard } from '../components/assets/AssetCard';
import { Search, SlidersHorizontal, QrCode } from 'lucide-react';
import { CATEGORIES, Asset } from '../types';
import { cn } from '../lib/utils';
import { QRScanner } from '../components/assets/QRScanner';
import { AnimatePresence } from 'motion/react';

export function Vault() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!user) return;
    return assetService.subscribeToUserAssets(user.uid, setAssets);
  }, [user]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                            asset.estimatedBrand?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory ? asset.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [assets, search, selectedCategory]);

  return (
    <div className="flex flex-col gap-8 pb-32 pt-12 px-6 max-w-lg mx-auto">
      <header className="px-1 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white italic">Vault</h1>
          <p className="text-[#8e8e93] text-sm font-medium mt-1">Catalog and protect your assets.</p>
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="w-12 h-12 rounded-2xl bg-[#1c1c1e] border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-white/5"
        >
          <QrCode size={20} />
        </button>
      </header>

      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93]" size={16} />
          <input 
            type="text"
            placeholder="Search assets"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1c1c1e] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-[#48484a] text-white"
          />
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none flex-nowrap -mx-6 px-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
              selectedCategory === null 
                ? "bg-white border-white text-black" 
                : "bg-transparent border-white/10 text-[#8e8e93] hover:text-white"
            )}
          >
            All Items
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                selectedCategory === cat 
                  ? "bg-white border-white text-black" 
                  : "bg-transparent border-white/10 text-[#8e8e93] hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredAssets.map((asset, i) => (
          <AssetCard key={asset.id} asset={asset} index={i} />
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-[#48484a] gap-4">
          <p className="text-sm font-bold uppercase tracking-widest">No Items Found</p>
          <button 
            onClick={() => { setSearch(''); setSelectedCategory(null); }} 
            className="text-white text-xs font-bold underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* QR Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assetService } from '../services/assetService';
import { Asset } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AssetCard } from '../components/assets/AssetCard';
import { WarrantyNotifications } from '../components/dashboard/WarrantyNotifications';
import { AssistantBubble } from '../components/dashboard/AssistantBubble';
import { formatCurrency } from '../lib/utils';
import { Shield, ArrowRight, Zap, History, Box, TrendingDown, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRScanner } from '../components/assets/QRScanner';

export function Dashboard() {
  const { user, profile } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    return assetService.subscribeToUserAssets(user.uid, setAssets);
  }, [user]);

  const purchaseTotal = assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0);
  const currentTotal = assets.reduce((sum, asset) => sum + (asset.marketValue || asset.purchasePrice || 0), 0);
  const recentAssets = assets.slice(0, 3);
  
  const totalLoss = purchaseTotal - currentTotal;
  const lossPercent = purchaseTotal > 0 ? (totalLoss / purchaseTotal) * 100 : 0;

  return (
    <div className="flex flex-col gap-10 pb-32 pt-12 px-6 max-w-lg mx-auto">
      {/* Header Stat */}
      <section className="mt-8 flex flex-col gap-1 relative">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#8e8e93] text-xs font-bold uppercase tracking-[0.1em]">Estate Market Value</h2>
            <div className="flex items-baseline gap-2">
              <h1 className="text-5xl font-bold tracking-tight text-white">
                {formatCurrency(currentTotal).split('.')[0]}
                <span className="text-xl text-[#48484a]">.{formatCurrency(currentTotal).split('.')[1] || '00'}</span>
              </h1>
            </div>
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="w-12 h-12 rounded-2xl bg-[#1c1c1e] border border-white/5 flex items-center justify-center text-white active:scale-95 transition-all hover:bg-white/5"
          >
            <QrCode size={20} />
          </button>
        </div>
        {totalLoss > 0 && (
          <div className="flex items-center gap-1.5 text-red-500/80 text-[10px] font-bold uppercase tracking-widest mt-1">
            <TrendingDown size={12} />
            <span>-{formatCurrency(totalLoss)} Depreciation ({lossPercent.toFixed(0)}%)</span>
          </div>
        )}
      </section>

      {/* Grid Headers & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1c1c1e] p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-32 relative overflow-hidden group">
          {profile?.isPro && (
            <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/20 blur-xl group-hover:bg-indigo-500/40 transition-all" />
          )}
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white relative z-10">
            <Shield size={16} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <p className="text-[#8e8e93] text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Protection</p>
               {profile?.isPro && (
                 <span className="text-[8px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Pro</span>
               )}
            </div>
            <p className="text-white font-bold text-lg leading-tight mt-1">Active</p>
          </div>
        </div>
        <div className="bg-[#1c1c1e] p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-32">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white">
            <Box size={16} />
          </div>
          <div>
            <p className="text-[#8e8e93] text-[10px] font-bold uppercase tracking-widest">Inventory</p>
            <p className="text-white font-bold text-lg leading-tight mt-1">{assets.length} items</p>
          </div>
        </div>
      </div>

      {/* Warranty Reminders */}
      <WarrantyNotifications assets={assets} profile={profile} />

      {/* Main Action if no assets */}
      {assets.length === 0 && (
        <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
            <Shield className="text-white opacity-20" size={40} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-bold text-lg text-white">Secure your items</p>
            <p className="text-sm text-[#8e8e93] leading-relaxed px-4">Magic Scan identifies your assets and secures them in your private vault.</p>
          </div>
          <button 
            onClick={() => navigate('/scan')}
            className="bg-white text-black font-bold h-12 px-8 rounded-full text-sm active:scale-95 transition-transform"
          >
            Start Magic Scan
          </button>
        </div>
      )}

      {/* Recent Activity */}
      {assets.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest opacity-60">Recent Assets</h2>
            <button 
              onClick={() => navigate('/vault')} 
              className="text-xs font-bold text-white/40 hover:text-white transition-colors"
            >
              See all
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {recentAssets.map((asset, i) => (
                <AssetCard key={asset.id} asset={asset} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Vault AI Chatbot */}
      <AssistantBubble assets={assets} />

      {/* QR Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

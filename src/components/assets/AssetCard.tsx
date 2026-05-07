import React from 'react';
import { motion } from 'motion/react';
import { Asset } from '../../types';
import { formatCurrency, getDaysRemaining } from '../../lib/utils';
import { ShieldCheck, Calendar, Briefcase, ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface AssetCardProps {
  asset: Asset;
  index: number;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, index }) => {
  const navigate = useNavigate();
  const daysLeft = getDaysRemaining(asset.warrantyExpiry || null);
  const isLent = asset.lendingStatus?.isLent;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={() => navigate(`/asset/${asset.id}`)}
      className="card-apple p-4 flex items-center gap-4 group cursor-pointer active:scale-95 transition-all overflow-hidden relative"
    >
      {isLent && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
          Lent
        </div>
      )}
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
        {asset.imageUrl ? (
          <img 
            src={asset.imageUrl} 
            alt={asset.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Briefcase className="text-slate-600 w-6 h-6" />
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-white leading-tight truncate text-sm">{asset.name}</h3>
          <span className="text-white font-bold text-sm flex-shrink-0">
            {formatCurrency(asset.marketValue || asset.purchasePrice)}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-[#8e8e93] text-[11px] font-medium truncate uppercase tracking-tighter">
            {asset.estimatedBrand || asset.category}
          </p>
          
          {daysLeft !== null ? (
            <div className={cn(
              "text-[10px] flex items-center gap-1 font-bold",
              daysLeft > 0 ? "text-amber-500" : "text-red-500"
            )}>
              <span>{daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}</span>
            </div>
          ) : (
            <span className="text-[10px] text-[#48484a] font-bold">Secured</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

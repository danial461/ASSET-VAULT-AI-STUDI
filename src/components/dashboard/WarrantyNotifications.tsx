import React from 'react';
import { Asset, UserProfile } from '../../types';
import { getDaysRemaining, cn } from '../../lib/utils';
import { Bell, AlertTriangle, ChevronRight, Inbox } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface WarrantyNotificationsProps {
  assets: Asset[];
  profile: UserProfile | null;
}

export function WarrantyNotifications({ assets, profile }: WarrantyNotificationsProps) {
  const navigate = useNavigate();
  
  if (!profile?.notificationsEnabled) return null;

  const threshold = profile.reminderDaysBefore || 30;
  
  const expiringAssets = assets.filter(asset => {
    if (!asset.warrantyExpiry) return false;
    const daysLeft = getDaysRemaining(asset.warrantyExpiry);
    return daysLeft !== null && daysLeft <= threshold && daysLeft > 0;
  }).sort((a, b) => {
    const d1 = getDaysRemaining(a.warrantyExpiry!);
    const d2 = getDaysRemaining(b.warrantyExpiry!);
    return (d1 || 0) - (d2 || 0);
  });

  if (expiringAssets.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Bell size={12} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Alerts</h3>
        </div>
        <span className="text-[9px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase">
          {expiringAssets.length} Critical
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {expiringAssets.slice(0, 3).map((asset, i) => {
          const daysLeft = getDaysRemaining(asset.warrantyExpiry!);
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/asset/${asset.id}`)}
              className="group glass p-4 rounded-2xl flex items-center justify-between border-l-4 border-amber-500/50 cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Box className="text-slate-700" size={20} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <p className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors capitalize">{asset.name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Expires in {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
            </motion.div>
          );
        })}
        {expiringAssets.length > 3 && (
          <button 
            onClick={() => navigate('/vault')}
            className="text-[10px] text-center font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 py-2"
          >
            + {expiringAssets.length - 3} more in vault
          </button>
        )}
      </div>
    </section>
  );
}

import { Box } from 'lucide-react';

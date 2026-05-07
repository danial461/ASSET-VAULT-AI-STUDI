import { useAuth } from '../context/AuthContext';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { assetService } from '../services/assetService';
import { Asset } from '../types';
import { generateInsuranceReport } from '../services/pdfService';
import { useState, useEffect } from 'react';
import { LogOut, ShieldAlert, FileText, Zap, ChevronRight, User, ExternalLink, Github, Bell, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { handleUpgrade } from '../lib/stripe';

export function Settings() {
  const { user, profile } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    return assetService.subscribeToUserAssets(user.uid, setAssets);
  }, [user]);

  const handleLogout = () => auth.signOut();

  const handleGenerateReport = async () => {
    if (!profile?.isPro) {
      alert("Insurance Reports are a Pro feature. Please upgrade to continue.");
      return;
    }
    setGenerating(true);
    try {
      await generateInsuranceReport(assets, profile?.email || 'User');
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const onUpgrade = () => {
    if (!user || !profile) return;
    handleUpgrade(user.uid, profile.email);
  };

  return (
    <div className="flex flex-col gap-10 pb-32 pt-12 px-6 max-w-lg mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-[#8e8e93] text-sm font-medium mt-1">Manage your account and preferences.</p>
      </header>

      {/* Profile Card */}
      <div className="bg-[#1c1c1e] rounded-3xl p-6 border border-white/5 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black font-bold text-xl uppercase">
            {profile?.email?.[0] || <User />}
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-white leading-tight">{profile?.email}</p>
            <p className="text-[#8e8e93] text-xs font-medium mt-0.5">{profile?.isPro ? 'Pro Subscription' : 'Standard Account'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
           <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-1 border border-white/5">
             <span className="text-[10px] text-[#8e8e93] uppercase font-bold tracking-widest">Inventory</span>
             <p className="font-bold text-xl text-white">{assets.length}</p>
           </div>
           <div className="bg-white/5 rounded-2xl p-4 flex flex-col gap-1 border border-white/5">
             <span className="text-[10px] text-[#8e8e93] uppercase font-bold tracking-widest">Estate Value</span>
             <p className="font-bold text-xl text-white">{formatCurrency(assets.reduce((s, a) => s + (a.purchasePrice || 0), 0)).split('.')[0]}</p>
           </div>
        </div>
      </div>

      {/* Insurance Panic Button */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest px-1">Panic & Security</h3>
        <button 
          onClick={handleGenerateReport}
          disabled={generating}
          className="w-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/5 text-white rounded-3xl p-5 flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert size={24} />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-md">Insurance Manifest</span>
              <span className="text-xs text-[#8e8e93]">Generate full asset report</span>
            </div>
          </div>
          {generating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight size={20} className="text-[#8e8e93]" />}
        </button>
      </section>

      {/* Notifications */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest px-1">Reminders</h3>
        <div className="bg-[#1c1c1e] border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Bell size={20} />
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-white leading-tight">Warranty Alerts</p>
                <p className="text-xs text-[#8e8e93] mt-0.5">Upcoming expirations</p>
              </div>
            </div>
            <button 
              onClick={() => updateDoc(doc(db, 'users', user?.uid!), { notificationsEnabled: !profile?.notificationsEnabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative flex items-center px-1 shadow-inner",
                profile?.notificationsEnabled ? "bg-[#34c759]" : "bg-[#3a3a3c]"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white transition-all shadow-md",
                profile?.notificationsEnabled ? "ml-6" : "ml-0"
              )} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Clock size={20} />
              </div>
              <div className="flex flex-col">
                <p className="font-bold text-white leading-tight">Alert Period</p>
                <p className="text-xs text-[#8e8e93] mt-0.5">Days before expiry</p>
              </div>
            </div>
            <select 
              value={profile?.reminderDaysBefore || 30}
              onChange={(e) => updateDoc(doc(db, 'users', user?.uid!), { reminderDaysBefore: parseInt(e.target.value) })}
              className="bg-[#2c2c2e] border-none rounded-xl px-4 py-2 text-xs font-bold text-white outline-none appearance-none"
            >
              {[7, 14, 30, 60, 90].map(days => (
                <option key={days} value={days}>{days} Days</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Subscriptions */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest px-1">Plan</h3>
        <div className="bg-[#1c1c1e] border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Zap className={profile?.isPro ? "text-indigo-400" : "text-[#48484a]"} size={28} />
              <p className="font-bold text-xl text-white italic">AssetVault Pro</p>
            </div>
            
            <ul className="flex flex-col gap-3">
              {['Unlimited Items Vault', 'Insurance-ready Exports', 'Smart Receipt Analysis', 'Cloud Warranty Archive'].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium text-[#8e8e93]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  {f}
                </li>
              ))}
            </ul>

            <button 
              onClick={onUpgrade}
              className="w-full bg-white text-black font-bold h-14 rounded-2xl active:scale-[0.97] transition-all mt-2 text-sm"
            >
              {profile?.isPro ? 'Manage Subscription' : 'Upgrade for $19.00'}
            </button>
          </div>
        </div>
      </section>

      {/* Support & Logout */}
      <footer className="mt-6 flex flex-col gap-4">
        <button 
          onClick={handleLogout}
          className="w-full h-14 bg-[#1c1c1e] border border-white/5 rounded-2xl flex items-center justify-center gap-2 text-red-500 font-bold active:scale-[0.97] transition-all text-sm"
        >
          <LogOut size={18} />
          Sign Out
        </button>
        <p className="text-[10px] text-center text-[#48484a] font-bold uppercase tracking-[0.2em]">AssetVault AI • Ver 1.2.0 • Apple Inspired</p>
      </footer>
    </div>
  );
}

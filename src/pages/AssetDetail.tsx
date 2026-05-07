import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { assetService } from '../services/assetService';
import { revaluateAsset, geminiService } from '../services/geminiService';
import { Asset, LendingHistory, ServiceRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Calendar, 
  ShieldCheck, 
  ExternalLink, 
  MoreHorizontal, 
  Trash2,
  Package,
  FileText,
  Search,
  TrendingDown,
  RefreshCw,
  Sparkles,
  HandHelping,
  QrCode,
  User,
  Clock,
  ArrowRightCircle,
  X,
  Upload,
  Loader2,
  CheckCircle,
  Wrench,
  ChevronRight,
  Plus,
  DollarSign,
  Copy,
  Check
} from 'lucide-react';
import { formatCurrency, getDaysRemaining, cn } from '../lib/utils';
import { lendingService } from '../services/lendingService';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { toast } from 'sonner';

export function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [revaluating, setRevaluating] = useState(false);
  const [showLendModal, setShowLendModal] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lendingHistory, setLendingHistory] = useState<LendingHistory[]>([]);
  const [editedSerial, setEditedSerial] = useState('');
  const [updatingSerial, setUpdatingSerial] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchingAdvice, setFetchingAdvice] = useState(false);
  const [showResellModal, setShowResellModal] = useState(false);
  const [resellListing, setResellListing] = useState<any>(null);
  const [generatingResell, setGeneratingResell] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceDesc, setServiceDesc] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLent = asset?.lendingStatus?.isLent;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Limit size to ~800KB since Firestore has 1MB limit for entire doc
    if (file.size > 800 * 1024) {
      toast.error('Image is too large. Cloud documents are limited to 800KB.');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64String = event.target?.result as string;
        await assetService.updateAsset(id, {
          imageUrl: base64String
        });
        toast.success('Visual ID updated');
      } catch (err) {
        console.error("Failed to upload image", err);
        toast.error('Failed to update image');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'assets', id), (snap) => {
      if (snap.exists()) {
        const data = { ...snap.data(), id: snap.id } as Asset;
        setAsset(data);
        setEditedSerial(data.serialNumber || '');
      }
      setLoading(false);
    });
    
    // Fetch Lending History
    const fetchHistory = async () => {
      if (!user) return;
      const history = await lendingService.getLendingHistory(user.uid, id!);
      setLendingHistory(history);
    };
    fetchHistory();
    
    return () => unsub();
  }, [id, isLent]); // Refresh history when lending status changes

  const handleDelete = async () => {
    if (!asset || !id) return;
    await assetService.deleteAsset(id);
    navigate(-1);
  };

  const handleManualSearch = () => {
    if (!asset) return;
    const query = `${asset.name} ${asset.estimatedBrand || ''} manual pdf`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const handleUpdateSerial = async () => {
    if (!id || !asset) return;
    setUpdatingSerial(true);
    try {
      await assetService.updateAsset(id, {
        serialNumber: editedSerial
      });
      toast.success('Serial number registered');
    } catch (err) {
      console.error("Failed to update serial number", err);
    } finally {
      setUpdatingSerial(false);
    }
  };

  const handleRevaluate = async () => {
    if (!asset || !id) return;
    setRevaluating(true);
    const idToast = toast.loading('Consulting global indices...');
    try {
      const result = await revaluateAsset(
        asset.name, 
        asset.category, 
        asset.purchasePrice || 0, 
        asset.purchaseDate || new Date().toISOString()
      );
      await assetService.updateAsset(id, {
        marketValue: result.marketValue,
        depreciationRate: result.depreciationRate,
        lastValuationDate: new Date().toISOString()
      });
      toast.success('Market value updated', { id: idToast });
    } catch (err) {
      console.error(err);
      toast.error('Valuation failed', { id: idToast });
    } finally {
      setRevaluating(false);
    }
  };

  const handleLend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !id || !user) return;
    try {
      await lendingService.lendAsset(user.uid, id, borrowerName, dueDate);
      setShowLendModal(false);
      setBorrowerName('');
      setDueDate('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturn = async () => {
    if (!asset || !id || !user) return;
    try {
      const history = await lendingService.getLendingHistory(user.uid, id);
      const activeRecord = history.find(r => r.status === 'active');
      if (activeRecord) {
        await lendingService.returnAsset(id, activeRecord.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchMaintenance = async () => {
    if (!asset || !id) return;
    setFetchingAdvice(true);
    try {
      const advice = await geminiService.getMaintenanceAdvice(asset);
      if (advice) {
        await assetService.updateAsset(id, {
          nextMaintenanceDate: advice.nextMaintenanceDate,
          maintenanceTips: advice.tips
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingAdvice(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !id) return;
    const newRecord: ServiceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: serviceDate,
      description: serviceDesc
    };
    try {
      await assetService.updateAsset(id, {
        serviceHistory: [...(asset.serviceHistory || []), newRecord]
      });
      setShowServiceModal(false);
      setServiceDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateResell = async () => {
    if (!asset) return;
    setGeneratingResell(true);
    setShowResellModal(true);
    try {
      const listing = await geminiService.getResellListing(asset);
      setResellListing(listing);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingResell(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><p className="text-[#8e8e93]">Initializing secure link...</p></div>;
  if (!asset) return <div className="h-screen flex items-center justify-center bg-black"><p className="text-white">Asset not located</p></div>;

  const daysLeft = getDaysRemaining(asset.warrantyExpiry || null);
  
  // Chart Data Generation
  const purchasePrice = asset.purchasePrice || 0;
  const marketValue = asset.marketValue || purchasePrice;
  const depRate = asset.depreciationRate || 0.15;
  const purchaseDate = new Date(asset.purchaseDate || Date.now());
  
  const chartData = [];
  const yearsOwned = Math.max(1, new Date().getFullYear() - purchaseDate.getFullYear());
  
  for (let i = 0; i <= yearsOwned; i++) {
    const year = purchaseDate.getFullYear() + i;
    const val = purchasePrice * Math.pow(1 - depRate, i);
    chartData.push({
      year: year.toString(),
      value: i === yearsOwned ? marketValue : val
    });
  }

  const loss = purchasePrice - marketValue;
  const lossPercent = purchasePrice > 0 ? (loss / purchasePrice) * 100 : 0;

  return (
    <div className="flex flex-col pb-32 min-h-screen bg-black">
      {/* Hero Header */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <div className="absolute inset-x-0 top-0 p-6 z-30 flex justify-between items-center pt-16">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploadingImage}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center disabled:opacity-50"
            >
              {uploadingImage ? <Loader2 size={20} className="animate-spin text-indigo-400" /> : <Upload size={20} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button onClick={() => setShowQr(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center">
              <QrCode size={20} />
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-red-500 flex items-center justify-center">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {asset.imageUrl ? (
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            src={asset.imageUrl} 
            alt={asset.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-[#1c1c1e] flex items-center justify-center">
            <Package size={64} className="text-[#2c2c2e]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 relative z-20 flex flex-col gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1c1c1e] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative"
        >
          {isLent && (
            <div className="absolute -top-3 right-8 bg-orange-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/20 z-10 transition-all flex items-center gap-1.5 border border-white/20">
              <ArrowRightCircle size={12} />
              Lent to {asset.lendingStatus?.borrowerName}
            </div>
          )}
          <div className="flex justify-between items-start mb-1">
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{asset.category}</span>
             <p className="text-2xl font-bold text-white italic">{formatCurrency(marketValue)}</p>
          </div>
          <h1 className="text-3xl font-bold leading-[1.1] mb-2 text-white">{asset.name}</h1>
          <div className="flex items-center justify-between mb-6">
            <p className="text-[#8e8e93] font-medium">{asset.estimatedBrand || "Generic Brand"}</p>
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
              <TrendingDown size={14} />
              <span>{lossPercent.toFixed(0)}% overall</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#8e8e93] text-[9px] uppercase tracking-widest font-bold">
                <Calendar size={12} className="text-indigo-400" />
                <span>Acquired</span>
              </div>
              <p className="font-bold text-xs text-white">
                {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "-"}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#8e8e93] text-[9px] uppercase tracking-widest font-bold">
                <ShieldCheck size={12} className={cn(daysLeft !== null && daysLeft > 0 ? "text-[#34c759]" : "text-red-500")} />
                <span>Warranty</span>
              </div>
              <p className={cn(
                "font-bold text-xs",
                daysLeft !== null ? (daysLeft > 0 ? "text-white" : "text-red-500") : "text-white"
              )}>
                {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d left` : "Expired") : "Not Tracked"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-white/5">
            <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest ml-1 flex items-center gap-1.5 font-bold">
              <Sparkles size={12} className="text-indigo-400" />
              Serial Number
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="N/A"
                value={editedSerial}
                onChange={(e) => setEditedSerial(e.target.value)}
                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-[#48484a] text-xs font-mono"
              />
              <button 
                onClick={handleUpdateSerial}
                disabled={updatingSerial || editedSerial === (asset.serialNumber || '')}
                className="px-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600/20 disabled:opacity-0 transition-all"
              >
                {updatingSerial ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Valuation Insights */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest">Market Valuation</h3>
            <button 
              onClick={handleRevaluate} 
              disabled={revaluating}
              className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest disabled:opacity-50"
            >
              <RefreshCw size={12} className={cn(revaluating && "animate-spin")} />
              Update
            </button>
          </div>
          
          <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
            <div className="h-40 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#48484a', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#8e8e93', fontSize: '10px' }}
                    formatter={(val: number) => [formatCurrency(val), 'Value']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
              <div className="flex flex-col gap-0.5">
                <p className="text-[9px] font-bold text-[#48484a] uppercase tracking-widest">Purchased</p>
                <p className="text-sm font-bold text-white">{formatCurrency(purchasePrice)}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[9px] font-bold text-[#48484a] uppercase tracking-widest">Rate</p>
                <p className="text-sm font-bold text-white">-{Math.round(depRate * 100)}%/yr</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-[9px] font-bold text-[#48484a] uppercase tracking-widest">Loss</p>
                <p className="text-sm font-bold text-red-500">-{formatCurrency(loss)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Lending Library Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest">Lending Library</h3>
          </div>
          
          <div className={cn(
            "rounded-3xl p-6 border transition-all flex flex-col gap-5",
            isLent ? "bg-orange-500/5 border-orange-500/20" : "bg-[#1c1c1e] border-white/5"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  isLent ? "bg-orange-500 text-white" : "bg-white/5 text-[#8e8e93]"
                )}>
                  <HandHelping size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{isLent ? 'Currently Out' : 'Available'}</span>
                  <span className="text-xs text-[#8e8e93]">
                    {isLent ? `Due on ${new Date(asset.lendingStatus!.dueDate!).toLocaleDateString()}` : 'Not currently lent to anyone'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => isLent ? handleReturn() : setShowLendModal(true)}
                className={cn(
                  "px-6 h-10 rounded-xl text-xs font-bold transition-all active:scale-95",
                  isLent 
                    ? "bg-white text-black hover:bg-gray-200" 
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                )}
              >
                {isLent ? 'Mark Returned' : 'Lend Item'}
              </button>
            </div>
          </div>
        </section>

        {/* AI Maintenance Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest">Maintenance & Care</h3>
            <button 
              onClick={handleFetchMaintenance}
              disabled={fetchingAdvice}
              className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest disabled:opacity-50"
            >
              <Sparkles size={12} className={cn(fetchingAdvice && "animate-spin")} />
              {asset.maintenanceTips ? 'Refresh Advice' : 'Get AI Advice'}
            </button>
          </div>

          <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#48484a] uppercase tracking-widest">Next Recommended Service</span>
                <p className="text-white font-bold">{asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'TBD'}</p>
              </div>
              <Wrench size={24} className="text-indigo-400 opacity-50" />
            </div>

            {asset.maintenanceTips && asset.maintenanceTips.length > 0 && (
              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pro Tips</span>
                <ul className="flex flex-col gap-2">
                  {asset.maintenanceTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-[#8e8e93] leading-relaxed">
                      <div className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button 
              onClick={() => setShowServiceModal(true)}
              className="w-full h-12 rounded-xl bg-white/5 border border-white/5 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all mt-2"
            >
              <Plus size={16} />
              Log Service Record
            </button>
          </div>

          {/* Service History Mini List */}
          {asset.serviceHistory && asset.serviceHistory.length > 0 && (
            <div className="flex flex-col gap-2 pl-2">
               {asset.serviceHistory.slice(-2).reverse().map((record) => (
                 <div key={record.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-white">{record.description}</span>
                       <span className="text-[10px] text-[#48484a] font-bold uppercase tracking-widest">{new Date(record.date).toLocaleDateString()}</span>
                    </div>
                    <CheckCircle size={14} className="text-[#34c759]" />
                 </div>
               ))}
            </div>
          )}
        </section>

        {/* Resell Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest">Marketplace Prep</h3>
          </div>
          <button 
            onClick={handleGenerateResell}
            className="group bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 flex flex-col items-start gap-4 active:scale-[0.98] transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
               <DollarSign size={80} />
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" />
                <h4 className="text-lg font-bold text-white italic">1-Tap Resell Copy</h4>
              </div>
              <p className="text-xs text-[#8e8e93] max-w-[240px]">
                Generate AI marketplace descriptions and suggested pricing instantly.
              </p>
            </div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-widest uppercase mt-2">
              Generate Listing <ChevronRight size={16} />
            </div>
          </button>
        </section>

        {/* Technical Specs */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest px-1">Technical Specs</h3>
          <div className="grid grid-cols-2 gap-4">
            {asset.serialNumber && (
              <div className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-6 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[#8e8e93] text-[9px] uppercase tracking-widest mb-1 font-bold">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>Serial Number</span>
                </div>
                <p className="font-mono text-xs text-white font-bold tracking-tighter overflow-hidden text-ellipsis">{asset.serialNumber}</p>
              </div>
            )}
            
            <button 
              onClick={handleManualSearch}
              className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-6 flex flex-col items-start gap-1 group active:scale-[0.98] transition-all text-left"
            >
              <div className="flex items-center gap-2 text-[#8e8e93] text-[9px] uppercase tracking-widest mb-1 font-bold">
                <FileText size={14} className="text-indigo-400" />
                <span>Technical PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Manual</span>
                <ExternalLink size={12} className="text-[#48484a] group-hover:text-white transition-colors" />
              </div>
            </button>
          </div>
        </section>

        {/* Audit Log / Lending History */}
        {lendingHistory.length > 0 && (
          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-[#8e8e93] uppercase tracking-widest px-1">Lending Records</h3>
            <div className="flex flex-col gap-3">
              {lendingHistory.map((record) => (
                <div key={record.id} className="bg-[#1c1c1e] border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center",
                        record.status === 'active' ? "bg-orange-500/10 text-orange-500" : "bg-white/5 text-[#8e8e93]"
                      )}>
                        <User size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{record.borrowerName}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border",
                            record.status === 'active' 
                              ? "bg-orange-500/10 border-orange-500/20 text-orange-500" 
                              : "bg-[#34c759]/10 border-[#34c759]/20 text-[#34c759]"
                          )}>
                            {record.status}
                          </span>
                          {record.status === 'active' && (
                            <span className="text-[10px] text-orange-500/60 font-medium">
                              Due {new Date(record.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#48484a] uppercase tracking-widest">Lent Date</p>
                      <p className="text-xs text-white font-bold">{new Date(record.lentDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {record.status === 'returned' && record.returnDate && (
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-[#8e8e93]">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Returned On</span>
                      </div>
                      <p className="text-xs text-white font-medium">{new Date(record.returnDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lending Modal */}
      <AnimatePresence>
        {showLendModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-sm bg-[#1c1c1e] rounded-[32px] p-8 border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white italic">Lend Asset</h3>
                <button onClick={() => setShowLendModal(false)} className="text-[#8e8e93]"><X size={24} /></button>
              </div>

              <form onSubmit={handleLend} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest ml-1">Borrower Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="Who is taking it?"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 outline-none focus:ring-1 focus:ring-white/20 transition-all text-white placeholder:text-[#48484a] text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest ml-1">Due Date</label>
                  <input 
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 outline-none focus:ring-1 focus:ring-white/20 transition-all text-white placeholder:text-[#48484a] text-sm"
                  />
                </div>

                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-14 rounded-2xl active:scale-95 transition-all text-sm mt-2"
                >
                  Confirm Loan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Service Record Modal */}
      <AnimatePresence>
        {showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-sm bg-[#1c1c1e] rounded-[32px] p-8 border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white italic">Log Service</h3>
                <button onClick={() => setShowServiceModal(false)} className="text-[#8e8e93]"><X size={24} /></button>
              </div>

              <form onSubmit={handleAddService} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest ml-1">Service Date</label>
                  <input 
                    type="date"
                    required
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 outline-none focus:ring-1 focus:ring-white/20 transition-all text-white placeholder:text-[#48484a] text-sm"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest ml-1">What was done?</label>
                  <textarea 
                    required
                    placeholder="e.g. Battery replacement, full cleaning..."
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    className="bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 outline-none focus:ring-1 focus:ring-white/20 transition-all text-white placeholder:text-[#48484a] text-sm h-24 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-14 rounded-2xl active:scale-95 transition-all text-sm mt-2"
                >
                  Save Record
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resell / Marketplace Modal */}
      <AnimatePresence>
        {showResellModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#1c1c1e] rounded-[40px] p-8 border border-white/10 flex flex-col gap-6 relative max-h-[85vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setShowResellModal(false);
                  setResellListing(null);
                }} 
                className="absolute top-6 right-6 text-[#8e8e93] hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-white italic">Marketplace Listing</h3>
                <p className="text-[#8e8e93] text-xs">AI-optimized for Facebook Marketplace & eBay</p>
              </div>

              {generatingResell ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 size={40} className="text-indigo-500 animate-spin" />
                  <p className="text-sm font-medium text-[#8e8e93] animate-pulse">Drafting listing...</p>
                </div>
              ) : resellListing ? (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Recommended Title</span>
                      <button 
                        onClick={() => copyToClipboard(resellListing.headline)}
                        className="text-[#48484a] hover:text-white transition-colors"
                      >
                         {copied ? <Check size={14} className="text-[#34c759]" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <h4 className="text-white font-bold leading-snug">{resellListing.headline}</h4>
                  </div>

                  <div className="bg-black/40 rounded-2xl p-5 border border-white/5 shrink-0">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Suggested Price</span>
                    <p className="text-2xl font-bold text-white italic">{resellListing.suggestedPriceRange}</p>
                  </div>

                  <div className="bg-black/40 rounded-2xl p-5 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Description</span>
                      <button 
                        onClick={() => copyToClipboard(resellListing.description)}
                        className="text-[#48484a] hover:text-white transition-colors"
                      >
                         {copied ? <Check size={14} className="text-[#34c759]" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-[#8e8e93] leading-relaxed whitespace-pre-wrap">{resellListing.description}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Key Features</span>
                    <div className="flex flex-wrap gap-2">
                      {resellListing.keyFeatures.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-white font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => copyToClipboard(`${resellListing.headline}\n\nPrice: ${resellListing.suggestedPriceRange}\n\n${resellListing.description}`)}
                    className="w-full h-14 rounded-2xl bg-white text-black font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    Copy Full Listing
                  </button>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-white rounded-[40px] p-10 flex flex-col items-center gap-8 relative"
            >
              <button 
                onClick={() => setShowQr(false)} 
                className="absolute top-6 right-6 text-black/20 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-black italic">Asset Identity</h3>
                <p className="text-black/40 text-[10px] font-bold uppercase tracking-widest mt-1">{asset.name}</p>
              </div>

              <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-black/5">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${asset.id}`} 
                  alt="Asset QR"
                  className="w-48 h-48"
                />
              </div>

              <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] text-center px-4">
                Scan to verify this item in your inventory
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#1c1c1e] rounded-[32px] p-8 border border-white/10 flex flex-col items-center text-center gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                <Trash2 size={32} />
              </div>
              
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-white italic">Confirm Deletion</h3>
                <p className="text-sm text-[#8e8e93]">
                  Are you sure you want to permanently remove <span className="text-white font-bold">{asset.name}</span> from your estate? This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 mt-2">
                <button 
                  onClick={handleDelete}
                  className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all active:scale-95"
                >
                  Permanently Delete
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

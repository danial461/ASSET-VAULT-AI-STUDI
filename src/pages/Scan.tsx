import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, Check, X, Sparkles, Loader2, Image as ImageIcon, Receipt, Box } from 'lucide-react';
import { analyzeAssetImage, analyzeReceiptImage, ReceiptScanResult } from '../services/geminiService';
import { assetService } from '../services/assetService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { toast } from 'sonner';

export function Scan() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanMode, setScanMode] = useState<'asset' | 'receipt'>('asset');
  const [result, setResult] = useState<any>(null);
  const [receiptResult, setReceiptResult] = useState<ReceiptScanResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Your browser does not support camera access. Try a modern browser like Chrome or Safari.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // Ensure video plays
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play failed", e));
        };
      }
    } catch (err: any) {
      console.error("Camera access denied", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera access was denied. Please check your browser's site settings and ensure you have allowed camera permissions.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No camera hardware found on this device.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError("Camera is already in use by another application or tab.");
      } else {
        setCameraError(`Could not access camera: ${err.message || 'Unknown error'}. Try opening the app in a new tab.`);
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setImage(dataUrl);
      stopCamera();
      analyze(dataUrl);
    }
  };

  const analyze = async (base64: string) => {
    setAnalyzing(true);
    setResult(null);
    setReceiptResult(null);
    try {
      if (scanMode === 'asset') {
        const res = await analyzeAssetImage(base64);
        setResult(res);
      } else {
        const res = await analyzeReceiptImage(base64);
        setReceiptResult(res);
      }
    } catch (err) {
      console.error(err);
      toast.error('AI Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl);
        stopCamera();
        analyze(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user || (!result && !receiptResult) || !image || !profile) return;
    
    // Check asset limit for free users
    const currentAssetCount = await assetService.getAssetCount(user.uid);
    if (!profile.isPro && currentAssetCount >= 5) {
      toast.error("Free limit reached", {
        description: "You've hit the 5-asset limit. Upgrade to Pro for unlimited storage.",
        action: {
          label: "Upgrade",
          onClick: () => navigate('/settings')
        },
      });
      return;
    }

    try {
      let finalData: any = {};

      if (scanMode === 'asset') {
        finalData = {
          name: result.name,
          category: result.category,
          estimatedBrand: result.estimatedBrand,
          purchasePrice: result.suggestedPrice || result.marketValue || 0,
          marketValue: result.marketValue || result.suggestedPrice || 0,
          depreciationRate: result.depreciationRate || 0.1,
          lastValuationDate: new Date().toISOString(),
          imageUrl: image,
          purchaseDate: new Date().toISOString(),
        };
      } else if (receiptResult) {
        // Calculate expiry if warranty months provided
        let expiry: string | undefined = undefined;
        if (receiptResult.warrantyMonths && receiptResult.purchaseDate) {
          const date = new Date(receiptResult.purchaseDate);
          date.setMonth(date.getMonth() + receiptResult.warrantyMonths);
          expiry = date.toISOString();
        }

        finalData = {
          name: receiptResult.itemName || receiptResult.merchantName || "New Asset",
          category: receiptResult.category || "Others",
          estimatedBrand: receiptResult.merchantName,
          purchasePrice: receiptResult.totalAmount || 0,
          purchaseDate: receiptResult.purchaseDate ? new Date(receiptResult.purchaseDate).toISOString() : new Date().toISOString(),
          warrantyExpiry: expiry,
          serialNumber: receiptResult.serialNumber,
          receiptUrl: image, // Use receipt image as receipt url
          imageUrl: image, // Also use as main image if it's the only one we have
        };
      }

      const assetId = await assetService.createAsset(user.uid, finalData);
      navigate(`/asset/${assetId}`);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col pt-12 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 mb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass flex items-center justify-center">
          <X size={20} />
        </button>
        <div className="bg-white/10 p-1 rounded-full flex items-center gap-1">
          <button 
            onClick={() => setScanMode('asset')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              scanMode === 'asset' ? "bg-white text-black" : "text-white/60 hover:text-white"
            )}
          >
            <Box size={12} /> Asset
          </button>
          <button 
            onClick={() => setScanMode('receipt')}
            className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              scanMode === 'receipt' ? "bg-white text-black" : "text-white/60 hover:text-white"
            )}
          >
            <Receipt size={12} /> Receipt
          </button>
        </div>
        <div className="w-10 h-10" />
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div 
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative"
            >
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <X size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Camera Blocked</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {cameraError}
                    </p>
                  </div>
                  <button 
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="glass px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                  >
                    Open in New Tab <RefreshCw size={14} />
                  </button>
                  <button 
                    onClick={startCamera}
                    className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-2"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover rounded-t-[3rem]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl -mb-1 -mr-1" />
                      
                      {scanMode === 'receipt' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-1/2 h-0.5 bg-indigo-500 animate-[bounce_2s_infinite]" />
                          <p className="text-[8px] font-black uppercase text-indigo-500 tracking-[0.3em] mt-4">Scanning Receipt</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-8">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-14 h-14 rounded-full bg-white/10 glass flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <ImageIcon size={24} className="text-white" />
                    </button>

                    <button 
                      onClick={capture}
                      className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
                    >
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                        <Camera size={32} className="text-gray-900" />
                      </div>
                    </button>

                    <div className="w-14 h-14" /> {/* Spacer for symmetry */}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full flex flex-col p-6 overflow-y-auto"
            >
              <div className="w-full aspect-[4/3] rounded-[3rem] overflow-hidden glass mb-6 relative flex-shrink-0">
                <img src={image} alt="Taken" className="w-full h-full object-cover" />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="text-blue-500" size={48} />
                    </motion.div>
                    <p className="font-bold text-xl">AI is {scanMode === 'asset' ? 'identifying' : 'extracting'}...</p>
                  </div>
                )}
              </div>

              {(result || receiptResult) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-[2rem] p-6 flex flex-col gap-6"
                >
                  {scanMode === 'asset' ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{result?.category}</span>
                      <h2 className="text-2xl font-black">{result?.name}</h2>
                      <p className="text-slate-400 text-sm font-medium">{result?.estimatedBrand || "Unknown brand"}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{receiptResult?.category || 'Others'}</span>
                          <h2 className="text-xl font-black">{receiptResult?.itemName || 'Multiple Items'}</h2>
                          <p className="text-slate-400 text-sm font-medium">{receiptResult?.merchantName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total</p>
                          <p className="text-xl font-black text-white">${receiptResult?.totalAmount?.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</p>
                          <p className="text-xs font-bold">{receiptResult?.purchaseDate || 'Not detected'}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Warranty</p>
                          <p className="text-xs font-bold">{receiptResult?.warrantyMonths ? `${receiptResult.warrantyMonths} Months` : 'Not detected'}</p>
                        </div>
                        {receiptResult?.serialNumber && (
                          <div className="flex flex-col gap-1 col-span-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Serial Number</p>
                            <p className="text-xs font-mono font-bold tracking-tighter">{receiptResult.serialNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleSave}
                      disabled={analyzing}
                      className="bg-indigo-600 hover:bg-indigo-500 w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      <Check size={18} />
                      Commit to Vault
                    </button>
                    <button 
                      onClick={() => { setImage(null); setResult(null); setReceiptResult(null); startCamera(); }}
                      className="w-full py-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-slate-300 transition-colors"
                    >
                      Discard & Retake
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

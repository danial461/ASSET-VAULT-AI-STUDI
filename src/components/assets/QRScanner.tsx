import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface QRScannerProps {
  onClose: () => void;
}

export function QRScanner({ onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText: string) {
      if (scannerRef.current) {
        scannerRef.current.clear().then(() => {
          // Assume the QR contains the asset ID
          navigate(`/asset/${decodedText}`);
          onClose();
        }).catch(err => {
          console.error("Failed to clear scanner", err);
          navigate(`/asset/${decodedText}`);
          onClose();
        });
      }
    }

    function onScanFailure(error: any) {
      // ignore failures - it scans constantly
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner cleanup failed", err));
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col pt-16">
      <div className="px-6 flex justify-between items-center mb-10">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-white italic">Identity Scanner</h2>
          <p className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-widest">Scanning for Asset ID</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6">
        <div className="w-full aspect-square max-w-sm rounded-[2rem] overflow-hidden border-2 border-white/10 relative bg-[#1c1c1e]">
          <div id="reader" className="w-full h-full"></div>
          
          {/* Scanning frame overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-indigo-500 rounded-3xl relative">
              <motion.div 
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 text-center flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <RefreshCw size={16} className="animate-spin" />
            <span>Active Pulse...</span>
          </div>
          <p className="text-[#48484a] text-xs font-medium max-w-[200px]">
            Align the asset's digital ID within the frame to retrieve its vault record.
          </p>
        </div>
      </div>
      
      {/* Visual background accents */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-indigo-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />
    </div>
  );
}

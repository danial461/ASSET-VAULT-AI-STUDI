import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Box, ArrowRight } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      <div className="atmosphere" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center flex flex-col items-center gap-12 max-w-sm z-10"
      >
        <div className="relative">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.15)] relative z-10">
            <Box size={36} className="text-black" strokeWidth={2.5} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="text-[52px] font-bold tracking-tight leading-[1.05] text-white italic">
            Protect your <br />
            <span className="text-white/40 not-italic">possessions.</span>
          </h1>
          <p className="text-[#8e8e93] text-lg font-medium tracking-tight px-4 leading-snug">
            High-precision vision cataloging for your physical estate.
          </p>
        </div>

        <div className="flex flex-col w-full gap-6 px-4">
          <button 
            onClick={() => navigate('/vault')}
            className="w-full bg-white text-black font-bold h-16 rounded-full flex items-center justify-center gap-2 text-md active:scale-[0.97] transition-all hover:bg-white/90"
          >
            Access Vault
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
          <div className="flex items-center justify-center gap-2 text-[#48484a] text-[10px] font-bold uppercase tracking-widest">
            <Shield size={12} strokeWidth={2.5} />
            Encrypted & Secure
          </div>
        </div>
      </motion.div>
    </div>
  );
}

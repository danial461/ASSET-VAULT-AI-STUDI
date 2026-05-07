import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Success() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function verifyAndUpgrade() {
      if (!user || !sessionId) {
        setStatus('error');
        return;
      }

      try {
        // In a real production app, you would verify the session_id on the server via a webhook or API call
        // For this demo/prototype, we'll update the user status if the session exists
        await updateDoc(doc(db, 'users', user.uid), {
          isPro: true,
          proSince: new Date().toISOString()
        });
        setStatus('success');
      } catch (err) {
        console.error('Failed to upgrade user:', err);
        setStatus('error');
      }
    }

    verifyAndUpgrade();
  }, [user, sessionId]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-[#8e8e93] font-medium">Verifying your upgrade...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm bg-[#1c1c1e] border border-white/5 rounded-[3rem] p-10 flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-[#34c759]/10 flex items-center justify-center text-[#34c759]">
              <CheckCircle2 size={48} />
            </div>
            
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">You're Pro!</h1>
              <p className="text-[#8e8e93] leading-relaxed">
                Welcome to AssetVault Pro. Your account has been upgraded with all premium features.
              </p>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white text-black font-bold h-14 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all group"
            >
              Go to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <ArrowRight size={32} className="rotate-180" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-[#8e8e93]">We couldn't verify your session.</p>
            </div>
            <Link to="/settings" className="text-indigo-400 font-bold">Back to Settings</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

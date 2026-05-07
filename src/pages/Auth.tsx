import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setError('');
    setAuthLoading(true);
    console.log("Initiating Google Login...");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      console.log("Google Login successful:", result.user.email);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please finish the process in the popup window.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please enable popups or try opening the app in a new tab.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please check your Firebase Console authentication settings.');
      } else {
        setError(err.message || 'An error occurred during sign-in.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    console.log("Initiating Email Auth (isLogin:", isLogin, ")...");
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("Email sign in successful:", result.user.email);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Email sign up successful:", result.user.email);
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <LogIn className="text-black" size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-white italic">AssetVault</h1>
          <p className="text-[#8e8e93] text-sm font-medium tracking-tight">Protect your digital estate.</p>
        </div>

        <div className="bg-[#1c1c1e] p-8 rounded-[32px] border border-white/5 shadow-2xl">
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#8e8e93] uppercase ml-1 tracking-widest">Email</label>
              <input 
                type="email" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 outline-none focus:ring-1 focus:ring-white/20 transition-all text-white placeholder:text-[#48484a] text-sm"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#8e8e93] uppercase ml-1 tracking-widest">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 outline-none focus:ring-1 focus:ring-white/20 transition-all text-white placeholder:text-[#48484a] text-sm"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-widest">{error}</p>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="bg-white hover:bg-[#f2f2f7] text-black font-bold h-12 rounded-xl mt-2 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:active:scale-100"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-8 flex items-center">
            <div className="flex-1 border-t border-white/5"></div>
            <span className="px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[#48484a]">Or</span>
            <div className="flex-1 border-t border-white/5"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full bg-white/5 border border-white/10 h-12 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50 disabled:active:scale-100"
          >
            {authLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebase/birdseed/v0/google_g.svg" className="w-5 h-5" alt="Google" />
                Continue with Google
              </>
            )}
          </button>

          <p className="text-center mt-10 text-[11px] text-[#8e8e93] font-medium tracking-tight">
            {isLogin ? "New to AssetVault?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-white font-bold ml-1"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

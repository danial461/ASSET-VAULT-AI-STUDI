import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Settings, Scan } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutGrid, label: 'Vault', path: '/vault' },
    { icon: null, label: 'Scan', path: '/scan', isFab: true },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md h-16 bottom-nav-glass z-50 flex items-center justify-around px-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        
        if (item.isFab) {
          return (
            <div key="fab" className="relative">
              <button
                onClick={() => navigate('/scan')}
                className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-black active:scale-90 transition-all group"
                id="magic-scan-fab"
              >
                <Scan size={24} strokeWidth={2.5} />
              </button>
            </div>
          );
        }

        const Icon = item.icon!;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center transition-all relative py-2",
              isActive ? "text-white" : "text-[#8e8e93] hover:text-white"
            )}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

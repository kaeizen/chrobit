import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

function isPWAOnMobile(): boolean {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  return standalone && mobile;
}

function usePWAMobile() {
  const [value, setValue] = useState(isPWAOnMobile);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setValue(isPWAOnMobile());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return value;
}

export function AppShell() {
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/play/');
  const pwaOnMobile = usePWAMobile();

  return (
    <div className="flex flex-col min-h-svh">
      {!isPlayer && (pwaOnMobile ? null : <TopNav />)}
      <main className={`flex-1 ${isPlayer ? '' : pwaOnMobile ? 'pb-nav' : 'pt-nav'}`}>
        <Outlet />
      </main>
      {!isPlayer && pwaOnMobile && <BottomNav />}
    </div>
  );
}

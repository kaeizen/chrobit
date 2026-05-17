import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';

function isPWAOnTouch(): boolean {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  return standalone && touch;
}

function usePWAOnTouch() {
  const [value, setValue] = useState(isPWAOnTouch);
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = () => setValue(isPWAOnTouch());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return value;
}

export function AppShell() {
  const location = useLocation();
  const isPlayer = location.pathname.startsWith('/play/');
  const pwaOnTouch = usePWAOnTouch();

  return (
    <div className="flex flex-col min-h-svh">
      {!isPlayer && (pwaOnTouch ? null : <TopNav />)}
      <main className={`flex-1 ${isPlayer ? '' : pwaOnTouch ? 'safe-top safe-bottom' : 'pt-nav'}`}>
        <Outlet />
      </main>
      {!isPlayer && pwaOnTouch && <BottomNav />}
    </div>
  );
}

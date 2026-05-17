import { useState } from 'react';
import QRCode from 'qrcode';
import type { Routine } from '@routine/shared';
import { encodeForQR } from '../../lib/share';
import { RoutineSelector, selectAllIds } from './RoutineSelector';

export function QRShareSection({ routines }: { routines: Routine[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => selectAllIds(routines));
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState('');
  const [generating, setGenerating] = useState(false);

  function toggle(id: string, checked: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
    setQrDataUrl(null);
    setQrError('');
  }

  async function handleGenerate() {
    const toShare = routines.filter((r) => selected.has(r.id));
    if (!toShare.length) return;
    setGenerating(true);
    setQrError('');
    try {
      const encoded = encodeForQR(toShare);
      const origin = window.location.origin.replace(/\/$/, '');
      const url = `${origin}/?import=${encoded}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: { dark: '#ffffff', light: '#18181b' },
        errorCorrectionLevel: 'L',
      });
      setQrDataUrl(dataUrl);
    } catch {
      setQrError('Could not generate QR — selected routines may be too large. Try fewer routines.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Select routines to share</p>
        <div className="flex gap-3">
          <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={() => { setSelected(selectAllIds(routines)); setQrDataUrl(null); }}>All</button>
          <button type="button" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={() => { setSelected(new Set()); setQrDataUrl(null); }}>None</button>
        </div>
      </div>
      <RoutineSelector
        routines={routines}
        selected={selected}
        onChange={toggle}
        emptyText="No routines to share."
      />

      <button
        type="button"
        onClick={handleGenerate}
        disabled={selected.size === 0 || generating}
        className="w-full py-2.5 text-sm font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
      >
        {generating ? 'Generating…' : `Generate QR (${selected.size})`}
      </button>

      {qrError && <p className="text-sm text-red-400">{qrError}</p>}

      {qrDataUrl && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="rounded-2xl overflow-hidden border border-zinc-700 p-3 bg-zinc-900">
            <img src={qrDataUrl} alt="QR code" width={280} height={280} />
          </div>
          <p className="text-xs text-zinc-500 text-center max-w-xs">
            Scan to import {selected.size} routine{selected.size !== 1 ? 's' : ''} into Routine.
          </p>
          <a
            href={qrDataUrl}
            download="routine-qr.png"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Save QR image
          </a>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useRoutineStore } from '../store/routineStore';
import { Toggle } from '../components/ui/Toggle';
import { DataPanel } from '../components/settings/DataPanel';
import { ExportSection } from '../components/settings/ExportSection';
import { ImportSection } from '../components/settings/ImportSection';
import { QRShareSection } from '../components/settings/QRShareSection';

export function SettingsPage() {
  const routines = useRoutineStore((s) => s.routines);

  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('routine:audio') !== 'false');

  function handleAudio(v: boolean) {
    setAudioEnabled(v);
    localStorage.setItem('routine:audio', v ? 'true' : 'false');
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Preferences */}
      <section className="mb-8">
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Preferences</h2>
        <div className="bg-zinc-900 rounded-2xl px-4 border border-zinc-800">
          <Toggle label="Sound effects" checked={audioEnabled} onChange={handleAudio} />
        </div>
      </section>

      {/* Data */}
      <section className="mb-8">
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Data</h2>
        <div className="bg-zinc-900 rounded-2xl px-4 border border-zinc-800">
          <DataPanel label="Export routines">
            <ExportSection routines={routines} />
          </DataPanel>
          <DataPanel label="Import routines">
            <ImportSection />
          </DataPanel>
          <DataPanel label="Share via QR code">
            <QRShareSection routines={routines} />
          </DataPanel>
        </div>
      </section>

      {/* About */}
      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">About</h2>
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-sm text-zinc-500 space-y-1">
          <p>Chrobit — interval timer &amp; activity tracker</p>
          <p>v0.1.0</p>
        </div>
      </section>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Download, QrCode, Sparkles, RefreshCw, CheckCircle2, Share2, Smartphone, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParticipantRecord, AppConfig } from '../types.js';

interface PhotoReadyScreenProps {
  config: AppConfig;
  record: ParticipantRecord;
  onDone: () => void;
  onOpenMobilePreview: (id: string) => void;
}

export default function PhotoReadyScreen({ config, record, onDone, onOpenMobilePreview }: PhotoReadyScreenProps) {
  const timeoutSeconds = config.event.autoResetTimeout || 20;
  const [secondsRemaining, setSecondsRemaining] = useState(timeoutSeconds);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  // Auto reset countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Safely trigger onDone after render when countdown completes
  useEffect(() => {
    if (secondsRemaining === 0) {
      onDone();
    }
  }, [secondsRemaining, onDone]);

  // Handle direct download on kiosk machine
  const handleLocalDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/download/${record.id}`;
    link.download = `${record.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progressPct = ((timeoutSeconds - secondsRemaining) / timeoutSeconds) * 100;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-slate-950 p-4 sm:p-8 overflow-y-auto">
      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5" />
          <span>¡Fotografía Guardada Exitosamente!</span>
        </div>

        {/* Auto reset progress countdown */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Reiniciando en</span>
            <span className="text-sm font-mono font-bold text-blue-400">{secondsRemaining}s</span>
          </div>
          <button
            id="btn-nueva-foto"
            type="button"
            onClick={onDone}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Nueva Foto</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Photo Preview (Left) + QR & Mobile Download (Right) */}
      <main className="my-auto w-full max-w-5xl py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Finished High-Res Branded Photo */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl">
            <img
              src={record.foto_url}
              alt="Fotografía Final"
              className="w-full h-full object-contain bg-black"
            />
          </div>

          <div className="mt-4 flex items-center justify-between w-full max-w-lg px-2 text-xs text-slate-400">
            <span className="font-mono">ID: {record.id}</span>
            <span>{record.nombre} {record.apellido} • {record.empresa}</span>
          </div>
        </div>

        {/* Right: QR Code & Mobile Download System */}
        <div className="lg:col-span-5 flex flex-col items-center text-center bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Descarga Inmediata</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            ¡Tu foto está lista!
          </h2>

          <p className="text-sm text-slate-300 max-w-xs mb-6">
            Escanea el código QR con la cámara de tu celular para ver y descargar tu foto.
          </p>

          {/* High contrast QR Code container */}
          <div className="relative p-4 rounded-2xl bg-white shadow-xl shadow-blue-500/10 border-4 border-slate-800/20 mb-6">
            {record.qr_data_url ? (
              <img
                src={record.qr_data_url}
                alt="Código QR de descarga"
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-800">
                <QrCode className="w-24 h-24 text-slate-400" />
              </div>
            )}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-950 text-white font-mono text-[11px] border border-slate-700 whitespace-nowrap">
              SM_{record.id.slice(-6)}
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full space-y-3">
            {/* Direct download button on this machine */}
            <button
              id="btn-descarga-local"
              type="button"
              onClick={handleLocalDownload}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Guardar copia en este equipo</span>
            </button>

            {/* Test mobile preview button */}
            <button
              id="btn-ver-vista-movil"
              type="button"
              onClick={() => onOpenMobilePreview(record.id)}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-medium text-xs flex items-center justify-center gap-2 border border-blue-500/30 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>Abrir vista móvil de descarga</span>
              <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
            </button>
          </div>
        </div>
      </main>

      {/* Auto Reset Bar */}
      <footer className="w-full max-w-5xl pt-4">
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">
          El Photobooth se reiniciará automáticamente para el siguiente participante en {secondsRemaining} segundos.
        </p>
      </footer>
    </div>
  );
}

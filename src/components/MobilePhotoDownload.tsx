import { useState, useEffect } from 'react';
import { Download, Share2, Check, ArrowLeft, Calendar, Building2, User, Sparkles, ExternalLink } from 'lucide-react';
import { ParticipantRecord, AppConfig } from '../types.js';
import { fetchParticipantById } from '../utils/api.js';

interface MobilePhotoDownloadProps {
  photoId: string;
  config: AppConfig;
  onBackToKiosk?: () => void;
}

export default function MobilePhotoDownload({ photoId, config, onBackToKiosk }: MobilePhotoDownloadProps) {
  const [record, setRecord] = useState<ParticipantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPhoto() {
      try {
        setLoading(true);
        const data = await fetchParticipantById(photoId);
        setRecord(data);
      } catch (err: any) {
        console.error(err);
        setError('No se pudo encontrar la fotografía solicitada o el enlace es inválido.');
      } finally {
        setLoading(false);
      }
    }
    loadPhoto();
  }, [photoId]);

  const handleDownload = () => {
    if (!record) return;
    const link = document.createElement('a');
    link.href = `/api/download/${record.id}`;
    link.download = `${record.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!record) return;

    const shareData = {
      title: `Mi foto en ${config.event.eventName}`,
      text: `¡Mira mi foto del evento ${config.event.eventName}!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.log('Share canceled or failed', e);
      }
    } else {
      // Fallback: Copy link or WhatsApp share
      const text = encodeURIComponent(`¡Mira mi foto en ${config.event.eventName}! ${window.location.href}`);
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Cargando tu fotografía...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 max-w-sm">
          <h2 className="text-lg font-bold mb-2">Fotografía no encontrada</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">{error}</p>
          {onBackToKiosk && (
            <button
              onClick={onBackToKiosk}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Volver al inicio
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-6 select-none">
      {/* Mobile Top App Bar */}
      <header className="w-full max-w-md flex items-center justify-between py-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          {config.branding.logoUrl ? (
            <img src={config.branding.logoUrl} alt="Logo" className="h-7 w-auto object-contain" />
          ) : (
            <span className="font-bold text-sm tracking-wide text-blue-400">PHOTOBOOTH</span>
          )}
        </div>

        {onBackToKiosk && (
          <button
            onClick={onBackToKiosk}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kiosk</span>
          </button>
        )}
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-md flex flex-col items-center flex-1 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{config.event.eventName}</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white text-center mb-1">
          ¡Tu foto está lista!
        </h1>
        <p className="text-xs text-slate-400 text-center mb-5">
          Guárdala en tu galería o compártela en tus redes sociales.
        </p>

        {/* The Branded Photo Display */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl mb-6">
          <img
            src={record.foto_url}
            alt="Tu fotografía"
            className="w-full h-full object-contain bg-black"
          />
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full space-y-3 mb-6">
          <button
            id="btn-mobile-descargar"
            type="button"
            onClick={handleDownload}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base tracking-wide shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>DESCARGAR FOTO</span>
          </button>

          <button
            id="btn-mobile-compartir"
            type="button"
            onClick={handleShare}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>{copied ? '¡Enlace copiado!' : 'COMPARTIR EN WHATSAPP / REDES'}</span>
          </button>
        </div>

        {/* Photo & Participant Details Card */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <User className="w-3.5 h-3.5" /> Participante
            </span>
            <span className="font-semibold">{record.nombre} {record.apellido}</span>
          </div>

          {record.empresa && (
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Building2 className="w-3.5 h-3.5" /> Empresa
              </span>
              <span className="font-medium">{record.empresa}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5" /> Fecha y Hora
            </span>
            <span>{record.fecha} • {record.hora}</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            <span>ID Único:</span>
            <span>{record.id}</span>
          </div>
        </div>

        {/* Event Organization watermark */}
        <p className="mt-8 text-center text-[11px] text-slate-500">
          Activación digital desarrollada con Photobooth Digital por {config.event.brandName}
        </p>
      </main>
    </div>
  );
}

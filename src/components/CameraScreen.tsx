import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, ArrowLeft, Video, VideoOff, Sparkles, Sliders, Eye, Upload } from 'lucide-react';
import { AppConfig } from '../types.js';
import { soundFx } from '../utils/audio.js';
import { processBrandedPhoto } from '../utils/photoProcessor.js';

interface CameraScreenProps {
  config: AppConfig;
  participantData: any;
  onPhotoConfirmed: (photoBase64: string) => void;
  onBack: () => void;
}

export default function CameraScreen({ config, participantData, onPhotoConfirmed, onBack }: CameraScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);

  // Initialize camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      try {
        setCameraError(null);

        // Get available media devices
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        }

        const constraints: MediaStreamConstraints = {
          video: selectedDeviceId
            ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            : { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.warn('Camera access issue:', err);
        setCameraError(
          'No pudimos acceder a la cámara en este dispositivo. Puedes seleccionar otra webcam o cargar una foto de prueba.'
        );
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  // Handle countdown & capture
  const handleStartCapture = () => {
    if (isCountingDown || isProcessing) return;

    const seconds = config.photoSettings.countdownSeconds || 3;
    setIsCountingDown(true);
    setCountdown(seconds);

    let current = seconds;

    if (config.photoSettings.soundEffects) {
      soundFx.playCountdownBeep(800, 0.1);
    }

    const timer = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
        if (config.photoSettings.soundEffects) {
          soundFx.playCountdownBeep(800, 0.1);
        }
      } else {
        clearInterval(timer);
        setIsCountingDown(false);
        triggerShutter();
      }
    }, 1000);
  };

  // Capture frame from video and process branding
  const triggerShutter = async () => {
    if (config.photoSettings.soundEffects) {
      soundFx.playShutterSound();
    }

    if (config.photoSettings.flashEffect) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 250);
    }

    setIsProcessing(true);

    try {
      if (!videoRef.current) throw new Error('Video stream not ready');

      // Process image through branding engine
      const brandedResult = await processBrandedPhoto(
        videoRef.current,
        config.branding,
        config.photoSettings,
        isMirrored
      );

      setCapturedPhoto(brandedResult);
      if (config.photoSettings.soundEffects) {
        soundFx.playSuccessChime();
      }
    } catch (err) {
      console.error('Error during photo capture:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fallback: Generate demo photo or handle manual upload if no webcam
  const handleSimulatedPhoto = async () => {
    setIsProcessing(true);
    try {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 1280;
      offCanvas.height = 960;
      const ctx = offCanvas.getContext('2d');
      if (ctx) {
        // Draw modern studio background
        const grad = ctx.createLinearGradient(0, 0, 1280, 960);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 960);

        // Draw friendly participant silhouette
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(640, 380, 150, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(640, 780, 260, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${participantData.nombre || 'Participante'} ${participantData.apellido || ''}`,
          640,
          720
        );

        ctx.font = '22px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(
          `${participantData.empresa || config.event.eventName} • Stand Photobooth`,
          640,
          765
        );
      }

      const branded = await processBrandedPhoto(
        offCanvas,
        config.branding,
        config.photoSettings,
        false
      );

      setCapturedPhoto(branded);
      if (config.photoSettings.soundEffects) {
        soundFx.playSuccessChime();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.onload = async () => {
        const branded = await processBrandedPhoto(
          img,
          config.branding,
          config.photoSettings,
          false
        );
        setCapturedPhoto(branded);
        setIsProcessing(false);
        if (config.photoSettings.soundEffects) {
          soundFx.playSuccessChime();
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoConfirmed(capturedPhoto);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-slate-950 p-4 sm:p-6 overflow-hidden">
      {/* Screen flash on capture */}
      {isFlashing && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-200" />
      )}

      {/* Top Controls Bar */}
      <header className="relative z-20 w-full max-w-5xl flex items-center justify-between py-2 border-b border-slate-800">
        <button
          id="btn-cam-volver"
          type="button"
          onClick={capturedPhoto ? handleRetake : onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm border border-slate-700/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{capturedPhoto ? 'Retomar' : 'Volver'}</span>
        </button>

        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
            {capturedPhoto ? 'Revisión y Branding' : 'Estación de Cámara'}
          </span>
          <h2 className="text-sm font-semibold text-slate-200">
            {participantData.nombre} {participantData.apellido} ({participantData.empresa})
          </h2>
        </div>

        {/* Camera toggles */}
        <div className="flex items-center gap-2">
          {!capturedPhoto && (
            <>
              <button
                type="button"
                onClick={() => setIsMirrored(!isMirrored)}
                className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                  isMirrored
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title="Modo espejo"
              >
                Espejo
              </button>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                  showGuide
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title="Guía de encuadre"
              >
                <Eye className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="relative z-10 my-auto w-full max-w-4xl flex flex-col items-center justify-center p-2">
        <div className="relative w-full aspect-[4/3] max-h-[68vh] rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
          {/* Live Video Feed (Hidden if photo already captured) */}
          {!capturedPhoto && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
              />

              {/* Face Guide Silhouette Overlay */}
              {showGuide && !cameraError && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-40">
                  {/* Oval head guide */}
                  <div className="w-48 h-64 border-2 border-dashed border-white/70 rounded-full" />
                  <div className="w-80 h-32 border-2 border-dashed border-white/50 rounded-t-[100px] -mt-6" />
                  <span className="mt-4 px-3 py-1 rounded-full bg-black/60 text-white/90 text-xs font-medium">
                    Ubica tu rostro aquí
                  </span>
                </div>
              )}

              {/* Countdown Overlay */}
              {isCountingDown && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                  <span className="text-9xl sm:text-[14rem] font-black text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-ping">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Camera Error / No Hardware Fallback View */}
              {cameraError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
                  <div className="p-4 rounded-full bg-slate-900 text-amber-400 mb-4 border border-amber-500/20">
                    <VideoOff className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Cámara no detectada o bloqueada</h3>
                  <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                    {cameraError}
                  </p>

                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleSimulatedPhoto}
                      className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Foto de Demostración</span>
                    </button>

                    <label className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Subir Imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Captured & Branded Photo Preview */}
          {capturedPhoto && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhoto}
                alt="Foto con branding"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Branding Aplicado</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Controls */}
      <footer className="relative z-20 w-full max-w-xl pb-4">
        {!capturedPhoto ? (
          <div className="flex flex-col items-center gap-4">
            {/* Big Shutter Button */}
            <button
              id="btn-tomar-foto"
              type="button"
              disabled={isCountingDown || isProcessing}
              onClick={handleStartCapture}
              className="group relative inline-flex items-center justify-center gap-4 px-12 py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:scale-105 active:scale-95 text-white font-extrabold text-xl tracking-wide shadow-2xl shadow-blue-600/40 transition-all cursor-pointer border border-blue-400/40 disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full border-4 border-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
              <span>{isCountingDown ? `Capturando en ${countdown}...` : 'TOMAR FOTO'}</span>
            </button>

            {/* Camera device selection dropdown if multiple available */}
            {devices.length > 1 && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Video className="w-4 h-4" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 outline-none"
                >
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Cámara ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          /* Confirmation choices: RETOMAR or USAR ESTA FOTO */
          <div className="grid grid-cols-2 gap-4">
            <button
              id="btn-retomar-foto"
              type="button"
              onClick={handleRetake}
              className="py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
              <span>RETOMAR</span>
            </button>

            <button
              id="btn-usar-foto"
              type="button"
              onClick={handleConfirmPhoto}
              className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Check className="w-6 h-6" />
              <span>USAR ESTA FOTO</span>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

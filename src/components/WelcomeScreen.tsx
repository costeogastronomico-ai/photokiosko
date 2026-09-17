import React, { useState } from 'react';
import { Camera, Sparkles, Shield, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { AppConfig } from '../types.js';
import { soundFx } from '../utils/audio.js';

interface WelcomeScreenProps {
  config: AppConfig;
  onStart: () => void;
  onOpenAdmin: () => void;
}

export default function WelcomeScreen({ config, onStart, onOpenAdmin }: WelcomeScreenProps) {
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleStart = () => {
    if (config.photoSettings.soundEffects) {
      soundFx.playCountdownBeep(600, 0.08);
    }
    onStart();
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === config.event.kioskPin) {
      setPinModalOpen(false);
      setPinInput('');
      setPinError(false);
      onOpenAdmin();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 md:p-12 overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          {config.branding.logoUrl ? (
            <img
              src={config.branding.logoUrl}
              alt={config.event.brandName}
              className="h-10 md:h-12 w-auto object-contain drop-shadow-md"
              onError={(e) => {
                // Fallback to default if custom image fails
                (e.target as HTMLImageElement).src = '/default-logo.svg';
              }}
            />
          ) : (
            <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold tracking-wide text-sm">
              <Camera className="w-5 h-5" />
              <span>PHOTOBOOTH</span>
            </div>
          )}
        </div>

        {/* Discreet admin lock button */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {config.event.eventName}
          </span>
          <button
            id="admin-access-btn"
            onClick={() => setPinModalOpen(true)}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-700/50 transition-all opacity-40 hover:opacity-100"
            title="Acceso Administrador"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="relative z-10 my-auto w-full max-w-3xl flex flex-col items-center text-center px-4 py-8">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold tracking-wide mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Experiencia Digital Interactiva</span>
        </div>

        {/* Dynamic Title from config */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6">
          {config.event.welcomeTitle}
        </h1>

        {/* Dynamic Subtitle */}
        <p className="text-lg sm:text-2xl text-slate-300 max-w-2xl font-normal leading-relaxed mb-12">
          {config.event.welcomeSubtitle}
        </p>

        {/* Giant touch-friendly Start Button */}
        <button
          id="btn-comenzar"
          onClick={handleStart}
          className="group relative inline-flex items-center justify-center gap-4 px-10 sm:px-14 py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xl sm:text-2xl tracking-wide shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-blue-400/40"
        >
          <Camera className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:rotate-6" />
          <span>COMENZAR</span>
          <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Simple 3-step indicator */}
        <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl text-center">
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 text-xs font-bold flex items-center justify-center mb-1.5">1</span>
            <span className="text-xs sm:text-sm font-medium text-slate-200">Completa tus datos</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 text-xs font-bold flex items-center justify-center mb-1.5">2</span>
            <span className="text-xs sm:text-sm font-medium text-slate-200">Tómate la foto</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 text-xs font-bold flex items-center justify-center mb-1.5">3</span>
            <span className="text-xs sm:text-sm font-medium text-slate-200">Descarga con QR</span>
          </div>
        </div>
      </main>

      {/* Footer information */}
      <footer className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-6">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Tus datos y fotografía se gestionan de forma segura para este evento.</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>{config.event.brandName}</span>
          <span>•</span>
          <span>{config.event.eventDate}</span>
        </div>
      </footer>

      {/* Admin PIN Verification Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-slate-100">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Panel de Administración</h3>
                <p className="text-xs text-slate-400">Ingresa el PIN de seguridad para continuar</p>
              </div>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  id="admin-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  autoFocus
                  placeholder="PIN (por defecto: 1234)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className="w-full text-center tracking-widest text-2xl font-mono py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white outline-none"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 mt-2 text-center font-medium">
                    PIN incorrecto. Intenta nuevamente.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPinModalOpen(false);
                    setPinInput('');
                    setPinError(false);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30"
                >
                  Acceder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

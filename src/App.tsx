import { useState, useEffect, useCallback } from 'react';
import { AppConfig, ParticipantRecord, DEFAULT_CONFIG } from './types.js';
import { fetchConfig, submitPhotoAndParticipant } from './utils/api.js';
import WelcomeScreen from './components/WelcomeScreen.js';
import FormScreen from './components/FormScreen.js';
import CameraScreen from './components/CameraScreen.js';
import PhotoReadyScreen from './components/PhotoReadyScreen.js';
import AdminPanel from './components/AdminPanel.js';
import MobilePhotoDownload from './components/MobilePhotoDownload.js';

type AppScreen = 'welcome' | 'form' | 'camera' | 'ready' | 'admin' | 'mobile';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('welcome');
  const [participantData, setParticipantData] = useState<any>(null);
  const [finalRecord, setFinalRecord] = useState<ParticipantRecord | null>(null);
  const [mobilePhotoId, setMobilePhotoId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial config and URL routing check
  useEffect(() => {
    async function init() {
      try {
        const loaded = await fetchConfig();
        setConfig(loaded);
      } catch (e) {
        console.warn('Using default config fallback:', e);
      }

      // Check URL for direct mobile photo link: /photo/:id or ?photoId=...
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const photoQuery = params.get('photoId');

      if (path.startsWith('/photo/')) {
        const id = path.replace('/photo/', '').trim();
        if (id) {
          setMobilePhotoId(id);
          setCurrentScreen('mobile');
          return;
        }
      } else if (photoQuery) {
        setMobilePhotoId(photoQuery);
        setCurrentScreen('mobile');
        return;
      } else if (path === '/admin') {
        setCurrentScreen('admin');
        return;
      }
    }

    init();
  }, []);

  // Step 1: Start button pressed on Welcome screen
  const handleStart = () => {
    setCurrentScreen('form');
  };

  // Step 2: Form submitted
  const handleFormSubmit = (data: any) => {
    setParticipantData(data);
    setCurrentScreen('camera');
  };

  // Step 3: Photo captured & confirmed in Camera screen
  const handlePhotoConfirmed = async (photoBase64: string) => {
    try {
      setIsSubmitting(true);
      const record = await submitPhotoAndParticipant({
        participantData,
        photoBase64,
      });
      setFinalRecord(record);
      setCurrentScreen('ready');
    } catch (err: any) {
      alert(err.message || 'Error al guardar la fotografía');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Done / Reset to welcome for next guest
  const handleResetToWelcome = useCallback(() => {
    setParticipantData(null);
    setFinalRecord(null);
    setCurrentScreen('welcome');
  }, []);

  // Open mobile preview from kiosk or admin
  const handleOpenMobilePreview = (id: string) => {
    setMobilePhotoId(id);
    setCurrentScreen('mobile');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Loading overlay during server save */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="w-14 h-14 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
          <p className="text-base font-bold text-white">Generando fotografía y código QR...</p>
          <p className="text-xs text-slate-400 mt-1">Guardando en almacenamiento local</p>
        </div>
      )}

      {/* Screen 1: Welcome / Kiosk idle */}
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          config={config}
          onStart={handleStart}
          onOpenAdmin={() => setCurrentScreen('admin')}
        />
      )}

      {/* Screen 2: Registration Form */}
      {currentScreen === 'form' && (
        <FormScreen
          config={config}
          onSubmit={handleFormSubmit}
          onBack={handleResetToWelcome}
        />
      )}

      {/* Screen 3: Camera Capture & Live Branding */}
      {currentScreen === 'camera' && (
        <CameraScreen
          config={config}
          participantData={participantData || {}}
          onPhotoConfirmed={handlePhotoConfirmed}
          onBack={() => setCurrentScreen('form')}
        />
      )}

      {/* Screen 4: Final Photo, QR Code & Auto-reset */}
      {currentScreen === 'ready' && finalRecord && (
        <PhotoReadyScreen
          config={config}
          record={finalRecord}
          onDone={handleResetToWelcome}
          onOpenMobilePreview={handleOpenMobilePreview}
        />
      )}

      {/* Screen 5: Admin Panel */}
      {currentScreen === 'admin' && (
        <AdminPanel
          currentConfig={config}
          onConfigUpdated={(newConfig) => setConfig(newConfig)}
          onReturnToKiosk={() => setCurrentScreen('welcome')}
          onOpenMobilePreview={handleOpenMobilePreview}
        />
      )}

      {/* Screen 6: Mobile QR Download Landing Page */}
      {currentScreen === 'mobile' && (
        <MobilePhotoDownload
          photoId={mobilePhotoId}
          config={config}
          onBackToKiosk={handleResetToWelcome}
        />
      )}
    </div>
  );
}

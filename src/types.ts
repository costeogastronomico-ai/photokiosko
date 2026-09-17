export interface EventConfig {
  eventName: string;
  eventDate: string;
  brandName: string;
  primaryColor: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  autoResetTimeout: number; // in seconds
  kioskPin: string;
  publicBaseUrl: string; // If empty, auto-detects window.location.origin
}

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
export type FrameStyle = 'none' | 'modern-clean' | 'gold-elegant' | 'neon-tech' | 'badge-corner' | 'minimal-card';

export interface BrandingConfig {
  logoUrl: string;
  logoPosition: LogoPosition;
  logoSize: number; // percentage (5 - 40)
  logoMargin: number; // pixels (8 - 60)
  logoOpacity: number; // 0.1 - 1.0
  frameStyle: FrameStyle;
  frameColor: string;
  frameWidth: number;
  overlayText: string;
  textPosition: 'bottom' | 'top' | 'none';
  textColor: string;
  textBgColor: string;
  textFontSize: number;
  textAlign: 'center' | 'left' | 'right';
}

export interface FormFieldConfig {
  enabled: boolean;
  required: boolean;
  label: string;
}

export interface FormConfig {
  fields: {
    nombre: FormFieldConfig;
    apellido: FormFieldConfig;
    email: FormFieldConfig;
    telefono: FormFieldConfig;
    empresa: FormFieldConfig;
    cargo: FormFieldConfig;
    ciudad: FormFieldConfig;
    customField1: FormFieldConfig;
    customField2: FormFieldConfig;
  };
  customField1Label?: string;
  customField2Label?: string;
  consentText: string;
  consentRequired: boolean;
}

export interface PhotoSettingsConfig {
  aspectRatio: '4:3' | '1:1' | '16:9' | '3:4';
  countdownSeconds: number;
  flashEffect: boolean;
  soundEffects: boolean;
}

export interface AppConfig {
  event: EventConfig;
  branding: BrandingConfig;
  form: FormConfig;
  photoSettings: PhotoSettingsConfig;
}

export interface ParticipantRecord {
  id: string; // e.g. SM_20260917_000123
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm:ss
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  empresa: string;
  cargo: string;
  ciudad: string;
  customField1?: string;
  customField2?: string;
  consentimiento: boolean;
  foto_id: string;
  foto_path: string;
  foto_url: string;
  qr_url: string;
  qr_data_url: string;
  created_at: string;
  status: 'completed' | 'pending';
}

export interface DashboardStats {
  totalParticipants: number;
  totalPhotos: number;
  photosToday: number;
  latestPhoto?: {
    id: string;
    foto_url: string;
    nombre: string;
    apellido: string;
    empresa: string;
    created_at: string;
  };
  participantsByHour: { hour: string; count: number }[];
  topCompanies: { name: string; count: number }[];
}

export const DEFAULT_CONFIG: AppConfig = {
  event: {
    eventName: 'Expo Minería & Tech 2026',
    eventDate: '2026-09-17',
    brandName: 'StandMetrics Interactive',
    primaryColor: '#2563eb', // Blue-600
    welcomeTitle: '¡Crea tu foto!',
    welcomeSubtitle: 'Completa tus datos y tómate una foto instantánea del recuerdo.',
    autoResetTimeout: 20,
    kioskPin: '1234',
    publicBaseUrl: '',
  },
  branding: {
    logoUrl: '/default-logo.svg',
    logoPosition: 'top-right',
    logoSize: 16,
    logoMargin: 24,
    logoOpacity: 0.95,
    frameStyle: 'modern-clean',
    frameColor: '#2563eb',
    frameWidth: 16,
    overlayText: 'Expo Minería 2026 • Yo estuve aquí',
    textPosition: 'bottom',
    textColor: '#ffffff',
    textBgColor: 'rgba(15, 23, 42, 0.85)',
    textFontSize: 22,
    textAlign: 'center',
  },
  form: {
    fields: {
      nombre: { enabled: true, required: true, label: 'Nombre' },
      apellido: { enabled: true, required: true, label: 'Apellido' },
      email: { enabled: true, required: true, label: 'Email' },
      telefono: { enabled: true, required: false, label: 'Teléfono celular' },
      empresa: { enabled: true, required: true, label: 'Empresa / Institución' },
      cargo: { enabled: true, required: false, label: 'Cargo u Ocupación' },
      ciudad: { enabled: true, required: false, label: 'Ciudad' },
      customField1: { enabled: false, required: false, label: 'Sector de interés' },
      customField2: { enabled: false, required: false, label: '¿Cómo nos conociste?' },
    },
    consentText: 'Acepto el uso de mis datos para los fines informados por la organización y la entrega de mi fotografía.',
    consentRequired: true,
  },
  photoSettings: {
    aspectRatio: '4:3',
    countdownSeconds: 3,
    flashEffect: true,
    soundEffects: true,
  },
};

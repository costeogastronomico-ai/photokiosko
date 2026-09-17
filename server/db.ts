import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { AppConfig, ParticipantRecord, DashboardStats, DEFAULT_CONFIG } from '../src/types.js';

export { DEFAULT_CONFIG };

const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const PHOTOS_DIR = path.join(STORAGE_ROOT, 'photos');
const BRANDING_DIR = path.join(STORAGE_ROOT, 'branding');
const DB_FILE = path.join(STORAGE_ROOT, 'database.json');

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  if (!fs.existsSync(BRANDING_DIR)) fs.mkdirSync(BRANDING_DIR, { recursive: true });
}

interface DatabaseSchema {
  config: AppConfig;
  participants: ParticipantRecord[];
  sequence: number;
}

// Generate an SVG sample photo for initial seed entries
function generateSamplePhotoBase64(name: string, company: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="${color}" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#818cf8" />
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg)" />
    <circle cx="400" cy="240" r="100" fill="#334155" stroke="#94a3b8" stroke-width="4"/>
    <circle cx="400" cy="210" r="45" fill="#64748b" />
    <path d="M 330 310 Q 400 280 470 310 Z" fill="#64748b" />
    <rect x="40" y="440" width="720" height="120" rx="16" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" stroke-width="2"/>
    <text x="400" y="485" fill="#f8fafc" font-size="28" font-family="sans-serif" font-weight="bold" text-anchor="middle">${name}</text>
    <text x="400" y="525" fill="#94a3b8" font-size="20" font-family="sans-serif" text-anchor="middle">${company} • Expo Minería 2026</text>
    <rect x="0" y="0" width="800" height="600" fill="none" stroke="${color}" stroke-width="18" />
    <g transform="translate(620, 30)">
      <rect width="150" height="46" rx="8" fill="#1e293b" opacity="0.9"/>
      <text x="75" y="30" fill="#38bdf8" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">STANDMETRICS</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

class PhotoboothDatabase {
  private data: DatabaseSchema;

  constructor() {
    ensureDirs();
    this.data = this.loadDatabase();
    this.ensureAllQrs();
  }

  private async ensureAllQrs() {
    let updated = false;
    for (const p of this.data.participants) {
      if (!p.qr_data_url) {
        try {
          p.qr_data_url = await QRCode.toDataURL(p.qr_url || `/photo/${p.id}`, {
            width: 320,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          updated = true;
        } catch (e) {
          console.error('Error generating QR for participant:', p.id, e);
        }
      }
    }
    if (updated) {
      this.saveData(this.data);
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (!parsed.config) parsed.config = DEFAULT_CONFIG;
        if (!Array.isArray(parsed.participants)) parsed.participants = [];
        if (typeof parsed.sequence !== 'number') parsed.sequence = parsed.participants.length;
        return parsed;
      } catch (err) {
        console.error('Error reading database.json, initializing fresh db:', err);
      }
    }

    // Initialize with default configuration and realistic sample records
    const initialData: DatabaseSchema = {
      config: DEFAULT_CONFIG,
      participants: [],
      sequence: 120,
    };

    // Pre-populate with sample attendees for the event
    const sampleAttendees = [
      { nombre: 'Camila', apellido: 'Valenzuela', email: 'c.valenzuela@codelco.cl', empresa: 'Codelco Chile', cargo: 'Jefa de Innovación', ciudad: 'Santiago' },
      { nombre: 'Rodrigo', apellido: 'Pérez', email: 'rperez@antofagasta.co.uk', empresa: 'Antofagasta Minerals', cargo: 'Ingeniero Senior Mina', ciudad: 'Antofagasta' },
      { nombre: 'Valentina', apellido: 'Morales', email: 'vmorales@bhp.com', empresa: 'BHP Escondida', cargo: 'Superintendente Automatización', ciudad: 'Calama' },
      { nombre: 'Matías', apellido: 'Silva', email: 'msilva@angloamerican.com', empresa: 'Anglo American', cargo: 'Gerente Operaciones', ciudad: 'Iquique' },
      { nombre: 'Francisca', apellido: 'Lagos', email: 'flagos@teck.com', empresa: 'Teck Quebrada Blanca', cargo: 'Especialista en Datos', ciudad: 'La Serena' },
    ];

    const todayStr = '2026-09-17';
    const dayDir = path.join(PHOTOS_DIR, todayStr);
    if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });

    sampleAttendees.forEach((attendee, index) => {
      const seq = 100 + index + 1;
      const paddedSeq = String(seq).padStart(6, '0');
      const id = `SM_${todayStr.replace(/-/g, '')}_${paddedSeq}`;
      const filename = `${id}.jpg`;
      const filePath = path.join(dayDir, filename);

      // Create a real placeholder file on disk
      const photoContent = generateSamplePhotoBase64(`${attendee.nombre} ${attendee.apellido}`, attendee.empresa, '#1d4ed8');
      fs.writeFileSync(filePath, photoContent, 'utf-8');

      const hour = String(10 + Math.floor(index * 1.5)).padStart(2, '0');
      const minute = String(12 + index * 8).padStart(2, '0');

      initialData.participants.push({
        id,
        fecha: todayStr,
        hora: `${hour}:${minute}:00`,
        nombre: attendee.nombre,
        apellido: attendee.apellido,
        email: attendee.email,
        telefono: `+56 9 8765 ${4320 + index}`,
        empresa: attendee.empresa,
        cargo: attendee.cargo,
        ciudad: attendee.ciudad,
        consentimiento: true,
        foto_id: id,
        foto_path: `/photobooth/photos/${todayStr}/${filename}`,
        foto_url: `/api/photos/${todayStr}/${filename}`,
        qr_url: `/photo/${id}`,
        qr_data_url: '',
        created_at: `${todayStr}T${hour}:${minute}:00.000Z`,
        status: 'completed',
      });
    });

    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema) {
    ensureDirs();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public getConfig(): AppConfig {
    return this.data.config;
  }

  public updateConfig(newConfig: Partial<AppConfig>): AppConfig {
    this.data.config = {
      ...this.data.config,
      ...newConfig,
      event: { ...this.data.config.event, ...newConfig.event },
      branding: { ...this.data.config.branding, ...newConfig.branding },
      form: { ...this.data.config.form, ...newConfig.form },
      photoSettings: { ...this.data.config.photoSettings, ...newConfig.photoSettings },
    };
    this.saveData(this.data);
    return this.data.config;
  }

  public resetConfig(): AppConfig {
    this.data.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.saveData(this.data);
    return this.data.config;
  }

  public async saveParticipantWithPhoto(params: {
    participantData: {
      nombre: string;
      apellido: string;
      email: string;
      telefono?: string;
      empresa: string;
      cargo?: string;
      ciudad?: string;
      customField1?: string;
      customField2?: string;
      consentimiento: boolean;
    };
    photoBase64: string; // Base64 data URL
    baseUrl: string;
  }): Promise<ParticipantRecord> {
    ensureDirs();
    this.data.sequence += 1;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dateCompact = `${yyyy}${mm}${dd}`;
    const timeStr = now.toTimeString().split(' ')[0];

    const seqStr = String(this.data.sequence).padStart(6, '0');
    const participantId = `SM_${dateCompact}_${seqStr}`;
    const filename = `${participantId}.jpg`;

    const dayDir = path.join(PHOTOS_DIR, dateStr);
    if (!fs.existsSync(dayDir)) {
      fs.mkdirSync(dayDir, { recursive: true });
    }

    const filePath = path.join(dayDir, filename);

    // Save image to disk
    const base64Data = params.photoBase64.replace(/^data:image\/\w+;base64,/, '');
    if (params.photoBase64.startsWith('data:image/svg+xml;base64,')) {
      // SVG data
      fs.writeFileSync(filePath, params.photoBase64, 'utf-8');
    } else {
      // Binary image
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
    }

    // Determine the QR URL that user scans with their phone
    const cleanBaseUrl = (this.data.config.event.publicBaseUrl || params.baseUrl || '').replace(/\/$/, '');
    const mobilePhotoUrl = `${cleanBaseUrl}/photo/${participantId}`;

    // Generate real scannable QR Code as Data URL
    const qrDataUrl = await QRCode.toDataURL(mobilePhotoUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const record: ParticipantRecord = {
      id: participantId,
      fecha: dateStr,
      hora: timeStr,
      nombre: params.participantData.nombre || '',
      apellido: params.participantData.apellido || '',
      email: params.participantData.email || '',
      telefono: params.participantData.telefono || '',
      empresa: params.participantData.empresa || '',
      cargo: params.participantData.cargo || '',
      ciudad: params.participantData.ciudad || '',
      customField1: params.participantData.customField1 || '',
      customField2: params.participantData.customField2 || '',
      consentimiento: params.participantData.consentimiento,
      foto_id: participantId,
      foto_path: `/photobooth/photos/${dateStr}/${filename}`,
      foto_url: `/api/photos/${dateStr}/${filename}`,
      qr_url: mobilePhotoUrl,
      qr_data_url: qrDataUrl,
      created_at: now.toISOString(),
      status: 'completed',
    };

    this.data.participants.unshift(record);
    this.saveData(this.data);

    return record;
  }

  public getParticipants(filter?: { search?: string; date?: string; empresa?: string }): ParticipantRecord[] {
    let result = [...this.data.participants];

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.apellido.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.empresa.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    if (filter?.date) {
      result = result.filter((p) => p.fecha === filter.date);
    }

    if (filter?.empresa) {
      result = result.filter((p) => p.empresa.toLowerCase() === filter.empresa?.toLowerCase());
    }

    return result;
  }

  public getParticipantById(id: string): ParticipantRecord | undefined {
    return this.data.participants.find((p) => p.id === id);
  }

  public deleteParticipant(id: string): boolean {
    const index = this.data.participants.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const record = this.data.participants[index];
    this.data.participants.splice(index, 1);
    this.saveData(this.data);

    // Also delete photo file on disk if exists
    try {
      const filename = `${record.foto_id}.jpg`;
      const filePath = path.join(PHOTOS_DIR, record.fecha, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error removing photo file:', e);
    }

    return true;
  }

  public getStats(): DashboardStats {
    const totalParticipants = this.data.participants.length;
    const totalPhotos = this.data.participants.filter((p) => p.status === 'completed').length;
    const today = new Date().toISOString().split('T')[0];
    const photosToday = this.data.participants.filter((p) => p.fecha === today || p.fecha === '2026-09-17').length;

    const latest = this.data.participants[0];
    const latestPhoto = latest
      ? {
          id: latest.id,
          foto_url: latest.foto_url,
          nombre: latest.nombre,
          apellido: latest.apellido,
          empresa: latest.empresa,
          created_at: latest.created_at,
        }
      : undefined;

    // Participants by hour
    const hourMap: Record<string, number> = {};
    for (let h = 8; h <= 20; h++) {
      hourMap[`${String(h).padStart(2, '0')}:00`] = 0;
    }

    this.data.participants.forEach((p) => {
      if (p.hora) {
        const hour = p.hora.split(':')[0] + ':00';
        if (hourMap[hour] !== undefined) {
          hourMap[hour] += 1;
        } else {
          hourMap[hour] = 1;
        }
      }
    });

    const participantsByHour = Object.entries(hourMap).map(([hour, count]) => ({ hour, count }));

    // Top companies
    const companyMap: Record<string, number> = {};
    this.data.participants.forEach((p) => {
      const emp = (p.empresa || 'Particular').trim();
      companyMap[emp] = (companyMap[emp] || 0) + 1;
    });

    const topCompanies = Object.entries(companyMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalParticipants,
      totalPhotos,
      photosToday,
      latestPhoto,
      participantsByHour,
      topCompanies,
    };
  }

  public generateCSV(): string {
    const headers = [
      'ID',
      'Fecha',
      'Hora',
      'Nombre',
      'Apellido',
      'Email',
      'Teléfono',
      'Empresa',
      'Cargo',
      'Ciudad',
      'Consentimiento',
      'Ruta Foto Disco',
      'URL Foto',
      'URL QR Móvil',
      'Estado',
      'Creado En',
    ];

    const escapeCSV = (str: string | number | boolean | undefined) => {
      if (str === undefined || str === null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = this.data.participants.map((p) => [
      escapeCSV(p.id),
      escapeCSV(p.fecha),
      escapeCSV(p.hora),
      escapeCSV(p.nombre),
      escapeCSV(p.apellido),
      escapeCSV(p.email),
      escapeCSV(p.telefono),
      escapeCSV(p.empresa),
      escapeCSV(p.cargo),
      escapeCSV(p.ciudad),
      escapeCSV(p.consentimiento ? 'SI' : 'NO'),
      escapeCSV(p.foto_path),
      escapeCSV(p.foto_url),
      escapeCSV(p.qr_url),
      escapeCSV(p.status),
      escapeCSV(p.created_at),
    ]);

    // Prepend UTF-8 BOM so Excel properly renders Spanish accents and characters
    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  public saveUploadedLogo(filename: string, buffer: Buffer): string {
    ensureDirs();
    const safeName = `logo_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const filePath = path.join(BRANDING_DIR, safeName);
    fs.writeFileSync(filePath, buffer);
    const logoUrl = `/api/branding/${safeName}`;
    this.data.config.branding.logoUrl = logoUrl;
    this.saveData(this.data);
    return logoUrl;
  }

  public getPhotoFilePath(date: string, filename: string): string | null {
    const filePath = path.join(PHOTOS_DIR, date, filename);
    if (fs.existsSync(filePath)) return filePath;
    return null;
  }

  public getBrandingFilePath(filename: string): string | null {
    const filePath = path.join(BRANDING_DIR, filename);
    if (fs.existsSync(filePath)) return filePath;
    return null;
  }
}

export const db = new PhotoboothDatabase();

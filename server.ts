import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';

const app = express();
const PORT = 3000;

// Setup JSON body parsing with larger limit for photo uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer for logo upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Config endpoints
app.get('/api/config', (req, res) => {
  try {
    const config = db.getConfig();
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const { config, pin } = req.body;
    const currentConfig = db.getConfig();
    if (pin && pin !== currentConfig.event.kioskPin) {
      return res.status(401).json({ success: false, error: 'PIN incorrecto' });
    }
    const updated = db.updateConfig(config);
    res.json({ success: true, config: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/config/reset', (req, res) => {
  try {
    const { pin } = req.body;
    const currentConfig = db.getConfig();
    if (pin && pin !== currentConfig.event.kioskPin) {
      return res.status(401).json({ success: false, error: 'PIN incorrecto' });
    }
    const reset = db.resetConfig();
    res.json({ success: true, config: reset });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logo upload endpoint
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se envió ningún archivo de imagen' });
    }
    const logoUrl = db.saveUploadedLogo(req.file.originalname, req.file.buffer);
    res.json({ success: true, logoUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save photo & participant endpoint
app.post('/api/save-photo', async (req, res) => {
  try {
    const { participantData, photoBase64 } = req.body;
    if (!photoBase64) {
      return res.status(400).json({ success: false, error: 'Datos de fotografía requeridos' });
    }

    // Determine base URL from header if not explicitly configured
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const defaultBaseUrl = `${protocol}://${host}`;

    const record = await db.saveParticipantWithPhoto({
      participantData: participantData || {},
      photoBase64,
      baseUrl: defaultBaseUrl,
    });

    res.json({ success: true, record });
  } catch (error: any) {
    console.error('Error saving photo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Participants list & filter
app.get('/api/participants', (req, res) => {
  try {
    const { search, date, empresa } = req.query as {
      search?: string;
      date?: string;
      empresa?: string;
    };
    const list = db.getParticipants({ search, date, empresa });
    res.json({ success: true, participants: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stats for dashboard
app.get('/api/participants/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single participant by ID
app.get('/api/participants/:id', (req, res) => {
  try {
    const record = db.getParticipantById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Registro no encontrado' });
    }
    res.json({ success: true, participant: record });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete participant & photo
app.delete('/api/participants/:id', (req, res) => {
  try {
    const success = db.deleteParticipant(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Registro no encontrado' });
    }
    res.json({ success: true, message: 'Registro eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export CSV
app.get('/api/export-csv', (req, res) => {
  try {
    const csvContent = db.generateCSV();
    const today = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="participantes_photobooth_${today}.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).send('Error generating CSV');
  }
});

// Serve physical photo from disk
app.get('/api/photos/:date/:filename', (req, res) => {
  const { date, filename } = req.params;
  const filePath = db.getPhotoFilePath(date, filename);
  if (!filePath) {
    return res.status(404).send('Fotografía no encontrada');
  }

  // Check if it's SVG data or JPEG
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    const head = Buffer.alloc(30);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, head, 0, 30, 0);
    fs.closeSync(fd);
    const headStr = head.toString('utf-8');
    if (headStr.includes('data:image/svg+xml')) {
      const full = fs.readFileSync(filePath, 'utf-8');
      const base64 = full.replace('data:image/svg+xml;base64,', '');
      const svg = Buffer.from(base64, 'base64').toString('utf-8');
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (filename.endsWith('.svg')) {
    res.setHeader('Content-Type', 'image/svg+xml');
  } else {
    res.setHeader('Content-Type', 'image/png');
  }

  res.sendFile(filePath);
});

// Force download photo attachment
app.get('/api/download/:id', (req, res) => {
  const record = db.getParticipantById(req.params.id);
  if (!record) {
    return res.status(404).send('Fotografía no encontrada');
  }

  const filename = `${record.foto_id}.jpg`;
  const filePath = db.getPhotoFilePath(record.fecha, filename);
  if (!filePath) {
    return res.status(404).send('Archivo de fotografía no encontrado en disco');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.sendFile(filePath);
});

// Serve branding assets
app.get('/api/branding/:filename', (req, res) => {
  const filePath = db.getBrandingFilePath(req.params.filename);
  if (!filePath) {
    return res.status(404).send('Logo no encontrado');
  }
  res.sendFile(filePath);
});

// ================= VITE / FRONTEND SERVING =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Photobooth Digital server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

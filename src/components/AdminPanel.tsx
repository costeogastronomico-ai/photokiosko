import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  Download,
  Search,
  Calendar,
  Filter,
  Trash2,
  Eye,
  Camera,
  Check,
  RefreshCw,
  Upload,
  ArrowLeft,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Clock,
  Building,
  Smartphone,
  Shield,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { AppConfig, ParticipantRecord, DashboardStats, LogoPosition, FrameStyle, FormFieldConfig } from '../types.js';
import {
  fetchConfig,
  saveConfig,
  resetConfig,
  uploadLogo,
  fetchParticipants,
  fetchStats,
  deleteParticipant
} from '../utils/api.js';
import { processBrandedPhoto } from '../utils/photoProcessor.js';

interface AdminPanelProps {
  currentConfig: AppConfig;
  onConfigUpdated: (config: AppConfig) => void;
  onReturnToKiosk: () => void;
  onOpenMobilePreview: (id: string) => void;
}

export default function AdminPanel({
  currentConfig,
  onConfigUpdated,
  onReturnToKiosk,
  onOpenMobilePreview,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'config'>('dashboard');

  // Stats & Records
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');

  // Selected participant for modal
  const [selectedRecord, setSelectedRecord] = useState<ParticipantRecord | null>(null);

  // Config editing state
  const [configDraft, setConfigDraft] = useState<AppConfig>(currentConfig);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [brandingPreviewUrl, setBrandingPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load stats and participants
  const loadData = async () => {
    try {
      setLoading(true);
      const [s, p] = await Promise.all([
        fetchStats(),
        fetchParticipants({ search: searchQuery, date: dateFilter, empresa: empresaFilter }),
      ]);
      setStats(s);
      setParticipants(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, dateFilter, empresaFilter]);

  // Update branding live preview canvas
  useEffect(() => {
    let active = true;
    async function updatePreview() {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 800;
        offCanvas.height = 600;
        const ctx = offCanvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 800, 600);
          grad.addColorStop(0, '#1e293b');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 800, 600);

          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(400, 260, 110, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(400, 520, 180, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Vista Previa de Foto', 400, 500);
        }

        const branded = await processBrandedPhoto(
          offCanvas,
          configDraft.branding,
          configDraft.photoSettings,
          false
        );
        if (active) setBrandingPreviewUrl(branded);
      } catch (err) {
        console.error('Preview error:', err);
      }
    }
    updatePreview();
    return () => {
      active = false;
    };
  }, [configDraft.branding, configDraft.photoSettings]);

  // Save config changes to server
  const handleSaveConfig = async () => {
    try {
      setIsSavingConfig(true);
      const updated = await saveConfig(configDraft);
      onConfigUpdated(updated);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al guardar configuración');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Reset config to defaults
  const handleResetDefaults = async () => {
    if (!confirm('¿Estás seguro de restablecer toda la configuración a los valores por defecto?')) return;
    try {
      const reset = await resetConfig();
      setConfigDraft(reset);
      onConfigUpdated(reset);
      alert('Configuración restablecida');
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Upload logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadLogo(file);
      setConfigDraft((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          logoUrl: url,
        },
      }));
    } catch (err: any) {
      alert(err.message || 'Error al subir el logo');
    }
  };

  // Delete participant
  const handleDeleteParticipant = async (id: string) => {
    if (!confirm(`¿Estás seguro de eliminar el registro ${id} y su fotografía?`)) return;
    try {
      await deleteParticipant(id);
      setSelectedRecord(null);
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            id="btn-admin-volver-kiosk"
            onClick={onReturnToKiosk}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Modo Kiosk</span>
          </button>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              PANEL ADMINISTRATIVO
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-blue-400 font-mono">
              {currentConfig.event.eventName}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            id="tab-records"
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'records'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registros ({participants.length})</span>
          </button>

          <button
            id="tab-config"
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración</span>
          </button>
        </div>

        {/* Export CSV action */}
        <a
          id="btn-exportar-csv"
          href="/api/export-csv"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>EXPORTAR CSV</span>
        </a>
      </header>

      {/* Main Tab Views */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Participantes</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white">{stats.totalParticipants}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-emerald-400">●</span> Registros con consentimiento
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Fotografías</span>
                  <Camera className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white">{stats.totalPhotos}</div>
                <div className="text-xs text-slate-400 mt-2">Guardadas en almacenamiento local</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Fotos Hoy</span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400">{stats.photosToday}</div>
                <div className="text-xs text-slate-400 mt-2">Actividad de la jornada</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tasa de Finalización</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white">100%</div>
                <div className="text-xs text-slate-400 mt-2">Formulario + Foto + QR</div>
              </div>
            </div>

            {/* Middle Section: Hourly Activity & Latest Photo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Hourly Chart */}
              <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Afluencia y Participantes por Hora</h3>
                    <p className="text-xs text-slate-400">Distribución de capturas durante el evento</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                    Hoy
                  </span>
                </div>

                {/* Visual Bar Chart */}
                <div className="h-48 flex items-end gap-2 pt-6 pb-2 px-2">
                  {stats.participantsByHour.map((item, idx) => {
                    const maxVal = Math.max(...stats.participantsByHour.map((x) => x.count), 1);
                    const heightPct = Math.max(8, (item.count / maxVal) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {item.count}
                        </div>
                        <div
                          className={`w-full rounded-t-lg transition-all ${
                            item.count > 0 ? 'bg-gradient-to-t from-blue-600 to-indigo-500' : 'bg-slate-800/40'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                        <span className="text-[10px] text-slate-500 mt-2 block transform -rotate-45 sm:rotate-0 origin-top-left">
                          {item.hour.slice(0, 2)}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest Photo Card */}
              <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
                <h3 className="text-base font-bold text-white mb-1">Última Fotografía</h3>
                <p className="text-xs text-slate-400 mb-4">Capturada recientemente en la estación</p>

                {stats.latestPhoto ? (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-md mb-3">
                      <img
                        src={stats.latestPhoto.foto_url}
                        alt="Última foto"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="w-full text-center">
                      <div className="font-bold text-sm text-white">
                        {stats.latestPhoto.nombre} {stats.latestPhoto.apellido}
                      </div>
                      <div className="text-xs text-slate-400">{stats.latestPhoto.empresa}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    Sin fotos registradas aún
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Top Companies Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-base font-bold text-white mb-1">Empresas con Mayor Participación</h3>
              <p className="text-xs text-slate-400 mb-4">Organizaciones activas registradas en el Photobooth</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {stats.topCompanies.map((c, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Building className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-200 truncate">{c.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RECORDS / REGISTROS */}
        {activeTab === 'records' && (
          <div className="space-y-6">
            {/* Search & Filters Header */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, empresa, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-transparent text-slate-200 outline-none text-xs"
                  />
                  {dateFilter && (
                    <button onClick={() => setDateFilter('')} className="text-slate-500 hover:text-slate-300">
                      ×
                    </button>
                  )}
                </div>

                <button
                  onClick={loadData}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Recargar datos"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Records Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Fecha y Hora</th>
                      <th className="py-3 px-4">Participante</th>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Foto</th>
                      <th className="py-3 px-4 text-center">QR</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {participants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No se encontraron registros que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      participants.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-slate-200">{p.fecha}</span>
                            <span className="text-xs text-slate-500 block">{p.hora}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">
                              {p.nombre} {p.apellido}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{p.id}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-200">{p.empresa || '-'}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-xs">{p.email}</td>
                          <td className="py-3 px-4">
                            <img
                              src={p.foto_url}
                              alt="Thumbnail"
                              className="w-12 h-9 rounded-lg object-cover bg-black border border-slate-700 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => setSelectedRecord(p)}
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {p.qr_data_url && (
                              <img
                                src={p.qr_data_url}
                                alt="QR"
                                className="w-8 h-8 mx-auto rounded bg-white p-0.5"
                              />
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedRecord(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <a
                                href={`/api/download/${p.id}`}
                                download={`${p.id}.jpg`}
                                className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400"
                                title="Descargar foto"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteParticipant(p.id)}
                                className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="space-y-8">
            {saveSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Configuración guardada exitosamente y sincronizada con el Kiosk.</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-7 space-y-8">
                {/* 1. Event Settings */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Datos del Evento</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Personaliza el nombre, marca y textos de la experiencia.
                  </p>

                  <div className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Nombre del Evento
                      </label>
                      <input
                        type="text"
                        value={configDraft.event.eventName}
                        onChange={(e) =>
                          setConfigDraft((prev) => ({
                            ...prev,
                            event: { ...prev.event, eventName: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Marca / Empresa
                        </label>
                        <input
                          type="text"
                          value={configDraft.event.brandName}
                          onChange={(e) =>
                            setConfigDraft((prev) => ({
                              ...prev,
                              event: { ...prev.event, brandName: e.target.value },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Fecha del Evento
                        </label>
                        <input
                          type="date"
                          value={configDraft.event.eventDate}
                          onChange={(e) =>
                            setConfigDraft((prev) => ({
                              ...prev,
                              event: { ...prev.event, eventDate: e.target.value },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Título de Bienvenida (Pantalla 1)
                      </label>
                      <input
                        type="text"
                        value={configDraft.event.welcomeTitle}
                        onChange={(e) =>
                          setConfigDraft((prev) => ({
                            ...prev,
                            event: { ...prev.event, welcomeTitle: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Subtítulo de Bienvenida
                      </label>
                      <input
                        type="text"
                        value={configDraft.event.welcomeSubtitle}
                        onChange={(e) =>
                          setConfigDraft((prev) => ({
                            ...prev,
                            event: { ...prev.event, welcomeSubtitle: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Tiempo de reinicio Kiosk (segundos)
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={120}
                          value={configDraft.event.autoResetTimeout}
                          onChange={(e) =>
                            setConfigDraft((prev) => ({
                              ...prev,
                              event: { ...prev.event, autoResetTimeout: parseInt(e.target.value) || 15 },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          PIN de Administrador
                        </label>
                        <input
                          type="password"
                          value={configDraft.event.kioskPin}
                          onChange={(e) =>
                            setConfigDraft((prev) => ({
                              ...prev,
                              event: { ...prev.event, kioskPin: e.target.value },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Base URL for Mobile QR download */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        URL Base del Sistema QR (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Dejar en blanco para autodetectar, o ej. http://192.168.1.50:3000"
                        value={configDraft.event.publicBaseUrl}
                        onChange={(e) =>
                          setConfigDraft((prev) => ({
                            ...prev,
                            event: { ...prev.event, publicBaseUrl: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500 text-xs font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Si el teléfono y el computador están en la misma red Wi-Fi local sin internet, ingresa la IP local del equipo (ej. http://192.168.1.100:3000).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Photo Branding Settings */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Branding Automático de Fotografía</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Configura el logo, marco y texto impresos en la imagen final.
                  </p>

                  <div className="space-y-5 text-xs sm:text-sm">
                    {/* Logo Uploader */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Logotipo del Evento / Marca
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-14 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center p-2">
                          <img
                            src={configDraft.branding.logoUrl || '/default-logo.svg'}
                            alt="Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir Nuevo Logo (PNG/JPG/SVG)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Logo Position */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Posición del Logo
                        </label>
                        <select
                          value={configDraft.branding.logoPosition}
                          onChange={(e) =>
                            setConfigDraft((prev) => ({
                              ...prev,
                              branding: {
                                ...prev.branding,
                                logoPosition: e.target.value as LogoPosition,
                              },
                            }))
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none text-xs"
                        >
                          <option value="top-left">Superior Izquierda</option>
                          <option value="top-right">Superior Derecha</option>
                          <option value="bottom-left">Inferior Izquierda</option>
                          <option value="bottom-right">Inferior Derecha</option>
                          <option value="center">Centro</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Tamaño del Logo ({configDraft.branding.logoSize}%)
                        </label>
                        <input
                          type="range"
                          min={8}
                          max={35}
                          value={configDraft.branding.logoSize}
                          onChange={(e) =>
                            setConfigDraft((prev) => ({
                              ...prev,
                              branding: {
                                ...prev.branding,
                                logoSize: parseInt(e.target.value),
                              },
                            }))
                          }
                          className="w-full accent-blue-500 mt-2"
                        />
                      </div>
                    </div>

                    {/* Graphic Frame Style */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Estilo de Marco Gráfico
                        </label>
                        <select
                          value={configDraft.branding.frameStyle}
                          onChange={(e) =>
                            setConfigDraft((prev) => ({
                              ...prev,
                              branding: {
                                ...prev.branding,
                                frameStyle: e.target.value as FrameStyle,
                              },
                            }))
                          }
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none text-xs"
                        >
                          <option value="modern-clean">Modern Clean (Borde azul sutil)</option>
                          <option value="gold-elegant">Gold Elegant (Borde dorado premium)</option>
                          <option value="neon-tech">Neon Tech (Efecto tecnológico)</option>
                          <option value="badge-corner">Badge Corner</option>
                          <option value="minimal-card">Minimal Card</option>
                          <option value="none">Sin Marco</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Color del Marco
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={configDraft.branding.frameColor}
                            onChange={(e) =>
                              setConfigDraft((prev) => ({
                                ...prev,
                                branding: { ...prev.branding, frameColor: e.target.value },
                              }))
                            }
                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                          />
                          <span className="font-mono text-xs text-slate-300">
                            {configDraft.branding.frameColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Overlay Text */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Texto Inferior de la Fotografía
                      </label>
                      <input
                        type="text"
                        value={configDraft.branding.overlayText}
                        onChange={(e) =>
                          setConfigDraft((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, overlayText: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Form Field Configuration */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Configuración de Campos del Formulario</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Activa o desactiva qué campos solicitar y cuáles son obligatorios.
                  </p>

                  <div className="space-y-3">
                    {(Object.entries(configDraft.form.fields) as [string, FormFieldConfig][]).map(([fieldName, fieldConfig]) => (
                      <div
                        key={fieldName}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm"
                      >
                        <span className="font-semibold text-slate-200 capitalize">
                          {fieldConfig.label}
                        </span>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400">
                            <input
                              type="checkbox"
                              checked={fieldConfig.enabled}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setConfigDraft((prev) => ({
                                  ...prev,
                                  form: {
                                    ...prev.form,
                                    fields: {
                                      ...prev.form.fields,
                                      [fieldName]: {
                                        ...fieldConfig,
                                        enabled: checked,
                                      },
                                    },
                                  },
                                }));
                              }}
                              className="rounded border-slate-700 text-blue-600 bg-slate-900"
                            />
                            <span>Habilitado</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400">
                            <input
                              type="checkbox"
                              checked={fieldConfig.required}
                              disabled={!fieldConfig.enabled}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setConfigDraft((prev) => ({
                                  ...prev,
                                  form: {
                                    ...prev.form,
                                    fields: {
                                      ...prev.form.fields,
                                      [fieldName]: {
                                        ...fieldConfig,
                                        required: checked,
                                      },
                                    },
                                  },
                                }));
                              }}
                              className="rounded border-slate-700 text-rose-500 bg-slate-900 disabled:opacity-30"
                            />
                            <span>Obligatorio</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Actions Bar */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    id="btn-guardar-config"
                    type="button"
                    disabled={isSavingConfig}
                    onClick={handleSaveConfig}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingConfig ? 'Guardando...' : 'GUARDAR CONFIGURACIÓN'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                  >
                    Valores por Defecto
                  </button>
                </div>
              </div>

              {/* Right Column: Live Interactive Branding Preview */}
              <div className="lg:col-span-5 space-y-6">
                <div className="sticky top-20 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span>Vista Previa del Branding en Vivo</span>
                    </h3>
                    <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                      En Tiempo Real
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Así quedará estampada la fotografía tomada por cada participante.
                  </p>

                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                    {brandingPreviewUrl ? (
                      <img
                        src={brandingPreviewUrl}
                        alt="Preview branding"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                        Generando previsualización...
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950 text-xs space-y-1 text-slate-400 border border-slate-800">
                    <div className="flex justify-between">
                      <span>Marco:</span>
                      <span className="text-slate-200">{configDraft.branding.frameStyle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Posición Logo:</span>
                      <span className="text-slate-200">{configDraft.branding.logoPosition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolución Salida:</span>
                      <span className="text-slate-200">1600 × 1200 px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal for Selected Participant */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-xs font-mono text-blue-400 block">{selectedRecord.id}</span>
                <h3 className="text-lg font-bold text-white">
                  {selectedRecord.nombre} {selectedRecord.apellido}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-800 shadow-md">
                <img
                  src={selectedRecord.foto_url}
                  alt="Foto"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Email</span>
                  <span className="font-semibold text-slate-200">{selectedRecord.email}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Empresa / Cargo</span>
                  <span className="font-semibold text-slate-200">
                    {selectedRecord.empresa || '-'} • {selectedRecord.cargo || '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Teléfono / Ciudad</span>
                  <span className="font-semibold text-slate-200">
                    {selectedRecord.telefono || '-'} • {selectedRecord.ciudad || '-'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Fecha y Hora</span>
                  <span className="font-semibold text-slate-200">
                    {selectedRecord.fecha} a las {selectedRecord.hora}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => onOpenMobilePreview(selectedRecord.id)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Abrir Vista QR Móvil</span>
              </button>
              <a
                href={`/api/download/${selectedRecord.id}`}
                download={`${selectedRecord.id}.jpg`}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Fotografía</span>
              </a>
              <button
                onClick={() => handleDeleteParticipant(selectedRecord.id)}
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold flex items-center gap-2 border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

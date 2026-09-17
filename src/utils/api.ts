import { AppConfig, ParticipantRecord, DashboardStats } from '../types.js';

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch('/api/config');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al obtener configuración');
  return data.config;
}

export async function saveConfig(config: AppConfig, pin?: string): Promise<AppConfig> {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, pin }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al guardar configuración');
  return data.config;
}

export async function resetConfig(pin?: string): Promise<AppConfig> {
  const res = await fetch('/api/config/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al restablecer configuración');
  return data.config;
}

export async function uploadLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('logo', file);
  const res = await fetch('/api/upload-logo', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al subir logotipo');
  return data.logoUrl;
}

export async function submitPhotoAndParticipant(params: {
  participantData: any;
  photoBase64: string;
}): Promise<ParticipantRecord> {
  const res = await fetch('/api/save-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al procesar y guardar fotografía');
  return data.record;
}

export async function fetchParticipants(params?: {
  search?: string;
  date?: string;
  empresa?: string;
}): Promise<ParticipantRecord[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.date) query.append('date', params.date);
  if (params?.empresa) query.append('empresa', params.empresa);

  const res = await fetch(`/api/participants?${query.toString()}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al listar participantes');
  return data.participants;
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch('/api/participants/stats');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al obtener estadísticas');
  return data.stats;
}

export async function fetchParticipantById(id: string): Promise<ParticipantRecord> {
  const res = await fetch(`/api/participants/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Registro no encontrado');
  return data.participant;
}

export async function deleteParticipant(id: string): Promise<void> {
  const res = await fetch(`/api/participants/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al eliminar participante');
}

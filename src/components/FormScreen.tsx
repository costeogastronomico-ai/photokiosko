import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, Mail, Phone, Building2, Briefcase, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';
import { AppConfig } from '../types.js';

interface FormScreenProps {
  config: AppConfig;
  onSubmit: (formData: any) => void;
  onBack: () => void;
}

export default function FormScreen({ config, onSubmit, onBack }: FormScreenProps) {
  const { form } = config;

  const [formData, setFormData] = useState<Record<string, string>>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    empresa: '',
    cargo: '',
    ciudad: '',
    customField1: '',
    customField2: '',
  });

  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validate fields according to active configuration
    Object.entries(form.fields).forEach(([fieldName, fieldConfig]) => {
      if (!fieldConfig.enabled) return;

      const value = (formData[fieldName] || '').trim();

      if (fieldConfig.required && !value) {
        newErrors[fieldName] = `Por favor ingresa tu ${fieldConfig.label.toLowerCase()}`;
        return;
      }

      // Special email validation
      if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors.email = 'Por favor ingresa un correo electrónico válido';
        }
      }

      // Special phone validation (if provided or required)
      if (fieldName === 'telefono' && value) {
        if (value.length < 6) {
          newErrors.telefono = 'Por favor ingresa un número de teléfono válido';
        }
      }
    });

    if (form.consentRequired && !consent) {
      newErrors.consent = 'Debes aceptar los términos y condiciones para continuar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        consentimiento: consent,
      });
    }
  };

  const handleChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-slate-950 p-4 sm:p-8 md:p-12 overflow-y-auto">
      {/* Top Navigation */}
      <header className="w-full max-w-3xl flex items-center justify-between pb-6 border-b border-slate-800">
        <button
          id="btn-form-volver"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm border border-slate-700/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-blue-400 font-bold">Paso 1 de 3</span>
          <h2 className="text-sm font-semibold text-slate-200">{config.event.eventName}</h2>
        </div>
      </header>

      {/* Form Card */}
      <main className="my-auto w-full max-w-2xl py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Registro del Participante
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Ingresa tus datos para generar tu fotografía personalizada y tu código QR de descarga.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Nombre & Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.fields.nombre.enabled && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    {form.fields.nombre.label} {form.fields.nombre.required && <span className="text-rose-400">*</span>}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      id="input-nombre"
                      type="text"
                      placeholder="Ej. Juan"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border ${
                        errors.nombre ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                      } text-white placeholder-slate-500 outline-none text-base transition-colors`}
                    />
                  </div>
                  {errors.nombre && <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {errors.nombre}</p>}
                </div>
              )}

              {form.fields.apellido.enabled && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    {form.fields.apellido.label} {form.fields.apellido.required && <span className="text-rose-400">*</span>}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      id="input-apellido"
                      type="text"
                      placeholder="Ej. Pérez"
                      value={formData.apellido}
                      onChange={(e) => handleChange('apellido', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border ${
                        errors.apellido ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                      } text-white placeholder-slate-500 outline-none text-base transition-colors`}
                    />
                  </div>
                  {errors.apellido && <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {errors.apellido}</p>}
                </div>
              )}
            </div>

            {/* Row 2: Email & Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.fields.email.enabled && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    {form.fields.email.label} {form.fields.email.required && <span className="text-rose-400">*</span>}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      id="input-email"
                      type="email"
                      inputMode="email"
                      placeholder="juan@empresa.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border ${
                        errors.email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                      } text-white placeholder-slate-500 outline-none text-base transition-colors`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {errors.email}</p>}
                </div>
              )}

              {form.fields.telefono.enabled && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    {form.fields.telefono.label} {form.fields.telefono.required && <span className="text-rose-400">*</span>}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      id="input-telefono"
                      type="tel"
                      inputMode="tel"
                      placeholder="+56 9 1234 5678"
                      value={formData.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border ${
                        errors.telefono ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                      } text-white placeholder-slate-500 outline-none text-base transition-colors`}
                    />
                  </div>
                  {errors.telefono && <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {errors.telefono}</p>}
                </div>
              )}
            </div>

            {/* Row 3: Empresa & Cargo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {form.fields.empresa.enabled && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    {form.fields.empresa.label} {form.fields.empresa.required && <span className="text-rose-400">*</span>}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      id="input-empresa"
                      type="text"
                      placeholder="Ej. Codelco / BHP"
                      value={formData.empresa}
                      onChange={(e) => handleChange('empresa', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border ${
                        errors.empresa ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                      } text-white placeholder-slate-500 outline-none text-base transition-colors`}
                    />
                  </div>
                  {errors.empresa && <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {errors.empresa}</p>}
                </div>
              )}

              {form.fields.cargo.enabled && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    {form.fields.cargo.label} {form.fields.cargo.required && <span className="text-rose-400">*</span>}
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      id="input-cargo"
                      type="text"
                      placeholder="Ej. Gerente de Innovación"
                      value={formData.cargo}
                      onChange={(e) => handleChange('cargo', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border ${
                        errors.cargo ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                      } text-white placeholder-slate-500 outline-none text-base transition-colors`}
                    />
                  </div>
                  {errors.cargo && <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {errors.cargo}</p>}
                </div>
              )}
            </div>

            {/* Row 4: Ciudad */}
            {form.fields.ciudad.enabled && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  {form.fields.ciudad.label} {form.fields.ciudad.required && <span className="text-rose-400">*</span>}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="input-ciudad"
                    type="text"
                    placeholder="Ej. Antofagasta, Calama, Santiago"
                    value={formData.ciudad}
                    onChange={(e) => handleChange('ciudad', e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border ${
                      errors.ciudad ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-blue-500'
                    } text-white placeholder-slate-500 outline-none text-base transition-colors`}
                  />
                </div>
                {errors.ciudad && <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {errors.ciudad}</p>}
              </div>
            )}

            {/* Custom fields if enabled */}
            {form.fields.customField1.enabled && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  {form.fields.customField1.label} {form.fields.customField1.required && <span className="text-rose-400">*</span>}
                </label>
                <input
                  type="text"
                  placeholder="Detalle..."
                  value={formData.customField1}
                  onChange={(e) => handleChange('customField1', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 text-white placeholder-slate-500 outline-none text-base transition-colors"
                />
              </div>
            )}

            {/* Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-950 transition-colors">
                <input
                  id="consent-checkbox"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (errors.consent) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.consent;
                        return copy;
                      });
                    }
                  }}
                  className="mt-1 w-5 h-5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-300 leading-relaxed select-none">
                  {form.consentText}
                </span>
              </label>
              {errors.consent && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.consent}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                id="btn-form-continuar"
                type="submit"
                className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg tracking-wide shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>CONTINUAR</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="w-full max-w-2xl text-center py-2 text-xs text-slate-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Validación y cifrado en estación local</span>
      </footer>
    </div>
  );
}

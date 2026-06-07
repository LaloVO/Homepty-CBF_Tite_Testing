"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { Template } from "@/lib/templates";

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROJECT_TYPES = [
  { value: "luxury-broker", label: "Broker de lujo" },
  { value: "agency", label: "Agencia inmobiliaria" },
  { value: "developer", label: "Desarrollador / constructora" },
  { value: "independent", label: "Asesor independiente" },
  { value: "investment-platform", label: "Plataforma de inversión" },
];

const PRESET_COLORS = ["#0F172A", "#1E40AF", "#7C3AED", "#B45309", "#065F46", "#9F1239"];

interface FormState {
  project_type: string;
  template_slug: string;
  website: string;
  instagram: string;
  logo_url: string;
  brand_colors: string[];
  reference_urls: string[];
  company_name: string;
  business_info: { location: string; services: string; team_size: string };
  vision_brief: string;
  contact: { name: string; email: string; phone: string; whatsapp: string };
  _honey: string;
}

interface Props {
  initialTemplate: string;
  templates: Template[];
}

export default function StartProjectForm({ initialTemplate, templates }: Props) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [newRefUrl, setNewRefUrl] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    project_type: "",
    template_slug: initialTemplate,
    website: "",
    instagram: "",
    logo_url: "",
    brand_colors: [],
    reference_urls: [],
    company_name: "",
    business_info: { location: "", services: "", team_size: "" },
    vision_brief: "",
    contact: { name: "", email: "", phone: "", whatsapp: "" },
    _honey: "",
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const setBI = (key: keyof FormState["business_info"], value: string) =>
    setForm((p) => ({ ...p, business_info: { ...p.business_info, [key]: value } }));

  const setContact = (key: keyof FormState["contact"], value: string) =>
    setForm((p) => ({ ...p, contact: { ...p.contact, [key]: value } }));

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `intakes/${Date.now()}.${ext}`;
      const { error } = await supabasePublic.storage
        .from("project-assets")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabasePublic.storage.from("project-assets").getPublicUrl(path);
      set("logo_url", data.publicUrl);
    } catch {
      // silently fail — logo is optional
    } finally {
      setUploadingLogo(false);
    }
  }

  function toggleColor(hex: string) {
    setForm((p) => ({
      ...p,
      brand_colors: p.brand_colors.includes(hex)
        ? p.brand_colors.filter((c) => c !== hex)
        : [...p.brand_colors, hex],
    }));
  }

  function addRefUrl() {
    const url = newRefUrl.trim();
    if (url && !form.reference_urls.includes(url)) {
      set("reference_urls", [...form.reference_urls, url]);
    }
    setNewRefUrl("");
  }

  function removeRefUrl(url: string) {
    set("reference_urls", form.reference_urls.filter((u) => u !== url));
  }

  const canContinue = () => {
    if (step === 0) return form.project_type !== "";
    if (step === 1) return form.template_slug !== "";
    if (step === 5)
      return (
        form.contact.name.trim() !== "" &&
        form.contact.email.trim() !== "" &&
        form.contact.phone.trim() !== ""
      );
    return true;
  };

  async function handleSubmit() {
    if (form._honey) return; // honeypot triggered
    setSubmitting(true);
    try {
      const payload = {
        template_slug: form.template_slug,
        project_type: form.project_type,
        company_name: form.company_name || null,
        website: form.website || null,
        instagram: form.instagram || null,
        logo_url: form.logo_url || null,
        brand_colors: form.brand_colors,
        reference_urls: form.reference_urls,
        business_info: form.business_info,
        vision_brief: form.vision_brief || null,
        contact: form.contact,
        source: "marketplace",
      };
      const res = await fetch("/api/cbf/projects/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) setDone(true);
    } catch {
      // surface to user in a future iteration
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm";

  const selectedTemplate = templates.find((t) => t.slug === form.template_slug);

  const STEPS = [
    {
      title: "¿Qué tipo de proyecto es?",
      content: (
        <div className="space-y-2">
          {PROJECT_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => set("project_type", pt.value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-medium ${
                form.project_type === pt.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              {form.project_type === pt.value && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
              {pt.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Elige tu plantilla",
      content: (
        <div className="space-y-3">
          {templates.map((t) => (
            <button
              key={t.slug}
              onClick={() => set("template_slug", t.slug)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border text-left transition-all ${
                form.template_slug === t.slug
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                {t.previewImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.previewImage} alt={t.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground truncate">{t.tagline}</p>
              </div>
              {form.template_slug === t.slug && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Tu marca",
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Instagram</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                className={inputCls}
                placeholder="@usuario"
              />
            </div>
          </div>

          {/* Logo upload */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Logo <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="file"
              ref={logoInputRef}
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
            />
            {form.logo_url ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded" />
                <p className="text-xs text-muted-foreground flex-1 truncate">Logo subido</p>
                <button onClick={() => set("logo_url", "")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors text-sm"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploadingLogo ? "Subiendo..." : "Subir logo"}
              </button>
            )}
          </div>

          {/* Brand colors */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">
              Colores de marca <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.brand_colors.includes(c) ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Reference URLs */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Sitios de referencia <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newRefUrl}
                onChange={(e) => setNewRefUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRefUrl()}
                className={inputCls}
                placeholder="https://..."
              />
              <Button size="sm" variant="outline" onClick={addRefUrl} type="button">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.reference_urls.length > 0 && (
              <ul className="mt-2 space-y-1">
                {form.reference_urls.map((u) => (
                  <li key={u} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate flex-1">{u}</span>
                    <button onClick={() => removeRefUrl(u)}>
                      <X className="w-3.5 h-3.5 hover:text-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Tu negocio",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Nombre de la empresa</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => set("company_name", e.target.value)}
              className={inputCls}
              placeholder="Inmobiliaria Montoya"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Ubicación principal</label>
            <input
              type="text"
              value={form.business_info.location}
              onChange={(e) => setBI("location", e.target.value)}
              className={inputCls}
              placeholder="CDMX, Monterrey, Guadalajara..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Servicios que ofreces</label>
            <input
              type="text"
              value={form.business_info.services}
              onChange={(e) => setBI("services", e.target.value)}
              className={inputCls}
              placeholder="Venta, renta, administración de propiedades..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Tamaño del equipo</label>
            <select
              value={form.business_info.team_size}
              onChange={(e) => setBI("team_size", e.target.value)}
              className={inputCls}
            >
              <option value="">Selecciona...</option>
              <option value="solo">Solo yo</option>
              <option value="2-5">2–5 personas</option>
              <option value="6-20">6–20 personas</option>
              <option value="20+">Más de 20</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      title: "Tu visión",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cuéntanos cómo imaginas tu sitio. No hay respuesta incorrecta — mientras más detalle, mejor resultado.
          </p>
          <textarea
            value={form.vision_brief}
            onChange={(e) => set("vision_brief", e.target.value)}
            rows={8}
            className={`${inputCls} resize-none`}
            placeholder="¿Cuál es tu meta principal? ¿Quiénes son tus clientes ideales? ¿Qué percepción quieres transmitir? ¿Qué te diferencia de otros asesores?..."
          />
          <p className="text-xs text-muted-foreground">
            {form.vision_brief.length} caracteres — recomendamos al menos 100
          </p>
        </div>
      ),
    },
    {
      title: "¿Cómo te contactamos?",
      content: (
        <div className="space-y-4">
          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            name="website_confirm"
            value={form._honey}
            onChange={(e) => set("_honey", e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Nombre completo <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.contact.name}
                onChange={(e) => setContact("name", e.target.value)}
                className={inputCls}
                placeholder="Tu nombre"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={form.contact.email}
                onChange={(e) => setContact("email", e.target.value)}
                className={inputCls}
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Teléfono <span className="text-destructive">*</span>
              </label>
              <input
                type="tel"
                value={form.contact.phone}
                onChange={(e) => setContact("phone", e.target.value)}
                className={inputCls}
                placeholder="+52 55..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">WhatsApp</label>
              <input
                type="tel"
                value={form.contact.whatsapp}
                onChange={(e) => setContact("whatsapp", e.target.value)}
                className={inputCls}
                placeholder="+52 55..."
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">¡Solicitud recibida!</h2>
            <p className="text-muted-foreground">
              Elige tu plan para activar tu sitio. Después del pago te guiamos paso a paso.
            </p>
          </div>
          {selectedTemplate && (
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 border border-border">
              Plantilla seleccionada: <strong className="text-foreground">{selectedTemplate.name}</strong>
            </div>
          )}
          <Button asChild className="w-full h-12 text-base">
            <a href="/#pricing">Elegir mi plan y pagar →</a>
          </Button>
          <a href="/demos" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Ver más plantillas
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-1">
          Paso {step + 1} de {STEPS.length}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            <h2 className="text-2xl font-bold text-foreground">{STEPS[step].title}</h2>
            {STEPS[step].content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue()}
              className="gap-1"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canContinue() || submitting}
              className="gap-1 min-w-32"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Enviar solicitud
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

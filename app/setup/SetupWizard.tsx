"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ChevronLeft, Sparkles, Map, Search, FileText, BookOpen, LayoutGrid, Palette, Rocket } from "lucide-react";

const MODULES = [
  { id: "buscador", label: "Buscador de propiedades", icon: Search, defaultOn: true },
  { id: "mapa", label: "Mapa interactivo", icon: Map, defaultOn: true },
  { id: "solicitudes", label: "Formulario de solicitudes", icon: FileText, defaultOn: true },
  { id: "blog", label: "Blog", icon: BookOpen, defaultOn: false },
  { id: "servicios", label: "Tabs de servicios y productos", icon: LayoutGrid, defaultOn: false },
];

interface SetupWizardProps {
  usuarioId: string;
  nombreUsuario: string;
  siteName: string;
}

export default function SetupWizard({ usuarioId, nombreUsuario, siteName }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    site_name: siteName,
    tagline: "",
    description: "",
    modules: MODULES.filter((m) => m.defaultOn).map((m) => m.id),
    primary_color: "#3B82F6",
    logo_url: "",
  });

  const toggleModule = (id: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(id)
        ? prev.modules.filter((m) => m !== id)
        : [...prev.modules, id],
    }));
  };

  const canContinue = () => {
    if (step === 1) return form.site_name.trim().length > 0;
    return true;
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cbf/setup-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: usuarioId,
          site_name: form.site_name,
          tagline: form.tagline,
          description: form.description,
          modules: form.modules,
          primary_color: form.primary_color,
          logo_url: form.logo_url || undefined,
        }),
      });
      if (res.ok) {
        window.location.href = "https://app.homepty.com/my-site";
      }
    } catch {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "¡Bienvenido a Homepty!",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              ¡Tu pago fue exitoso, {nombreUsuario}!
            </h2>
            <p className="text-muted-foreground text-lg">
              Ahora configuremos tu sitio web. Solo toma unos minutos.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium w-fit mx-auto">
            <Check className="w-4 h-4" />
            Pago confirmado
          </div>
        </div>
      ),
    },
    {
      title: "Tu negocio",
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nombre de tu sitio
            </label>
            <input
              type="text"
              value={form.site_name}
              onChange={(e) => setForm((p) => ({ ...p, site_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ej: Inmobiliaria Montoya"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Tagline <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ej: Tu aliado en bienes raíces"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              ¿Cómo visualizas tu sitio?
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Cuéntanos qué tipo de propiedades manejas, quiénes son tus clientes, qué hace especial a tu negocio..."
            />
          </div>
        </div>
      ),
    },
    {
      title: "Módulos de tu sitio",
      content: (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm mb-4">
            Elige qué funcionalidades quieres en tu sitio. Puedes cambiarlo en cualquier momento.
          </p>
          {MODULES.map((mod) => {
            const active = form.modules.includes(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <mod.icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{mod.label}</span>
                {mod.defaultOn && (
                  <span className="ml-auto text-xs text-muted-foreground">Recomendado</span>
                )}
                {active && <Check className={`w-4 h-4 text-primary shrink-0 ${mod.defaultOn ? "" : "ml-auto"}`} />}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "Estilo de tu sitio",
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <Palette className="w-4 h-4 inline mr-1.5" />
              Color principal
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))}
                className="w-14 h-14 rounded-xl cursor-pointer border border-border"
              />
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium">{form.primary_color}</p>
                <p className="text-xs text-muted-foreground">Se aplica a botones, acentos y highlights</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#0F172A"].map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((p) => ({ ...p, primary_color: c }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.primary_color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              URL de tu logo <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">Puedes subir tu logo más adelante desde tu panel.</p>
          </div>
        </div>
      ),
    },
    {
      title: "Listo para activar",
      content: (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium text-foreground">{form.site_name}</span>
            </div>
            {form.tagline && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tagline</span>
                <span className="font-medium text-foreground">{form.tagline}</span>
              </div>
            )}
            <div className="flex items-start justify-between text-sm">
              <span className="text-muted-foreground">Módulos</span>
              <span className="font-medium text-foreground text-right">
                {form.modules.map((id) => MODULES.find((m) => m.id === id)?.label).filter(Boolean).join(", ")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Color</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: form.primary_color }} />
                <span className="font-medium text-foreground">{form.primary_color}</span>
              </div>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full h-14 text-lg rounded-full"
            onClick={handleActivate}
            disabled={loading}
          >
            {loading ? (
              "Activando tu sitio..."
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-2" />
                Activar mi sitio
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Una vez activado, serás redirigido a tu panel en app.homepty.com
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold text-foreground">{steps[step].title}</h3>
            {steps[step].content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < steps.length - 1 && (
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
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue()}
              className="gap-1"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        {step > 0 && step === steps.length - 1 && (
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            className="mt-4 gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </Button>
        )}
      </div>
    </div>
  );
}

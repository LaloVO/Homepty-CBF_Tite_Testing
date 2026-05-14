"use client";
import { motion } from "framer-motion";
import { Brain, Database, Globe, Zap, Shield, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "IA Predictiva",
    description: "Modelos de machine learning que predicen tendencias del mercado y valuaciones precisas."
  },
  {
    icon: Database,
    title: "Dataset Exclusivo",
    description: "Acceso a millones de datos inmobiliarios actualizados en tiempo real."
  },
  {
    icon: Globe,
    title: "Integración Total",
    description: "APIs y WebSockets para conectar con cualquier plataforma existente."
  },
  {
    icon: Zap,
    title: "Automatización",
    description: "Herramientas que automatizan tareas repetitivas y ahorran horas de trabajo."
  },
  {
    icon: Shield,
    title: "Data Segregada",
    description: "Infraestructura multiusuario con seguridad enterprise y datos aislados."
  },
  {
    icon: TrendingUp,
    title: "Analytics Avanzados",
    description: "Dashboards y reportes que transforman datos en decisiones estratégicas."
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-32 px-6 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Tecnología que potencia tu negocio
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Una suite completa de herramientas diseñadas para el profesional inmobiliario moderno.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
                ease: "backOut"
              }}
              whileHover={{
                scale: 1.02,
                backgroundColor: "hsl(var(--background))"
              }}
              className="group relative p-8 rounded-3xl bg-background/50 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

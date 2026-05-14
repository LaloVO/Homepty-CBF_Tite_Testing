"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Building2, User } from "lucide-react";

const tiers = [
  {
    title: "Asesor Starter",
    subtitle: "",
    icon: User,
    setup: "$2,499 MXN",
    setupNote: "Por la creación de tu web app",
    subscription: "$899 MXN",
    subscriptionNote: "Por mantenimiento mas:",
    features: [
      "Web app conectada a Homepty",
      "Análisis de rentabilidad de la zona: Análisis rápido de precios, demanda y oportunidades por zona",
      "25 Análisis de rentabilidad profunda de la propiedad: Reportes detallados con proyecciones financieras, históricos, tasa de absorción y más",
      "Comparativas de propiedades por criterio no solo por características",
      "Estimador de valor comercial",
      "Asistentes y Automatización AI",
      "Gestión y CRM",
      "Publicación de propiedades ilimitadas",
      "Homepty Edu (Capacitación)"
    ],
    highlight: true,
    stripeLink: "https://buy.stripe.com/4gMdR8buHdt83erbmWew80b"
  },
  {
    title: "Asesor Independiente",
    subtitle: "Conectamos tu pagina a Homepty y obten:",
    icon: User,
    setup: "$1,699 MXN",
    setupNote: "Por la integración de los módulos",
    subscription: "$899 MXN",
    subscriptionNote: "Por mantenimiento mas:",
    features: [
      "Análisis de rentabilidad de la zona: Análisis rápido de precios, demanda y oportunidades por zona",
      "25 Análisis de rentabilidad profunda de la propiedad: Reportes detallados con proyecciones financieras, históricos, tasa de absorción y más",
      "Comparativas de propiedades por criterio no solo por características",
      "Estimador de valor comercial",
      "Asistentes y Automatización AI",
      "Gestión y CRM",
      "Publicación de propiedades ilimitadas",
      "Homepty Edu (Capacitación)"
    ],
    stripeLink: "https://buy.stripe.com/28E8wO8ivbl0dT5aiSew80c"
  },
  {
    title: "Inmobiliaria",
    subtitle: "",
    icon: Building2,
    setup: "$3,499 MXN",
    setupNote: "Por la creación de tu web app",
    subscription: "$1,798 MXN",
    subscriptionNote: "Por mantenimiento mas:",
    features: [
      "Web app conectada a Homepty",
      "Perfiles para 5 usuarios de tu inmobiliaria",
      "Análisis de rentabilidad de la zona: Análisis rápido de precios, demanda y oportunidades por zona",
      "50 Análisis de rentabilidad profunda de la propiedad: Reportes detallados con proyecciones financieras, históricos, tasa de absorción y más",
      "Comparativas de propiedades por criterio no solo por características",
      "Estimador de valor comercial",
      "Asistentes y Automatización AI",
      "Gestión y CRM",
      "Publicación de propiedades ilimitadas",
      "Homepty Edu (Capacitación)"
    ],
    stripeLink: "https://buy.stripe.com/7sYaEWfKXexc8yL2Qqew80d"
  },
  {
    title: "Inmobiliaria Plus",
    subtitle: "Conectamos tu pagina y CRM a Homepty y obten:",
    icon: Building2,
    setup: "$2,699 MXN",
    setupNote: "Por la integración de los módulos",
    subscription: "$1,798 MXN",
    subscriptionNote: "Por mantenimiento mas:",
    features: [
      "Perfiles para 5 usuarios de tu inmobiliaria",
      "Análisis de rentabilidad de la zona: Análisis rápido de precios, demanda y oportunidades por zona",
      "50 Análisis de rentabilidad profunda de la propiedad: Reportes detallados con proyecciones financieras, históricos, tasa de absorción y más",
      "Comparativas de propiedades por criterio no solo por características",
      "Estimador de valor comercial",
      "Asistentes y Automatización AI",
      "Gestión y CRM",
      "Publicación de propiedades ilimitadas",
      "Homepty Edu (Capacitación)"
    ],
    stripeLink: "https://buy.stripe.com/28EaEWeGTexc02fez8ew80e"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-background to-accent/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            Acceso Fundador
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Planes de Preventa
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Precios exclusivos para fundadores. Asegura tu lugar antes del lanzamiento público.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {tiers.map((tier, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className={`flex flex-col h-full relative overflow-hidden transition-all duration-300 hover:shadow-xl ${tier.highlight
                ? "border-primary shadow-lg ring-2 ring-primary/20"
                : "border-border hover:border-primary/30"
                }`}>
                {tier.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tier.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}>
                      <tier.icon className="w-5 h-5" />
                    </div>
                    {tier.highlight && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                        Popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{tier.title}</h3>
                  <p className="text-sm text-muted-foreground min-h-[2.5rem] flex items-center">{tier.subtitle}</p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 pt-0">
                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Setup único</p>
                      <p className="text-lg font-bold text-foreground">{tier.setup}</p>
                      {'setupNote' in tier && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic">
                          {tier.setupNote as string}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-start -my-2 relative z-10 px-1">
                      <span className="px-2 py-0.5 rounded-full bg-background border border-border text-[10px] text-muted-foreground font-medium">
                        + Más tu primer mensualidad
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-xs text-primary uppercase tracking-wide mb-1">Acceso Fundador</p>
                      <p className="text-lg font-bold text-primary">{tier.subscription}</p>
                      <p className="text-xs text-muted-foreground">{tier.subscriptionNote}</p>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${tier.highlight ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                    variant={tier.highlight ? "default" : "secondary"}
                    asChild
                  >
                    <a href={tier.stripeLink} target="_blank" rel="noopener noreferrer">
                      Adquirir Plan
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Template } from "@/lib/templates";

const CATEGORY_LABELS: Record<string, string> = {
  "luxury-real-estate": "Lujo",
  agency: "Agencia",
  broker: "Broker",
  developer: "Desarrollador",
};

const ALL = "all";

interface Props {
  templates: Template[];
}

export default function DemosCatalog({ templates }: Props) {
  const categories = [ALL, ...Array.from(new Set(templates.map((t) => t.category)))];
  const [active, setActive] = useState(ALL);

  const visible = active === ALL ? templates : templates.filter((t) => t.category === active);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              active === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
            }`}
          >
            {cat === ALL ? "Todos" : (CATEGORY_LABELS[cat] ?? cat)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((template, i) => (
          <motion.div
            key={template.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
              {/* Preview image */}
              <div className="relative aspect-video bg-muted overflow-hidden">
                {template.previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={template.previewImage}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Vista previa próximamente
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full border border-border">
                  {CATEGORY_LABELS[template.category] ?? template.category}
                </span>
              </div>

              <CardContent className="flex-1 pt-5">
                <h3 className="font-semibold text-lg text-foreground mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.tagline}</p>
              </CardContent>

              <CardFooter className="flex gap-2 pt-0">
                {template.demoUrl ? (
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={template.demoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Ver demo
                    </a>
                  </Button>
                ) : null}
                <Button size="sm" className="flex-1" asChild>
                  <a href={`/start-project?template=${template.slug}`}>
                    Usar diseño
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-muted-foreground py-20">
          No hay plantillas en esta categoría.
        </p>
      )}
    </section>
  );
}

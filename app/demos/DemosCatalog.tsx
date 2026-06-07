"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ArrowRight, Search, SlidersHorizontal, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Template } from "@/lib/templates";

function DemoIframePreview({ url, name }: { url: string; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.21);

  useEffect(() => {
    if (containerRef.current) {
      setScale(containerRef.current.offsetWidth / 1440);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-muted overflow-hidden"
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: 1440,
          height: 810,
          transformOrigin: "0 0",
          transform: `scale(${scale})`,
          pointerEvents: "none",
        }}
      >
        <iframe src={url} title={name} width={1440} height={810} style={{ border: "none" }} />
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  "luxury-real-estate": "Lujo",
  agency: "Agencia",
  broker: "Broker",
  developer: "Desarrollador",
};

const ALL = "all";

const FEATURE_FILTERS = [
  { id: "mapbox", label: "Mapa interactivo", match: (t: Template) => t.tech.includes("Mapbox") },
  { id: "valuacion", label: "Valuación con IA", match: (t: Template) => t.tech.includes("Valuación IA") },
  { id: "blog", label: "Blog integrado", match: (t: Template) => t.tech.includes("Blog") },
  { id: "dominio", label: "Dominio propio", match: (t: Template) => t.tech.includes("Dominio personalizado") },
  { id: "citas", label: "Citas virtuales", match: (t: Template) => t.features.some((f) => f.toLowerCase().includes("cita")) },
];

interface Props {
  templates: Template[];
}

export default function DemosCatalog({ templates }: Props) {
  const categories = [ALL, ...Array.from(new Set(templates.map((t) => t.category)))];
  const [active, setActive] = useState(ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const getCategoryCount = (category: string) => {
    if (category === ALL) return templates.length;
    return templates.filter((t) => t.category === category).length;
  };

  const getFeatureCount = (featureId: string) => {
    const filter = FEATURE_FILTERS.find((f) => f.id === featureId);
    if (!filter) return 0;
    return templates.filter(filter.match).length;
  };

  const filteredTemplates = templates.filter((template) => {
    // 1. Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchesName = template.name.toLowerCase().includes(q);
      const matchesTagline = template.tagline.toLowerCase().includes(q);
      const matchesDesc = template.description.toLowerCase().includes(q);
      const matchesFeatures = template.features.some((f) => f.toLowerCase().includes(q));
      const matchesTech = template.tech.some((t) => t.toLowerCase().includes(q));

      if (!matchesName && !matchesTagline && !matchesDesc && !matchesFeatures && !matchesTech) {
        return false;
      }
    }

    // 2. Category Filter
    if (active !== ALL && template.category !== active) {
      return false;
    }

    // 3. Special Features Filters
    if (selectedFeatures.length > 0) {
      for (const featureId of selectedFeatures) {
        const filter = FEATURE_FILTERS.find((f) => f.id === featureId);
        if (filter && !filter.match(template)) {
          return false;
        }
      }
    }

    return true;
  });

  const handleClearFilters = () => {
    setActive(ALL);
    setSearchQuery("");
    setSelectedFeatures([]);
  };

  const isAnyFilterActive = active !== ALL || searchQuery.trim() !== "" || selectedFeatures.length > 0;
  const activeFiltersCount = (active !== ALL ? 1 : 0) + selectedFeatures.length;

  return (
    <section className="w-full px-6 md:px-10 lg:px-16 py-12">
      {/* Mobile Search & Filter toggle */}
      <div className="lg:hidden space-y-4 mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar plantilla..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-background border border-border/80 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 border rounded-full text-sm font-medium transition-all ${
              showMobileFilters || selectedFeatures.length > 0 || active !== ALL
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border/80 hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="flex items-center justify-center bg-primary-foreground text-primary text-[10px] font-bold w-4 h-4 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-5 space-y-6 overflow-hidden"
            >
              {/* Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categorías</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isActive = active === cat;
                    const count = getCategoryCount(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => setActive(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border/70 hover:border-primary hover:text-foreground"
                        }`}
                      >
                        {cat === ALL ? "Todos" : (CATEGORY_LABELS[cat] ?? cat)}
                        <span className="ml-1.5 opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Características</h4>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_FILTERS.map((feat) => {
                    const isChecked = selectedFeatures.includes(feat.id);
                    const count = getFeatureCount(feat.id);
                    return (
                      <button
                        key={feat.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedFeatures(selectedFeatures.filter((f) => f !== feat.id));
                          } else {
                            setSelectedFeatures([...selectedFeatures, feat.id]);
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                          isChecked
                            ? "bg-primary/10 text-primary border-primary/40 shadow-sm"
                            : "bg-background text-muted-foreground border-border/70 hover:border-primary hover:text-foreground"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 text-primary" />}
                        <span>{feat.label}</span>
                        <span className="opacity-60 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-border/40">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:bg-primary/90 transition-colors text-center"
                >
                  Aplicar filtros
                </button>
                {isAnyFilterActive && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 border border-border/80 text-muted-foreground hover:text-foreground text-xs font-semibold rounded-full hover:bg-muted/50 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Container: Flexbox layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[280px] shrink-0 lg:sticky lg:top-28 bg-card/45 backdrop-blur-md border border-border/50 shadow-md rounded-2xl p-6 space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Buscar</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Nombre o tema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-background border border-border/80 rounded-full text-sm placeholder:text-muted-foreground/75 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categorías</h4>
            <div className="space-y-1">
              {categories.map((cat) => {
                const isActive = active === cat;
                const count = getCategoryCount(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setActive(cat)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-sm transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <span>{cat === ALL ? "Todos" : (CATEGORY_LABELS[cat] ?? cat)}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Características</h4>
            <div className="space-y-2">
              {FEATURE_FILTERS.map((feat) => {
                const isChecked = selectedFeatures.includes(feat.id);
                const count = getFeatureCount(feat.id);
                return (
                  <label
                    key={feat.id}
                    className="flex items-center justify-between group cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedFeatures(selectedFeatures.filter((f) => f !== feat.id));
                          } else {
                            setSelectedFeatures([...selectedFeatures, feat.id]);
                          }
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border/80 group-hover:border-primary"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className={isChecked ? "font-medium text-foreground" : ""}>{feat.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground/60">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Clear Filters */}
          {isAnyFilterActive && (
            <div className="pt-4 border-t border-border/40">
              <button
                onClick={handleClearFilters}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold border border-border hover:bg-muted/50 rounded-full transition-all text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar filtros
              </button>
            </div>
          )}
        </aside>

        {/* Body panel for cards */}
        <div className="flex-1 space-y-6 w-full">
          
          {/* Status summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-semibold text-foreground">{filteredTemplates.length}</span>{" "}
              {filteredTemplates.length === 1 ? "diseño disponible" : "diseños disponibles"}
            </p>
          </div>

          {/* Active filter badges */}
          {isAnyFilterActive && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Filtros activos:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span>Búsqueda: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {active !== ALL && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span>Categoría: {CATEGORY_LABELS[active] ?? active}</span>
                  <button
                    onClick={() => setActive(ALL)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedFeatures.map((featId) => {
                const feat = FEATURE_FILTERS.find((f) => f.id === featId);
                if (!feat) return null;
                return (
                  <span
                    key={featId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                  >
                    <span>{feat.label}</span>
                    <button
                      onClick={() => setSelectedFeatures(selectedFeatures.filter((f) => f !== featId))}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              <button
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline ml-1"
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template, i) => (
              <motion.div
                key={template.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="overflow-hidden flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/65 backdrop-blur-md border border-border/40 rounded-2xl">
                  {/* Preview image */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {template.demoUrl ? (
                      <DemoIframePreview url={template.demoUrl} name={template.name} />
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
                      <Button variant="outline" size="sm" className="flex-1 rounded-full" asChild>
                        <a href={template.demoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          Ver demo
                        </a>
                      </Button>
                    ) : null}
                    <Button size="sm" className="flex-1 rounded-full" asChild>
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

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/25 backdrop-blur-sm border border-dashed border-border rounded-2xl">
              <div className="p-3.5 bg-muted/50 rounded-full mb-4">
                <SlidersHorizontal className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Sin resultados</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-5">
                No encontramos ninguna plantilla que coincida con tus filtros actuales. Intenta ajustar tu búsqueda o restablecer los filtros.
              </p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={handleClearFilters}>
                Restablecer todos los filtros
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/app/components/homepty/Header";
import Footer from "@/app/components/homepty/Footer";
import { getTemplateBySlug, getTemplates } from "@/lib/templates";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getTemplates().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) return {};
  return {
    title: `${template.name} | Plantillas Homepty`,
    description: template.tagline,
  };
}

export default async function TemplateDetailPage({ params }: Props) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);

  if (!template) notFound();

  const CATEGORY_LABELS: Record<string, string> = {
    "luxury-real-estate": "Lujo",
    agency: "Agencia",
    broker: "Broker",
    developer: "Desarrollador",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-8">
            <a href="/demos" className="hover:text-foreground transition-colors">
              Plantillas
            </a>
            <span className="mx-2">/</span>
            <span className="text-foreground">{template.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left — gallery */}
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border">
                {template.gallery[0] ?? template.previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={template.gallery[0] ?? template.previewImage}
                    alt={`${template.name} — captura principal`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Vista previa próximamente
                  </div>
                )}
              </div>
              {template.gallery.slice(1).length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {template.gallery.slice(1).map((img, i) => (
                    <div
                      key={i}
                      className="aspect-video bg-muted rounded-xl overflow-hidden border border-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${template.name} — captura ${i + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right — info */}
            <div className="space-y-6 lg:sticky lg:top-28">
              <div>
                <span className="text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full">
                  {CATEGORY_LABELS[template.category] ?? template.category}
                </span>
                <h1 className="text-3xl font-bold text-foreground mt-3 mb-2">
                  {template.name}
                </h1>
                <p className="text-lg text-muted-foreground">{template.tagline}</p>
              </div>

              <p className="text-foreground/80 leading-relaxed">{template.description}</p>

              {/* Target audience */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Ideal para</p>
                <p className="text-foreground">{template.targetAudience}</p>
              </div>

              {/* Tech badges */}
              {template.tech.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {template.tech.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full border border-border"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Features */}
              <ul className="space-y-2">
                {template.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-2">
                <Button size="lg" className="w-full" asChild>
                  <a href={`/start-project?template=${template.slug}`}>
                    Construir mi sitio con esta plantilla
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
                {template.demoUrl && (
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <a href={template.demoUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir demo en vivo
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

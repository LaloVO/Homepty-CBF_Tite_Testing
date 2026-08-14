import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/app/components/homepty/Header";
import Footer from "@/app/components/homepty/Footer";
import { getTemplateBySlug, getTemplates } from "@/lib/templates";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getTemplates().map((reference) => ({ slug: reference.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const reference = getTemplateBySlug((await params).slug);
  return reference ? { title: `${reference.name} | Referencias Homepty`, description: reference.tagline } : {};
}

export default async function VisualReferenceDetail({ params }: Props) {
  const reference = getTemplateBySlug((await params).slug);
  if (!reference) notFound();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <div className="w-full px-6 py-12 md:px-10 lg:px-16">
          <nav className="mb-8 text-sm text-muted-foreground">
            <Link href="/plantillas" className="transition-colors hover:text-foreground">Referencias</Link>
            <span className="mx-2">/</span><span className="text-foreground">{reference.name}</span>
          </nav>
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-muted">
                {reference.gallery[0] ?? reference.previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={reference.gallery[0] ?? reference.previewImage} alt={`${reference.name} — captura principal`} className="h-full w-full object-cover" />
                ) : <div className="flex h-full items-center justify-center text-muted-foreground">Vista previa próximamente</div>}
              </div>
              {reference.gallery.slice(1).length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {reference.gallery.slice(1).map((image, index) => (
                    <div key={image} className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt={`${reference.name} — captura ${index + 2}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-6 lg:sticky lg:top-28">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{reference.name}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{reference.tagline}</p>
              </div>
              <p className="leading-relaxed text-foreground/80">{reference.description}</p>
              <div><p className="mb-1 text-sm font-medium text-muted-foreground">Puede inspirar</p><p className="text-foreground">{reference.targetAudience}</p></div>
              <ul className="space-y-2">
                {reference.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-foreground/80"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{feature}</li>)}
              </ul>
              <p className="rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">Esta selección se guarda únicamente como referencia. El factory tiene prohibido copiar su implementación o composición.</p>
              <div className="flex flex-col gap-3 pt-2">
                <Button size="lg" className="w-full" asChild>
                  <a href={`https://app.homepty.com/my-site?reference=${encodeURIComponent(reference.slug)}`}>Usar como referencia<ArrowRight className="ml-2 size-4" /></a>
                </Button>
                {reference.demoUrl && <Button variant="outline" size="lg" className="w-full" asChild><a href={reference.demoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 size-4" />Abrir demo en vivo</a></Button>}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

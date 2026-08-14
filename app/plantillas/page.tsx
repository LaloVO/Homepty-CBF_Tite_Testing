import type { Metadata } from "next";
import Header from "@/app/components/homepty/Header";
import Footer from "@/app/components/homepty/Footer";
import DemosCatalog from "@/app/demos/DemosCatalog";
import { getTemplates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Referencias visuales | Homepty Sites",
  description: "Explora referencias para comunicar la dirección visual de tu futuro sitio. Nunca se copian como plantilla.",
};

export default function VisualReferencesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <div className="w-full px-6 md:px-10 lg:px-16 mb-4">
          <h1 className="text-4xl font-bold text-foreground mb-3">Referencias visuales</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">Guarda ideas de atmósfera, ritmo y funcionalidad. Tu sitio se diseña desde cero: ninguna referencia determina JSX, CSS, tokens ni estructura editorial.</p>
        </div>
        <DemosCatalog templates={getTemplates()} />
      </main>
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import Header from "@/app/components/homepty/Header";
import Footer from "@/app/components/homepty/Footer";
import DemosCatalog from "./DemosCatalog";
import { getTemplates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Plantillas | Homepty Sites",
  description:
    "Explora los diseños disponibles para tu sitio inmobiliario. Elige el que te emociona e inicia tu proyecto.",
};

export default function DemosPage() {
  const templates = getTemplates();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <h1 className="text-4xl font-bold text-foreground mb-3">Plantillas</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Elige el diseño que mejor representa tu marca. Después lo personalizamos
            con tus colores, logo y propiedades reales.
          </p>
        </div>
        <DemosCatalog templates={templates} />
      </main>
      <Footer />
    </div>
  );
}

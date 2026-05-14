"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";

export default function CTASection() {
  return <section className="py-24 px-6 bg-primary relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

    <motion.div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl" animate={{
      scale: [1, 1.2, 1]
    }} transition={{
      duration: 8,
      repeat: Infinity
    }} />
    <motion.div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary-foreground/5 rounded-full blur-3xl" animate={{
      scale: [1.2, 1, 1.2]
    }} transition={{
      duration: 10,
      repeat: Infinity
    }} />

    <div className="max-w-4xl mx-auto text-center relative z-10">
      <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.6
      }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-6">
          <Rocket className="w-4 h-4" />
          Lanzamiento Q1 2026
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
          Sé parte del futuro inmobiliario
        </h2>

        <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
          Únete a la preventa exclusiva y obtén acceso anticipado a la plataforma
          que transformará la industria inmobiliaria en México.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 py-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90 group" asChild>
            <a href="https://homepty.info/">
              Reservar mi acceso ahora
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
        </div>

        <p className="mt-8 text-sm text-primary-foreground/60">
          Sin compromiso · Cancela cuando quieras · Precios de fundador garantizados
        </p>
      </motion.div>
    </div>
  </section>;
}

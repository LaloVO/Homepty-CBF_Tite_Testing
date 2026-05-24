"use client";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Scan } from "lucide-react";
import { useRef, useEffect } from "react";
import type { User } from "@/lib/supabase";

interface HeroSectionProps {
  user?: Pick<User, "nombre_usuario"> | null;
}

const Counter = ({ from, to, duration = 2, shouldFormat = true }: { from: number; to: number; duration?: number; shouldFormat?: boolean }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;

    const node = nodeRef.current;
    if (!node) return;

    let startTime: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / (duration * 1000), 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      const current = Math.floor(easeOutQuart * (to - from) + from);
      node.textContent = shouldFormat ? current.toLocaleString() : current.toString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        node.textContent = shouldFormat ? to.toLocaleString() : to.toString();
      }
    };

    requestAnimationFrame(animate);
  }, [inView, from, to, duration, shouldFormat]);

  return <span ref={nodeRef} className="tabular-nums">{from}</span>;
};

export default function HeroSection({ user }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const smoothScroll = useSpring(scrollYProgress, { mass: 0.1, stiffness: 80, damping: 20 });

  const backgroundY = useTransform(smoothScroll, [0, 1], ["0%", "50%"]);
  const textY = useTransform(smoothScroll, [0, 1], ["0%", "100%"]);
  const textOpacity = useTransform(smoothScroll, [0, 0.5], [1, 0]);

  const scannerY = useTransform(smoothScroll, [0, 1], ["0%", "-50%"]);
  const scannerRotate = useTransform(smoothScroll, [0, 1], [0, 15]);

  return (
    <section ref={containerRef} className="relative min-h-[120vh] flex items-center justify-center overflow-hidden bg-background">
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </motion.div>

      <motion.div
        style={{ y: scannerY, rotate: scannerRotate }}
        className="absolute top-1/4 -right-20 w-80 h-80 border border-primary/20 rounded-full z-0 opacity-20 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-dashed border-primary/30 rounded-full animate-[spin_60s_linear_infinite]" />
        <Scan className="absolute top-4 left-1/2 -translate-x-1/2 text-primary/40 w-8 h-8" />
        <div className="absolute bottom-10 left-10 text-xs font-mono text-primary/60">
          SCANNING...
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-40 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="container mx-auto px-6 relative z-10 pt-20">
        <div className="max-w-5xl mx-auto text-center perspective-[1000px]">

          <motion.div
            style={{ y: textY, opacity: textOpacity }}
            className="will-change-transform"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex justify-center"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                {user ? "Activo · Contratación en curso" : "Planes disponibles"}
              </span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-8 leading-tight tracking-tight relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70">
                El futuro del
              </span>
              <span className="relative inline-block">
                <span className="absolute -inset-1 rounded-lg bg-primary/10 blur-xl opacity-50" />
                <span className="relative text-primary">sector inmobiliario</span>
              </span>
              <br />
              comienza aquí
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Infraestructura, data y modelos predictivos impulsados por IA.
              Únete a la preventa y transforma tu negocio inmobiliario.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button size="lg" className="h-14 px-8 text-lg rounded-full group shadow-[0_0_20px_-5px_rgba(0,123,255,0.4)] hover:shadow-[0_0_25px_-5px_rgba(0,123,255,0.6)] transition-all" asChild>
                <a href="#pricing">
                  {user ? "Completar mi Setup" : "Ver Planes"}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full backdrop-blur-sm bg-background/50" asChild>
                <a href="#pricing">Ver planes</a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 border-t border-border/50 bg-background/30 backdrop-blur-sm rounded-2xl p-8 shadow-2xl ring-1 ring-white/10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {[
              { label: "Asesores en espera", value: 1300, prefix: "+", format: true },
              { label: "Inmobiliarias", value: 150, prefix: "+", format: true },
              { label: "Lanzamiento", value: 2026, prefix: "", format: false }
            ].map((stat, i) => (
              <div key={i} className={`text-center relative ${i !== 2 ? 'md:border-r border-border/50' : ''}`}>
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full hidden md:block"
                  initial={{ height: 0, opacity: 0 }}
                  whileInView={{ height: "100%", opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 + (0.1 * i) }}
                />
                <div className="text-4xl lg:text-5xl font-bold text-foreground mb-2 flex justify-center items-center gap-1">
                  <span>{stat.prefix}</span>
                  <Counter from={0} to={stat.value} shouldFormat={stat.format} />
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}

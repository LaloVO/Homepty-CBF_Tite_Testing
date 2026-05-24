"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, RefreshCw, ExternalLink, Globe, Sparkles, Search, MapPin, Building, ShieldCheck } from "lucide-react";

// Interfaces para tipado riguroso
interface PropertyMock {
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
}

interface ClientAgency {
  id: string;
  domain: string;
  name: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  heroTitle: string;
  heroSubtitle: string;
  logo: React.ReactNode;
  properties: PropertyMock[];
  buildingType: string;
  isReal?: boolean;
  realUrl?: string;
}

export default function ClientsCarousel() {
  const [hoveredClient, setHoveredClient] = useState<ClientAgency | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Definición de las inmobiliarias (3 reales y 5 mockups premium)
  const clients: ClientAgency[] = [
    {
      id: "raquel",
      domain: "raquelmelendrez.homepty.com",
      realUrl: "https://raquelmelendrez.homepty.com/",
      isReal: true,
      name: "Raquel Melendrez",
      slogan: "Asesoría Inmobiliaria de Confianza",
      primaryColor: "#1C1C1E",     // Dark Gray
      secondaryColor: "#E2B65E",   // Elegant Gold
      accentColor: "#FAF8F5",
      fontFamily: "font-serif",
      heroTitle: "Asesoría Inmobiliaria Profesional",
      heroSubtitle: "Encuentra tu hogar ideal de mi mano con atención exclusiva y de confianza.",
      buildingType: "Residencial & Comercial Premium",
      logo: (
        <svg className="h-6 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="10" y="28" fontFamily="Georgia, serif" fontSize="24" fontWeight="bold" fill="currentColor" letterSpacing="1">RM</text>
          <line x1="58" y1="12" x2="58" y2="28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="70" y="26" fontFamily="Georgia, serif" fontSize="11" fontWeight="normal" fill="currentColor" letterSpacing="1">RAQUEL M.</text>
        </svg>
      ),
      properties: []
    },
    {
      id: "frankco",
      domain: "frankcoasesores.homepty.com",
      realUrl: "https://frankcoasesores.homepty.com/",
      isReal: true,
      name: "Frankco Asesores",
      slogan: "Inversión Inmobiliaria Estratégica",
      primaryColor: "#0A192F",     // Deep Blue
      secondaryColor: "#F5A623",   // Warm Orange
      accentColor: "#EAF2F8",
      fontFamily: "font-sans",
      heroTitle: "Líderes en Asesoría y Consultoría",
      heroSubtitle: "Proyectos exclusivos con alto retorno de inversión en las mejores zonas del país.",
      buildingType: "Asesoría & Inversiones Elite",
      logo: (
        <svg className="h-6 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12L20 20L10 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 12L27 20L17 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <text x="36" y="27" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="950" fill="currentColor" letterSpacing="1">FRANKCO</text>
        </svg>
      ),
      properties: []
    },
    {
      id: "sergio",
      domain: "sergio.homepty.com",
      realUrl: "https://sergio.homepty.com/",
      isReal: true,
      name: "Sergio Real Estate",
      slogan: "Encuentra tu Espacio Ideal",
      primaryColor: "#111827",     // Slate Dark
      secondaryColor: "#06B6D4",   // Premium Cyan
      accentColor: "#F3F4F6",
      fontFamily: "font-sans",
      heroTitle: "Tu Asesor Inmobiliario de Confianza",
      heroSubtitle: "Encuentra la propiedad que mejor se adapta a tus necesidades y presupuesto.",
      buildingType: "Brokerage de Alta Confianza",
      logo: (
        <svg className="h-6 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 26L20 14L30 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="21" r="4.5" fill="currentColor" />
          <text x="38" y="27" fontFamily="system-ui, sans-serif" fontSize="18" fontWeight="800" fill="currentColor" letterSpacing="1">SERGIO</text>
        </svg>
      ),
      properties: []
    },
    {
      id: "luxe",
      domain: "luxe.homepty.com",
      name: "Luxe & Co.",
      slogan: "Curating Exceptional Spaces",
      primaryColor: "#0F0F11",     // Deep Charcoal
      secondaryColor: "#D4AF37",   // Antique Gold
      accentColor: "#F7F5F0",      // Champagne Cream
      fontFamily: "font-serif",
      heroTitle: "Curating Exceptional Spaces",
      heroSubtitle: "Exclusive high-end residences tailored for discerning lifestyles.",
      buildingType: "Mansiones de Mármol & Penthouses",
      logo: (
        <svg className="h-7 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="10" y="28" fontFamily="Georgia, serif" fontSize="24" fontWeight="bold" fill="currentColor" letterSpacing="2">L&C</text>
          <line x1="75" y1="12" x2="75" y2="28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
          <text x="88" y="26" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="300" fill="currentColor" letterSpacing="3">LUXE & CO.</text>
        </svg>
      ),
      properties: [
        { title: "Villas de Mármol", price: "$4,850,000 USD", location: "Polanco, CDMX", beds: 4, baths: 5 },
        { title: "Duplex Penthouse", price: "$6,200,000 USD", location: "Lomas de Chapultepec", beds: 5, baths: 6 }
      ]
    },
    {
      id: "apex",
      domain: "apex.homepty.com",
      name: "Apex Living",
      slogan: "High-Trust Luxury Residences",
      primaryColor: "#0D2C22",     // Emerald Dark
      secondaryColor: "#E6C594",   // Warm Gold Sand
      accentColor: "#F4F7F5",      // Forest Mist
      fontFamily: "font-sans",
      heroTitle: "High-Trust Luxury Residences",
      heroSubtitle: "Sustainable architectural masterpieces engineered for supreme comfort.",
      buildingType: "Residenciales Inteligentes & Sostenibles",
      logo: (
        <svg className="h-7 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25 8L39 30H11L25 8Z" fill="currentColor" />
          <path d="M25 15L33 28H17L25 15Z" fill="#0D2C22" />
          <text x="50" y="27" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="900" fill="currentColor" letterSpacing="1">APEX</text>
          <text x="110" y="27" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="300" fill="currentColor" letterSpacing="2">LIVING</text>
        </svg>
      ),
      properties: [
        { title: "Skyline Residence", price: "$2,950,000 USD", location: "Santa Fe, CDMX", beds: 3, baths: 3.5 },
        { title: "Eco-Mansion Forestal", price: "$3,800,000 USD", location: "Valle de Bravo", beds: 4, baths: 4.5 }
      ]
    },
    {
      id: "horizon",
      domain: "horizon.homepty.com",
      name: "Horizon Properties",
      slogan: "Find Your Coastal Sanctuary",
      primaryColor: "#0F2C59",     // Deep Ocean Blue
      secondaryColor: "#00D4FF",   // Electric Cyan
      accentColor: "#F0F6FC",      // Sea Foam White
      fontFamily: "font-sans",
      heroTitle: "Find Your Coastal Sanctuary",
      heroSubtitle: "Bright, open-concept spaces framing spectacular infinite ocean horizons.",
      buildingType: "Condos Frente al Mar & Villas de Playa",
      logo: (
        <svg className="h-7 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 24C18 20 22 28 30 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M10 18C18 14 22 22 30 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          <circle cx="20" cy="12" r="4" fill="currentColor" />
          <text x="42" y="26" fontFamily="system-ui, sans-serif" fontSize="18" fontWeight="800" fill="currentColor" letterSpacing="2">HORIZON</text>
        </svg>
      ),
      properties: [
        { title: "Villas Careyes", price: "$5,300,000 USD", location: "Costa Careyes, Jal.", beds: 5, baths: 5 },
        { title: "Marina Bay Condo", price: "$1,890,000 USD", location: "Puerto Vallarta", beds: 2, baths: 2 }
      ]
    },
    {
      id: "terra",
      domain: "terra.homepty.com",
      name: "Terra Capital",
      slogan: "Solid Ground for Investments",
      primaryColor: "#3A231C",     // Rich Terracotta
      secondaryColor: "#DF7A5F",   // Soft Burnt Rust
      accentColor: "#FAF7F5",      // Clay Sand
      fontFamily: "font-sans",
      heroTitle: "Solid Ground for High-Yield Investments",
      heroSubtitle: "Strategic development land and premier industrial assets optimized for yield.",
      buildingType: "Zonas Industriales & Desarrollos Comerciales",
      logo: (
        <svg className="h-7 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="20" r="12" stroke="currentColor" strokeWidth="2.5" />
          <path d="M16 20H28" stroke="currentColor" strokeWidth="2.5" />
          <path d="M22 14V26" stroke="currentColor" strokeWidth="2.5" />
          <text x="44" y="26" fontFamily="system-ui, sans-serif" fontSize="18" fontWeight="700" fill="currentColor" letterSpacing="1.5">TERRA</text>
          <text x="105" y="26" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="300" fill="currentColor" letterSpacing="2.5">CAPITAL</text>
        </svg>
      ),
      properties: [
        { title: "San Pedro Tower Suite", price: "$1,650,000 USD", location: "San Pedro, NL", beds: 2, baths: 2 },
        { title: "Lote Industrial Plus", price: "$7,900,000 USD", location: "El Marqués, Qro.", beds: 0, baths: 0 }
      ]
    },
    {
      id: "vanguard",
      domain: "vanguard.homepty.com",
      name: "Vanguard Realty",
      slogan: "AI-Powered Real Estate Brokerage",
      primaryColor: "#121214",     // Cyber Gray
      secondaryColor: "#9E7AFF",   // Electric Purple
      accentColor: "#18181C",      // Dark Tech Board
      fontFamily: "font-mono",
      heroTitle: "AI-Powered Real Estate Brokerage",
      heroSubtitle: "Hyper-personalized property matching powered by predictive neural models.",
      buildingType: "Lofts Domóticos & Smart Penthouses",
      logo: (
        <svg className="h-7 w-auto" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 10L20 30L28 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 10L30 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          <text x="40" y="27" fontFamily="monospace" fontSize="18" fontWeight="bold" fill="currentColor" letterSpacing="1">VANGUARD</text>
        </svg>
      ),
      properties: [
        { title: "Condesa Smart Loft", price: "$990,000 USD", location: "Condesa, CDMX", beds: 1, baths: 1.5 },
        { title: "Roma Automation Penthouse", price: "$1,720,000 USD", location: "Roma Norte, CDMX", beds: 2, baths: 2 }
      ]
    }
  ];

  // Duplicar la lista para lograr un marquee infinito perfectamente fluido
  const marqueeClients = [...clients, ...clients, ...clients];

  // Manejo elegante de hover y posicionamiento
  const handleMouseEnter = (client: ClientAgency, event: React.MouseEvent<HTMLDivElement>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Obtener la posición del contenedor relativo
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cardRect = event.currentTarget.getBoundingClientRect();
      
      // Posicionar el preview centrado arriba del logo hovered
      setHoverPos({
        x: cardRect.left - rect.left + cardRect.width / 2,
        y: cardRect.top - rect.top
      });
    }
    
    setHoveredClient(client);
    setIframeLoading(true); // Inicializar en cargando para sitos reales
    setIsCarouselPaused(true);
  };

  const handleMouseLeave = () => {
    // Añadimos una ventana de tiempo de 350ms antes de cerrar para permitir al usuario
    // mover el cursor sobre la previsualización interactiva si lo desea
    timeoutRef.current = setTimeout(() => {
      setHoveredClient(null);
      setIsCarouselPaused(false);
    }, 350);
  };

  const handlePreviewMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handlePreviewMouseLeave = () => {
    setHoveredClient(null);
    setIsCarouselPaused(false);
  };

  // Limpiar timers
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <section ref={containerRef} className="py-20 relative bg-background overflow-hidden border-y border-border/50">
      
      {/* Elementos Decorativos de Fondo de Alta Gama */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Encabezado Principal */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-foreground"
          >
            Nuestros clientes ya tienen su{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              sitio web inmobiliario
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Coloca el cursor sobre los logotipos para previsualizar, interactuar y navegar por la página principal en tiempo real de cada uno de sus desarrollos.
          </motion.p>
        </div>

        {/* Zona del Carrusel con Contenedor Relativo */}
        <div className="relative w-full py-8 mt-4">
          
          {/* Sombras laterales degradadas para un corte visual elegante */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

          {/* Marquee del Carrusel Infinito */}
          <div className="flex overflow-hidden w-full select-none">
            <motion.div
              className="flex whitespace-nowrap gap-8"
              animate={isCarouselPaused ? {} : { x: [0, -2200] }}
              transition={
                isCarouselPaused
                  ? {}
                  : {
                      x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 48,
                        ease: "linear",
                      },
                    }
              }
            >
              {marqueeClients.map((client, index) => (
                <div
                  key={`${client.id}-${index}`}
                  onMouseEnter={(e) => handleMouseEnter(client, e)}
                  onMouseLeave={handleMouseLeave}
                  className={`inline-flex items-center justify-center min-w-[220px] h-20 px-8 rounded-2xl cursor-pointer transition-all duration-300 relative group border ${
                    hoveredClient?.id === client.id
                      ? "bg-primary/10 border-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-primary"
                      : "bg-background/40 hover:bg-background/80 border-border/60 hover:border-border text-muted-foreground hover:text-foreground shadow-sm"
                  } backdrop-blur-md overflow-hidden`}
                >
                  {/* Fondo sutil brillante al hacer hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Render del Logo SVG */}
                  <div className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                    {client.logo}
                  </div>
                  
                  {/* Pequeña bombilla/indicador de previsualización */}
                  <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-0.5 text-[9px] font-semibold text-primary uppercase tracking-wider">
                    <Sparkles className="w-2 h-2" /> Live
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ========================================================================= */}
          {/* VENTANA FLOTANTE DE PREVISUALIZACIÓN TIPO NAVEGADOR macOS */}
          {/* ========================================================================= */}
          <AnimatePresence>
            {hoveredClient && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y: -360, // Muestra el popup por encima del logo
                  scale: 1,
                  x: hoverPos.x - 280, // Centrar el preview de 560px de ancho
                }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                onMouseEnter={handlePreviewMouseEnter}
                onMouseLeave={handlePreviewMouseLeave}
                className="absolute z-50 w-[560px] h-[340px] rounded-2xl bg-[#0b0c10]/95 backdrop-blur-xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pointer-events-auto"
              >
                
                {/* 1. Barra de Navegación del Navegador macOS */}
                <div className="h-10 bg-[#12141c] border-b border-white/5 flex items-center px-4 justify-between select-none">
                  {/* Botones de control estilo Mac */}
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] block" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] block" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] block" />
                  </div>
                  
                  {/* Barra de Direcciones SSL */}
                  <div className="flex-1 max-w-[340px] mx-4 h-6.5 bg-black/40 rounded-md border border-white/5 flex items-center justify-between px-3 text-[11px] text-white/50">
                    <div className="flex items-center gap-1.5 truncate">
                      <Lock className="w-3 h-3 text-[#27c93f] shrink-0" />
                      <span className="text-white/30">https://</span>
                      <span className="text-white/80 font-mono truncate">{hoveredClient.domain}</span>
                    </div>
                    <RefreshCw className="w-2.5 h-2.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer shrink-0" />
                  </div>

                  {/* Icono de Enlace Externo */}
                  <a 
                    href={hoveredClient.isReal && hoveredClient.realUrl ? hoveredClient.realUrl : `https://${hoveredClient.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-primary font-medium hover:underline cursor-pointer transition-colors"
                  >
                    <span>Visitar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* 2. Área de visualización interactiva de la web del cliente */}
                <div 
                  className={`flex-1 overflow-y-auto overflow-x-hidden ${hoveredClient.fontFamily} select-none relative`}
                  style={{
                    backgroundColor: hoveredClient.primaryColor,
                    color: hoveredClient.primaryColor === "#0F0F11" || hoveredClient.primaryColor === "#121214" || hoveredClient.primaryColor === "#0D2C22" || hoveredClient.primaryColor === "#3A231C" || hoveredClient.primaryColor === "#1C1C1E" || hoveredClient.primaryColor === "#0A192F" || hoveredClient.primaryColor === "#111827" ? "#FFFFFF" : "#1A1A1A"
                  }}
                >
                  
                  {hoveredClient.isReal && hoveredClient.realUrl ? (
                    /* CASO A: Sitio real con carga de iframe interactivo */
                    <div className="relative w-full h-full">
                      
                      {/* Animación de carga y skeleton en tiempo real */}
                      {iframeLoading && (
                        <div className="absolute inset-0 bg-[#0c0d12] flex flex-col items-center justify-center gap-4 z-30 p-8 text-center">
                          <div className="relative flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                            <Sparkles className="w-3.5 h-3.5 text-primary absolute animate-pulse" />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <h4 className="text-xs font-semibold text-white/90">Estableciendo conexión segura...</h4>
                            <p className="text-[10px] text-white/50 max-w-xs leading-normal">
                              Cargando sitio real de <strong className="text-white/80">{hoveredClient.name}</strong> en tiempo real.
                            </p>
                          </div>
                          
                          {/* Skeleton visual */}
                          <div className="w-full max-w-[240px] space-y-2 mt-4 opacity-20">
                            <div className="h-3 bg-white/20 rounded w-3/4 animate-pulse mx-auto" />
                            <div className="h-2 bg-white/10 rounded w-1/2 animate-pulse mx-auto" />
                            <div className="h-8 bg-white/5 rounded w-full animate-pulse mt-3 mx-auto" />
                          </div>
                        </div>
                      )}
                      
                      {/* El Iframe que conecta con el sitio real */}
                      <iframe
                        src={hoveredClient.realUrl}
                        title={hoveredClient.name}
                        className="w-full h-full border-none pointer-events-auto relative z-10 bg-white"
                        onLoad={() => setIframeLoading(false)}
                      />
                    </div>
                  ) : (
                    /* CASO B: Sitio mockup simulado localmente de alta fidelidad */
                    <>
                      {/* A) Encabezado de la Inmobiliaria */}
                      <div 
                        className="py-3 px-6 border-b flex items-center justify-between"
                        style={{ borderColor: "rgba(255,255,255,0.08)" }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="scale-75 origin-left shrink-0 opacity-90 text-white">
                            {hoveredClient.logo}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[10px] font-medium opacity-70">
                          <span>Propiedades</span>
                          <span>Desarrollos</span>
                          <span className="hidden sm:inline">Contacto</span>
                          <span 
                            className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wide uppercase shrink-0"
                            style={{
                              backgroundColor: hoveredClient.secondaryColor,
                              color: hoveredClient.primaryColor
                            }}
                          >
                            Buscar
                          </span>
                        </div>
                      </div>

                      {/* B) Sección Hero Inmobiliaria */}
                      <div className="relative py-8 px-6 overflow-hidden flex flex-col gap-3 min-h-[140px] justify-center">
                        <div className="absolute inset-0 z-0 opacity-25">
                          <div 
                            className="w-full h-full bg-cover bg-center"
                            style={{
                              backgroundImage: 
                                hoveredClient.id === "luxe" 
                                  ? "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=300&auto=format&fit=crop')"
                                  : hoveredClient.id === "apex"
                                  ? "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=300&auto=format&fit=crop')"
                                  : hoveredClient.id === "horizon"
                                  ? "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=300&auto=format&fit=crop')"
                                  : "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop')"
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        </div>

                        <div className="relative z-10 flex flex-col gap-2 max-w-sm">
                          <div className="flex items-center gap-1">
                            <span 
                              className="w-1.5 h-1.5 rounded-full animate-pulse" 
                              style={{ backgroundColor: hoveredClient.secondaryColor }}
                            />
                            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 text-white/90">
                              {hoveredClient.buildingType}
                            </span>
                          </div>

                          <h3 className="text-lg md:text-xl font-bold leading-tight tracking-tight text-white">
                            {hoveredClient.heroTitle}
                          </h3>

                          <p className="text-[10px] opacity-80 leading-relaxed text-white/70 max-w-xs">
                            {hoveredClient.heroSubtitle}
                          </p>
                        </div>
                      </div>

                      {/* C) Buscador Mini */}
                      <div className="px-6 py-2">
                        <div 
                          className="rounded-lg p-2.5 flex items-center justify-between border shadow-lg"
                          style={{ 
                            backgroundColor: "rgba(255,255,255,0.04)",
                            borderColor: "rgba(255,255,255,0.08)"
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-1 opacity-70">
                              <MapPin className="w-3 h-3 text-white/60" />
                              <span className="text-[10px] text-white">Polanco, CDMX</span>
                            </div>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-1 opacity-70">
                              <Building className="w-3 h-3 text-white/60" />
                              <span className="text-[10px] text-white">Residencial</span>
                            </div>
                          </div>
                          
                          <button 
                            className="h-6 px-3 rounded-md text-[9px] font-bold flex items-center gap-1 transition-transform active:scale-95 shrink-0"
                            style={{
                              backgroundColor: hoveredClient.secondaryColor,
                              color: hoveredClient.primaryColor
                            }}
                          >
                            <Search className="w-2.5 h-2.5" />
                            Buscar
                          </button>
                        </div>
                      </div>

                      {/* D) Grid de Propiedades Destacadas */}
                      <div className="px-6 py-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between opacity-80">
                          <span className="text-[10px] font-bold uppercase tracking-wider">Propiedades Premium</span>
                          <span className="text-[9px] flex items-center gap-0.5 opacity-60">Ver todas &rarr;</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {hoveredClient.properties.map((prop, idx) => (
                            <div 
                              key={idx}
                              className="rounded-lg overflow-hidden border transition-all duration-300 hover:-translate-y-0.5"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.02)",
                                borderColor: "rgba(255,255,255,0.06)",
                              }}
                            >
                              <div className="h-16 bg-white/5 relative">
                                <div 
                                  className="w-full h-full bg-cover bg-center"
                                  style={{
                                    backgroundImage:
                                      idx === 0 
                                        ? "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=200&auto=format&fit=crop')"
                                        : "url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=200&auto=format&fit=crop')"
                                  }}
                                />
                                <span 
                                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide text-white"
                                  style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                                >
                                  Exclusivo
                                </span>
                              </div>
                              <div className="p-2 flex flex-col gap-1">
                                <h4 className="text-[10px] font-bold truncate text-white">{prop.title}</h4>
                                <p className="text-[9px] opacity-60 truncate text-white/80">{prop.location}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] font-extrabold" style={{ color: hoveredClient.secondaryColor }}>{prop.price}</span>
                                  <span className="text-[8px] opacity-50">{prop.beds} Rec. · {prop.baths} Baños</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* E) Pie de Página Inmobiliaria */}
                      <div 
                        className="py-4 px-6 border-t flex items-center justify-between text-[8px] opacity-50"
                        style={{ borderColor: "rgba(255,255,255,0.06)" }}
                      >
                        <span>© {new Date().getFullYear()} {hoveredClient.name}</span>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-[#27c93f]" />
                          <span>Sitio Protegido por Homepty</span>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </section>
  );
}

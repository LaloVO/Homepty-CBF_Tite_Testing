"use client";
import { useRef, useEffect, useState } from "react";

export default function WhiteLabelSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const handleScroll = () => {
            const rect = section.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            const start = windowHeight;
            const end = windowHeight * 0.3;
            const current = rect.top;
            const progress = Math.max(0, Math.min(1, (start - current) / (start - end)));

            setScrollProgress(progress);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const titleOpacity = Math.min(1, scrollProgress * 5);
    const titleY = Math.max(0, 30 - scrollProgress * 150);

    const paragraphOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.05) * 5));
    const paragraphY = Math.max(0, 20 - (scrollProgress - 0.05) * 100);

    const mockup1Progress = Math.min(1, Math.max(0, (scrollProgress - 0.1) * 3.33));
    const mockup2Progress = Math.min(1, Math.max(0, (scrollProgress - 0.2) * 3.33));

    const mockup1Y = -200 * (1 - mockup1Progress);
    const mockup2Y = -200 * (1 - mockup2Progress);

    return (
        <section
            ref={sectionRef}
            className="whitelabel-section py-4 px-6 relative overflow-hidden bg-accent/30"
        >
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                    <div className="text-content">
                        <h2
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight"
                            style={{
                                opacity: titleOpacity,
                                transform: `translateY(${titleY}px)`,
                                willChange: "transform, opacity",
                            }}
                        >
                            ¡Todo el poder de Homepty estará en tu marca!
                        </h2>

                        <p
                            className="text-xl text-muted-foreground leading-relaxed"
                            style={{
                                opacity: paragraphOpacity,
                                transform: `translateY(${paragraphY}px)`,
                                willChange: "transform, opacity",
                            }}
                        >
                            Tu página web, tu identidad, tu marca — respaldada por la infraestructura más avanzada
                            del sector inmobiliario. Mientras tus clientes navegan una experiencia 100% personalizada
                            con tu branding, detrás de escena trabaja el motor de Homepty: inteligencia de mercado
                            en tiempo real, modelos predictivos de machine learning, y un dataset exclusivo de
                            miles de propiedades. Tú eres la cara; nosotros, el poder invisible que te hace
                            destacar.
                        </p>
                    </div>

                    <div className="mockups-container relative pb-[30px]">
                        <div
                            className="mockup-card"
                            style={{
                                transform: `translateY(${mockup1Y}px)`,
                                opacity: mockup1Progress,
                                willChange: "transform, opacity",
                                position: "relative",
                                zIndex: 1,
                            }}
                        >
                            <img
                                src="/images/mockup-pageModel-1.png"
                                alt="Homepty Page Model 1"
                                className="w-full max-w-2xl rounded-2xl shadow-2xl"
                            />
                        </div>

                        <div
                            className="mockup-card"
                            style={{
                                transform: `translateY(${mockup2Y}px) translateX(var(--mockup-offset))`,
                                opacity: mockup2Progress,
                                willChange: "transform, opacity",
                                position: "relative",
                                zIndex: 2,
                                marginTop: "var(--mockup-overlap)",
                            }}
                        >
                            <img
                                src="/images/muckup-pageModel-2.png"
                                alt="Homepty Page Model 2"
                                className="w-full max-w-2xl rounded-2xl shadow-2xl"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function PageMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        gsap.set(".hero-anim, .reveal", { clearProps: "all" });
        return;
      }

      const intro = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      intro
        .from(".nav", {
          autoAlpha: 0,
          y: -16,
          duration: 0.55,
        })
        .from(
          ".hero-anim",
          {
            autoAlpha: 0,
            y: 26,
            duration: 0.78,
            stagger: 0.12,
          },
          0.12,
        );

      ScrollTrigger.batch(".reveal", {
        start: "top 84%",
        once: true,
        interval: 0.08,
        batchMax: 3,
        onEnter: (elements) => {
          gsap.fromTo(
            elements,
            { autoAlpha: 0, y: 22 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.68,
              stagger: 0.09,
              ease: "power3.out",
              clearProps: "transform,opacity,visibility",
            },
          );
        },
      });

      gsap.from(".architecture .layer", {
        autoAlpha: 0,
        x: 28,
        duration: 0.72,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".architecture",
          start: "top 72%",
          once: true,
        },
      });

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh, { once: true });
      document.fonts.ready.then(refresh);

      return () => window.removeEventListener("load", refresh);
    },
    { scope },
  );

  return (
    <div ref={scope} className="motion-scope">
      {children}
    </div>
  );
}

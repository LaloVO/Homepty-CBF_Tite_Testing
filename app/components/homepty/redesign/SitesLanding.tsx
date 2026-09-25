import { Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import styles from "./SitesLanding.module.css";
import HeroSection from "./HeroSection";
import SiteSection from "./SiteSection";
import InfrastructureSection from "./InfrastructureSection";
import ComplianceSection from "./ComplianceSection";
import ConversionSection from "./ConversionSection";
import PageMotion from "./PageMotion";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--sites-font-body",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--sites-font-display",
  display: "swap",
});

export default function SitesLanding() {
  return (
    <div
      lang="es"
      className={`${styles.root} ${manrope.variable} ${spaceGrotesk.variable}`}
    >
      <PageMotion>
        <div className="nav-wrap">
          <nav className="nav" aria-label="Principal">
            <a href="#top" className="brand" aria-label="Homepty Sites">
              <span className="brand-mark" aria-hidden="true"></span>
              <span>
                {"homepty "}
                <span style={{ color: "#8090a4", fontWeight: "500" }}>
                  {"sites"}
                </span>
              </span>
            </a>
            <div className="nav-links">
              <Link href="/plantillas">{"Plantillas"}</Link>
              <a href="https://homepty.com/whyus">{"Nosotros"}</a>
            </div>
            <a className="nav-cta" href="https://app.homepty.com/">
              {"Crear mi appweb"}
            </a>
          </nav>
        </div>
        <main id="top">
          <HeroSection />
          <SiteSection />
          <InfrastructureSection />
          <ComplianceSection />
          <ConversionSection />
        </main>
        <footer className="footer">
          <span>{"© 2026 Homepty"}</span>
          <a href="mailto:contacto@homepty.info">contacto@homepty.info</a>
        </footer>
      </PageMotion>
    </div>
  );
}

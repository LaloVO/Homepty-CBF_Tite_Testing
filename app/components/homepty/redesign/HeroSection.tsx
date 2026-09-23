import SuiteStory from "./SuiteStory";

export default function HeroSection() {
  return (
    <section className="hero" id="product">
      <div className="hero-copy">
        <h1 className="hero-anim">
          {"Tu sitio inmobiliario puede operar como "}
          <span>{"producto."}</span>
        </h1>
        <div className="hero-side hero-anim">
          <p>
            {
              "Tu marca al frente. Debajo, una appweb conectada a inventario, mapa, datos, seguimiento, IA y capas de cumplimiento. No una plantilla más."
            }
          </p>
          <div className="hero-actions">
            <a href="#suite-story" className="btn-primary">
              {"Recorrer Homepty Suite\n              "}
              <svg
                className="btn-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </a>
            <a href="#capabilities" className="btn-secondary">
              {"Ver la experiencia del sitio"}
            </a>
          </div>
          <div className="hero-note">
            {
              "Pinned scrollytelling · transiciones scrubbed · producto real, no screenshots"
            }
          </div>
        </div>
      </div>
      <SuiteStory />
    </section>
  );
}

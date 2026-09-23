export default function ConversionSection() {
  return (
    <section className="cta-section">
      <div className="cta-box">
        <h2>
          {"Haz que tu sitio trabaje como una "}
          <span style={{ color: "var(--blue)" }}>{"app."}</span>
        </h2>
        <div className="cta-side">
          <p>
            {
              "Una presencia digital que puede empezar con inventario y captación, y crecer hacia data, seguimiento, IA y automatización sin perder tu marca."
            }
          </p>
          <a href="https://app.homepty.com/" className="btn-primary">
            {"Crear mi appweb "}
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
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
import { usePinnedStoryMotion } from "./usePinnedStoryMotion";
import MobileStoryControls from "./MobileStoryControls";

export default function SiteStory() {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectStory = usePinnedStoryMotion(rootRef, setActive);
  return (
    <div
      ref={rootRef}
      className="scroll-story site-story"
      id="site-story"
      data-story="site"
    >
      <div className="story-pin">
        <div className="story-shell site-story-shell">
          <div className="story-visual-column site-visual-column">
            <div className="story-ambient-grid"></div>
            <div className="story-frame-stack site-frame-stack">
              <article
                className={`story-frame${active === 0 ? " active" : ""}`}
                data-frame="0"
                aria-hidden={active !== 0}
                inert={active !== 0}
              >
                <div className="product-window public-window">
                  <div className="public-top">
                    <div className="public-brand">
                      <i></i>
                      <strong>{"Agencia"}</strong>
                    </div>
                    <nav>
                      <span>{"Propiedades"}</span>
                      <span>{"Comprar"}</span>
                      <span>{"Vender"}</span>
                      <span>{"Nosotros"}</span>
                    </nav>
                    <button type="button">{"Contacto"}</button>
                  </div>
                  <div className="public-home">
                    <div className="public-hero-copy">
                      <h3>
                        {"Encuentra una propiedad sin perderte entre portales."}
                      </h3>
                      <span>{"Bienes raíces, con contexto."}</span>
                      <p>
                        {
                          "Inventario propio, búsqueda geográfica y asesoría conectada a tu intención."
                        }
                      </p>
                      <div className="public-search">
                        <b>{"¿Dónde quieres buscar?"}</b>
                        <span>{"Saltillo, Coahuila"}</span>
                        <button type="button">{"Explorar"}</button>
                      </div>
                    </div>
                    <div className="public-hero-visual">
                      <div className="architecture-photo">
                        <div className="arch-light l1"></div>
                        <div className="arch-light l2"></div>
                        <div className="arch-building b1"></div>
                        <div className="arch-building b2"></div>
                        <div className="arch-building b3"></div>
                      </div>
                      <div className="floating-property">
                        <small>{"Destacada"}</small>
                        <strong>{"Residencia · San Patricio"}</strong>
                        <span>{"$6.8 M · 286 m²"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
              <article
                className={`story-frame${active === 1 ? " active" : ""}`}
                data-frame="1"
                aria-hidden={active !== 1}
                inert={active !== 1}
              >
                <div className="product-window public-window">
                  <div className="public-top">
                    <div className="public-brand">
                      <i></i>
                      <strong>{"Agencia"}</strong>
                    </div>
                    <nav>
                      <span className="active">{"Propiedades"}</span>
                      <span>{"Comprar"}</span>
                      <span>{"Vender"}</span>
                      <span>{"Nosotros"}</span>
                    </nav>
                    <button type="button">{"Contacto"}</button>
                  </div>
                  <div className="public-map-layout">
                    <aside>
                      <div className="public-map-search">
                        {"Querétaro · Industrial"}
                      </div>
                      <div className="public-card on">
                        <div className="ph industrial"></div>
                        <div>
                          <strong>{"Nave · El Marqués"}</strong>
                          <small>{"4,800 m² · renta"}</small>
                          <b>{"$185 / m²"}</b>
                        </div>
                      </div>
                      <div className="public-card">
                        <div className="ph warehouse"></div>
                        <div>
                          <strong>{"Bodega · Aeropuerto"}</strong>
                          <small>{"2,100 m² · renta"}</small>
                          <b>{"$164 / m²"}</b>
                        </div>
                      </div>
                      <div className="public-card">
                        <div className="ph land"></div>
                        <div>
                          <strong>{"Terreno · Colón"}</strong>
                          <small>{"18 ha · venta"}</small>
                          <b>{"$1,980 / m²"}</b>
                        </div>
                      </div>
                    </aside>
                    <div className="public-map">
                      <iframe
                        title="Mapa público"
                        loading="lazy"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=-100.47%2C20.52%2C-100.31%2C20.66&layer=mapnik&marker=20.5888%2C-100.3899"
                      ></iframe>
                      <div className="public-map-chip">
                        {"12 propiedades en esta zona"}
                      </div>
                      <div className="public-pin-card">
                        <small>{"Seleccionada"}</small>
                        <strong>{"Nave · El Marqués"}</strong>
                        <span>{"Ver ficha →"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
              <article
                className={`story-frame${active === 2 ? " active" : ""}`}
                data-frame="2"
                aria-hidden={active !== 2}
                inert={active !== 2}
              >
                <div className="product-window public-window">
                  <div className="public-top">
                    <div className="public-brand">
                      <i></i>
                      <strong>{"Agencia"}</strong>
                    </div>
                    <nav>
                      <span>{"Propiedades"}</span>
                      <span>{"Comprar"}</span>
                      <span className="active">{"Vender"}</span>
                      <span>{"Nosotros"}</span>
                    </nav>
                    <button type="button">{"Contacto"}</button>
                  </div>
                  <div className="intent-module seller-module">
                    <div className="intent-copy">
                      <h3>{"Empieza por entender el inmueble."}</h3>
                      <span>{"Vender propiedad"}</span>
                      <p>
                        {
                          "Un flujo diseñado para captar contexto útil antes de pedir datos personales."
                        }
                      </p>
                      <div className="intent-points">
                        <span>{"01 · Ubicación"}</span>
                        <span>{"02 · Tipo"}</span>
                        <span>{"03 · Condición"}</span>
                        <span>{"04 · Objetivo"}</span>
                      </div>
                    </div>
                    <div className="intent-form">
                      <div className="form-step">
                        <h4>{"¿Dónde está tu propiedad?"}</h4>
                        <small>{"Paso 1 de 4"}</small>
                        <label>{"Ciudad"}</label>
                        <div className="input-like">{"Saltillo, Coahuila"}</div>
                        <label>{"Colonia o zona"}</label>
                        <div className="input-like muted">
                          {"Ej. San Patricio"}
                        </div>
                        <div className="form-map-mini">
                          <iframe
                            title="Mapa para vender"
                            loading="lazy"
                            src="https://www.openstreetmap.org/export/embed.html?bbox=-101.01%2C25.40%2C-100.94%2C25.47&layer=mapnik&marker=25.4383%2C-100.9737"
                          ></iframe>
                        </div>
                        <button type="button">{"Continuar"}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
              <article
                className={`story-frame${active === 3 ? " active" : ""}`}
                data-frame="3"
                aria-hidden={active !== 3}
                inert={active !== 3}
              >
                <div className="product-window public-window">
                  <div className="public-top">
                    <div className="public-brand">
                      <i></i>
                      <strong>{"Agencia"}</strong>
                    </div>
                    <nav>
                      <span>{"Propiedades"}</span>
                      <span className="active">{"Comprar"}</span>
                      <span>{"Vender"}</span>
                      <span>{"Nosotros"}</span>
                    </nav>
                    <button type="button">{"Contacto"}</button>
                  </div>
                  <div className="intent-module request-module">
                    <div className="intent-copy">
                      <h3>
                        {"Describe la operación, no una lista de filtros."}
                      </h3>
                      <span>{"Solicita un inmueble"}</span>
                      <p>
                        {
                          "La intención se convierte en un brief estructurado que el asesor puede trabajar desde Homepty."
                        }
                      </p>
                      <div className="intent-quote">
                        {
                          "“Busco una nave en Querétaro de 4,000–5,000 m², con patio y acceso rápido a la 57.”"
                        }
                      </div>
                    </div>
                    <div className="request-card">
                      <h4>{"Industrial · renta"}</h4>
                      <small>{"Tu búsqueda"}</small>
                      <div className="request-tags">
                        <span>{"Querétaro"}</span>
                        <span>{"4,000–5,000 m²"}</span>
                        <span>{"Patio"}</span>
                        <span>{"Acceso 57"}</span>
                      </div>
                      <div className="request-match">
                        <div>
                          <small>{"Inventario visible"}</small>
                          <strong>{"7 coincidencias"}</strong>
                        </div>
                        <div>
                          <small>{"Asesor asignado"}</small>
                          <strong>{"Especialista industrial"}</strong>
                        </div>
                      </div>
                      <div className="request-next">
                        <i></i>
                        <div>
                          <strong>{"Siguiente paso"}</strong>
                          <span>{"Refinar disponibilidad y timing."}</span>
                        </div>
                      </div>
                      <button type="button">{"Enviar solicitud"}</button>
                    </div>
                  </div>
                </div>
              </article>
              <article
                className={`story-frame${active === 4 ? " active" : ""}`}
                data-frame="4"
                aria-hidden={active !== 4}
                inert={active !== 4}
              >
                <div className="product-window public-window valuation-window">
                  <div className="public-top">
                    <div className="public-brand">
                      <i></i>
                      <strong>{"Agencia"}</strong>
                    </div>
                    <nav>
                      <span>{"Propiedades"}</span>
                      <span>{"Comprar"}</span>
                      <span>{"Vender"}</span>
                      <span>{"Nosotros"}</span>
                    </nav>
                    <button type="button">{"Contacto"}</button>
                  </div>
                  <div className="valuation-ui">
                    <div className="valuation-copy">
                      <h3>{"Una estimación que explica de dónde sale."}</h3>
                      <span>{"Estimador de valor"}</span>
                      <p>
                        {
                          "Rango, comparables y confianza visibles. No un número mágico aislado."
                        }
                      </p>
                      <div className="valuation-fields">
                        <div>
                          <small>{"Ubicación"}</small>
                          <strong>{"San Patricio, Saltillo"}</strong>
                        </div>
                        <div>
                          <small>{"Superficie"}</small>
                          <strong>{"286 m²"}</strong>
                        </div>
                        <div>
                          <small>{"Tipología"}</small>
                          <strong>{"Residencial"}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="valuation-result">
                      <div className="estimate-head">
                        <small>{"Rango estimado"}</small>
                        <strong>{"$6.45 M — $7.08 M"}</strong>
                        <span>{"Confianza 82%"}</span>
                      </div>
                      <svg
                        viewBox="0 0 620 220"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <defs>
                          <linearGradient
                            id="valueArea"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0"
                              stopColor="#0b5fff"
                              stopOpacity=".18"
                            ></stop>
                            <stop
                              offset="1"
                              stopColor="#0b5fff"
                              stopOpacity="0"
                            ></stop>
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 176 C72 166 110 134 168 143 C226 152 260 106 316 112 C372 118 406 79 462 87 C518 95 558 55 620 62 L620 220 L0 220Z"
                          fill="url(#valueArea)"
                        ></path>
                        <path
                          d="M0 176 C72 166 110 134 168 143 C226 152 260 106 316 112 C372 118 406 79 462 87 C518 95 558 55 620 62"
                          fill="none"
                          stroke="#0b5fff"
                          strokeWidth="2.5"
                        ></path>
                      </svg>
                      <div className="valuation-comps">
                        <div>
                          <small>{"Comparable A"}</small>
                          <strong>{"$6.62 M"}</strong>
                          <span>{"0.8 km"}</span>
                        </div>
                        <div>
                          <small>{"Comparable B"}</small>
                          <strong>{"$6.88 M"}</strong>
                          <span>{"1.1 km"}</span>
                        </div>
                        <div>
                          <small>{"Comparable C"}</small>
                          <strong>{"$7.02 M"}</strong>
                          <span>{"1.4 km"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
          <div className="story-copy-column site-copy-column">
            <div className="story-copy-stack">
              <article
                className={`story-copy-item${active === 0 ? " active" : ""}`}
                aria-hidden={active !== 0}
                inert={active !== 0}
              >
                <h2>{"Home"}</h2>
                <span className="story-index">{"01 / 05"}</span>
                <p>
                  {
                    "Una entrada editorial que posiciona a la agencia y dirige al usuario hacia intención, inventario y conversación."
                  }
                </p>
              </article>
              <article
                className={`story-copy-item${active === 1 ? " active" : ""}`}
                aria-hidden={active !== 1}
                inert={active !== 1}
              >
                <h2>{"Mapa"}</h2>
                <span className="story-index">{"02 / 05"}</span>
                <p>
                  {
                    "El inventario deja de ser una cuadrícula estática. La ubicación se vuelve una dimensión de navegación y comparación."
                  }
                </p>
              </article>
              <article
                className={`story-copy-item${active === 2 ? " active" : ""}`}
                aria-hidden={active !== 2}
                inert={active !== 2}
              >
                <h2>{"Vender propiedad"}</h2>
                <span className="story-index">{"03 / 05"}</span>
                <p>
                  {
                    "La captación empieza con contexto del inmueble y del objetivo. La información entra ya estructurada al flujo operativo."
                  }
                </p>
              </article>
              <article
                className={`story-copy-item${active === 3 ? " active" : ""}`}
                aria-hidden={active !== 3}
                inert={active !== 3}
              >
                <h2>{"Solicita un inmueble"}</h2>
                <span className="story-index">{"04 / 05"}</span>
                <p>
                  {
                    "La necesidad del comprador o arrendatario se convierte en un brief legible por personas, datos y agentes."
                  }
                </p>
              </article>
              <article
                className={`story-copy-item${active === 4 ? " active" : ""}`}
                aria-hidden={active !== 4}
                inert={active !== 4}
              >
                <h2>{"Estimador de valor"}</h2>
                <span className="story-index">{"05 / 05"}</span>
                <p>
                  {
                    "El sitio entrega utilidad antes del contacto y puede explicar rango, comparables y nivel de confianza."
                  }
                </p>
              </article>
            </div>
            <div className="story-kicker">
              {"Tu marca · experiencia pública"}
            </div>
            <div className="story-step-rail" aria-label="Etapas de la appweb">
              <button
                className={`story-step${active === 0 ? " active" : ""}`}
                data-story-step="0"
                type="button"
                onClick={() => selectStory(0)}
                aria-pressed={active === 0}
              >
                <i></i>
                <span>{"Home"}</span>
              </button>
              <button
                className={`story-step${active === 1 ? " active" : ""}`}
                data-story-step="1"
                type="button"
                onClick={() => selectStory(1)}
                aria-pressed={active === 1}
              >
                <i></i>
                <span>{"Mapa"}</span>
              </button>
              <button
                className={`story-step${active === 2 ? " active" : ""}`}
                data-story-step="2"
                type="button"
                onClick={() => selectStory(2)}
                aria-pressed={active === 2}
              >
                <i></i>
                <span>{"Vender"}</span>
              </button>
              <button
                className={`story-step${active === 3 ? " active" : ""}`}
                data-story-step="3"
                type="button"
                onClick={() => selectStory(3)}
                aria-pressed={active === 3}
              >
                <i></i>
                <span>{"Solicita"}</span>
              </button>
              <button
                className={`story-step${active === 4 ? " active" : ""}`}
                data-story-step="4"
                type="button"
                onClick={() => selectStory(4)}
                aria-pressed={active === 4}
              >
                <i></i>
                <span>{"Estimador"}</span>
              </button>
            </div>
            <MobileStoryControls active={active} selectStory={selectStory} />
          </div>
        </div>
      </div>
    </div>
  );
}

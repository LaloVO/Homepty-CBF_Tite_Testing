"use client";

import { useRef, useState } from "react";
import { usePinnedStoryMotion } from "./usePinnedStoryMotion";

export default function SuiteStory() {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectStory = usePinnedStoryMotion(rootRef, setActive);
  return (
    <div
      ref={rootRef}
      className="scroll-story suite-story"
      id="suite-story"
      data-story="suite"
    >
      <div className="story-pin">
        <div className="story-shell">
          <div className="story-copy-column">
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
                    "Una superficie operacional única para inventario, actividad, clientes y contexto. El sitio no vive separado de la operación."
                  }
                </p>
              </article>
              <article
                className={`story-copy-item${active === 1 ? " active" : ""}`}
                aria-hidden={active !== 1}
                inert={active !== 1}
              >
                <h2>{"Agentes"}</h2>
                <span className="story-index">{"02 / 05"}</span>
                <p>
                  {
                    "Los agentes especializados viven detrás del Copilot y ejecutan tareas concretas: precalificar, documentar, organizar, analizar y dar seguimiento."
                  }
                </p>
              </article>
              <article
                className={`story-copy-item${active === 2 ? " active" : ""}`}
                aria-hidden={active !== 2}
                inert={active !== 2}
              >
                <h2>{"Explore"}</h2>
                <span className="story-index">{"03 / 05"}</span>
                <p>
                  {
                    "Inventario y geografía se convierten en una sola superficie de decisión. El mapa es navegación real, no decoración."
                  }
                </p>
              </article>
              <article
                className={`story-copy-item${active === 3 ? " active" : ""}`}
                aria-hidden={active !== 3}
                inert={active !== 3}
              >
                <h2>{"Mensajes"}</h2>
                <span className="story-index">{"04 / 05"}</span>
                <p>
                  {
                    "Conversaciones, propiedades y tareas permanecen conectadas al mismo contexto para evitar que cada canal cree un expediente distinto."
                  }
                </p>
              </article>
              <article
                className={`story-copy-item${active === 4 ? " active" : ""}`}
                aria-hidden={active !== 4}
                inert={active !== 4}
              >
                <h2>{"Inteligencia"}</h2>
                <span className="story-index">{"05 / 05"}</span>
                <p>
                  {
                    "Un CRM AI-native no empieza por llenar campos: construye memoria operacional a partir de señales, relaciones y comportamiento, y propone la siguiente acción."
                  }
                </p>
              </article>
            </div>
            <div className="story-kicker">
              {"Homepty Suite · detrás de tu appweb"}
            </div>
            <div
              className="story-step-rail"
              aria-label="Etapas de Homepty Suite"
            >
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
                <span>{"Agentes"}</span>
              </button>
              <button
                className={`story-step${active === 2 ? " active" : ""}`}
                data-story-step="2"
                type="button"
                onClick={() => selectStory(2)}
                aria-pressed={active === 2}
              >
                <i></i>
                <span>{"Explore"}</span>
              </button>
              <button
                className={`story-step${active === 3 ? " active" : ""}`}
                data-story-step="3"
                type="button"
                onClick={() => selectStory(3)}
                aria-pressed={active === 3}
              >
                <i></i>
                <span>{"Mensajes"}</span>
              </button>
              <button
                className={`story-step${active === 4 ? " active" : ""}`}
                data-story-step="4"
                type="button"
                onClick={() => selectStory(4)}
                aria-pressed={active === 4}
              >
                <i></i>
                <span>{"Inteligencia"}</span>
              </button>
            </div>
          </div>
          <div className="story-visual-column">
            <div className="story-ambient-grid"></div>
            <div className="story-frame-stack suite-frame-stack">
              <article
                className={`story-frame${active === 0 ? " active" : ""}`}
                data-frame="0"
                aria-hidden={active !== 0}
                inert={active !== 0}
              >
                <div className="product-window suite-window">
                  <div className="window-bar">
                    <div className="window-dots">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    <div className="window-title">
                      {"app.homepty.com / home"}
                    </div>
                    <span className="window-live">{"Live"}</span>
                  </div>
                  <div className="suite-ui suite-home-ui">
                    <aside className="suite-side">
                      <div className="suite-logo">
                        <b>{"h"}</b>
                        <span>{"homepty"}</span>
                      </div>
                      <nav>
                        <span className="on">{"Home"}</span>
                        <span>{"Agentes"}</span>
                        <span>{"Explore"}</span>
                        <span>{"Mensajes"}</span>
                        <span>{"Inteligencia"}</span>
                      </nav>
                      <div className="suite-user">
                        <i></i>
                        <div>
                          <strong>{"Agencia"}</strong>
                          <small>{"Workspace"}</small>
                        </div>
                      </div>
                    </aside>
                    <div className="suite-main">
                      <div className="suite-main-head">
                        <div>
                          <h3>{"Tu operación, en contexto."}</h3>
                          <small>{"Buenos días"}</small>
                        </div>
                        <button type="button">{"+ Nueva tarea"}</button>
                      </div>
                      <div className="suite-kpis">
                        <div>
                          <small>{"Prospectos activos"}</small>
                          <strong>{"38"}</strong>
                          <em>{"+12%"}</em>
                        </div>
                        <div>
                          <small>{"Propiedades vistas"}</small>
                          <strong>{"146"}</strong>
                          <em>{"7 días"}</em>
                        </div>
                        <div>
                          <small>{"Seguimientos"}</small>
                          <strong>{"21"}</strong>
                          <em>{"Hoy"}</em>
                        </div>
                      </div>
                      <div className="suite-home-grid">
                        <section className="suite-chart">
                          <div className="mini-head">
                            <strong>{"Actividad"}</strong>
                            <span>{"Últimos 30 días"}</span>
                          </div>
                          <svg
                            viewBox="0 0 520 190"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                          >
                            <defs>
                              <linearGradient
                                id="suiteArea"
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
                              d="M0 150 C50 142 72 118 118 127 C164 136 198 87 248 98 C298 109 326 71 370 78 C414 85 455 43 520 54 L520 190 L0 190Z"
                              fill="url(#suiteArea)"
                            ></path>
                            <path
                              d="M0 150 C50 142 72 118 118 127 C164 136 198 87 248 98 C298 109 326 71 370 78 C414 85 455 43 520 54"
                              fill="none"
                              stroke="#0b5fff"
                              strokeWidth="2.5"
                            ></path>
                          </svg>
                        </section>
                        <section className="suite-feed">
                          <div className="mini-head">
                            <strong>{"Ahora"}</strong>
                            <span>{"Contexto"}</span>
                          </div>
                          <div className="feed-row">
                            <i></i>
                            <p>
                              <b>{"María"}</b>
                              {" volvió a ver una propiedad guardada."}
                            </p>
                          </div>
                          <div className="feed-row">
                            <i></i>
                            <p>
                              <b>{"Copilot"}</b>
                              {" preparó 4 seguimientos prioritarios."}
                            </p>
                          </div>
                          <div className="feed-row">
                            <i></i>
                            <p>
                              <b>{"Inventario"}</b>
                              {" actualizó disponibilidad en 3 fichas."}
                            </p>
                          </div>
                        </section>
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
                <div className="product-window suite-window">
                  <div className="window-bar">
                    <div className="window-dots">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    <div className="window-title">
                      {"app.homepty.com / agentes"}
                    </div>
                    <span className="window-live">{"Orquestación"}</span>
                  </div>
                  <div className="suite-ui agents-ui">
                    <aside className="suite-side">
                      <div className="suite-logo">
                        <b>{"h"}</b>
                        <span>{"homepty"}</span>
                      </div>
                      <nav>
                        <span>{"Home"}</span>
                        <span className="on">{"Agentes"}</span>
                        <span>{"Explore"}</span>
                        <span>{"Mensajes"}</span>
                        <span>{"Inteligencia"}</span>
                      </nav>
                      <div className="suite-user">
                        <i></i>
                        <div>
                          <strong>{"Agencia"}</strong>
                          <small>{"Workspace"}</small>
                        </div>
                      </div>
                    </aside>
                    <div className="suite-main">
                      <div className="suite-main-head">
                        <div>
                          <h3>{"Especialistas coordinados por contexto."}</h3>
                          <small>{"Agentic workspace"}</small>
                        </div>
                        <button type="button">{"Configurar"}</button>
                      </div>
                      <div className="agent-orbit">
                        <div className="agent-core">
                          <span>{"Copilot"}</span>
                          <strong>{"1 tarea"}</strong>
                          <small>{"Coordina permisos y tools"}</small>
                        </div>
                        <div className="agent-node a1">
                          <i></i>
                          <strong>{"Precalificación"}</strong>
                          <small>{"Lead → perfil"}</small>
                        </div>
                        <div className="agent-node a2">
                          <i></i>
                          <strong>{"Documentos"}</strong>
                          <small>{"Checklist → expediente"}</small>
                        </div>
                        <div className="agent-node a3">
                          <i></i>
                          <strong>{"Seguimiento"}</strong>
                          <small>{"Señales → acción"}</small>
                        </div>
                        <div className="agent-node a4">
                          <i></i>
                          <strong>{"Inteligencia"}</strong>
                          <small>{"Datos → contexto"}</small>
                        </div>
                        <svg
                          className="agent-lines"
                          viewBox="0 0 760 430"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path d="M380 215 C300 180 250 120 170 95"></path>
                          <path d="M380 215 C465 170 530 118 620 92"></path>
                          <path d="M380 215 C298 260 245 320 165 345"></path>
                          <path d="M380 215 C470 260 532 315 625 344"></path>
                        </svg>
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
                <div className="product-window suite-window">
                  <div className="window-bar">
                    <div className="window-dots">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    <div className="window-title">
                      {"app.homepty.com / explore"}
                    </div>
                    <span className="window-live">{"Mapa real"}</span>
                  </div>
                  <div className="suite-ui">
                    <aside className="suite-side">
                      <div className="suite-logo">
                        <b>{"h"}</b>
                        <span>{"homepty"}</span>
                      </div>
                      <nav>
                        <span>{"Home"}</span>
                        <span>{"Agentes"}</span>
                        <span className="on">{"Explore"}</span>
                        <span>{"Mensajes"}</span>
                        <span>{"Inteligencia"}</span>
                      </nav>
                      <div className="suite-user">
                        <i></i>
                        <div>
                          <strong>{"Agencia"}</strong>
                          <small>{"Workspace"}</small>
                        </div>
                      </div>
                    </aside>
                    <div className="suite-main explore-suite">
                      <div className="suite-explore-bar">
                        <div className="fake-search">
                          {"Querétaro · Industrial"}
                        </div>
                        <button type="button">{"Filtros"}</button>
                        <button type="button">{"12 resultados"}</button>
                      </div>
                      <div className="suite-explore-layout">
                        <div className="suite-list">
                          <div className="suite-property on">
                            <div className="ph industrial"></div>
                            <div>
                              <strong>{"Nave · El Marqués"}</strong>
                              <small>{"4,800 m² · inmediata"}</small>
                              <b>{"$185 / m²"}</b>
                            </div>
                          </div>
                          <div className="suite-property">
                            <div className="ph warehouse"></div>
                            <div>
                              <strong>{"Bodega · Aeropuerto"}</strong>
                              <small>{"2,100 m² · triple altura"}</small>
                              <b>{"$164 / m²"}</b>
                            </div>
                          </div>
                          <div className="suite-property">
                            <div className="ph land"></div>
                            <div>
                              <strong>{"Terreno · Colón"}</strong>
                              <small>{"18 ha · industrial"}</small>
                              <b>{"$1,980 / m²"}</b>
                            </div>
                          </div>
                        </div>
                        <div className="suite-map">
                          <iframe
                            title="Explore map"
                            loading="lazy"
                            src="https://www.openstreetmap.org/export/embed.html?bbox=-100.47%2C20.52%2C-100.31%2C20.66&layer=mapnik&marker=20.5888%2C-100.3899"
                          ></iframe>
                          <div className="map-float">
                            <small>{"Seleccionada"}</small>
                            <strong>{"Nave · El Marqués"}</strong>
                            <span>{"Data + ficha + contacto"}</span>
                          </div>
                        </div>
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
                <div className="product-window suite-window">
                  <div className="window-bar">
                    <div className="window-dots">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    <div className="window-title">
                      {"app.homepty.com / mensajes"}
                    </div>
                    <span className="window-live">{"Omnicanal"}</span>
                  </div>
                  <div className="suite-ui">
                    <aside className="suite-side">
                      <div className="suite-logo">
                        <b>{"h"}</b>
                        <span>{"homepty"}</span>
                      </div>
                      <nav>
                        <span>{"Home"}</span>
                        <span>{"Agentes"}</span>
                        <span>{"Explore"}</span>
                        <span className="on">{"Mensajes"}</span>
                        <span>{"Inteligencia"}</span>
                      </nav>
                      <div className="suite-user">
                        <i></i>
                        <div>
                          <strong>{"Agencia"}</strong>
                          <small>{"Workspace"}</small>
                        </div>
                      </div>
                    </aside>
                    <div className="suite-main messages-ui">
                      <div className="inbox-list">
                        <div className="mini-head">
                          <strong>{"Mensajes"}</strong>
                          <span>{"12 abiertos"}</span>
                        </div>
                        <div className="thread on">
                          <i></i>
                          <div>
                            <strong>{"María González"}</strong>
                            <small>{"WhatsApp · hace 4 min"}</small>
                            <p>
                              {"¿Sigue disponible la casa de San Patricio?"}
                            </p>
                          </div>
                        </div>
                        <div className="thread">
                          <i></i>
                          <div>
                            <strong>{"Jorge N."}</strong>
                            <small>{"Web · hace 18 min"}</small>
                            <p>{"Necesito 4,000–5,000 m² en Querétaro."}</p>
                          </div>
                        </div>
                        <div className="thread">
                          <i></i>
                          <div>
                            <strong>{"Andrea R."}</strong>
                            <small>{"Email · ayer"}</small>
                            <p>{"Revisé el comparativo. ¿Agendamos?"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="conversation">
                        <div className="conversation-head">
                          <div>
                            <strong>{"María González"}</strong>
                            <small>
                              {"Contexto conectado · intención alta"}
                            </small>
                          </div>
                          <button type="button">{"Ver perfil"}</button>
                        </div>
                        <div className="conversation-body">
                          <div className="msg their">
                            {"¿Sigue disponible la casa de San Patricio?"}
                          </div>
                          <div className="context-card">
                            <span>{"Contexto recuperado"}</span>
                            <strong>
                              {
                                "Vio la propiedad 3 veces · guardó 2 comparables · presupuesto compatible"
                              }
                            </strong>
                          </div>
                          <div className="msg ours">
                            {
                              "Sí. También tengo dos opciones muy cercanas a tu rango. Te preparo el comparativo."
                            }
                          </div>
                        </div>
                        <div className="conversation-compose">
                          {"Responder con contexto… "}
                          <button type="button">{"↑"}</button>
                        </div>
                      </div>
                      <aside className="message-context">
                        <small>{"Objeto relacionado"}</small>
                        <div className="context-property">
                          <div className="ph"></div>
                          <strong>{"San Patricio"}</strong>
                          <span>{"$6.8 M · Saltillo"}</span>
                        </div>
                        <small>{"Señales"}</small>
                        <ul>
                          <li>{"3 visitas en 48 h"}</li>
                          <li>{"2 propiedades guardadas"}</li>
                          <li>{"Alta afinidad de presupuesto"}</li>
                        </ul>
                      </aside>
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
                <div className="product-window suite-window intelligence-window">
                  <div className="window-bar">
                    <div className="window-dots">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                    <div className="window-title">
                      {"app.homepty.com / inteligencia"}
                    </div>
                    <span className="window-live">{"AI-native CRM"}</span>
                  </div>
                  <div className="suite-ui">
                    <aside className="suite-side">
                      <div className="suite-logo">
                        <b>{"h"}</b>
                        <span>{"homepty"}</span>
                      </div>
                      <nav>
                        <span>{"Home"}</span>
                        <span>{"Agentes"}</span>
                        <span>{"Explore"}</span>
                        <span>{"Mensajes"}</span>
                        <span className="on">{"Inteligencia"}</span>
                      </nav>
                      <div className="suite-user">
                        <i></i>
                        <div>
                          <strong>{"Agencia"}</strong>
                          <small>{"Workspace"}</small>
                        </div>
                      </div>
                    </aside>
                    <div className="suite-main intelligence-ui">
                      <div className="intel-head">
                        <div>
                          <h3>{"María González"}</h3>
                          <small>{"Relationship intelligence"}</small>
                          <p>
                            {
                              "La ficha se construye con comportamiento, conversación y contexto; no con captura manual."
                            }
                          </p>
                        </div>
                        <div className="intent-score">
                          <small>{"Intención"}</small>
                          <strong>{"86"}</strong>
                          <span>{"alta"}</span>
                        </div>
                      </div>
                      <div className="intel-grid">
                        <section className="signal-graph">
                          <div className="intel-node center">
                            <b>{"MG"}</b>
                            <strong>{"María"}</strong>
                          </div>
                          <div className="intel-node n1">
                            <span>{"Propiedad"}</span>
                            <strong>{"San Patricio"}</strong>
                          </div>
                          <div className="intel-node n2">
                            <span>{"Canal"}</span>
                            <strong>{"WhatsApp"}</strong>
                          </div>
                          <div className="intel-node n3">
                            <span>{"Señal"}</span>
                            <strong>{"3 visitas"}</strong>
                          </div>
                          <div className="intel-node n4">
                            <span>{"Presupuesto"}</span>
                            <strong>{"$6–7 M"}</strong>
                          </div>
                          <svg
                            viewBox="0 0 560 320"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                          >
                            <path d="M280 160 L125 80"></path>
                            <path d="M280 160 L435 72"></path>
                            <path d="M280 160 L132 250"></path>
                            <path d="M280 160 L438 248"></path>
                          </svg>
                        </section>
                        <aside className="next-action">
                          <h4>
                            {"Enviar comparativo antes de solicitar cita."}
                          </h4>
                          <small>{"Next best action"}</small>
                          <p>
                            {
                              "La probabilidad de respuesta mejora cuando la conversación parte de las dos propiedades que guardó y resuelve la diferencia de precio por m²."
                            }
                          </p>
                          <div className="action-evidence">
                            <span>{"✓ 2 propiedades guardadas"}</span>
                            <span>{"✓ 3 visitas recientes"}</span>
                            <span>{"✓ pregunta de disponibilidad"}</span>
                          </div>
                          <button type="button">
                            {"Preparar comparativo"}
                          </button>
                        </aside>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
            <div className="story-depth-label">{"SCROLL TO ORCHESTRATE"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

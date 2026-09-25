"use client";

import { useRef, useState } from "react";
import SuiteMockup from "./SuiteMockups";
import MobileStoryControls from "./MobileStoryControls";
import { usePinnedStoryMotion } from "./usePinnedStoryMotion";

export default function SuiteStory() {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectStory = usePinnedStoryMotion(rootRef, setActive, true);
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
            <MobileStoryControls active={active} selectStory={selectStory} />
          </div>
          <div className="story-visual-column">
            <div className="story-ambient-grid"></div>
            <div className="story-frame-stack suite-frame-stack">
              {[0, 1, 2, 3, 4].map((screen) => (
                <article
                  key={screen}
                  className={`story-frame${active === screen ? " active" : ""}`}
                  data-frame={screen}
                  aria-hidden={active !== screen}
                  inert={active !== screen}
                >
                  <div className="product-window suite-window">
                    <SuiteMockup screen={screen} />
                  </div>
                </article>
              ))}
            </div>
            <div className="story-depth-label">{"SCROLL TO ORCHESTRATE"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

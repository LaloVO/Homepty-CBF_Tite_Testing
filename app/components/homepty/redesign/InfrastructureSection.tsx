import type { CSSProperties } from "react";

export default function InfrastructureSection() {
  return (
    <section className="section" id="infrastructure">
      <div className="section-inner">
        <h2 className="section-title reveal">
          {"Tu appweb no termina cuando se publica. "}
          <span className="blue">{"Puede seguir creciendo."}</span>
        </h2>
        <div className="section-kicker reveal">
          {"Marca arriba. Infraestructura debajo."}
        </div>
        <p className="section-lead reveal">
          {
            "La propuesta de Homepty Sites debe vender una arquitectura de producto, no una página terminada: nuevas capacidades pueden incorporarse sin reconstruir la presencia digital desde cero."
          }
        </p>
        <div className="architecture reveal">
          <div className="arch-grid"></div>
          <div className="arch-content">
            <div className="arch-copy">
              <h3>{"La interfaz es la punta del sistema."}</h3>
              <p>
                {
                  "Una misma appweb puede exponer únicamente lo que el negocio necesita hoy y habilitar nuevas capas conforme cambian el inventario, el equipo o la operación. Esto evita que el sitio se convierta en un activo estático que envejece aislado."
                }
              </p>
            </div>
            <div className="arch-stack">
              <div className="layer" style={{ "--x": "22px" } as CSSProperties}>
                <i>{"01"}</i>
                <div>
                  <strong>{"Tu marca y tu experiencia"}</strong>
                  <small>{"Dominio, identidad, narrativa, propiedades"}</small>
                </div>
                <em>{"visible al cliente"}</em>
              </div>
              <div className="layer" style={{ "--x": "9px" } as CSSProperties}>
                <i>{"02"}</i>
                <div>
                  <strong>{"Product shell inmobiliario"}</strong>
                  <small>
                    {"Búsqueda, mapa, fichas, comparador, contacto"}
                  </small>
                </div>
                <em>{"interfaz"}</em>
              </div>
              <div className="layer" style={{ "--x": "-4px" } as CSSProperties}>
                <i>{"03"}</i>
                <div>
                  <strong>{"Operación conectada"}</strong>
                  <small>
                    {"Prospectos, seguimiento, workspaces y CRM IA"}
                  </small>
                </div>
                <em>{"workflow"}</em>
              </div>
              <div
                className="layer"
                style={{ "--x": "-17px" } as CSSProperties}
              >
                <i>{"04"}</i>
                <div>
                  <strong>{"Inteligencia y automatización"}</strong>
                  <small>{"Modelos, agentes, reportes y contexto"}</small>
                </div>
                <em>{"capabilities"}</em>
              </div>
              <div
                className="layer"
                style={{ "--x": "-30px" } as CSSProperties}
              >
                <i>{"05"}</i>
                <div>
                  <strong>{"Homepty infrastructure"}</strong>
                  <small>
                    {"Datos, permisos, APIs, seguridad y evolución"}
                  </small>
                </div>
                <em>{"backbone"}</em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

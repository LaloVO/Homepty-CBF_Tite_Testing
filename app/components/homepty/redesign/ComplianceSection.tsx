export default function ComplianceSection() {
  return (
    <section className="section soft" id="compliance">
      <div className="section-inner">
        <div className="compliance">
          <div className="legal-ui reveal">
            <div className="legal-head">
              <strong>{"Checklist de publicación"}</strong>
              <span>{"Validación activa"}</span>
            </div>
            <div className="legal-body">
              <div className="check">
                <i>{"✓"}</i>
                <div>
                  <strong>{"Información comercial"}</strong>
                  <small>{"Campos y datos visibles en la ficha."}</small>
                </div>
                <em>{"completo"}</em>
              </div>
              <div className="check">
                <i>{"✓"}</i>
                <div>
                  <strong>{"Publicidad y material visual"}</strong>
                  <small>
                    {"Revisión de información mostrada al usuario."}
                  </small>
                </div>
                <em>{"completo"}</em>
              </div>
              <div className="check">
                <i>{"✓"}</i>
                <div>
                  <strong>{"Canales de atención"}</strong>
                  <small>
                    {"Datos de contacto y seguimiento disponibles."}
                  </small>
                </div>
                <em>{"activo"}</em>
              </div>
              <div className="check">
                <i>{"✓"}</i>
                <div>
                  <strong>{"Trazabilidad"}</strong>
                  <small>
                    {"Registro de cambios y contexto de publicación."}
                  </small>
                </div>
                <em>{"activo"}</em>
              </div>
            </div>
          </div>
          <div className="legal-copy reveal">
            <h3>
              {
                "El cumplimiento no debería aparecer como una página olvidada en el footer."
              }
            </h3>
            <div className="section-kicker reveal">
              {"Cumplimiento integrado al producto"}
            </div>
            <p>
              {
                "Puede formar parte del flujo de publicación, revisión y atención. La interfaz hace visible qué falta y qué ya está listo, reduciendo dependencia de checklists manuales dispersos."
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

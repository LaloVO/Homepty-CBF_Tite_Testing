export default function ComplianceSection() {
  return (
    <section className="section soft" id="compliance">
      <div className="section-inner">
        <div className="compliance">
          <div className="legal-ui reveal">
            <div className="legal-head">
              <strong>{"Seguimiento LFPIORPI"}</strong>
              <span>{"Por operación"}</span>
            </div>
            <div className="legal-body">
              <div className="check">
                <i>{"01"}</i>
                <div>
                  <strong>{"Identificación del cliente"}</strong>
                  <small>{"Datos y documentos que acreditan su identidad."}</small>
                </div>
                <em>{"Revisar"}</em>
              </div>
              <div className="check">
                <i>{"02"}</i>
                <div>
                  <strong>{"Beneficiario controlador"}</strong>
                  <small>{"Declaración y soporte, cuando corresponda."}</small>
                </div>
                <em>{"Verificar"}</em>
              </div>
              <div className="check">
                <i>{"03"}</i>
                <div>
                  <strong>{"Expediente de la operación"}</strong>
                  <small>{"Documentos y evidencia que deben conservarse."}</small>
                </div>
                <em>{"Organizar"}</em>
              </div>
              <div className="check">
                <i>{"04"}</i>
                <div>
                  <strong>{"Evaluación de riesgo"}</strong>
                  <small>{"Información necesaria para valorar el caso."}</small>
                </div>
                <em>{"Evaluar"}</em>
              </div>
              <div className="check">
                <i>{"05"}</i>
                <div>
                  <strong>{"Avisos al SAT"}</strong>
                  <small>{"Revisión del supuesto y umbral aplicables."}</small>
                </div>
                <em>{"Determinar"}</em>
              </div>
            </div>
          </div>
          <div className="legal-copy reveal">
            <h2>
              {"La LFPIORPI también forma parte de tu operación inmobiliaria."}
            </h2>
            <div className="section-kicker reveal">
              {"Ley antilavado · expedientes y avisos"}
            </div>
            <p>
              {
                "En actividades inmobiliarias sujetas a la ley antilavado, la identificación del cliente, el expediente y los Avisos dependen de la operación y los umbrales aplicables. Homepty organiza la información y muestra lo pendiente para que tu equipo pueda darle seguimiento."
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

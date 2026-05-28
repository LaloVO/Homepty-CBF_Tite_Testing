import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/cbf/leads
 * Registra un lead calificado de 6 pasos procedente del sitio satélite.
 * 
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 */
export async function POST(request: NextRequest) {
  // 1. Autenticar la solicitud utilizando el middleware por API Key del satélite
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Retorna error de autenticación 401
  }

  const { userId } = authResult; // userId es el user_id_supabase del asesor dueño del sitio

  try {
    const body = await request.json();

    const {
      nombre_completo,
      email,
      telefono,
      tipo_operacion,
      tipo_propiedad, // string (e.g. "casa", "departamento")
      num_habitaciones,
      num_banos,
      num_estacionamientos,
      metros_cuadrados_min,
      metros_cuadrados_max,
      estados_deseados,
      ciudades_deseadas,
      zonas_especificas,
      estilo_vida_descripcion,
      presupuesto_min,
      presupuesto_max,
      metodo_pago,
      tiene_precalificacion_crediticia,
      institucion_crediticia,
      uso_destino,
      detalles_uso,
      documentos_disponibles,
      documentos_urls,
      cita_virtual_solicitada,
      cita_virtual_fecha_hora,
    } = body;

    // Validar campos básicos indispensables
    if (!nombre_completo || !email || !telefono) {
      return NextResponse.json(
        { error: "Faltan datos personales obligatorios (nombre_completo, email, telefono)" },
        { status: 400 }
      );
    }

    // 2. Mapear tipo_operacion ("compra" / "renta" -> "Comprar" / "Rentar")
    const mappedTipoOperacion = tipo_operacion === "renta" ? "Rentar" : "Comprar";

    // 3. Mapear tipo_propiedad string a tipo_propiedad_id (número)
    const propertyTypeStr = String(tipo_propiedad || "").toLowerCase().trim();
    let tipoPropiedadId = 1; // Casa por defecto
    if (propertyTypeStr.includes("depto") || propertyTypeStr.includes("departamento")) {
      tipoPropiedadId = 2;
    } else if (propertyTypeStr.includes("terreno")) {
      tipoPropiedadId = 3;
    } else if (propertyTypeStr.includes("oficina")) {
      tipoPropiedadId = 4;
    } else if (propertyTypeStr.includes("local")) {
      tipoPropiedadId = 5;
    } else if (propertyTypeStr.includes("bodega")) {
      tipoPropiedadId = 6;
    } else if (propertyTypeStr.includes("loft")) {
      tipoPropiedadId = 7;
    } else if (propertyTypeStr.includes("lote")) {
      tipoPropiedadId = 8;
    } else if (propertyTypeStr.includes("nave") || propertyTypeStr.includes("industrial")) {
      tipoPropiedadId = 9;
    }

    // 4. Buscar y mapear el ID del Estado y de la Ciudad en la base de datos
    let finalEstadoId = 7; // CDMX por defecto
    let finalCiudadId = 19; // CDMX por defecto

    const selectedStateName = Array.isArray(estados_deseados) && estados_deseados.length > 0 
      ? estados_deseados[0] 
      : null;
    const selectedCityName = Array.isArray(ciudades_deseadas) && ciudades_deseadas.length > 0
      ? ciudades_deseadas[0]
      : null;

    if (selectedStateName) {
      // Buscar en tabla de estados en Supabase
      const { data: estadoData } = await supabase
        .from("estados")
        .select("id_estado")
        .ilike("nombre_estado", selectedStateName)
        .maybeSingle();
      if (estadoData) {
        finalEstadoId = estadoData.id_estado;
      }
    }

    if (selectedCityName && selectedStateName) {
      // Buscar en tabla de ciudades para el estado resuelto
      const { data: ciudadData } = await supabase
        .from("ciudades")
        .select("id_ciudad")
        .eq("id_estado", finalEstadoId)
        .ilike("nombre_ciudad", selectedCityName)
        .maybeSingle();
      if (ciudadData) {
        finalCiudadId = ciudadData.id_ciudad;
      }
    }

    // Si no se pudo mapear una ubicación de la solicitud, resolvemos los valores por defecto del perfil del asesor
    if (!selectedStateName) {
      const { data: userProfile } = await supabase
        .from("usuarios")
        .select("id_estado, id_ciudad")
        .eq("id", userId)
        .maybeSingle();
      
      if (userProfile?.id_estado) finalEstadoId = userProfile.id_estado;
      if (userProfile?.id_ciudad) finalCiudadId = userProfile.id_ciudad;
    }

    // 5. Formatear y compilar detalles_adicionales de forma enriquecida
    const metodosPagoStr = Array.isArray(metodo_pago) ? metodo_pago.join(", ") : metodo_pago || "No especificado";
    const docsStr = Array.isArray(documentos_disponibles) ? documentos_disponibles.join(", ") : "Ninguno seleccionado";
    const precalifStr = tiene_precalificacion_crediticia ? `Sí (${institucion_crediticia || "No especificada"})` : "No";

    let citaVirtualStr = "No solicitada";
    if (cita_virtual_solicitada && cita_virtual_fecha_hora) {
      citaVirtualStr = `Solicitada para el día/hora: ${cita_virtual_fecha_hora}`;
    }

    // Mapear URLs de documentos para mostrarlas como enlaces individuales
    let docsUrlsStr = "Ninguno cargado en expediente";
    if (documentos_urls && typeof documentos_urls === "object") {
      const entries = Object.entries(documentos_urls);
      if (entries.length > 0) {
        const labelsMap: Record<string, string> = {
          identificacion: "Identificación Oficial (INE)",
          comprobante_ingresos: "Comprobante de Ingresos",
          estados_cuenta: "Estados de Cuenta",
          comprobante_domicilio: "Comprobante de Domicilio",
          carta_recomendacion: "Carta de Recomendación Bancaria",
          otros: "Otros Documentos"
        };
        docsUrlsStr = entries
          .map(([key, url]) => `• ${labelsMap[key] || key}: ${url}`)
          .join("\n");
      }
    }

    const detallesAdicionalesText = `[Embudo de 6 Pasos - Sitio Satélite]
USO Y DESTINO:
• Uso principal: ${uso_destino || "No especificado"}
• Detalles del uso: ${detalles_uso || "Ninguno"}

FINANCIAMIENTO:
• Métodos de pago preferidos: ${metodosPagoStr}
• Precalificación hipotecaria: ${precalifStr}

CITA VIRTUAL:
• Cita virtual: ${citaVirtualStr}

EXPEDIENTE DISPONIBLE (CLIENTE):
• Documentación lista: ${docsStr}

ENLACES A DOCUMENTOS (CARGADOS EN STORAGE):
${docsUrlsStr}`;

    // 6. Insertar solicitud de lead calificado
    const { data: newLead, error: insertError } = await supabase
      .from("solicitudes")
      .insert({
        usuario_id: userId,
        nombre_contacto: nombre_completo,
        correo_contacto: email.toLowerCase().trim(),
        telefono_contacto: telefono,
        tipo_operacion: mappedTipoOperacion,
        tipo_propiedad_id: tipoPropiedadId,
        habitaciones: num_habitaciones ? parseInt(num_habitaciones) : null,
        banos: num_banos != null ? Math.round(parseFloat(num_banos)) : null,
        estacionamientos: num_estacionamientos ? parseInt(num_estacionamientos) : null,
        metros_cuadrados: metros_cuadrados_max ? Math.round(parseFloat(metros_cuadrados_max)) : null,
        id_estado: finalEstadoId,
        id_ciudad: finalCiudadId,
        zona: zonas_especificas || null,
        comentarios: estilo_vida_descripcion || "Solicitud de búsqueda inteligente de 6 pasos.",
        detalles_adicionales: detallesAdicionalesText,
        presupuesto_min: presupuesto_min ? Math.round(parseFloat(String(presupuesto_min).replace(/,/g, ""))) : 0,
        presupuesto_max: presupuesto_max ? Math.round(parseFloat(String(presupuesto_max).replace(/,/g, ""))) : 0,
        tipo_solicitante: "lead",
        estado_solicitud: "nueva",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error insertando solicitud de lead — code:", insertError.code, "| message:", insertError.message, "| details:", insertError.details, "| hint:", insertError.hint);
      return NextResponse.json(
        { error: "Error al registrar la solicitud en la base de datos central: " + insertError.message },
        { status: 500 }
      );
    }

    // 7. Insertar notificación para alertas en tiempo real en el CRM
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: "nueva_solicitud",
        title: "Búsqueda Inteligente Recibida",
        body: `${nombre_completo} completó el embudo calificado de 6 pasos en tu sitio satélite.`,
        entity_type: "solicitud",
        entity_id: String(newLead.id),
        metadata: {
          tipo_operacion: mappedTipoOperacion,
          source: "cbf_satellite_funnel",
        },
        read: false,
      });

    if (notifError) {
      console.warn("Error al inyectar notificación en CRM (no-bloqueante):", notifError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Lead calificado registrado exitosamente en el CRM",
        data: {
          id: newLead.id,
          nombre_contacto: newLead.nombre_contacto,
          correo_contacto: newLead.correo_contacto,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inesperado en route de leads:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

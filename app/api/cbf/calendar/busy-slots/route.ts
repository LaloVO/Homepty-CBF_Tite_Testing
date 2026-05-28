import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/cbf/calendar/busy-slots
 * Obtiene los rangos de fechas ocupados en el calendario del asesor.
 * 
 * Headers requeridos:
 * - Authorization: Bearer <cbf_api_key>
 */
export async function GET(request: NextRequest) {
  // 1. Autenticar la solicitud
  const authResult = await authMiddleware(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Error de autenticación
  }

  const { userId } = authResult;

  try {
    // 2. Obtener eventos de calendario activos (no cancelados) para este usuario
    const { data: events, error: eventsError } = await supabase
      .from("eventos_calendario")
      .select("fecha_inicio, fecha_fin")
      .eq("id_usuario", userId)
      .neq("estado", "cancelado");

    if (eventsError) {
      console.error("Error al obtener eventos de calendario:", eventsError);
      return NextResponse.json(
        { error: "Error al obtener eventos de calendario" },
        { status: 500 }
      );
    }

    // 3. Mapear a formato simplificado { start, end }
    const busySlots = (events || []).map((event) => ({
      start: event.fecha_inicio,
      end: event.fecha_fin,
    }));

    return NextResponse.json({
      success: true,
      busySlots,
    });
  } catch (error) {
    console.error("Error inesperado al obtener horarios ocupados:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

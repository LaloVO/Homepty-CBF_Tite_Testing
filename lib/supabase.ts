import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// CBF corre server-side — usa service role para bypassear RLS en user_sites y propiedades
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan las variables de entorno de Supabase. Verifica tu archivo .env.local"
  );
}

/**
 * Cliente de Supabase para el CBF
 * Este cliente se conecta a la base de datos central de Homepty
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Tipos de base de datos (sincronizados con app.homepty.com)
 */
export interface Property {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  precio: number;
  area: number;
  area_construida: number | null;
  habitaciones: number;
  banios: number;
  estacionamientos: number | null;
  direccion: string;
  colonia: string | null;
  codigo_postal: string | null;
  id_estado: number;
  id_ciudad: number;
  id_tipo_accion: number;
  id_tipo_uso: number;
  id_usuario: string;
  is_unit: boolean;
  parent_id: number | null;
  descripcion_estado: string | null;
  descripcion_inversion: string | null;
  caracteristicas: string | null;
  created_at: string;
}

export interface PropertyImage {
  id: number;
  id_propiedad: number;
  image_url: string;
  created_at: string;
}

export interface PropertyWithImages extends Property {
  imagenes_propiedades: PropertyImage[];
}

export interface User {
  id: string;
  email_usuario: string;
  nombre_usuario: string | null;
  telefono_usuario: string | null;
  actividad_usuario: string | null;
  imagen_perfil_usuario: string | null;
  banner_usuario: string | null;
  descripcion_usuario: string | null;
  id_estado: number | null;
  id_ciudad: number | null;
  estado_usuario: boolean;
  fecha_creacion_usuario: string;
}

export interface ProjectIntake {
  id: string;
  template_slug: string | null;
  project_type: string | null;
  company_name: string | null;
  website: string | null;
  instagram: string | null;
  logo_url: string | null;
  brand_colors: string[];
  reference_urls: string[];
  business_info: {
    location?: string;
    services?: string;
    team_size?: string;
  };
  vision_brief: string | null;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  raw_payload: Record<string, unknown> | null;
  status: "new" | "contacted" | "in_progress" | "delivered";
  source: string;
  created_at: string;
}

export interface UserSite {
  id: string;
  user_id_supabase: string;
  site_name: string;
  custom_domain: string | null;
  subdomain: string | null;
  cbf_api_key: string;
  is_active: boolean;
  theme_config: {
    primaryColor: string;
    secondaryColor: string;
    logo: string | null;
    banner: string | null;
    fontFamily: string;
  };
  seo_config: {
    title: string | null;
    description: string | null;
    keywords: string[];
  };
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_tipo?: string | null;
  created_at: string;
  updated_at: string;
}

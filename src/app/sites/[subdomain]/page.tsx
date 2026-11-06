import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { APPROVAL_GATE, PUBLIC_STATUS, SELECT_PROPIEDAD_PUBLICA } from '@/lib/property-publication';
import { sitioDeCuentaViva } from '@/lib/site-owner';

/** Lo que esta página lee de cada propiedad (columnas heredadas: si no vienen, no se pintan). */
type PropiedadDelSitio = { id: number; titulo_propiedad?: string; descripcion_propiedad?: string; precio_propiedad?: number };

interface SitePageProps {
  params: Promise<{ subdomain: string }>;
}

async function getSiteData(subdomain: string) {
  const supabase = await createClient();
  
  // Get site info
  const { data: site, error: siteError } = await supabase
    .from('user_sites')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('is_active', true)
    .single();

  if (siteError || !site) {
    console.error('Site not found:', subdomain, siteError);
    return null;
  }

  // HPY-216: el sitio de una cuenta eliminada no se pinta, como uno que no existe.
  if (!(await sitioDeCuentaViva(site.user_id_supabase))) {
    console.error('Site not found:', subdomain);
    return null;
  }

  // Get properties for this user
  const { data: properties, error: propsError } = await supabase
    .from('propiedades')
    .select(SELECT_PROPIEDAD_PUBLICA)
    .eq('id_usuario', site.user_id_supabase)
    // Entrada 91: `estado_propiedad` es la columna vieja; la publicación vive en `status` (y la aprobación del owner).
    .eq('status', PUBLIC_STATUS)
    .or(APPROVAL_GATE);

  if (propsError) {
    console.error('Error fetching properties:', propsError);
  }

  // La proyección pública es una cadena calculada: el cliente no infiere sus columnas.
  return { site, properties: (properties || []) as unknown as PropiedadDelSitio[] };
}

export default async function SitePage({ params }: SitePageProps) {
  const { subdomain } = await params;
  const data = await getSiteData(subdomain);

  if (!data) {
    notFound();
  }

  const { site, properties } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {site.site_name}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Propiedades disponibles: {properties.length}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No hay propiedades disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Property Card - Placeholder */}
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Imagen</span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {property.titulo_propiedad || 'Propiedad'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {property.descripcion_propiedad?.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">
                      ${property.precio_propiedad?.toLocaleString()}
                    </span>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Ver más
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Powered by Homepty Brain
          </p>
        </div>
      </footer>
    </div>
  );
}

export async function generateMetadata({ params }: SitePageProps) {
  const { subdomain } = await params;
  const data = await getSiteData(subdomain);

  if (!data) {
    return {
      title: 'Sitio no encontrado',
    };
  }

  return {
    title: data.site.site_name,
    description: `Propiedades de ${data.site.site_name}`,
  };
}

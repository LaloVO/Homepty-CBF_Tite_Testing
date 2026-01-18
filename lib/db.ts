export async function getSiteByDomain(domain: string) {
  return {
    domain,
    config: {
      theme: {
        primary_color: '#2563eb',
        font_family: 'Inter',
      },
      pages: [
        {
          route: '/',
          title: 'Inicio',
          slots: [
            {
              slot_name: 'hero',
              component_id: 'HeroSearchV1',
              props: {
                title: 'Hero Home',
              },
            },
            {
              slot_name: 'grid',
              component_id: 'PropertyGridV2',
              props: {
                title: 'Grid Home',
              },
            },
          ],
        },
        {
          route: '/propiedad/[id]',
          title: 'Detalle',
          slots: [
            {
              slot_name: 'details',
              component_id: 'PropertyDetailsV3',
              props: {},
            },
            {
              slot_name: 'form',
              component_id: 'LeadCaptureFormV2',
              props: {},
            },
          ],
        },
      ],
    },
  };
}

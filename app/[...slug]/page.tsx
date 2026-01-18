// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
// app/[...slug]/page.tsx
// app/[...slug]/page.tsx
import { headers } from 'next/headers';
import { getSiteByDomain } from '../../lib/db';
import { PageRenderer } from '../components/PageRenderer';

export default async function DynamicPage({ params }) {
  const headersList = await headers(); // 👈 IMPORTANTE
  const host = headersList.get('host') || 'localhost';

  const slug = '/' + (params.slug?.join('/') || '');

  const site = await getSiteByDomain(host);

  const page = site.config.pages.find((p: any) => p.route === slug);

  if (!page) {
    return <div className="p-10">404 – Página no encontrada</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
      <PageRenderer page={page} />
    </div>
  );
}

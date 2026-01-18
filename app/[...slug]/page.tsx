// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
// app/[...slug]/page.tsx
// app/[...slug]/page.tsx
import { headers } from 'next/headers';
import { getSiteByDomain } from '../../lib/db';
import { PageRenderer } from '../components/PageRenderer';

export default async function DynamicPage({ params }) {
  return <div className="p-10">Ruta interna</div>;
}

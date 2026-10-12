import type { APIRoute } from 'astro';
import { sitemapXml, STATIC_PAGES } from '../lib/sitemap';

export const GET: APIRoute = () =>
  new Response(sitemapXml(STATIC_PAGES), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });

import { Metadata } from 'next';
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { stripHtml } from '@/lib/html-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';

type FetchResult =
  | { ok: true; content: any }
  | { ok: false; status: 'notfound' | 'error' };

async function fetchContent(id: string): Promise<FetchResult> {
  try {
    const res = await fetch(`${API_URL}/api/v1/content/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404 || res.status === 410) {
      return { ok: false, status: 'notfound' };
    }
    if (!res.ok) {
      // 5xx / network — transient, don't deindex.
      // eslint-disable-next-line no-console
      console.error('[content/layout] upstream error', res.status, id);
      return { ok: false, status: 'error' };
    }
    const json = await res.json();
    return { ok: true, content: json.data || json };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[content/layout] fetch threw', e);
    return { ok: false, status: 'error' };
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await fetchContent(params.id);
  if (!result.ok) {
    // Only mark as noindex when the upstream explicitly says the content
    // is gone. Transient 5xx / network errors must not deindex the URL —
    // Google would drop it from the index on a flaky deploy.
    if (result.status === 'notfound') {
      return buildMetadata({ title: 'Content Not Found', noindex: true });
    }
    return buildMetadata({ title: 'Kalaloka' });
  }
  const content = result.content;

  const author = content.author || {};
  const wordCount = content.body?.split(/\s+/).length || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const excerpt = content.excerpt || (content.body ? stripHtml(content.body).slice(0, 160).replace(/\n/g, ' ') : '');

  return buildMetadata({
    title: content.title,
    description: `${excerpt} — by ${author.name || 'Unknown'} · ${readTime} min read`,
    image: content.coverImage,
    url: `/content/${params.id}`,
    type: 'article',
    author: author.name,
    publishedTime: content.createdAt,
    modifiedTime: content.updatedAt,
    tags: content.hashtags?.map((h: any) => h.tag || h.hashtag?.tag || h),
  });
}

export default async function ContentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const result = await fetchContent(params.id);
  const content = result.ok ? result.content : null;

  return (
    <>
      {content && (
        <>
          <JsonLd data={articleJsonLd(content, content.author)} />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: content.contentType || 'Content', url: `/discover?type=${content.contentType}` },
              { name: content.title, url: `/content/${params.id}` },
            ])}
          />
        </>
      )}
      {children}
    </>
  );
}

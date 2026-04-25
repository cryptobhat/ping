import { Metadata } from 'next';
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { stripHtml } from '@/lib/html-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';

async function fetchContent(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/content/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const content = await fetchContent(params.id);
  if (!content) return buildMetadata({ title: 'Content Not Found', noindex: true });

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
  const content = await fetchContent(params.id);

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

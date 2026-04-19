import { Metadata } from 'next';
import { buildMetadata, personJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';

async function fetchUser(username: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/users/${username}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const user = await fetchUser(params.username);
  if (!user) return buildMetadata({ title: 'Writer Not Found', noindex: true });

  return buildMetadata({
    title: `${user.name} (@${user.username})`,
    description: user.bio || `Read stories, poems, and articles by ${user.name} on Kalaloka. ${user.followersCount || 0} followers · ${user.contentCount || 0} posts`,
    image: user.profileImage,
    url: `/user/${params.username}`,
    type: 'profile',
    author: user.name,
  });
}

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const user = await fetchUser(params.username);
  return (
    <>
      {user && (
        <>
          <JsonLd data={personJsonLd(user)} />
          <JsonLd data={breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Writers', url: '/discover' },
            { name: user.name, url: `/user/${params.username}` },
          ])} />
        </>
      )}
      {children}
    </>
  );
}

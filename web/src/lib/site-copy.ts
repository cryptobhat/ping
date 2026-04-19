import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.kalaloka.buzz';

export async function fetchSiteCopy(
  pages: string[],
  lang: string
): Promise<Record<string, Record<string, string>>> {
  const pagesParam = pages.join(',');
  const { data } = await axios.get(`${API_URL}/api/v1/site-copy`, {
    params: { pages: pagesParam, lang },
    timeout: 8000,
  });
  return (data?.data || {}) as Record<string, Record<string, string>>;
}

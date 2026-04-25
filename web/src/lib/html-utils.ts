/**
 * Strip HTML tags and decode common HTML entities from a string.
 * Use this whenever body/description content is rendered as plain text
 * (previews, excerpts, meta descriptions, JSON-LD).
 */
export function stripHtml(html: string): string {
  return (
    html
      ?.replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim() || ''
  );
}

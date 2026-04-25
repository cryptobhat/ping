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

/**
 * Decode common HTML entities in a string while preserving its structure
 * (newlines, paragraphs). Used for plain-text article bodies that some
 * authors paste in with raw `&nbsp;` / `&amp;` text. Live audit on
 * /content/[id] caught literal "&nbsp;" rendering between Kannada words.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

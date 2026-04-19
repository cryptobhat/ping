import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

export class LlmService {
  /**
   * Call DeepSeek chat completion (OpenAI-compatible format).
   * Returns empty string on any failure — callers should handle gracefully.
   */
  static async complete(
    prompt: string,
    systemPrompt?: string,
    maxTokens = 500
  ): Promise<string> {
    if (!DEEPSEEK_API_KEY) {
      console.warn('[LLM] No DEEPSEEK_API_KEY set — skipping AI call');
      return '';
    }

    try {
      const res = await axios.post(
        `${DEEPSEEK_BASE_URL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            ...(systemPrompt
              ? [{ role: 'system' as const, content: systemPrompt }]
              : []),
            { role: 'user' as const, content: prompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return res.data?.choices?.[0]?.message?.content?.trim() || '';
    } catch (err: any) {
      console.error('[LLM] Error:', err.message);
      return '';
    }
  }

  /**
   * Generate a short description for content.
   */
  static async generateDescription(
    title: string,
    body: string,
    contentType: string
  ): Promise<string> {
    const prompt = `Generate a 2-line engaging summary for this ${contentType.toLowerCase()} titled '${title}'. First 200 chars of content: ${body.slice(0, 200)}. Write in the same language as the content. Keep it under 100 words.`;
    return this.complete(prompt, 'You are a helpful literary assistant. Write concise, engaging content descriptions.', 150);
  }

  /**
   * Auto-generate hashtags for content. Returns an array of tag strings (no # prefix).
   */
  static async generateTags(
    title: string,
    body: string,
    contentType: string
  ): Promise<string[]> {
    const prompt = `Analyze this ${contentType.toLowerCase()} and suggest 3-5 relevant hashtags. Content title: ${title}. First 300 chars: ${body.slice(0, 300)}. Return ONLY a JSON array of hashtag strings without #. Example: ["love","romance","family"]. Write tags in the same language as the content.`;
    const raw = await this.complete(
      prompt,
      'You are a content tagging assistant. Return only valid JSON arrays.',
      100
    );

    if (!raw) return [];

    try {
      // Extract JSON array from response (LLM may wrap in markdown code blocks)
      const jsonMatch = raw.match(/\[[\s\S]*?\]/);
      if (!jsonMatch) return [];
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((t: unknown) => typeof t === 'string')
        .map((t: string) => t.replace(/^#/, '').trim().toLowerCase())
        .filter((t: string) => t.length > 0)
        .slice(0, 5);
    } catch {
      console.error('[LLM] Failed to parse tags JSON:', raw);
      return [];
    }
  }

  /**
   * Writing autocomplete — continue text in the style/language of the content.
   */
  static async suggestWriting(
    text: string,
    contentType: string,
    language: string
  ): Promise<string> {
    const langName = language === 'kn' ? 'Kannada' : language === 'hi' ? 'Hindi' : 'English';
    const prompt = `Continue writing this ${contentType.toLowerCase()} in ${langName}. Write 1-2 natural sentences that flow from the text. Text so far: ${text.slice(-500)}. Only output the continuation, nothing else.`;
    return this.complete(
      prompt,
      `You are a creative writing assistant. Continue the text naturally in ${langName}. Do not repeat what was already written. Output only the new text.`,
      200
    );
  }
}

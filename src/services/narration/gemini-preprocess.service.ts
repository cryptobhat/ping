import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildNarrationPreprocessPrompt } from './prompts';
import { LexiconService } from './lexicon.service';
import { narrationPreprocessOutputSchema, type NarrationPreprocessOutput } from '../../schemas/narration-segments.zod';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function stripJsonFence(raw: string): string {
  let t = raw.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  return t.trim();
}

export class GeminiPreprocessService {
  /**
   * Returns validated structured output or throws.
   */
  static async preprocessStoryText(
    storyText: string,
    options?: { dialect?: string; lexiconJsonOverride?: string }
  ): Promise<NarrationPreprocessOutput> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const dialect = options?.dialect ?? 'general';
    const lexiconJson =
      options?.lexiconJsonOverride ??
      LexiconService.toPromptJson(await LexiconService.fetchForDialect(dialect));

    const prompt = buildNarrationPreprocessPrompt(lexiconJson, storyText);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(stripJsonFence(text));
    return narrationPreprocessOutputSchema.parse(parsed);
  }
}

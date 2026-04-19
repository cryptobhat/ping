import axios from 'axios';
import fs from 'fs/promises';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const SARVAM_BASE_URL = process.env.SARVAM_BASE_URL || 'https://api.sarvam.ai';

const LANG_MAP: Record<string, string> = {
  kn: 'kn-IN',
  hi: 'hi-IN',
  en: 'en-IN',
};

/** MVP: one narrator voice, one dialogue voice (plan §15). */
const VOICE_NARRATOR_MALE = process.env.SARVAM_VOICE_NARRATOR || 'gokul';
const VOICE_DIALOGUE_MALE = process.env.SARVAM_VOICE_DIALOGUE || 'varun';
const VOICE_NARRATOR_FEMALE = process.env.SARVAM_VOICE_NARRATOR_FEMALE || VOICE_NARRATOR_MALE;
const VOICE_DIALOGUE_FEMALE = process.env.SARVAM_VOICE_DIALOGUE_FEMALE || VOICE_DIALOGUE_MALE;

export type SarvamSegmentRequest = {
  text: string;
  language: string;
  role: 'narration' | 'dialogue';
  narratorGenderPref: 'male' | 'female' | 'any';
  pace: number;
};

function pickVoice(role: 'narration' | 'dialogue', narratorGenderPref: string): string {
  const female = narratorGenderPref === 'female';
  if (role === 'dialogue') {
    return female ? VOICE_DIALOGUE_FEMALE : VOICE_DIALOGUE_MALE;
  }
  return female ? VOICE_NARRATOR_FEMALE : VOICE_NARRATOR_MALE;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class SarvamNarrationAdapter {
  /**
   * Generate speech for one segment; returns WAV/PCM buffer from Sarvam (same as legacy TTS).
   */
  static async synthesizeSegment(
    req: SarvamSegmentRequest,
    options?: { maxRetries?: number }
  ): Promise<Buffer> {
    if (!SARVAM_API_KEY) {
      throw new Error('SARVAM_API_KEY is not configured');
    }

    const targetLang = LANG_MAP[req.language] || LANG_MAP.kn;
    const gender = req.narratorGenderPref === 'female' || req.narratorGenderPref === 'male' ? req.narratorGenderPref : 'male';
    const speaker = pickVoice(req.role, gender);

    const maxRetries = options?.maxRetries ?? 4;
    let lastErr: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await axios.post(
          `${SARVAM_BASE_URL}/text-to-speech`,
          {
            inputs: [req.text],
            target_language_code: targetLang,
            speaker,
            model: 'bulbul:v3',
            pace: req.pace,
            enable_preprocessing: true,
          },
          {
            headers: {
              'API-Subscription-Key': SARVAM_API_KEY,
              'Content-Type': 'application/json',
            },
            timeout: 120000,
          }
        );

        const audioBase64 = res.data?.audios?.[0];
        if (!audioBase64) throw new Error('Sarvam returned no audio');
        return Buffer.from(audioBase64, 'base64');
      } catch (e: any) {
        lastErr = e;
        const status = e.response?.status;
        const backoff = Math.min(8000, 500 * 2 ** attempt);
        if (status === 429 || (status >= 500 && status < 600) || e.code === 'ECONNABORTED') {
          await sleep(backoff);
          continue;
        }
        throw e;
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  static async synthesizeToFile(req: SarvamSegmentRequest, outPath: string): Promise<void> {
    const buf = await this.synthesizeSegment(req);
    await fs.writeFile(outPath, buf);
  }
}

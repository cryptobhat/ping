import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';

function run(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let stderr = '';
    let stdout = '';
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });
    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export class FfmpegNarrationService {
  static async probeDurationSec(filePath: string): Promise<number> {
    const { code, stdout, stderr } = await run(FFPROBE, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    if (code !== 0) throw new Error(`ffprobe failed: ${stderr}`);
    const sec = parseFloat(stdout.trim());
    if (!Number.isFinite(sec)) return 0;
    return sec;
  }

  /** Generate silent WAV via lavfi (mono 24kHz). */
  static async generateSilenceWav(durationSec: number, outPath: string): Promise<void> {
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    const { code, stderr } = await run(FFMPEG, [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=24000:cl=mono',
      '-t',
      String(Math.max(0.01, durationSec)),
      '-c:a',
      'pcm_s16le',
      outPath,
    ]);
    if (code !== 0) throw new Error(`ffmpeg silence failed: ${stderr.slice(-400)}`);
  }

  /** Concatenate audio files in order (same codec ideally). */
  static async concatListFile(listPath: string, outPath: string, reencode: boolean): Promise<void> {
    const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listPath];
    if (reencode) {
      args.push('-c:a', 'libmp3lame', '-b:a', '192k', outPath);
    } else {
      args.push('-c', 'copy', outPath);
    }
    const { code, stderr } = await run(FFMPEG, args);
    if (code !== 0) throw new Error(`ffmpeg concat failed: ${stderr}`);
  }

  static async loudnormMp3(inputPath: string, outPath: string): Promise<void> {
    const { code, stderr } = await run(FFMPEG, [
      '-y',
      '-i',
      inputPath,
      '-af',
      'loudnorm=I=-16:TP=-1.5:LRA=11',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '192k',
      outPath,
    ]);
    if (code !== 0) throw new Error(`ffmpeg loudnorm failed: ${stderr}`);
  }

  static async transcodeMp3Bitrate(inputPath: string, outPath: string, kbps: 64 | 128): Promise<void> {
    const { code, stderr } = await run(FFMPEG, [
      '-y',
      '-i',
      inputPath,
      '-c:a',
      'libmp3lame',
      '-b:a',
      `${kbps}k`,
      outPath,
    ]);
    if (code !== 0) throw new Error(`ffmpeg transcode failed: ${stderr}`);
  }

  /**
   * Mix voice (input 0) with BGM (input 1), duck BGM lightly for MVP.
   */
  static async mixWithBgm(voicePath: string, bgmPath: string, outPath: string, bgmVol = 0.12): Promise<void> {
    const { code, stderr } = await run(FFMPEG, [
      '-y',
      '-i',
      voicePath,
      '-i',
      bgmPath,
      '-filter_complex',
      `[1:a]volume=${bgmVol},aloop=loop=-1:size=2e+09[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2`,
      '-c:a',
      'libmp3lame',
      '-b:a',
      '192k',
      outPath,
    ]);
    if (code !== 0) throw new Error(`ffmpeg mix bgm failed: ${stderr}`);
  }

  /** Re-encode arbitrary input to mp3 for concat compatibility. */
  static async toMp3(inputPath: string, outPath: string, bitrate = '192k'): Promise<void> {
    const { code, stderr } = await run(FFMPEG, [
      '-y',
      '-i',
      inputPath,
      '-c:a',
      'libmp3lame',
      '-b:a',
      bitrate,
      outPath,
    ]);
    if (code !== 0) throw new Error(`ffmpeg toMp3 failed: ${stderr}`);
  }
}

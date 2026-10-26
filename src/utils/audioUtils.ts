/**
 * @license
 * Robust Phonics Audio & Speech Synthesis Engine
 * Designed for reliable playback on Chrome, Safari, Edge, iOS, and Android.
 */

import { LETTER_PHONICS_MAP } from '../data/phonicsData';
import { PhonicsWord } from '../types/phonics';

// Shared Web Audio Context with auto-resume
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlocks audio context on user interaction (critical for mobile browsers)
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Also unlock SpeechSynthesis on iOS/Safari
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  } catch {
    //
  }
}

if (typeof window !== 'undefined') {
  const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  const onUserInteraction = () => {
    unlockAudio();
    unlockEvents.forEach((evt) => window.removeEventListener(evt, onUserInteraction));
  };
  unlockEvents.forEach((evt) => window.addEventListener(evt, onUserInteraction, { once: true }));
}

// ==========================================
// Web Audio Synthesized Sound Effects (Always reliable)
// ==========================================

export function playLetterClickSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch {
    //
  }
}

export function playPopSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    //
  }
}

export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.26);
    });
  } catch {
    //
  }
}

export function playIncorrectSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.21);
  } catch {
    //
  }
}

export function playFanfareSound() {
  try {
    const ctx = getAudioContext();
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + 0.65);
    });
  } catch {
    //
  }
}

export function playSparkleSound() {
  try {
    const ctx = getAudioContext();
    const notes = [880, 1174.66, 1396.91, 1760];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.21);
    });
  } catch {
    //
  }
}

// ==========================================
// Speech Synthesis (Phonics & Pronunciation)
// Bulletproof with GC prevention & Queue recovery
// ==========================================

// Global reference set to protect SpeechSynthesisUtterance from Garbage Collector (Chrome bug)
const activeUtterances = new Set<SpeechSynthesisUtterance>();

let availableVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const update = () => {
      availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        voicesLoaded = true;
        resolve(availableVoices);
      }
    };

    update();
    if (!voicesLoaded) {
      window.speechSynthesis.onvoiceschanged = () => {
        update();
        resolve(availableVoices);
      };
      // Fallback timeout in case onvoiceschanged does not fire
      setTimeout(() => {
        update();
        resolve(availableVoices);
      }, 500);
    }
  });
}

// Initialize voices immediately
if (typeof window !== 'undefined') {
  loadVoices();
}

export function getAllVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (!availableVoices.length) {
    availableVoices = window.speechSynthesis.getVoices();
  }
  return availableVoices;
}

let currentPreferredVoiceURI: string = '';
let currentVoiceMode: PhonicsVoiceMode = 'sound';
let currentDialect: 'en-US' | 'en-GB' = 'en-US';

export function setAudioEngineConfig(config: {
  preferredVoiceURI?: string;
  voiceMode?: PhonicsVoiceMode;
  dialect?: 'en-US' | 'en-GB';
}) {
  if (config.preferredVoiceURI !== undefined) currentPreferredVoiceURI = config.preferredVoiceURI;
  if (config.voiceMode !== undefined) currentVoiceMode = config.voiceMode;
  if (config.dialect !== undefined) currentDialect = config.dialect;
}

export function getAudioEngineConfig() {
  return {
    preferredVoiceURI: currentPreferredVoiceURI,
    voiceMode: currentVoiceMode,
    dialect: currentDialect,
  };
}

export function getEnglishVoice(
  preferredVoiceURI?: string,
  dialect?: 'en-US' | 'en-GB'
): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  if (!voices.length) return null;

  const targetURI = preferredVoiceURI || currentPreferredVoiceURI;
  if (targetURI) {
    const found = voices.find((v) => v.voiceURI === targetURI);
    if (found) return found;
  }

  const targetDialect = dialect || currentDialect || 'en-US';

  // Priority 1: High quality / Natural / Neural English voices matching preferred dialect
  const highQualityMatching = voices.find(
    (v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(targetDialect.toLowerCase()) &&
      (v.name.includes('Natural') ||
        v.name.includes('Google US English') ||
        v.name.includes('Google UK English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Jenny') ||
        v.name.includes('Guy') ||
        v.name.includes('Karen') ||
        v.name.includes('Daniel') ||
        v.name.includes('Alex') ||
        v.name.includes('Oliver') ||
        v.name.includes('Siri') ||
        v.name.includes('Victoria') ||
        v.name.includes('Ava') ||
        v.name.includes('Allison'))
  );
  if (highQualityMatching) return highQualityMatching;

  // Priority 2: Any high-quality English voice (US/UK/AU)
  const highQualityAny = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith('en') &&
      (v.name.includes('Natural') ||
        v.name.includes('Google') ||
        v.name.includes('Samantha') ||
        v.name.includes('Jenny') ||
        v.name.includes('Guy') ||
        v.name.includes('Karen') ||
        v.name.includes('Daniel') ||
        v.name.includes('Alex') ||
        v.name.includes('Oliver') ||
        v.name.includes('Siri'))
  );
  if (highQualityAny) return highQualityAny;

  // Priority 3: Exact dialect match (e.g. en-US or en-GB)
  const dialectVoice = voices.find((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith(targetDialect.toLowerCase())
  );
  if (dialectVoice) return dialectVoice;

  // Priority 4: Any en-US voice
  const usVoice = voices.find((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith('en-us')
  );
  if (usVoice) return usVoice;

  // Priority 5: Any English voice
  const anyEnglish = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
  if (anyEnglish) return anyEnglish;

  // IMPORTANT: Do NOT return voices[0] if it is Thai or non-English!
  // Return null so utterance uses utterance.lang = 'en-US' which triggers system English speech
  return null;
}

export function getThaiVoice(): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith('th')) || null;
}

export interface SpeakOptions {
  rate?: number; // 0.6 to 1.1
  pitch?: number; // 0.8 to 1.3
  volume?: number;
  lang?: string;
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterances.clear();
  }
}

// Low-level safe speak function
export function speakText(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    const synth = window.speechSynthesis;

    // Resume if paused
    if (synth.paused) {
      synth.resume();
    }

    // Cancel previous audio cleanly
    synth.cancel();

    // Small delay to prevent Chrome cancel-speak collision bug
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterances.add(utterance);

      const isThai = options.lang?.startsWith('th') || /[\u0E00-\u0E7F]/.test(text);

      if (isThai) {
        const thaiVoice = getThaiVoice();
        if (thaiVoice) utterance.voice = thaiVoice;
        utterance.lang = 'th-TH';
        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1.0;
      } else {
        const enVoice = getEnglishVoice(options.voiceURI);
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = options.lang || 'en-US';
        utterance.rate = options.rate ?? 0.85; // friendly pace for primary students
        utterance.pitch = options.pitch ?? 1.05; // slightly cheerful
      }

      utterance.volume = options.volume ?? 1.0;

      let hasCleanedUp = false;
      const cleanup = () => {
        if (!hasCleanedUp) {
          hasCleanedUp = true;
          activeUtterances.delete(utterance);
          options.onEnd?.();
          resolve();
        }
      };

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = cleanup;
      utterance.onerror = (e) => {
        // 'interrupted' or 'canceled' are normal when user navigates
        cleanup();
      };

      // Watchdog timer: In case browser hangs or loses the onend event
      const estimatedDuration = Math.max(1200, (text.length / 10) * 1200);
      const watchdog = setTimeout(() => {
        cleanup();
      }, estimatedDuration + 1500);

      const originalOnEnd = utterance.onend;
      utterance.onend = (e) => {
        clearTimeout(watchdog);
        if (typeof originalOnEnd === 'function') originalOnEnd.call(utterance, e);
      };

      try {
        synth.speak(utterance);
      } catch (err) {
        clearTimeout(watchdog);
        cleanup();
      }
    }, 40);
  });
}

// Speak without cancelling active speech (for queuing)
export function queueSpeak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.paused) synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterances.add(utterance);

    const isThai = options.lang?.startsWith('th') || /[\u0E00-\u0E7F]/.test(text);

    if (isThai) {
      const thaiVoice = getThaiVoice();
      if (thaiVoice) utterance.voice = thaiVoice;
      utterance.lang = 'th-TH';
      utterance.rate = options.rate ?? 0.9;
    } else {
      const enVoice = getEnglishVoice(options.voiceURI);
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = options.lang || 'en-US';
      utterance.rate = options.rate ?? 0.85;
      utterance.pitch = options.pitch ?? 1.05;
    }

    utterance.volume = options.volume ?? 1.0;

    let hasCleanedUp = false;
    const cleanup = () => {
      if (!hasCleanedUp) {
        hasCleanedUp = true;
        activeUtterances.delete(utterance);
        options.onEnd?.();
        resolve();
      }
    };

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    const estimatedDuration = Math.max(1000, (text.length / 8) * 1000);
    const watchdog = setTimeout(cleanup, estimatedDuration + 1500);

    const origEnd = utterance.onend;
    utterance.onend = (e) => {
      clearTimeout(watchdog);
      if (typeof origEnd === 'function') origEnd.call(utterance, e);
    };

    try {
      synth.speak(utterance);
    } catch {
      clearTimeout(watchdog);
      cleanup();
    }
  });
}

// ==========================================
// Calibrated Phonics Pronunciation
// ==========================================

export type PhonicsVoiceMode = 'sound' | 'anchor' | 'thai';

/**
 * Synthesizes the authentic native English short /æ/ phoneme (เสียงสระ แอะ / /æ/ as in apple, cat, ant)
 * using Web Audio API physical vocal tract formant modeling:
 * - F0 vocal pitch: 216 Hz with natural human inflection curve (216 -> 223 -> 204 Hz)
 * - Glottal pulse: rich dual-wave source (sawtooth + triangle) with natural vocal-cord lowpass filtering
 * - Formant resonances calibrated for authentic native open front unrounded /æ/:
 *   F1 = 830 Hz (Q=8.5, gain=0.48) - open pharyngeal cavity
 *   F2 = 1760 Hz (Q=14.5, gain=0.34) - fronted tongue body resonance (gives distinct 'แอะ' timbre)
 *   F3 = 2550 Hz (Q=16.0, gain=0.16) - palatal resonance
 *   F4 = 3500 Hz (Q=16.0, gain=0.08) - upper vocal tract brilliance
 * - Vocal body chest resonance at 220 Hz for human warmth (no thin/robotic tone)
 * - Soft glottal aspiration onset (15ms breath impulse) for authentic living speech feel
 * - Smooth natural ADSR envelope (0 click, 0 distortion)
 */
export function playShortASound(duration: number = 0.36) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master envelope calibrated to match full consonant volume
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.95, now + 0.026);
    master.gain.setValueAtTime(0.88, now + duration - 0.07);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Dual Glottal Excitation Source (Sawtooth for rich harmonics + Triangle for warm core)
    const oscSaw = ctx.createOscillator();
    oscSaw.type = 'sawtooth';
    oscSaw.frequency.setValueAtTime(216, now);
    oscSaw.frequency.linearRampToValueAtTime(223, now + 0.045);
    oscSaw.frequency.linearRampToValueAtTime(204, now + duration);

    const oscTri = ctx.createOscillator();
    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(216, now);
    oscTri.frequency.linearRampToValueAtTime(223, now + 0.045);
    oscTri.frequency.linearRampToValueAtTime(204, now + duration);

    const sawGain = ctx.createGain();
    sawGain.gain.setValueAtTime(0.85, now);

    const triGain = ctx.createGain();
    triGain.gain.setValueAtTime(0.40, now);

    // Initial glottal spectrum tilt (human vocal folds attenuate higher harmonics at ~12dB/octave)
    const glottalTilt = ctx.createBiquadFilter();
    glottalTilt.type = 'lowpass';
    glottalTilt.frequency.setValueAtTime(3400, now);

    oscSaw.connect(sawGain);
    oscTri.connect(triGain);
    sawGain.connect(glottalTilt);
    triGain.connect(glottalTilt);

    // 2. Formant Filters (F1, F2, F3, F4) for /æ/ (open front unrounded vowel)
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(830, now);
    f1.Q.setValueAtTime(7.5, now);

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1760, now);
    f2.Q.setValueAtTime(12.0, now);

    const f3 = ctx.createBiquadFilter();
    f3.type = 'bandpass';
    f3.frequency.setValueAtTime(2550, now);
    f3.Q.setValueAtTime(14.0, now);

    const f4 = ctx.createBiquadFilter();
    f4.type = 'bandpass';
    f4.frequency.setValueAtTime(3500, now);
    f4.Q.setValueAtTime(14.0, now);

    // Formant Gains (Calibrated for equal loudness parity with consonants)
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.85, now);

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.65, now);

    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.35, now);

    const g4 = ctx.createGain();
    g4.gain.setValueAtTime(0.18, now);

    // 3. Chest / Throat Resonance (Subglottal Body)
    const chestFilter = ctx.createBiquadFilter();
    chestFilter.type = 'peaking';
    chestFilter.frequency.setValueAtTime(220, now);
    chestFilter.Q.setValueAtTime(1.8, now);
    chestFilter.gain.setValueAtTime(4.5, now);

    // Formant bus
    const formantBus = ctx.createGain();

    glottalTilt.connect(f1);
    glottalTilt.connect(f2);
    glottalTilt.connect(f3);
    glottalTilt.connect(f4);

    f1.connect(g1);
    f2.connect(g2);
    f3.connect(g3);
    f4.connect(g4);

    g1.connect(formantBus);
    g2.connect(formantBus);
    g3.connect(formantBus);
    g4.connect(formantBus);

    // 4. Vocal tract high-cut smoothing filter (eliminates digital harshness)
    const smoothFilter = ctx.createBiquadFilter();
    smoothFilter.type = 'lowpass';
    smoothFilter.frequency.setValueAtTime(4200, now);

    formantBus.connect(chestFilter);
    chestFilter.connect(smoothFilter);
    smoothFilter.connect(master);

    // 5. Natural Glottal Breath Onset (subtle breath impulse)
    const noiseBufferSize = Math.floor(ctx.sampleRate * 0.05);
    const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const noiseBandpass = ctx.createBiquadFilter();
    noiseBandpass.type = 'bandpass';
    noiseBandpass.frequency.setValueAtTime(1800, now);
    noiseBandpass.Q.setValueAtTime(2.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.035, now);

    noiseNode.connect(noiseBandpass);
    noiseBandpass.connect(noiseGain);
    noiseGain.connect(master);

    // 6. Transparent Broadcast Dynamics Limiter / Compressor for perfect volume parity with consonants
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-4, now);
    compressor.knee.setValueAtTime(4, now);
    compressor.ratio.setValueAtTime(6, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.08, now);

    master.connect(compressor);
    compressor.connect(ctx.destination);

    // Start oscillators
    oscSaw.start(now);
    oscTri.start(now);
    noiseNode.start(now);

    const stopTime = now + duration + 0.05;
    oscSaw.stop(stopTime);
    oscTri.stop(stopTime);
    noiseNode.stop(stopTime);
  } catch {
    // fallback if Web Audio is unsupported
  }
}

/**
 * Synthesizes acoustic formants for English vowels with high volume and presence,
 * calibrated to match the loudness of consonants.
 * Uses 4 acoustic vocal tract formants (F1, F2, F3, F4) + dual vocal fold oscillator
 * + subglottal chest warmth + dynamics compressor.
 */
export function playVowelFormant(vowel: string, duration: number = 0.36) {
  const lower = vowel.toLowerCase().trim();
  if (lower === 'a' || lower === '/æ/' || lower === 'แอะ' || lower === 'แอ') {
    playShortASound(duration);
    return;
  }

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Dual Glottal Excitation Source: Sawtooth for harmonics + Triangle for fundamental core warmth
    const oscSaw = ctx.createOscillator();
    oscSaw.type = 'sawtooth';
    oscSaw.frequency.setValueAtTime(215, now);
    oscSaw.frequency.linearRampToValueAtTime(206, now + duration);

    const oscTri = ctx.createOscillator();
    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(215, now);
    oscTri.frequency.linearRampToValueAtTime(206, now + duration);

    const sawGain = ctx.createGain();
    sawGain.gain.setValueAtTime(0.80, now);

    const triGain = ctx.createGain();
    triGain.gain.setValueAtTime(0.40, now);

    const glottalTilt = ctx.createBiquadFilter();
    glottalTilt.type = 'lowpass';
    glottalTilt.frequency.setValueAtTime(3600, now);

    oscSaw.connect(sawGain);
    oscTri.connect(triGain);
    sawGain.connect(glottalTilt);
    triGain.connect(glottalTilt);

    // Formant 1, Formant 2, Formant 3, and Formant 4
    let f1Freq = 530;
    let f2Freq = 1850;
    let f3Freq = 2550;
    let f4Freq = 3500;

    if (lower === 'i' || lower === '/ɪ/' || lower === 'อิ') {
      f1Freq = 390;
      f2Freq = 2100;
      f3Freq = 2850;
      f4Freq = 3600;
    } else if (lower === 'e' || lower === '/e/' || lower === '/ɛ/' || lower === 'เอะ') {
      f1Freq = 530;
      f2Freq = 1850;
      f3Freq = 2550;
      f4Freq = 3500;
    } else if (lower === 'o' || lower === '/ɒ/' || lower === 'เอาะ' || lower === 'ออ' || lower === 'เอาะ/ออ') {
      f1Freq = 580;
      f2Freq = 960;
      f3Freq = 2450;
      f4Freq = 3400;
    } else if (lower === 'u' || lower === '/ʌ/' || lower === 'อะ') {
      f1Freq = 650;
      f2Freq = 1220;
      f3Freq = 2550;
      f4Freq = 3500;
    } else if (lower === 'long-a' || lower === '/eɪ/' || lower === 'เอ' || lower === 'a_e' || lower === 'ai' || lower === 'ay') {
      f1Freq = 480;
      f2Freq = 2100;
      f3Freq = 2800;
      f4Freq = 3500;
    } else if (lower === 'long-e' || lower === '/iː/' || lower === 'อี' || lower === 'ee' || lower === 'ea') {
      f1Freq = 300;
      f2Freq = 2400;
      f3Freq = 3000;
      f4Freq = 3700;
    } else if (lower === 'long-i' || lower === '/aɪ/' || lower === 'ไอ' || lower === 'i_e' || lower === 'igh') {
      f1Freq = 680;
      f2Freq = 1800;
      f3Freq = 2650;
      f4Freq = 3500;
    } else if (lower === 'long-o' || lower === '/oʊ/' || lower === 'โอ' || lower === 'o_e' || lower === 'oa') {
      f1Freq = 480;
      f2Freq = 880;
      f3Freq = 2400;
      f4Freq = 3400;
    } else if (lower === 'long-u' || lower === '/juː/' || lower === '/uː/' || lower === 'ยู' || lower === 'ยู/อู' || lower === 'u_e') {
      f1Freq = 320;
      f2Freq = 920;
      f3Freq = 2450;
      f4Freq = 3500;
    } else if (lower === 'dip-oi' || lower === 'oi' || lower === 'oy' || lower === '/ɔɪ/' || lower === 'ออย') {
      f1Freq = 520;
      f2Freq = 1600;
      f3Freq = 2500;
      f4Freq = 3500;
    } else if (lower === 'dip-ou' || lower === 'ou' || lower === 'ow' || lower === '/aʊ/' || lower === 'เอา' || lower === 'อาว' || lower === 'เอา/อาว') {
      f1Freq = 680;
      f2Freq = 1120;
      f3Freq = 2450;
      f4Freq = 3400;
    } else if (lower === 'dip-oo' || lower === 'oo' || lower === '/ʊ/' || lower === 'oo_short' || lower === 'อุ') {
      f1Freq = 440;
      f2Freq = 1050;
      f3Freq = 2400;
      f4Freq = 3400;
    } else if (lower === 'oo_long' || lower === 'อู') {
      f1Freq = 320;
      f2Freq = 850;
      f3Freq = 2400;
      f4Freq = 3400;
    } else if (lower === 'dip-aw' || lower === 'aw' || lower === 'au' || lower === '/ɔː/') {
      f1Freq = 580;
      f2Freq = 880;
      f3Freq = 2450;
      f4Freq = 3400;
    } else if (lower === 'dip-air' || lower === 'air' || lower === 'ear' || lower === '/eər/' || lower === '/ɪər/' || lower === 'แอร์' || lower === 'เอีย') {
      f1Freq = 500;
      f2Freq = 1950;
      f3Freq = 2700;
      f4Freq = 3500;
    }

    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(f1Freq, now);
    filter1.Q.setValueAtTime(5.0, now);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(f2Freq, now);
    filter2.Q.setValueAtTime(7.0, now);

    const filter3 = ctx.createBiquadFilter();
    filter3.type = 'bandpass';
    filter3.frequency.setValueAtTime(f3Freq, now);
    filter3.Q.setValueAtTime(8.0, now);

    const filter4 = ctx.createBiquadFilter();
    filter4.type = 'bandpass';
    filter4.frequency.setValueAtTime(f4Freq, now);
    filter4.Q.setValueAtTime(9.0, now);

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    const gain4 = ctx.createGain();
    const formantBus = ctx.createGain();

    // Formant gains boosted for full loudness parity with consonants
    gain1.gain.setValueAtTime(0.85, now);
    gain2.gain.setValueAtTime(0.65, now);
    gain3.gain.setValueAtTime(0.35, now);
    gain4.gain.setValueAtTime(0.18, now);

    glottalTilt.connect(filter1);
    glottalTilt.connect(filter2);
    glottalTilt.connect(filter3);
    glottalTilt.connect(filter4);

    filter1.connect(gain1);
    filter2.connect(gain2);
    filter3.connect(gain3);
    filter4.connect(gain4);

    gain1.connect(formantBus);
    gain2.connect(formantBus);
    gain3.connect(formantBus);
    gain4.connect(formantBus);

    // Warm subglottal chest resonance (+4.5 dB)
    const chestFilter = ctx.createBiquadFilter();
    chestFilter.type = 'peaking';
    chestFilter.frequency.setValueAtTime(220, now);
    chestFilter.Q.setValueAtTime(1.8, now);
    chestFilter.gain.setValueAtTime(4.5, now);

    // High-cut smoothing filter (eliminates harsh digital buzz)
    const smoothFilter = ctx.createBiquadFilter();
    smoothFilter.type = 'lowpass';
    smoothFilter.frequency.setValueAtTime(4200, now);

    formantBus.connect(chestFilter);
    chestFilter.connect(smoothFilter);

    // Master ADSR envelope calibrated for full, resonant vowel sound
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.95, now + 0.025);
    master.gain.setValueAtTime(0.88, now + duration - 0.07);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    smoothFilter.connect(master);

    // Dynamics Compressor / Limiter: guarantees equal perceived loudness to consonants with 0 distortion
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-4, now);
    compressor.knee.setValueAtTime(4, now);
    compressor.ratio.setValueAtTime(6, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.08, now);

    master.connect(compressor);
    compressor.connect(ctx.destination);

    oscSaw.start(now);
    oscTri.start(now);

    const stopTime = now + duration + 0.05;
    oscSaw.stop(stopTime);
    oscTri.stop(stopTime);
  } catch {
    // Graceful fallback
  }
}

/**
 * Synthesizes the authentic voiced alveolar fricative /z/ (the phonics "buzzing bee" sound)
 * using Web Audio API physical modeling:
 * 1. Voiced glottal source: 138 Hz periodic vocal-cord pulse with warm lowpass filter (voice bar)
 * 2. Alveolar turbulent frication noise: bandpass filtered at 5.2 kHz (Q=2.8) and highpass filtered at 3.2 kHz
 * 3. Vocal-fold amplitude modulation (AM): modulates the frication noise at 138 Hz to create the unmistakable /z/ buzz
 * 4. Natural ADSR envelope: 35ms attack, 220ms sustain, 65ms release (total 320ms)
 */
export function playZSound(duration: number = 0.32) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master envelope gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.035);
    masterGain.gain.setValueAtTime(0.32, now + duration - 0.07);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Voiced Glottal Source (Voice bar / throat vocal folds vibration)
    const voiceOsc = ctx.createOscillator();
    voiceOsc.type = 'sawtooth';
    voiceOsc.frequency.setValueAtTime(138, now);
    voiceOsc.frequency.linearRampToValueAtTime(132, now + duration);

    const voiceLowpass = ctx.createBiquadFilter();
    voiceLowpass.type = 'lowpass';
    voiceLowpass.frequency.setValueAtTime(520, now);

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.28, now);

    voiceOsc.connect(voiceLowpass);
    voiceLowpass.connect(voiceGain);
    voiceGain.connect(masterGain);

    // 2. Alveolar Turbulent Frication Noise (air escaping teeth constriction)
    const bufferSize = Math.max(1024, Math.floor(ctx.sampleRate * (duration + 0.08)));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Highpass to eliminate low-end rumble
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(3200, now);

    // Alveolar resonance bandpass centered at 5.2 kHz
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(5200, now);
    bandpass.Q.setValueAtTime(2.8, now);

    // 3. Amplitude Modulation: Vocal fold periodic vibration modulates noise amplitude
    // This gives the signature buzzing timbre of /z/ rather than unvoiced /s/ or separate hum
    const amOsc = ctx.createOscillator();
    amOsc.type = 'sine';
    amOsc.frequency.setValueAtTime(138, now);

    const amDepth = ctx.createGain();
    amDepth.gain.setValueAtTime(0.42, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);

    amOsc.connect(amDepth);
    amDepth.connect(noiseGain.gain);

    noiseSource.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(masterGain);

    // Connect master to audio context destination
    masterGain.connect(ctx.destination);

    // Start audio sources
    voiceOsc.start(now);
    amOsc.start(now);
    noiseSource.start(now);

    // Clean stop
    const stopTime = now + duration + 0.05;
    voiceOsc.stop(stopTime);
    amOsc.stop(stopTime);
    noiseSource.stop(stopTime);
  } catch {
    // Graceful fallback if Web Audio is unsupported
  }
}

/**
 * Synthesizes the authentic native English phonics sound of letter X (/ks/)
 * as in box, fox, six, axe (เสียง คสึ - ไม่มีเสียงสระ 'เอะ' นำหน้าเหมือนคำว่า ecks / เอ็กซ์)
 * Consists of:
 * 1. Crisp voiceless velar plosive burst (/k/): transient click at 2.2 kHz (18ms)
 * 2. Voiceless alveolar sibilant frication (/s/): high-frequency noise bandpassed at 6.4 kHz
 * 3. Fast natural decay envelope reproducing the authentic phonics release /ks/
 */
export function playXSound(duration: number = 0.26) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master envelope
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.38, now + 0.015);
    master.gain.setValueAtTime(0.34, now + duration - 0.06);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 1. Voiceless Velar Plosive Burst (/k/)
    // Short pitch drop transient to give the 'k' tongue-release attack
    const kClickOsc = ctx.createOscillator();
    kClickOsc.type = 'sine';
    kClickOsc.frequency.setValueAtTime(1400, now);
    kClickOsc.frequency.exponentialRampToValueAtTime(180, now + 0.018);

    const kClickGain = ctx.createGain();
    kClickGain.gain.setValueAtTime(0.35, now);
    kClickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    kClickOsc.connect(kClickGain);
    kClickGain.connect(master);

    // 2. Velar burst noise (/k/ acoustic burst centered at 2100 Hz)
    const kNoiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.035), ctx.sampleRate);
    const kNoiseData = kNoiseBuffer.getChannelData(0);
    for (let i = 0; i < kNoiseData.length; i++) {
      kNoiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
    }
    const kNoiseSource = ctx.createBufferSource();
    kNoiseSource.buffer = kNoiseBuffer;

    const kBandpass = ctx.createBiquadFilter();
    kBandpass.type = 'bandpass';
    kBandpass.frequency.setValueAtTime(2200, now);
    kBandpass.Q.setValueAtTime(2.5, now);

    const kNoiseGain = ctx.createGain();
    kNoiseGain.gain.setValueAtTime(0.40, now);

    kNoiseSource.connect(kBandpass);
    kBandpass.connect(kNoiseGain);
    kNoiseGain.connect(master);

    // 3. Voiceless Alveolar Sibilant Frication (/s/)
    // Starts immediately during the /k/ release and provides the signature /ks/ hiss
    const sBufferSize = Math.floor(ctx.sampleRate * duration);
    const sBuffer = ctx.createBuffer(1, sBufferSize, ctx.sampleRate);
    const sData = sBuffer.getChannelData(0);
    for (let i = 0; i < sBufferSize; i++) {
      sData[i] = Math.random() * 2 - 1;
    }
    const sSource = ctx.createBufferSource();
    sSource.buffer = sBuffer;

    const sHighpass = ctx.createBiquadFilter();
    sHighpass.type = 'highpass';
    sHighpass.frequency.setValueAtTime(4500, now);

    const sBandpass = ctx.createBiquadFilter();
    sBandpass.type = 'bandpass';
    sBandpass.frequency.setValueAtTime(6400, now);
    sBandpass.Q.setValueAtTime(1.8, now);

    const sGain = ctx.createGain();
    // /s/ gains momentum right after the /k/ transient (at +0.018s)
    sGain.gain.setValueAtTime(0.0001, now);
    sGain.gain.linearRampToValueAtTime(0.52, now + 0.028);
    sGain.gain.setValueAtTime(0.48, now + duration - 0.06);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    sSource.connect(sHighpass);
    sHighpass.connect(sBandpass);
    sBandpass.connect(sGain);
    sGain.connect(master);

    // Connect to destination
    master.connect(ctx.destination);

    // Start audio sources
    kClickOsc.start(now);
    kNoiseSource.start(now);
    sSource.start(now);

    const stopTime = now + duration + 0.03;
    kClickOsc.stop(now + 0.025);
    kNoiseSource.stop(now + 0.035);
    sSource.stop(stopTime);
  } catch {
    // fallback if Web Audio is unsupported
  }
}

/**
 * Authentic Native English Phonics Prompts Table (Pronounced by US/UK English TTS Engines)
 * Calibrated with single-phoneme release syllables to prevent TTS acronym spelling traps.
 */
export const NATIVE_ENGLISH_PHONICS_TABLE: Record<string, string> = {
  // Consonants (Pure English onset/coda phonemes)
  b: 'buh',
  c: 'kuh',
  d: 'duh',
  f: 'fuh', // Fixed: 'fuh' prevents TTS spelling 'eff-eff-eff'
  g: 'guh',
  h: 'huh',
  j: 'juh',
  k: 'kuh',
  l: 'luh',
  m: 'muh', // Fixed: 'muh' prevents TTS spelling 'em-em-em'
  n: 'nuh', // Fixed: 'nuh' prevents TTS spelling 'en-en-en'
  p: 'puh',
  q: 'qua', // Fixed: 'qua' (/kwɑ/) prevents TTS spelling 'K-W-U-H'
  r: 'ruh',
  s: 'suh', // Fixed: 'suh' prevents TTS spelling 'es-es-es'
  t: 'tuh',
  v: 'vuh',
  w: 'wuh',
  x: 'ecks', // Fixed: 'ecks' (/ɛks/) prevents TTS expanding 'ks' into 'Kansas'
  y: 'yuh',
  z: 'zuh', // Fixed: 'zuh' prevents TTS spelling 'zee-zee-zee'

  // Consonant Digraphs & Blends
  ch: 'chuh',
  sh: 'shuh',
  th: 'thuh',
  wh: 'wuh',
  ph: 'fuh',
  ck: 'kuh',
  qu: 'qua',
  cl: 'cluh',
  cr: 'cruh',
  br: 'bruh',
  dr: 'druh',
  fl: 'fluh',
  fr: 'fruh',
  gl: 'gluh',
  gr: 'gruh',
  pl: 'pluh',
  pr: 'pruh',
  sk: 'skuh',
  sl: 'sluh',
  sm: 'smuh',
  sn: 'snuh',
  sp: 'spuh',
  st: 'stuh',
  sw: 'swuh',
  tr: 'truh',

  // Short Vowels (authentic native English pronunciation)
  a: 'at', // short /æ/ as in apple, cat (intercepted by playShortASound)
  e: 'eh', // short /e/ as in egg, bed
  i: 'ih', // short /ɪ/ synthesized via dedicated formant
  o: 'aw', // short /ɒ/ or /ɑ/ as in ox, hot
  u: 'uh', // short /ʌ/ as in up, sun

  // Long Vowels (Magic E and Vowel Teams)
  'long-a': 'ay',
  'long-e': 'ee',
  'long-i': 'eye',
  'long-o': 'oh',
  'long-u': 'yoo',
  ai: 'ay',
  ay: 'ay',
  ee: 'ee',
  ea: 'ee',
  ie: 'eye',
  igh: 'eye',
  oa: 'oh',
  ow: 'ow',
  ue: 'yoo',
  ew: 'yoo',

  // Diphthongs
  'dip-oi': 'oy',
  'dip-ou': 'ow',
  'dip-oo': 'oo',
  'dip-aw': 'aw',
  'dip-air': 'air',
  oi: 'oy',
  oy: 'oy',
  ou: 'ow',
  oo: 'oo',
  oo_short: 'ooh',
  oo_long: 'oo',
  aw: 'aw',
  au: 'aw',
  air: 'air',
  ear: 'ear',
  eer: 'ear',
  are: 'air',

  // IPA aliases
  '/æ/': 'at',
  '/b/': 'buh',
  '/k/': 'kuh',
  '/d/': 'duh',
  '/e/': 'eh',
  '/ɛ/': 'eh',
  '/f/': 'fuh',
  '/g/': 'guh',
  '/h/': 'huh',
  '/ɪ/': 'ih',
  '/dʒ/': 'juh',
  '/l/': 'luh',
  '/m/': 'muh',
  '/n/': 'nuh',
  '/ɒ/': 'aw',
  '/p/': 'puh',
  '/kw/': 'qua',
  '/r/': 'ruh',
  '/s/': 'suh',
  '/t/': 'tuh',
  '/ʌ/': 'uh',
  '/v/': 'vuh',
  '/w/': 'wuh',
  '/ks/': 'ecks',
  '/j/': 'yuh',
  '/z/': 'zuh',
  '/ʃ/': 'shuh',
  '/tʃ/': 'chuh',
  '/θ/': 'thuh',
  '/eɪ/': 'ay',
  '/iː/': 'ee',
  '/aɪ/': 'eye',
  '/oʊ/': 'oh',
  '/juː/': 'yoo',
  '/uː/': 'oo',
  '/ɔɪ/': 'oy',
  '/aʊ/': 'ow',
  '/ɔː/': 'aw',
  '/ʊ/': 'ooh',
  '/eər/': 'air',
  '/ɪər/': 'ear',
};

/**
 * Reverse mapping from Thai phonetic labels to standard English phonics keys.
 * Ensures that if legacy components pass Thai text (e.g. 'แอ', 'คึ', 'บึ'),
 * the pure phonics engine maps it back to English native speech immediately.
 */
export const THAI_TO_PHONEME_MAP: Record<string, string> = {
  'แอ': 'a',
  'แอะ': 'a',
  'แอะห์': 'a',
  'เอะ': 'e',
  'อิ': 'i',
  'ออ': 'o',
  'เอาะ': 'o',
  'เอาะ/ออ': 'o',
  'อะ': 'u',
  'เอ': 'long-a',
  'อี': 'long-e',
  'ไอ': 'long-i',
  'โอ': 'long-o',
  'ยู': 'long-u',
  'ยู/อู': 'long-u',
  'ออย': 'dip-oi',
  'เอา': 'dip-ou',
  'อาว': 'dip-ou',
  'เอา/อาว': 'dip-ou',
  'อุ': 'oo_short',
  'อู': 'oo_long',
  'แอร์': 'dip-air',
  'เอีย': 'ear',
  'บึ': 'b',
  'บ': 'b',
  'คึ': 'c',
  'ค': 'c',
  'ดึ': 'd',
  'ด': 'd',
  'ฟึ': 'f',
  'ฟ': 'f',
  'กึ': 'g',
  'ก': 'g',
  'ฮึ': 'h',
  'ฮ': 'h',
  'จึ': 'j',
  'จ': 'j',
  'ลึ': 'l',
  'ล': 'l',
  'มึ': 'm',
  'ม': 'm',
  'นึ': 'n',
  'น': 'n',
  'พึ': 'p',
  'พ': 'p',
  'ควึ': 'qu',
  'คว': 'qu',
  'รึ': 'r',
  'ร': 'r',
  'ซึ': 's',
  'ซ': 's',
  'ทึ': 't',
  'ท': 't',
  'วึ': 'w',
  'ว': 'w',
  'คสึ': 'x',
  'เอ็กซ์': 'x',
  'เอ๊กซ์': 'x',
  'ยึ': 'y',
  'ย': 'y',
  'ชึ': 'sh',
  'ช': 'sh',
  'ธึ': 'th',
  'ธ': 'th',
  'ซสึ': 'z',
  'ซึสั่น': 'z',
  'แซด': 'z',
  'ซี': 'z',
};

/**
 * Phonics Thai mapping table (used exclusively when user explicitly selects Thai Teacher Coaching Mode)
 */
export const PHONICS_SOUND_TABLE: Record<string, string> = {
  a: 'แอ',
  b: 'บึ',
  c: 'คึ',
  d: 'ดึ',
  e: 'เอะ',
  f: 'ฟึ',
  g: 'กึ',
  h: 'ฮึ',
  i: 'อิ',
  j: 'จึ',
  k: 'คึ',
  l: 'ลึ',
  m: 'มึ',
  n: 'นึ',
  o: 'ออ',
  p: 'พึ',
  q: 'ควึ',
  r: 'รึ',
  s: 'ซึ',
  t: 'ทึ',
  u: 'อะ',
  v: 'วึ',
  w: 'วึ',
  x: 'คสึ',
  y: 'ยึ',
  z: 'ซึ',
  'long-a': 'เอ',
  'long-e': 'อี',
  'long-i': 'ไอ',
  'long-o': 'โอ',
  'long-u': 'ยู',
  'dip-oi': 'ออย',
  'dip-ou': 'เอา',
  'dip-oo': 'อู',
  'dip-aw': 'ออ',
  'dip-air': 'แอร์',
  oo_short: 'อุ',
  oo_long: 'อู',
  'แอ': 'แอ',
  'เอะ': 'เอะ',
  'อิ': 'อิ',
  'เอาะ': 'เอาะ',
  'อะ': 'อะ',
  'เอ': 'เอ',
  'อี': 'อี',
  'ไอ': 'ไอ',
  'โอ': 'โอ',
  'ยู': 'ยู',
  'ออย': 'ออย',
  'เอา': 'เอา',
  'อาว': 'อาว',
  'อุ': 'อุ',
  'อู': 'อู',
  'ออ': 'ออ',
  'แอร์': 'แอร์',
  'เอีย': 'เอีย',
};

/**
 * Play Phonics Sound for any letter or phonics symbol.
 * Defaults to 100% authentic Native English Phonics pronunciation without Thai accent.
 */
export const playPhonicsSound = (
  letter: string,
  customRate: number = 0.88,
  preferredVoiceURI?: string,
  mode?: PhonicsVoiceMode
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (letter.toLowerCase().trim() === 'z' || letter.toLowerCase().trim() === '/z/') {
      playZSound();
    } else if (letter.toLowerCase().trim() === 'x' || letter.toLowerCase().trim() === '/ks/') {
      playXSound();
    } else if (letter.toLowerCase().trim() === 'a' || letter.toLowerCase().trim() === '/æ/') {
      playShortASound();
    } else {
      playVowelFormant(letter);
    }
    return;
  }

  window.speechSynthesis.cancel();
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  const activeMode = mode || currentVoiceMode || 'sound';
  const voiceURI = preferredVoiceURI || currentPreferredVoiceURI;
  const rawKey = letter.toLowerCase().trim();

  // Mode 1: Thai Teacher Phonics Sound (เมื่อผู้ใช้เลือกโหมดครูไทยโดยเฉพาะ)
  if (activeMode === 'thai') {
    const soundText = PHONICS_SOUND_TABLE[rawKey] || LETTER_PHONICS_MAP[rawKey]?.soundTh || letter;
    const utterance = new SpeechSynthesisUtterance(soundText);
    const thaiVoice = getThaiVoice();
    if (thaiVoice) utterance.voice = thaiVoice;
    utterance.lang = 'th-TH';
    utterance.rate = customRate || 0.85;
    utterance.pitch = 1.05;

    activeUtterances.add(utterance);
    utterance.onend = () => activeUtterances.delete(utterance);
    utterance.onerror = () => activeUtterances.delete(utterance);
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        // fallback
      }
    }, 25);
    return;
  }

  // Mode 2: Anchor Word Mode (e.g. "a as in apple", "c as in cat")
  if (activeMode === 'anchor') {
    const cleanKey = THAI_TO_PHONEME_MAP[rawKey] || rawKey;
    const detail = LETTER_PHONICS_MAP[cleanKey];
    const textToSpeak = detail?.anchorWord ? `${cleanKey}, as in ${detail.anchorWord}` : cleanKey;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const enVoice = getEnglishVoice(voiceURI, currentDialect);
    if (enVoice) utterance.voice = enVoice;
    utterance.lang = currentDialect || 'en-US';
    utterance.rate = customRate || 0.85;
    utterance.pitch = 1.0;

    activeUtterances.add(utterance);
    utterance.onend = () => activeUtterances.delete(utterance);
    utterance.onerror = () => activeUtterances.delete(utterance);
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        // fallback
      }
    }, 25);
    return;
  }

  // Mode 3: Pure Native English Phonics Sound (โหมดสากลแท้ 100% ไม่ติดสำเนียงไทย)
  // Resolve phoneme key even if caller passed a Thai phonetic label (e.g. 'แอ', 'แอะ', 'คึ')
  const englishKey = THAI_TO_PHONEME_MAP[rawKey] || rawKey;

  // Short A (/æ/) - Solves TTS vowel distortion ('ah' /ɑː/ -> pure short /æ/ แอะ as in apple, cat, ant)
  if (englishKey === 'a' || englishKey === '/æ/') {
    playShortASound();
    return;
  }

  // Short E (/e/ or /ɛ/) as in egg, bed, red
  if (englishKey === 'e' || englishKey === '/e/' || englishKey === '/ɛ/') {
    playVowelFormant('e');
    return;
  }

  // Short I (/ɪ/) has no isolated open-syllable word in English orthography (TTS engines spell 'I-H')
  // We play the pristine acoustic vocal tract synthesizer to produce pure /ɪ/ (เสียง อิ)
  if (englishKey === 'i' || englishKey === '/ɪ/') {
    playVowelFormant('i');
    return;
  }

  // Short O (/ɒ/) as in ox, hot, dog (เสียง เอาะ/ออ) - synthesized loud and clear
  if (englishKey === 'o' || englishKey === '/ɒ/') {
    playVowelFormant('o');
    return;
  }

  // Short U (/ʌ/) as in up, sun, cup (เสียง อะ/อั) - synthesized loud and clear
  if (englishKey === 'u' || englishKey === '/ʌ/') {
    playVowelFormant('u');
    return;
  }

  // Pure Voiceless Velar-Alveolar Cluster /ks/ (เสียง คสึ แท้ 100% ไม่มีเสียงสระ เอะ นำหน้าเหมือนคำว่า ecks / เอ็กซ์)
  if (englishKey === 'x' || englishKey === '/ks/' || englishKey === 'ks') {
    playXSound();
    return;
  }

  // Pure Voiced Alveolar Fricative /z/ (เสียงผึ้งบิน zzzzz แท้ 100% ไม่เพี้ยน ไม่กระตุก)
  // Standard TTS engines produce an unnatural grunt or distorted 'zuh' for letter Z.
  // We synthesize the authentic Jolly Phonics / Oxford Phonics buzzing sibilant /z/.
  if (englishKey === 'z' || englishKey === '/z/' || englishKey === 'zz') {
    playZSound();
    return;
  }

  const spokenPhoneme =
    NATIVE_ENGLISH_PHONICS_TABLE[englishKey] ||
    NATIVE_ENGLISH_PHONICS_TABLE[rawKey] ||
    englishKey;

  const utterance = new SpeechSynthesisUtterance(spokenPhoneme);
  const voice = getEnglishVoice(voiceURI, currentDialect);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = currentDialect || 'en-US';
  utterance.rate = customRate || 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0; // 100% full volume

  activeUtterances.add(utterance);
  utterance.onend = () => activeUtterances.delete(utterance);
  utterance.onerror = () => {
    activeUtterances.delete(utterance);
    if (englishKey === 'a' || englishKey === '/æ/') {
      playShortASound();
    } else if (englishKey === 'x' || englishKey === '/ks/') {
      playXSound();
    } else if (englishKey === 'z' || englishKey === '/z/') {
      playZSound();
    } else if (['i', 'e', 'o', 'u'].includes(englishKey)) {
      playVowelFormant(englishKey);
    }
  };

  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      if (englishKey === 'a' || englishKey === '/æ/') {
        playShortASound();
      } else if (englishKey === 'x' || englishKey === '/ks/') {
        playXSound();
      } else if (englishKey === 'z' || englishKey === '/z/') {
        playZSound();
      } else {
        playVowelFormant(englishKey);
      }
    }
  }, 25);
};

/**
 * Asynchronously plays a single phoneme sound, resolving ONLY when the audio
 * has finished sounding out completely. Prevents overlapping speech or cutoffs,
 * guaranteeing clear and full consonant articulation for beginner learners.
 */
export function playPhonicsSoundAsync(
  letter: string,
  customRate: number = 0.74,
  preferredVoiceURI?: string,
  mode?: PhonicsVoiceMode
): Promise<void> {
  return new Promise((resolve) => {
    const rawKey = letter.toLowerCase().trim();
    const activeMode = mode || currentVoiceMode || 'sound';
    const englishKey = THAI_TO_PHONEME_MAP[rawKey] || rawKey;

    // Web Audio Synthesized sounds (100% deterministic duration and loud balanced presence)
    if (activeMode !== 'thai' && activeMode !== 'anchor') {
      if (englishKey === 'a' || englishKey === '/æ/') {
        playShortASound(0.38);
        setTimeout(resolve, 400);
        return;
      }
      if (englishKey === 'e' || englishKey === '/e/' || englishKey === '/ɛ/') {
        playVowelFormant('e', 0.36);
        setTimeout(resolve, 380);
        return;
      }
      if (englishKey === 'i' || englishKey === '/ɪ/') {
        playVowelFormant('i', 0.36);
        setTimeout(resolve, 380);
        return;
      }
      if (englishKey === 'o' || englishKey === '/ɒ/') {
        playVowelFormant('o', 0.36);
        setTimeout(resolve, 380);
        return;
      }
      if (englishKey === 'u' || englishKey === '/ʌ/') {
        playVowelFormant('u', 0.36);
        setTimeout(resolve, 380);
        return;
      }
      if (englishKey === 'x' || englishKey === '/ks/' || englishKey === 'ks') {
        playXSound(0.30);
        setTimeout(resolve, 340);
        return;
      }
      if (englishKey === 'z' || englishKey === '/z/' || englishKey === 'zz') {
        playZSound(0.36);
        setTimeout(resolve, 380);
        return;
      }
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      playVowelFormant(englishKey);
      setTimeout(resolve, 360);
      return;
    }

    let textToSpeak = '';
    let voiceToUse: SpeechSynthesisVoice | null = null;
    let lang: string = currentDialect || 'en-US';
    // Deliberate, patient, clear rate for beginner students
    let rate = Math.min(customRate || 0.74, 0.78);
    let pitch = 1.0;

    if (activeMode === 'thai') {
      textToSpeak = PHONICS_SOUND_TABLE[rawKey] || LETTER_PHONICS_MAP[rawKey]?.soundTh || letter;
      voiceToUse = getThaiVoice();
      lang = 'th-TH';
      rate = Math.min(customRate || 0.80, 0.85);
      pitch = 1.05;
    } else if (activeMode === 'anchor') {
      const detail = LETTER_PHONICS_MAP[englishKey];
      textToSpeak = detail?.anchorWord ? `${englishKey}, as in ${detail.anchorWord}` : englishKey;
      voiceToUse = getEnglishVoice(preferredVoiceURI || currentPreferredVoiceURI, currentDialect);
    } else {
      textToSpeak =
        NATIVE_ENGLISH_PHONICS_TABLE[englishKey] ||
        NATIVE_ENGLISH_PHONICS_TABLE[rawKey] ||
        englishKey;
      voiceToUse = getEnglishVoice(preferredVoiceURI || currentPreferredVoiceURI, currentDialect);
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    if (voiceToUse) utterance.voice = voiceToUse;
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1.0; // 100% full volume

    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        activeUtterances.delete(utterance);
        resolve();
      }
    };

    activeUtterances.add(utterance);
    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety watchdog timeout
    setTimeout(finish, 1300);

    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    }, 20);
  });
}

/**
 * Pronounce an individual letter with high phonics accuracy and native English accent
 * Calibrated with comfortable spacing for early learners.
 */
export async function speakLetterPhoneme(
  letter: string,
  rate: number = 0.74,
  mode: PhonicsVoiceMode = 'sound',
  preferredVoiceURI?: string
): Promise<void> {
  const lower = letter.toLowerCase().trim();
  await playPhonicsSoundAsync(lower, Math.min(rate, 0.78), preferredVoiceURI, mode);
  await new Promise((r) => setTimeout(r, 480));
}

export interface BlendingStep {
  indices: number[];
  soundKey: string;
  soundLabel: string;
  isMagicE?: boolean;
  isVowel?: boolean;
}

/**
 * Combines an onset consonant with a vowel/diphthong sound to form the blended "body" (Syllable Base):
 * e.g., Onset 'ค' + Vowel 'เอ' -> 'เค' (เค + คึ -> เค้ก / cake)
 * e.g., Onset 'ค' + Diphthong 'ออย' -> 'คอย' (คอย + นึ -> คอยน์ / coin)
 * e.g., Onset 'บ' + Diphthong 'อุ' -> 'บุ' (บุ + คึ -> บุค / book)
 */
export function combineOnsetAndVowel(onsetInitial: string, vowelSound: string): string {
  const c = onsetInitial || 'อ';
  const v = vowelSound || '';
  if (!v) return c;
  if (v.includes('เอาะ')) return `เ${c}าะ`;
  if (v.includes('เอา') || v.includes('อาว')) return `เ${c}า`;
  if (v.includes('เอีย')) return `เ${c}ีย`;
  if (v.includes('เอะ')) return `เ${c}ะ`;
  if (v.includes('แอร์')) return `แ${c}ร์`;
  if (v.includes('แอะ')) return `แ${c}ะ`;
  if (v.includes('แอ')) return `แ${c}`;
  if (v.includes('ออย')) return `${c}อย`;
  if (v.includes('อู')) return `${c}ู`;
  if (v.includes('อุ')) return `${c}ุ`;
  if (v.includes('ออ')) return `${c}อ`;
  if (v.includes('เอ')) return `เ${c}`;
  if (v.includes('อี')) return `${c}ี`;
  if (v.includes('ไอ')) return `ไ${c}`;
  if (v.includes('โอ')) return `โ${c}`;
  if (v.includes('ยู')) return `${c}ิว`;
  if (v.includes('อิ')) return `${c}ิ`;
  if (v.includes('อะ')) return `${c}ะ`;
  return `${c}${v}`;
}

/**
 * Builds pedagogically accurate phonics blending steps:
 * - For Magic E words (cake, bike, bone, cute): blends Initial + Long Vowel (a_e) together + Final Consonant
 * - For Vowel Teams (rain, boat, tree, night): blends Initial + Vowel Team (ai, oa, ee, igh) + Final Consonant
 * - For Diphthongs (coin, cow, book, saw, chair): blends Initial + Diphthong (oi, ow, oo, aw, air) + Final Consonant
 * - For Short Vowels (cat, bed, pig, hot, sun): blends C + V + C
 */
export function buildPhonicsBlendingSteps(word: PhonicsWord): BlendingStep[] {
  const letters = word.letters;
  if (!letters || letters.length === 0) {
    return word.word.split('').map((char, idx) => ({
      indices: [idx],
      soundKey: char.toLowerCase(),
      soundLabel: PHONICS_SOUND_TABLE[char.toLowerCase()] || char,
      isVowel: ['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase()),
    }));
  }

  // Check if Magic E word (e.g. cake, bike, bone, cute)
  const isMagicE =
    word.pattern?.includes('_e') ||
    (letters.length >= 3 &&
      letters[letters.length - 1].letter.toLowerCase() === 'e' &&
      letters[letters.length - 1].soundTh.includes('ไม่ออกเสียง'));

  if (isMagicE) {
    const magicEIndex = letters.length - 1;
    // Find vowel index (a, i, o, u)
    const vowelIndex = letters.findIndex(
      (l, idx) =>
        idx < magicEIndex &&
        (l.soundTh === 'เอ' ||
          l.soundTh === 'ไอ' ||
          l.soundTh === 'โอ' ||
          l.soundTh === 'ยู' ||
          l.soundTh === 'อู' ||
          l.letter.toLowerCase() === word.baseLetter ||
          ['a', 'i', 'o', 'u'].includes(l.letter.toLowerCase()))
    );

    const steps: BlendingStep[] = [];
    for (let i = 0; i < letters.length; i++) {
      if (i === magicEIndex) {
        continue; // Handled together with vowel!
      }

      if (i === vowelIndex) {
        const vowelSoundLabel =
          letters[vowelIndex].soundTh ||
          (word.vowel === 'long-a'
            ? 'เอ'
            : word.vowel === 'long-i'
            ? 'ไอ'
            : word.vowel === 'long-o'
            ? 'โอ'
            : 'ยู');
        steps.push({
          indices: [vowelIndex, magicEIndex],
          soundKey: word.vowel,
          soundLabel: vowelSoundLabel,
          isMagicE: true,
          isVowel: true,
        });
      } else {
        const seg = letters[i];
        if (seg.soundTh && !seg.soundTh.includes('ไม่ออกเสียง')) {
          const spokenLabel = PHONICS_SOUND_TABLE[seg.letter.toLowerCase()] || seg.soundTh;
          steps.push({
            indices: [i],
            soundKey: seg.letter.toLowerCase(),
            soundLabel: spokenLabel,
            isVowel: false,
          });
        }
      }
    }
    return steps;
  }

  // Vowel Teams, Diphthongs, and Short Vowels:
  const steps: BlendingStep[] = [];
  for (let i = 0; i < letters.length; i++) {
    const seg = letters[i];
    if (seg.soundTh.includes('ไม่ออกเสียง') || seg.soundIpa === '') {
      continue;
    }

    const isVowelSegment =
      seg.letter.toLowerCase() === word.vowel ||
      seg.letter.toLowerCase() === word.baseLetter ||
      (word.pattern && seg.letter.toLowerCase() === word.pattern.toLowerCase()) ||
      ['เอ', 'อี', 'ไอ', 'โอ', 'ยู', 'อู', 'อุ', 'ออย', 'เอา', 'แอร์', 'เอีย', 'แอะ', 'แอ', 'เอะ', 'อิ', 'เอาะ', 'อะ'].includes(seg.soundTh);

    let soundKey = seg.letter.toLowerCase();
    let soundLabel = seg.soundTh;

    if (isVowelSegment) {
      if (seg.soundTh === 'อุ') {
        soundKey = 'oo_short';
      } else if (seg.soundTh === 'อู') {
        soundKey = 'oo_long';
      } else if (word.vowelCategory && word.vowelCategory !== 'short') {
        soundKey = word.vowel;
      }
      soundLabel = seg.soundTh;
    } else {
      soundLabel = PHONICS_SOUND_TABLE[seg.letter.toLowerCase()] || seg.soundTh;
    }

    steps.push({
      indices: [i],
      soundKey,
      soundLabel,
      isVowel: isVowelSegment,
    });
  }

  return steps;
}

/**
 * Builds teacher script following authentic Phonics Blending Technique (เทคนิคการออกเสียงโฟนิกส์):
 * e.g. "เสียง คึ รวมกับสระ เอ เป็น เค ... เค รวมกับตัวสะกด คึ ผสมเป็นคำว่า เค้ก ... cake แปลว่า อบขนม"
 * e.g. "เสียง คึ รวมกับสระ ออย เป็น คอย ... คอย รวมกับตัวสะกด นึ ผสมเป็นคำว่า คอยน์ ... coin แปลว่า เหรียญเงิน"
 * e.g. "เสียง คึ รวมกับสระ เอา ผสมเป็นคำว่า คาว ... cow แปลว่า แม่วัว"
 */
export function buildPhonicsCoachScript(word: PhonicsWord): string {
  const steps = buildPhonicsBlendingSteps(word);
  if (!steps || steps.length === 0) {
    return `${word.word} อ่านว่า ${word.phoneticTh} แปลว่า ${word.meaningTh}`;
  }

  const vowelStepIdx = steps.findIndex((s) => s.isVowel || s.isMagicE);
  const onsetStep = steps[0];
  const vowelStep = vowelStepIdx !== -1 ? steps[vowelStepIdx] : (steps.length > 1 ? steps[1] : null);

  // If there are consonants after the vowel, take the final coda
  const codaStep = vowelStepIdx !== -1 && vowelStepIdx < steps.length - 1 ? steps[steps.length - 1] : null;

  if (vowelStep && codaStep && steps.length >= 3) {
    // 3-part Phonics Blending: Onset + Vowel -> Body ... Body + Coda -> Word!
    const onsetLabel = onsetStep.soundLabel;
    const vowelLabel = vowelStep.soundLabel;
    const codaLabel = codaStep.soundLabel;

    const rawInitial = (word.letters && word.letters[0]?.soundTh) || onsetLabel || 'อ';
    const onsetInitial = rawInitial.replace(/[ึะ]/g, '').trim() || 'อ';
    const bodySound = combineOnsetAndVowel(onsetInitial, vowelLabel);

    return `เสียง ${onsetLabel} รวมกับสระ ${vowelLabel} เป็น ${bodySound} ... ${bodySound} รวมกับตัวสะกด ${codaLabel} ผสมเป็นคำว่า ${word.phoneticTh} ... ${word.word} แปลว่า ${word.meaningTh}`;
  } else if (vowelStep && steps.length === 2) {
    // 2-part Phonics Blending: Onset + Vowel -> Word! (e.g. cow, day, saw, chair, sea)
    const onsetLabel = onsetStep.soundLabel;
    const vowelLabel = vowelStep.soundLabel;
    return `เสียง ${onsetLabel} รวมกับสระ ${vowelLabel} ผสมเป็นคำว่า ${word.phoneticTh} ... ${word.word} แปลว่า ${word.meaningTh}`;
  } else {
    const sequence = steps.map((s) => s.soundLabel).join(' ... ');
    return `${sequence} ... รวมเสียงเป็นคำว่า ${word.phoneticTh} ... ${word.word} แปลว่า ${word.meaningTh}`;
  }
}

/**
 * Enhanced Phonics Blending for a PhonicsWord:
 * Calibrated specifically for early/beginner students (นักเรียนเริ่มเรียน):
 * - Consonants and vowels are sounded out with patient, deliberate enunciation (~0.74x)
 * - Waiting for each phoneme to fully finish playing (no sound overlaps or cutoffs)
 * - Generous pedagogical pause (~650ms) between letters so young learners clearly absorb each sound
 * - Breathing thinking pause (680ms) before smoothly blending into the complete word
 */
export async function soundOutAndBlendWord(
  word: PhonicsWord,
  onStepChange?: (activeIndices: number[] | null) => void,
  speedRate: number = 0.74,
  mode?: PhonicsVoiceMode,
  preferredVoiceURI?: string
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 80));

  const steps = buildPhonicsBlendingSteps(word);

  // Ample pedagogical pause calibrated for early/beginner learners
  // At speedRate 0.74, pause is ~620ms after the sound completes
  const pauseAfterSound = Math.max(450, Math.round(920 - speedRate * 420));

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    onStepChange?.(step.indices);
    playLetterClickSound();

    // Await full phoneme articulation so consonants (b, c, d, p, t, etc.) are 100% audible and never cut off
    await playPhonicsSoundAsync(step.soundKey, Math.min(speedRate, 0.76), preferredVoiceURI, mode);

    // Pedagogical pause between phonemes so kids distinguish each consonant clearly
    await new Promise((r) => setTimeout(r, pauseAfterSound));
  }

  // Highlight all segments when blending into whole word!
  const allIndices = word.letters ? word.letters.map((_, idx) => idx) : [];
  onStepChange?.(allIndices);

  // Anticipatory thinking pause before pronouncing the blended word
  await new Promise((r) => setTimeout(r, 680));

  // Announce the blended word cleanly with deliberate native English voice!
  playSparkleSound();
  await speakText(word.word, {
    rate: Math.min(speedRate, 0.80),
    pitch: 1.05,
    voiceURI: preferredVoiceURI || currentPreferredVoiceURI,
    lang: currentDialect || 'en-US',
  });
  await new Promise((r) => setTimeout(r, 480));

  onStepChange?.(null);
}

/**
 * Sequential sound-out and blending of a full word (backwards compatible)
 * Calibrated with patient pacing for early learners.
 */
export async function soundOutAndBlend(
  word: string,
  onStepChange?: (stepIndex: number | null) => void,
  speedRate: number = 0.74,
  mode: PhonicsVoiceMode = 'sound',
  preferredVoiceURI?: string
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 80));

  const letters = word.toLowerCase().split('');
  const pauseAfterSound = Math.max(450, Math.round(920 - speedRate * 420));

  for (let i = 0; i < letters.length; i++) {
    onStepChange?.(i);
    playLetterClickSound();

    const char = letters[i];
    await playPhonicsSoundAsync(char, Math.min(speedRate, 0.76), preferredVoiceURI, mode);

    await new Promise((r) => setTimeout(r, pauseAfterSound));
  }

  onStepChange?.(null);
  await new Promise((r) => setTimeout(r, 680));

  playSparkleSound();
  await speakText(word, {
    rate: Math.min(speedRate, 0.80),
    pitch: 1.05,
    voiceURI: preferredVoiceURI || currentPreferredVoiceURI,
    lang: currentDialect || 'en-US',
  });
}

/**
 * Thai Teacher Phonics Coaching:
 * Teaches proper phonics blending technique:
 * e.g. "เสียง คึ รวมกับสระ เอ เป็น เค ... เค รวมกับตัวสะกด คึ ผสมเป็นคำว่า เค้ก ... cake แปลว่า ขนมเค้ก"
 */
export async function speakThaiPhonicsCoachWord(
  word: PhonicsWord,
  speedRate: number = 0.9
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 50));

  const fullCoachScript = buildPhonicsCoachScript(word);
  await speakText(fullCoachScript, { lang: 'th-TH', rate: speedRate });
}

export async function speakThaiPhonicsCoach(
  word: string,
  lettersTh: string[],
  readingTh: string,
  meaningTh: string,
  speedRate: number = 0.9
): Promise<void> {
  stopSpeaking();
  await new Promise((r) => setTimeout(r, 50));

  const sequence = lettersTh.join(' ... ');
  const fullCoachScript = `${sequence} ... รวมเสียงเป็นคำว่า ${readingTh} ... ${word} แปลว่า ${meaningTh}`;

  await speakText(fullCoachScript, { lang: 'th-TH', rate: speedRate });
}

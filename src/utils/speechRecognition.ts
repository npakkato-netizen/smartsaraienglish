// Speech Recognition helper for children pronunciation practice

export interface RecognitionResult {
  transcript: string;
  isMatch: boolean;
  confidence: number;
}

// Clean text helper (removes punctuation, lowercases)
export function normalizeWord(str: string): string {
  return str.toLowerCase().replace(/[^a-z]/g, '').trim();
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

export class ChildSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 5;
      }
    }
  }

  public startListening(
    targetWord: string,
    onResult: (result: RecognitionResult) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('เบราว์เซอร์นี้ยังไม่รองรับระบบตรวจจับเสียงพูด กรุณาใช้ Google Chrome หรือ Edge');
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.abort();
      } catch {
        //
      }
    }

    this.isListening = true;
    const cleanTarget = normalizeWord(targetWord);

    this.recognition.onresult = (event: any) => {
      const results = event.results[0];
      let bestTranscript = '';
      let isMatch = false;
      let highestConfidence = 0;

      for (let i = 0; i < results.length; i++) {
        const alt = results[i];
        const spoken = normalizeWord(alt.transcript);
        if (i === 0) {
          bestTranscript = alt.transcript;
          highestConfidence = alt.confidence || 0.9;
        }

        // Exact match or includes target
        if (spoken === cleanTarget || spoken.includes(cleanTarget) || cleanTarget.includes(spoken)) {
          isMatch = true;
          bestTranscript = alt.transcript;
          highestConfidence = Math.max(highestConfidence, alt.confidence || 0.95);
          break;
        }
      }

      onResult({
        transcript: bestTranscript,
        isMatch,
        confidence: highestConfidence,
      });
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (event.error === 'no-speech') {
        onError('ไม่ได้ยินเสียงเลย ลองพูดใกล้ไมโครโฟนดูอีกครั้งนะจ๊ะ');
      } else if (event.error === 'not-allowed') {
        onError('กรุณาอนุญาตให้ใช้งานไมโครโฟน เพื่อฝึกออกเสียง');
      } else {
        onError(`ข้อผิดพลาด: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      onError(e.message || 'ไม่สามารถเปิดไมโครโฟนได้');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        //
      }
      this.isListening = false;
    }
  }
}

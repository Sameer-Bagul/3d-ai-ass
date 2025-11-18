/**
 * Web Speech API TTS Service
 * Provides text-to-speech functionality using the browser's built-in speech synthesis
 */

export interface Voice {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
}

export interface SpeechOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;      // 0.1 to 10 (default: 1)
  pitch?: number;     // 0 to 2 (default: 1)
  volume?: number;    // 0 to 1 (default: 1)
  lang?: string;
}

export interface PhonemeData {
  phoneme: string;
  start: number;
  end: number;
}

class WebSpeechTTSService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private onPhonemeCallback?: (phoneme: PhonemeData) => void;
  private startTime: number = 0;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices();
    console.log('🎤 Available voices:', this.voices.length);
  }

  /**
   * Get all available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  /**
   * Get voices by language
   */
  getVoicesByLanguage(lang: string): SpeechSynthesisVoice[] {
    return this.getVoices().filter(voice => voice.lang.startsWith(lang));
  }

  /**
   * Get the default voice for a language
   */
  getDefaultVoice(lang: string = 'en'): SpeechSynthesisVoice | undefined {
    const voices = this.getVoicesByLanguage(lang);
    return voices.find(voice => voice.default) || voices[0];
  }

  /**
   * Speak text using Web Speech API
   */
  speak(text: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set options
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        const defaultVoice = this.getDefaultVoice(options.lang || 'en');
        if (defaultVoice) {
          utterance.voice = defaultVoice;
        }
      }

      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;
      if (options.lang) {
        utterance.lang = options.lang;
      }

      // Event handlers
      utterance.onstart = () => {
        this.startTime = performance.now();
        console.log('🔊 Speech started:', text);
      };

      utterance.onend = () => {
        console.log('✅ Speech ended');
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Boundary events for word timing
      utterance.onboundary = (event) => {
        const currentTime = (performance.now() - this.startTime) / 1000;
        
        if (this.onPhonemeCallback && event.name === 'word') {
          // Generate approximate phoneme data based on word boundaries
          this.onPhonemeCallback({
            phoneme: event.name,
            start: currentTime,
            end: currentTime + 0.1
          });
        }
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Check if speech is currently active
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  /**
   * Check if speech is paused
   */
  isPaused(): boolean {
    return this.synth.paused;
  }

  /**
   * Set callback for phoneme/word events
   */
  onPhoneme(callback: (phoneme: PhonemeData) => void) {
    this.onPhonemeCallback = callback;
  }

  /**
   * Generate estimated phoneme timeline for text
   * This is an approximation since Web Speech API doesn't provide detailed phoneme data
   */
  generateEstimatedPhonemes(text: string, duration?: number): PhonemeData[] {
    const words = text.split(/\s+/);
    const estimatedDuration = duration || (text.length * 0.08 + 0.5);
    const phonemes: PhonemeData[] = [];
    
    let currentTime = 0;
    const timePerWord = estimatedDuration / words.length;

    words.forEach((word) => {
      // Estimate syllables (rough approximation)
      const syllables = Math.max(1, word.match(/[aeiouy]+/gi)?.length || 1);
      const timePerSyllable = timePerWord / syllables;

      for (let i = 0; i < syllables; i++) {
        const start = currentTime;
        const end = currentTime + timePerSyllable * 0.8; // 80% of time for actual sound

        phonemes.push({
          phoneme: word.substring(i * (word.length / syllables), (i + 1) * (word.length / syllables)),
          start: parseFloat(start.toFixed(3)),
          end: parseFloat(end.toFixed(3))
        });

        currentTime = end;
      }

      // Add small pause between words
      currentTime += timePerSyllable * 0.2;
    });

    return phonemes;
  }
}

// Export singleton instance
export const webSpeechTTS = new WebSpeechTTSService();

// Export helper functions
export function speak(text: string, options?: SpeechOptions): Promise<void> {
  return webSpeechTTS.speak(text, options);
}

export function stopSpeech() {
  webSpeechTTS.stop();
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return webSpeechTTS.getVoices();
}

export function isSupported(): boolean {
  return 'speechSynthesis' in window;
}

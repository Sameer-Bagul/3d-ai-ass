import AvatarController from '../components/AvatarController';

interface PhonemeEvent {
  phoneme: string;
  start: number;
  end: number;
}

export class PhonemePlayer {
  private timeline: PhonemeEvent[] = [];
  private audioStartTime: number = 0;
  private isPlaying: boolean = false;
  private controller: AvatarController | null = null;

  constructor(controller: AvatarController) {
    this.controller = controller;
  }

  load(timeline: PhonemeEvent[], audioStartTime: number) {
    this.timeline = timeline;
    this.audioStartTime = audioStartTime;
    this.isPlaying = false;
    
    console.log(`📝 Phoneme player loaded: ${timeline.length} events`);
  }

  start() {
    if (this.timeline.length === 0) {
      console.warn('No phoneme timeline to play');
      return;
    }

    this.isPlaying = true;
    console.log('▶️ Phoneme playback started');
  }

  stop() {
    this.isPlaying = false;
    console.log('⏹️ Phoneme playback stopped');
  }

  update(currentTime: number) {
    if (!this.isPlaying || !this.controller) return;

    const elapsed = currentTime - this.audioStartTime;
    
    const currentPhoneme = this.timeline.find(
      event => elapsed >= event.start && elapsed <= event.end
    );

    if (currentPhoneme) {
      this.controller.applyPhonemeTimeline([currentPhoneme], this.audioStartTime);
    }

    const lastPhoneme = this.timeline[this.timeline.length - 1];
    if (elapsed > lastPhoneme.end) {
      this.stop();
    }
  }

  reset() {
    this.timeline = [];
    this.audioStartTime = 0;
    this.isPlaying = false;
  }
}

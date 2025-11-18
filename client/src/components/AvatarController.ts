import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import * as THREE from 'three';
import AnimationLoader from '../lib/animationLoader';
import EmotionEngine, { EmotionType } from '../lib/emotionEngine';

interface PhonemeItem {
  phoneme: string;
  start: number;
  end: number;
}

interface BlendshapeTarget {
  name: string;
  value: number;
}

interface AnimationCommand {
  type: 'blendshape' | 'head' | 'gesture';
  start?: number;
  end?: number;
  targets?: BlendshapeTarget[];
  keyframes?: any[];
}

export interface AnimationPayload {
  emotion?: EmotionType;
  animation?: string;
  intensity?: number;
  viewMode?: 'full-body' | 'half-body' | 'head-only';
  speech?: string;
  interrupt?: boolean;
}

export default class AvatarController {
  private vrm: VRM;
  private phonemeTimeline: PhonemeItem[] = [];
  private audioStartTime: number = 0;
  private isPlaying: boolean = false;
  private currentBlendshapes: Map<string, number> = new Map();
  private idleTime: number = 0;
  private needsTimeInit: boolean = false;
  
  public animationLoader: AnimationLoader;
  public emotionEngine: EmotionEngine;
  private isSpeaking: boolean = false;

  constructor(vrm: VRM) {
    this.vrm = vrm;
    
    this.animationLoader = new AnimationLoader();
    this.animationLoader.initialize(vrm);
    
    this.emotionEngine = new EmotionEngine();
    this.emotionEngine.initialize(vrm);
    
    console.log('🎮 AvatarController initialized with full animation & emotion systems');
  }

  async initializeAnimations(): Promise<void> {
    await this.animationLoader.loadBasicAnimations();
    console.log('✅ Basic animations loaded');
  }

  applyPhonemeTimeline(timeline: PhonemeItem[], audioStartTime?: number) {
    this.phonemeTimeline = timeline;
    if (audioStartTime !== undefined) {
      this.audioStartTime = audioStartTime;
      this.needsTimeInit = false;
    } else {
      this.needsTimeInit = true;
    }
    this.isPlaying = true;
    this.isSpeaking = true;
    
    console.log(`📝 Phoneme timeline applied: ${timeline.length} phonemes`);
  }

  applyAnimationCommands(commands: AnimationCommand[]) {
    console.log(`🎬 Animation commands received: ${commands.length} commands`);
  }

  async playAnimation(
    name: string,
    options?: {
      fadeIn?: number;
      fadeOut?: number;
      loop?: boolean;
      interrupt?: boolean;
    }
  ): Promise<void> {
    await this.animationLoader.playAnimation(name, options);
  }

  setEmotion(emotion: EmotionType, intensity: number = 1.0): void {
    this.emotionEngine.setEmotion(emotion, intensity);
  }

  async applyAnimationPayload(payload: AnimationPayload): Promise<void> {
    console.log('🎭 Applying animation payload:', payload);

    if (payload.interrupt) {
      this.stopSpeaking();
    }

    if (payload.emotion) {
      this.setEmotion(payload.emotion, payload.intensity || 1.0);
    }

    if (payload.animation) {
      await this.playAnimation(payload.animation, {
        interrupt: payload.interrupt !== false,
        loop: false
      });
    }
  }

  stopSpeaking(): void {
    this.isPlaying = false;
    this.isSpeaking = false;
    this.phonemeTimeline = [];
    
    this.animationLoader.stopCurrentAnimation(0.3);
    this.animationLoader.returnToIdle(0.5);
    
    console.log('🛑 Speech and animation interrupted');
  }

  update(clockTime: number, deltaTime: number) {
    if (!this.vrm) return;

    this.idleTime += deltaTime;

    this.animationLoader.update(deltaTime);

    if (!this.isSpeaking) {
      this.emotionEngine.update(deltaTime);
    }

    if (this.isPlaying && this.phonemeTimeline.length > 0) {
      if (this.needsTimeInit) {
        this.audioStartTime = clockTime;
        this.needsTimeInit = false;
        console.log(`⏱️  Audio start time initialized to: ${clockTime.toFixed(3)}s`);
      }
      
      const elapsed = clockTime - this.audioStartTime;
      this.updatePhonemeAnimation(elapsed);
    } else if (!this.isSpeaking) {
      this.updateIdleAnimation(this.idleTime);
    }

    if (!this.isSpeaking) {
      this.updateHeadMovement(this.idleTime);
    }

    this.applyBlendshapes();

    if (this.vrm.update) {
      this.vrm.update(deltaTime);
    }
  }

  private updatePhonemeAnimation(time: number) {
    const currentPhoneme = this.phonemeTimeline.find(
      p => time >= p.start && time <= p.end
    );

    if (currentPhoneme) {
      const blendshapes = this.phonemeToBlendshapes(currentPhoneme.phoneme);
      
      for (const [name, value] of Object.entries(blendshapes)) {
        this.setBlendshape(name, value);
      }
    } else {
      this.setBlendshape('jawOpen', 0);
      this.setBlendshape('mouthPucker', 0);
      this.setBlendshape('mouthSmile', 0);
    }

    const lastPhoneme = this.phonemeTimeline[this.phonemeTimeline.length - 1];
    if (lastPhoneme && time > lastPhoneme.end + 0.5) {
      this.isPlaying = false;
      this.isSpeaking = false;
      this.phonemeTimeline = [];
      
      this.animationLoader.returnToIdle(0.5);
    }
  }

  private updateIdleAnimation(time: number) {
    const breathe = Math.sin(time * 0.8) * 0.5 + 0.5;
    this.setBlendshape('jawOpen', breathe * 0.05);
    
    if (Math.random() < 0.001) {
      this.blink();
    }
  }

  private updateHeadMovement(time: number) {
    if (!this.vrm.humanoid || this.isSpeaking) return;

    const head = this.vrm.humanoid.getNormalizedBoneNode('head');
    if (head) {
      const idleYaw = Math.sin(time * 0.3) * 0.1;
      const idlePitch = Math.sin(time * 0.5) * 0.05;
      
      head.rotation.y = idleYaw;
      head.rotation.x = idlePitch;
    }
  }

  private phonemeToBlendshapes(phoneme: string): Record<string, number> {
    const map: Record<string, Record<string, number>> = {
      'AA': { jawOpen: 0.8, mouthPucker: 0.0 },
      'AE': { jawOpen: 0.6, mouthSmile: 0.3 },
      'AH': { jawOpen: 0.5, mouthPucker: 0.0 },
      'E': { jawOpen: 0.4, mouthSmile: 0.5 },
      'I': { jawOpen: 0.3, mouthSmile: 0.6 },
      'O': { jawOpen: 0.6, mouthPucker: 0.7 },
      'U': { jawOpen: 0.3, mouthPucker: 0.8 },
      'M': { jawOpen: 0.0, mouthPucker: 0.5 },
      'P': { jawOpen: 0.0, mouthPucker: 0.6 },
      'B': { jawOpen: 0.0, mouthPucker: 0.5 },
      'F': { jawOpen: 0.1, mouthPucker: 0.3 },
      'V': { jawOpen: 0.1, mouthPucker: 0.3 },
      'S': { jawOpen: 0.15, mouthSmile: 0.2 },
      'Z': { jawOpen: 0.15, mouthSmile: 0.2 },
      'T': { jawOpen: 0.3, mouthPucker: 0.0 },
      'D': { jawOpen: 0.3, mouthPucker: 0.0 },
      'K': { jawOpen: 0.4, mouthPucker: 0.0 },
      'G': { jawOpen: 0.4, mouthPucker: 0.0 },
      'L': { jawOpen: 0.3, mouthPucker: 0.0 },
      'R': { jawOpen: 0.3, mouthPucker: 0.2 },
      'W': { jawOpen: 0.3, mouthPucker: 0.7 },
    };

    return map[phoneme.toUpperCase()] || { jawOpen: 0.2 };
  }

  private setBlendshape(name: string, targetValue: number) {
    const current = this.currentBlendshapes.get(name) || 0;
    const smoothed = THREE.MathUtils.lerp(current, targetValue, 0.3);
    this.currentBlendshapes.set(name, smoothed);
  }

  private applyBlendshapes() {
    if (!this.vrm.expressionManager) return;

    const presetMap: Record<string, VRMExpressionPresetName> = {
      'happy': 'happy',
      'angry': 'angry',
      'sad': 'sad',
      'relaxed': 'relaxed',
      'surprised': 'surprised'
    };

    for (const [name, value] of this.currentBlendshapes.entries()) {
      const preset = presetMap[name];
      if (preset) {
        this.vrm.expressionManager.setValue(preset, value);
      }
    }

    const jawOpen = this.currentBlendshapes.get('jawOpen') || 0;
    this.vrm.expressionManager.setValue('aa', jawOpen);
    
    const mouthPucker = this.currentBlendshapes.get('mouthPucker') || 0;
    this.vrm.expressionManager.setValue('ou', mouthPucker);
    
    const mouthSmile = this.currentBlendshapes.get('mouthSmile') || 0;
    this.vrm.expressionManager.setValue('happy', mouthSmile * 0.5);
  }

  private blink() {
    if (!this.vrm.expressionManager) return;
    
    this.vrm.expressionManager.setValue('blink', 1.0);
    
    setTimeout(() => {
      if (this.vrm.expressionManager) {
        this.vrm.expressionManager.setValue('blink', 0.0);
      }
    }, 150);
  }

  getAvailableAnimations(): string[] {
    return this.animationLoader.getAvailableAnimations();
  }

  getCurrentAnimation(): string | null {
    return this.animationLoader.getCurrentAnimation();
  }

  getCurrentEmotion(): EmotionType {
    return this.emotionEngine.getCurrentEmotion();
  }

  getEmotionIntensity(): number {
    return this.emotionEngine.getEmotionIntensity();
  }

  reset() {
    this.phonemeTimeline = [];
    this.isPlaying = false;
    this.isSpeaking = false;
    this.currentBlendshapes.clear();
    this.emotionEngine.reset();
    this.animationLoader.returnToIdle();
  }
}

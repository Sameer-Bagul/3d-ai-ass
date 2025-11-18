import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';

export type Emotion = 'neutral' | 'joy' | 'angry' | 'sad' | 'surprised' | 'relaxed';

export interface EmotionConfig {
  expressions: Array<{
    preset: VRMExpressionPresetName;
    weight: number;
  }>;
  // Optional: blendshape overrides for custom emotions
  blendShapes?: Record<string, number>;
}

/**
 * Maps high-level emotions to VRM expression presets
 */
const EMOTION_MAP: Record<Emotion, EmotionConfig> = {
  neutral: {
    expressions: [
      { preset: 'neutral', weight: 1.0 },
    ],
  },
  joy: {
    expressions: [
      { preset: 'happy', weight: 1.0 },
      { preset: 'relaxed', weight: 0.3 },
    ],
  },
  angry: {
    expressions: [
      { preset: 'angry', weight: 1.0 },
    ],
  },
  sad: {
    expressions: [
      { preset: 'sad', weight: 1.0 },
      { preset: 'relaxed', weight: 0.2 },
    ],
  },
  surprised: {
    expressions: [
      { preset: 'surprised', weight: 1.0 },
    ],
  },
  relaxed: {
    expressions: [
      { preset: 'relaxed', weight: 1.0 },
    ],
  },
};

export class EmotionSystem {
  private vrm: VRM;
  private currentEmotion: Emotion = 'neutral';
  private targetWeights: Map<VRMExpressionPresetName, number> = new Map();
  private currentWeights: Map<VRMExpressionPresetName, number> = new Map();
  private transitionSpeed: number = 2.0; // How fast emotions blend

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.initializeWeights();
  }

  /**
   * Initialize all expression weights to 0
   */
  private initializeWeights(): void {
    const allPresets: VRMExpressionPresetName[] = [
      'neutral',
      'happy',
      'angry',
      'sad',
      'surprised',
      'relaxed',
      'aa',
      'ih',
      'ou',
      'ee',
      'oh',
      'blink',
      'blinkLeft',
      'blinkRight',
      'lookUp',
      'lookDown',
      'lookLeft',
      'lookRight',
    ];

    allPresets.forEach((preset) => {
      this.currentWeights.set(preset, 0);
      this.targetWeights.set(preset, 0);
    });
  }

  /**
   * Set emotion with intensity (0-1)
   */
  setEmotion(emotion: Emotion, intensity: number = 1.0): void {
    this.currentEmotion = emotion;
    const config = EMOTION_MAP[emotion];

    // Reset all target weights to 0
    this.targetWeights.forEach((_, preset) => {
      this.targetWeights.set(preset, 0);
    });

    // Set target weights based on emotion config
    config.expressions.forEach(({ preset, weight }) => {
      this.targetWeights.set(preset, weight * intensity);
    });

    console.log(`😊 Setting emotion: ${emotion} (intensity: ${intensity})`);
  }

  /**
   * Update expression weights (call in render loop)
   * Smoothly transitions between current and target weights
   */
  update(deltaTime: number): void {
    if (!this.vrm.expressionManager) {
      console.warn('VRM has no expression manager');
      return;
    }

    const lerpSpeed = this.transitionSpeed * deltaTime;

    this.currentWeights.forEach((currentWeight, preset) => {
      const targetWeight = this.targetWeights.get(preset) ?? 0;
      
      // Lerp current weight towards target
      const newWeight = this.lerp(currentWeight, targetWeight, lerpSpeed);
      this.currentWeights.set(preset, newWeight);

      // Apply to VRM
      try {
        if (this.vrm.expressionManager) {
          this.vrm.expressionManager.setValue(preset, newWeight);
        }
      } catch (error) {
        // Some presets might not exist in this VRM, silently skip
      }
    });
  }

  /**
   * Set custom blendshape values directly
   */
  setBlendShape(name: VRMExpressionPresetName, value: number): void {
    if (!this.vrm.expressionManager) return;
    
    try {
      this.vrm.expressionManager.setValue(name, value);
      this.currentWeights.set(name, value);
      this.targetWeights.set(name, value);
    } catch (error) {
      console.warn(`Blendshape "${name}" not available in this VRM`);
    }
  }

  /**
   * Trigger a blink
   */
  blink(duration: number = 0.15): void {
    if (!this.vrm.expressionManager) return;

    this.vrm.expressionManager.setValue('blink', 1.0);
    
    setTimeout(() => {
      this.vrm.expressionManager?.setValue('blink', 0.0);
    }, duration * 1000);
  }

  /**
   * Start automatic blinking
   */
  startAutoBlinking(): () => void {
    const blinkInterval = () => {
      // Random blink interval between 2-6 seconds
      const interval = 2000 + Math.random() * 4000;
      
      setTimeout(() => {
        this.blink();
        blinkInterval();
      }, interval);
    };

    blinkInterval();

    // Return cleanup function
    return () => {
      // Cleanup handled by setTimeout cleanup
    };
  }

  /**
   * Set lip-sync viseme (for speech)
   */
  setViseme(viseme: 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | null, intensity: number = 1.0): void {
    if (!this.vrm.expressionManager) return;

    // Reset all mouth shapes
    ['aa', 'ih', 'ou', 'ee', 'oh'].forEach((shape) => {
      this.vrm.expressionManager?.setValue(shape as VRMExpressionPresetName, 0);
    });

    // Set current viseme
    if (viseme) {
      this.vrm.expressionManager.setValue(viseme, intensity);
    }
  }

  /**
   * Get current emotion
   */
  getCurrentEmotion(): Emotion {
    return this.currentEmotion;
  }

  /**
   * Set transition speed (how fast emotions blend)
   */
  setTransitionSpeed(speed: number): void {
    this.transitionSpeed = speed;
  }

  /**
   * Linear interpolation helper
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.min(t, 1.0);
  }
}

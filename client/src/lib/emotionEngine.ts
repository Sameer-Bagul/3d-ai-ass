import { VRM, VRMExpressionPresetName } from '@pixiv/three-vrm';
import * as THREE from 'three';

export type EmotionType = 'happy' | 'sad' | 'angry' | 'surprised' | 'confused' | 'neutral';

export interface EmotionState {
  name: EmotionType;
  intensity: number;
  blendshapes: Record<string, number>;
  headMovement: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  microMovements: {
    enabled: boolean;
    frequency: number;
    amplitude: number;
  };
}

const EMOTION_PRESETS: Record<EmotionType, EmotionState> = {
  happy: {
    name: 'happy',
    intensity: 1.0,
    blendshapes: {
      happy: 0.8,
      relaxed: 0.3,
      mouthSmile: 0.7
    },
    headMovement: {
      pitch: 0.05,
      yaw: 0.0,
      roll: 0.0
    },
    microMovements: {
      enabled: true,
      frequency: 0.8,
      amplitude: 0.15
    }
  },
  sad: {
    name: 'sad',
    intensity: 1.0,
    blendshapes: {
      sad: 0.7,
      relaxed: 0.2
    },
    headMovement: {
      pitch: -0.15,
      yaw: 0.05,
      roll: 0.0
    },
    microMovements: {
      enabled: true,
      frequency: 0.3,
      amplitude: 0.05
    }
  },
  angry: {
    name: 'angry',
    intensity: 1.0,
    blendshapes: {
      angry: 0.8
    },
    headMovement: {
      pitch: 0.0,
      yaw: 0.0,
      roll: 0.0
    },
    microMovements: {
      enabled: true,
      frequency: 0.5,
      amplitude: 0.1
    }
  },
  surprised: {
    name: 'surprised',
    intensity: 1.0,
    blendshapes: {
      surprised: 0.9
    },
    headMovement: {
      pitch: 0.1,
      yaw: 0.0,
      roll: 0.0
    },
    microMovements: {
      enabled: false,
      frequency: 0.0,
      amplitude: 0.0
    }
  },
  confused: {
    name: 'confused',
    intensity: 1.0,
    blendshapes: {
      surprised: 0.3,
      sad: 0.2
    },
    headMovement: {
      pitch: 0.0,
      yaw: 0.1,
      roll: 0.05
    },
    microMovements: {
      enabled: true,
      frequency: 0.6,
      amplitude: 0.12
    }
  },
  neutral: {
    name: 'neutral',
    intensity: 1.0,
    blendshapes: {
      relaxed: 0.1
    },
    headMovement: {
      pitch: 0.0,
      yaw: 0.0,
      roll: 0.0
    },
    microMovements: {
      enabled: true,
      frequency: 0.4,
      amplitude: 0.08
    }
  }
};

export class EmotionEngine {
  private vrm: VRM | null = null;
  private currentEmotion: EmotionState = EMOTION_PRESETS.neutral;
  private targetEmotion: EmotionState = EMOTION_PRESETS.neutral;
  private transitionProgress: number = 1.0;
  private transitionSpeed: number = 0.05;
  private time: number = 0;
  private baseHeadRotation = { pitch: 0, yaw: 0, roll: 0 };

  constructor() {
    console.log('😊 EmotionEngine initialized');
  }

  initialize(vrm: VRM): void {
    this.vrm = vrm;
  }

  setEmotion(emotion: EmotionType, intensity: number = 1.0, transitionSpeed: number = 0.05): void {
    if (!EMOTION_PRESETS[emotion]) {
      console.warn(`Unknown emotion: ${emotion}`);
      return;
    }

    this.targetEmotion = {
      ...EMOTION_PRESETS[emotion],
      intensity
    };

    this.transitionProgress = 0.0;
    this.transitionSpeed = transitionSpeed;

    console.log(`😊 Transitioning to emotion: ${emotion} (intensity: ${intensity})`);
  }

  update(deltaTime: number): void {
    if (!this.vrm || !this.vrm.expressionManager) return;

    this.time += deltaTime;

    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + this.transitionSpeed);
      
      this.currentEmotion = this.blendEmotions(
        this.currentEmotion,
        this.targetEmotion,
        this.transitionProgress
      );
    }

    this.applyEmotionalBlendshapes();
    this.applyHeadMovement(deltaTime);
    this.applyMicroMovements(deltaTime);
  }

  private blendEmotions(from: EmotionState, to: EmotionState, t: number): EmotionState {
    const blended: EmotionState = {
      name: to.name,
      intensity: THREE.MathUtils.lerp(from.intensity, to.intensity, t),
      blendshapes: {},
      headMovement: {
        pitch: THREE.MathUtils.lerp(from.headMovement.pitch, to.headMovement.pitch, t),
        yaw: THREE.MathUtils.lerp(from.headMovement.yaw, to.headMovement.yaw, t),
        roll: THREE.MathUtils.lerp(from.headMovement.roll, to.headMovement.roll, t)
      },
      microMovements: {
        enabled: to.microMovements.enabled,
        frequency: THREE.MathUtils.lerp(from.microMovements.frequency, to.microMovements.frequency, t),
        amplitude: THREE.MathUtils.lerp(from.microMovements.amplitude, to.microMovements.amplitude, t)
      }
    };

    const allKeys = new Set([
      ...Object.keys(from.blendshapes),
      ...Object.keys(to.blendshapes)
    ]);

    allKeys.forEach(key => {
      const fromVal = from.blendshapes[key] || 0;
      const toVal = to.blendshapes[key] || 0;
      blended.blendshapes[key] = THREE.MathUtils.lerp(fromVal, toVal, t);
    });

    return blended;
  }

  private applyEmotionalBlendshapes(): void {
    if (!this.vrm || !this.vrm.expressionManager) return;

    const presetMap: Record<string, VRMExpressionPresetName> = {
      happy: 'happy',
      angry: 'angry',
      sad: 'sad',
      relaxed: 'relaxed',
      surprised: 'surprised'
    };

    for (const [key, value] of Object.entries(this.currentEmotion.blendshapes)) {
      const preset = presetMap[key];
      if (preset) {
        const adjustedValue = value * this.currentEmotion.intensity;
        this.vrm.expressionManager.setValue(preset, adjustedValue);
      }
    }
  }

  private applyHeadMovement(deltaTime: number): void {
    if (!this.vrm || !this.vrm.humanoid) return;

    const head = this.vrm.humanoid.getNormalizedBoneNode('head');
    if (!head) return;

    const { pitch, yaw, roll } = this.currentEmotion.headMovement;
    
    this.baseHeadRotation.pitch = THREE.MathUtils.lerp(
      this.baseHeadRotation.pitch,
      pitch,
      deltaTime * 2
    );
    this.baseHeadRotation.yaw = THREE.MathUtils.lerp(
      this.baseHeadRotation.yaw,
      yaw,
      deltaTime * 2
    );
    this.baseHeadRotation.roll = THREE.MathUtils.lerp(
      this.baseHeadRotation.roll,
      roll,
      deltaTime * 2
    );
  }

  private applyMicroMovements(_deltaTime: number): void {
    if (!this.vrm || !this.vrm.humanoid) return;
    if (!this.currentEmotion.microMovements.enabled) return;

    const head = this.vrm.humanoid.getNormalizedBoneNode('head');
    if (!head) return;

    const { frequency, amplitude } = this.currentEmotion.microMovements;

    const microYaw = Math.sin(this.time * frequency * 2) * amplitude * 0.5;
    const microPitch = Math.sin(this.time * frequency * 1.5) * amplitude * 0.3;
    const microRoll = Math.sin(this.time * frequency) * amplitude * 0.2;

    head.rotation.x = this.baseHeadRotation.pitch + microPitch;
    head.rotation.y = this.baseHeadRotation.yaw + microYaw;
    head.rotation.z = this.baseHeadRotation.roll + microRoll;
  }

  getCurrentEmotion(): EmotionType {
    return this.currentEmotion.name;
  }

  getEmotionIntensity(): number {
    return this.currentEmotion.intensity;
  }

  reset(): void {
    this.setEmotion('neutral', 1.0, 0.1);
  }
}

export default EmotionEngine;

import { Emotion, EmotionConfig } from '../types/animation';

export const EMOTION_PRESETS: Record<Emotion, EmotionConfig> = {
  neutral: {
    blendshapes: [
      { name: 'neutral', weight: 1.0 }
    ],
    bodyLanguage: {
      headTilt: 0,
      neckAngle: 0,
      shoulderRaise: 0,
      spineSlump: 0
    },
    gestureModifier: 1.0,
    movementSpeed: 1.0
  },

  happy: {
    blendshapes: [
      { name: 'happy', weight: 1.0 },
      { name: 'relaxed', weight: 0.3 }
    ],
    bodyLanguage: {
      headTilt: 0.05,
      neckAngle: 0.02,
      shoulderRaise: -0.02,
      spineSlump: -0.03
    },
    gestureModifier: 1.3,
    movementSpeed: 1.2
  },

  sad: {
    blendshapes: [
      { name: 'sad', weight: 1.0 }
    ],
    bodyLanguage: {
      headTilt: -0.08,
      neckAngle: -0.05,
      shoulderRaise: 0.08,
      spineSlump: 0.15
    },
    gestureModifier: 0.6,
    movementSpeed: 0.7
  },

  angry: {
    blendshapes: [
      { name: 'angry', weight: 1.0 }
    ],
    bodyLanguage: {
      headTilt: -0.03,
      neckAngle: 0.05,
      shoulderRaise: -0.05,
      spineSlump: -0.05
    },
    gestureModifier: 1.5,
    movementSpeed: 1.3
  },

  cute: {
    blendshapes: [
      { name: 'happy', weight: 0.7 },
      { name: 'relaxed', weight: 0.5 }
    ],
    bodyLanguage: {
      headTilt: 0.15,
      neckAngle: 0.08,
      shoulderRaise: -0.03,
      spineSlump: -0.02
    },
    gestureModifier: 1.4,
    movementSpeed: 1.1
  },

  excited: {
    blendshapes: [
      { name: 'happy', weight: 1.0 },
      { name: 'surprised', weight: 0.4 }
    ],
    bodyLanguage: {
      headTilt: 0.08,
      neckAngle: 0.05,
      shoulderRaise: -0.05,
      spineSlump: -0.08
    },
    gestureModifier: 1.6,
    movementSpeed: 1.4
  },

  nervous: {
    blendshapes: [
      { name: 'sad', weight: 0.4 },
      { name: 'surprised', weight: 0.3 }
    ],
    bodyLanguage: {
      headTilt: -0.05,
      neckAngle: -0.03,
      shoulderRaise: 0.12,
      spineSlump: 0.08
    },
    gestureModifier: 0.8,
    movementSpeed: 0.9
  },

  surprised: {
    blendshapes: [
      { name: 'surprised', weight: 1.0 }
    ],
    bodyLanguage: {
      headTilt: 0.03,
      neckAngle: 0.04,
      shoulderRaise: -0.04,
      spineSlump: -0.02
    },
    gestureModifier: 1.2,
    movementSpeed: 1.3
  },

  confused: {
    blendshapes: [
      { name: 'surprised', weight: 0.5 },
      { name: 'sad', weight: 0.3 }
    ],
    bodyLanguage: {
      headTilt: 0.12,
      neckAngle: 0.05,
      shoulderRaise: 0.05,
      spineSlump: 0.03
    },
    gestureModifier: 0.9,
    movementSpeed: 0.9
  }
};

export function getEmotionPreset(emotion: Emotion): EmotionConfig {
  return EMOTION_PRESETS[emotion] || EMOTION_PRESETS.neutral;
}

export function blendEmotions(
  emotion1: Emotion,
  emotion2: Emotion,
  blend: number
): EmotionConfig {
  const preset1 = getEmotionPreset(emotion1);
  const preset2 = getEmotionPreset(emotion2);

  const blendedBlendshapes = [...preset1.blendshapes];
  preset2.blendshapes.forEach(shape2 => {
    const existing = blendedBlendshapes.find(s => s.name === shape2.name);
    if (existing) {
      existing.weight = existing.weight * (1 - blend) + shape2.weight * blend;
    } else {
      blendedBlendshapes.push({
        ...shape2,
        weight: shape2.weight * blend
      });
    }
  });

  const blendValue = (v1: number = 0, v2: number = 0) => {
    return v1 * (1 - blend) + v2 * blend;
  };

  return {
    blendshapes: blendedBlendshapes,
    bodyLanguage: {
      headTilt: blendValue(preset1.bodyLanguage?.headTilt, preset2.bodyLanguage?.headTilt),
      neckAngle: blendValue(preset1.bodyLanguage?.neckAngle, preset2.bodyLanguage?.neckAngle),
      shoulderRaise: blendValue(preset1.bodyLanguage?.shoulderRaise, preset2.bodyLanguage?.shoulderRaise),
      spineSlump: blendValue(preset1.bodyLanguage?.spineSlump, preset2.bodyLanguage?.spineSlump)
    },
    gestureModifier: blendValue(preset1.gestureModifier, preset2.gestureModifier),
    movementSpeed: blendValue(preset1.movementSpeed, preset2.movementSpeed)
  };
}

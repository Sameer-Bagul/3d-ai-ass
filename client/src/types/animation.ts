export interface PhonemeEvent {
  phoneme: string;
  start: number;
  end: number;
}

export interface BlendshapeTarget {
  k: string;
  v: number;
}

export interface AnimationCommand {
  type: 'blendshape' | 'head' | 'gesture' | 'expression';
  targets?: BlendshapeTarget[];
  start?: number;
  end?: number;
  easing?: string;
  keyframes?: HeadKeyframe[];
  blendshapes?: Record<string, number>;
  duration?: number;
  name?: string;
  intensity?: number;
  description?: string;
}

export interface HeadKeyframe {
  t: number;
  pitch: number;
  yaw: number;
  roll?: number;
}

export interface AnimationPlan {
  type: string;
  text: string;
  ttsId?: string;
  phonemeFile?: string;
  commands?: AnimationCommand[];
}

export interface ChatResponse {
  reply: string;
  animationPlan?: AnimationPlan;
  timestamp: number;
}

export interface TTSResponse {
  audioUrl: string;
  phonemes: PhonemeEvent[];
  phonemeId: string;
  duration: number;
}

import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';

export type Emotion = 
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'cute'
  | 'excited'
  | 'nervous'
  | 'surprised'
  | 'confused';

export type ActionType =
  | 'idle'
  | 'wave'
  | 'point'
  | 'nod'
  | 'shake_head'
  | 'bow'
  | 'thumbs_up'
  | 'dance'
  | 'jump'
  | 'celebrate'
  | 'think'
  | 'shrug';

export type ViewMode = 
  | 'full-body'
  | 'half-body'
  | 'head-only'
  | 'cinematic';

export type AnimationLayer = 
  | 'base'
  | 'gesture'
  | 'emotion'
  | 'locomotion'
  | 'override';

export interface AnimationCommand {
  emotion?: Emotion;
  action?: ActionType | null;
  duration?: number;
  intensity?: number;
  lookAtUser?: boolean;
  viewMode?: ViewMode;
  interrupt?: boolean;
}

export interface BlendshapeTarget {
  name: string;
  weight: number;
  duration?: number;
}

export interface BoneTarget {
  boneName: string;
  rotation?: THREE.Euler;
  position?: THREE.Vector3;
  duration?: number;
}

export interface EmotionConfig {
  blendshapes: BlendshapeTarget[];
  bodyLanguage?: {
    headTilt?: number;
    neckAngle?: number;
    shoulderRaise?: number;
    spineSlump?: number;
  };
  gestureModifier?: number;
  movementSpeed?: number;
}

export interface ProceduralAnimation {
  name: string;
  layer: AnimationLayer;
  priority: number;
  loop: boolean;
  duration: number;
  update: (vrm: VRM, time: number, deltaTime: number) => void;
  onStart?: (vrm: VRM) => void;
  onEnd?: (vrm: VRM) => void;
}

export interface AnimationState {
  currentAction: ActionType | null;
  currentEmotion: Emotion;
  currentViewMode: ViewMode;
  activeAnimations: Map<AnimationLayer, ProceduralAnimation>;
  isTransitioning: boolean;
}

export interface KeyframeData {
  time: number;
  value: number | THREE.Vector3 | THREE.Euler | THREE.Quaternion;
  easing?: (t: number) => number;
}

export interface AnimationClipData {
  name: string;
  duration: number;
  tracks: {
    boneName: string;
    keyframes: KeyframeData[];
    property: 'position' | 'rotation' | 'scale';
  }[];
}

export interface CameraConfig {
  position: THREE.Vector3;
  fov: number;
  minDistance: number;
  maxDistance: number;
  lookAtOffset?: THREE.Vector3;
}

export interface AnimationEngineConfig {
  enableIdle: boolean;
  enableBreathing: boolean;
  enableBlink: boolean;
  enableGaze: boolean;
  enableMicroMovements: boolean;
  blinkInterval?: [number, number];
  gazeInterval?: [number, number];
}

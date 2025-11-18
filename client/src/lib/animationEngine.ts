import { VRM } from '@pixiv/three-vrm';
import { AnimationStateMachine } from './stateMachine';
import { ProceduralAnimations } from './proceduralAnimations';
import { ActionAnimations } from './actionAnimations';
import { CameraController } from './cameraPresets';
import { getEmotionPreset } from './emotionPresets';
import {
  AnimationCommand,
  AnimationEngineConfig,
  Emotion,
  ActionType,
  ViewMode
} from '../types/animation';
import * as THREE from 'three';

export class AnimationEngine {
  private vrm: VRM;
  private stateMachine: AnimationStateMachine;
  private cameraController: CameraController | null = null;
  private config: AnimationEngineConfig;
  private currentEmotion: Emotion = 'neutral';
  private emotionIntensity: number = 1.0;

  constructor(vrm: VRM, camera?: THREE.Camera, controls?: any) {
    this.vrm = vrm;
    this.stateMachine = new AnimationStateMachine(vrm);

    if (camera) {
      this.cameraController = new CameraController(camera, controls);
    }

    this.config = {
      enableIdle: true,
      enableBreathing: true,
      enableBlink: true,
      enableGaze: true,
      enableMicroMovements: true,
      blinkInterval: [2, 6],
      gazeInterval: [3, 8]
    };

    this.initializeBaseAnimations();
  }

  private initializeBaseAnimations(): void {
    if (this.config.enableBreathing) {
      this.stateMachine.addAnimation(ProceduralAnimations.createIdleBreathing());
    }

    if (this.config.enableIdle) {
      this.stateMachine.addAnimation(ProceduralAnimations.createIdleSway());
      this.stateMachine.addAnimation(ProceduralAnimations.createHeadBob());
    }

    if (this.config.enableBlink) {
      const [min, max] = this.config.blinkInterval || [2, 6];
      this.stateMachine.addAnimation(ProceduralAnimations.createBlinking(min, max));
    }

    if (this.config.enableGaze) {
      const [min, max] = this.config.gazeInterval || [3, 8];
      this.stateMachine.addAnimation(ProceduralAnimations.createGazeSystem(min, max));
    }

    if (this.config.enableMicroMovements) {
      this.stateMachine.addAnimation(ProceduralAnimations.createMicroMovements());
    }

    console.log('✅ Base animations initialized');
  }

  executeCommand(command: AnimationCommand): void {
    console.log('🎬 Executing animation command:', command);

    if (command.interrupt) {
      this.stateMachine.clearAllExceptBase();
    }

    if (command.emotion) {
      this.setEmotion(command.emotion, command.intensity || 1.0);
    }

    if (command.action) {
      this.playAction(command.action, command.duration);
    }

    if (command.viewMode && this.cameraController) {
      this.cameraController.setViewMode(command.viewMode, true);
    }

    if (command.lookAtUser) {
      this.lookAtCamera();
    }
  }

  setEmotion(emotion: Emotion, intensity: number = 1.0): void {
    this.currentEmotion = emotion;
    this.emotionIntensity = intensity;

    const emotionConfig = getEmotionPreset(emotion);
    const expressionManager = this.vrm.expressionManager;

    if (!expressionManager) {
      console.warn('⚠️ No expression manager available');
      return;
    }

    expressionManager.setValue('happy', 0);
    expressionManager.setValue('sad', 0);
    expressionManager.setValue('angry', 0);
    expressionManager.setValue('surprised', 0);
    expressionManager.setValue('relaxed', 0);
    expressionManager.setValue('neutral', 0);

    emotionConfig.blendshapes.forEach(({ name, weight }) => {
      const finalWeight = weight * intensity;
      expressionManager.setValue(name as any, finalWeight);
    });

    if (emotionConfig.bodyLanguage) {
      this.applyBodyLanguage(emotionConfig.bodyLanguage);
    }

    this.stateMachine.setEmotion(emotion);
    console.log(`😊 Emotion set to: ${emotion} (intensity: ${intensity})`);
  }

  private applyBodyLanguage(bodyLanguage: any): void {
    const humanoid = this.vrm.humanoid;
    if (!humanoid) return;

    const head = humanoid.getNormalizedBoneNode('head');
    const neck = humanoid.getNormalizedBoneNode('neck');
    const spine = humanoid.getNormalizedBoneNode('spine');
    const leftShoulder = humanoid.getNormalizedBoneNode('leftShoulder');
    const rightShoulder = humanoid.getNormalizedBoneNode('rightShoulder');

    if (head && bodyLanguage.headTilt) {
      head.rotation.z += bodyLanguage.headTilt * this.emotionIntensity;
    }

    if (neck && bodyLanguage.neckAngle) {
      neck.rotation.x += bodyLanguage.neckAngle * this.emotionIntensity;
    }

    if (spine && bodyLanguage.spineSlump) {
      spine.rotation.x += bodyLanguage.spineSlump * this.emotionIntensity;
    }

    if (leftShoulder && bodyLanguage.shoulderRaise) {
      leftShoulder.rotation.z += bodyLanguage.shoulderRaise * this.emotionIntensity;
    }

    if (rightShoulder && bodyLanguage.shoulderRaise) {
      rightShoulder.rotation.z -= bodyLanguage.shoulderRaise * this.emotionIntensity;
    }
  }

  playAction(action: ActionType, duration?: number): void {
    let animation;

    switch (action) {
      case 'wave':
        animation = ActionAnimations.createWaveGesture('right');
        break;
      case 'point':
        animation = ActionAnimations.createPointGesture('right');
        break;
      case 'nod':
        animation = ActionAnimations.createNodGesture(1.0);
        break;
      case 'shake_head':
        animation = ActionAnimations.createShakeHeadGesture();
        break;
      case 'bow':
        animation = ActionAnimations.createBowGesture(0.5);
        break;
      case 'thumbs_up':
        animation = ActionAnimations.createThumbsUpGesture('right');
        break;
      case 'dance':
        animation = ActionAnimations.createDanceAnimation('groove');
        break;
      case 'jump':
        animation = ActionAnimations.createJumpAnimation();
        break;
      case 'celebrate':
        animation = ActionAnimations.createCelebrationAnimation();
        break;
      case 'think':
        animation = ActionAnimations.createThinkAnimation();
        break;
      case 'shrug':
        animation = ActionAnimations.createShrugGesture();
        break;
      default:
        console.warn(`⚠️ Unknown action: ${action}`);
        return;
    }

    if (duration && animation) {
      animation.duration = duration;
    }

    if (animation) {
      this.stateMachine.addAnimation(animation, true);
      this.stateMachine.setAction(action);
    }
  }

  lookAtCamera(): void {
    const cameraPosition = new THREE.Vector3(0, 1.5, 5);
    const lookAtAnimation = ProceduralAnimations.createLookAt(cameraPosition, true);
    this.stateMachine.addAnimation(lookAtAnimation, true);
  }

  setViewMode(mode: ViewMode): void {
    if (this.cameraController) {
      this.cameraController.setViewMode(mode, true);
    }
  }

  update(deltaTime: number): void {
    this.stateMachine.update(deltaTime);

    if (this.vrm.update) {
      this.vrm.update(deltaTime);
    }
  }

  getStatus() {
    return {
      currentEmotion: this.currentEmotion,
      currentAction: this.stateMachine.getState().currentAction,
      currentViewMode: this.cameraController?.getCurrentMode() || 'full-body',
      activeAnimations: this.stateMachine.getActiveAnimationNames(),
      isTransitioning: this.stateMachine.getState().isTransitioning
    };
  }

  reset(): void {
    this.stateMachine.reset();
    this.initializeBaseAnimations();
    this.setEmotion('neutral', 1.0);
    
    if (this.cameraController) {
      this.cameraController.reset();
    }

    console.log('🔄 Animation engine reset');
  }

  dispose(): void {
    this.stateMachine.reset();
    console.log('🗑️ Animation engine disposed');
  }
}

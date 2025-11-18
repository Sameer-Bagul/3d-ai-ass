import { VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { AnimationEngine } from '../lib/animationEngine';
import { AnimationCommand, Emotion, ActionType, ViewMode } from '../types/animation';

export class AvatarController {
  private vrm: VRM;
  private animationEngine: AnimationEngine;
  private clock: THREE.Clock;

  constructor(vrm: VRM, camera?: THREE.Camera, controls?: any) {
    this.vrm = vrm;
    this.clock = new THREE.Clock();
    this.animationEngine = new AnimationEngine(vrm, camera, controls);

    console.log('🎮 AvatarController initialized');
  }

  executeAnimationCommand(command: AnimationCommand): void {
    this.animationEngine.executeCommand(command);
  }

  setEmotion(emotion: Emotion, intensity?: number): void {
    this.animationEngine.setEmotion(emotion, intensity);
  }

  playAction(action: ActionType): void {
    this.animationEngine.playAction(action);
  }

  setViewMode(mode: ViewMode): void {
    this.animationEngine.setViewMode(mode);
  }

  lookAtCamera(): void {
    this.animationEngine.lookAtCamera();
  }

  update(deltaTime?: number): void {
    const delta = deltaTime !== undefined ? deltaTime : this.clock.getDelta();
    this.animationEngine.update(delta);
  }

  getStatus() {
    return this.animationEngine.getStatus();
  }

  reset(): void {
    this.animationEngine.reset();
  }

  dispose(): void {
    this.animationEngine.dispose();
  }
}

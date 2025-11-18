import { VRM } from '@pixiv/three-vrm';
import { ProceduralAnimation, AnimationLayer, AnimationState, ActionType, Emotion } from '../types/animation';

export class AnimationStateMachine {
  private state: AnimationState;
  private vrm: VRM;
  private animationStartTimes: Map<AnimationLayer, number> = new Map();
  private globalTime: number = 0;

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.state = {
      currentAction: null,
      currentEmotion: 'neutral',
      currentViewMode: 'full-body',
      activeAnimations: new Map(),
      isTransitioning: false
    };
  }

  addAnimation(animation: ProceduralAnimation, replace: boolean = false): void {
    const layer = animation.layer;

    if (replace || !this.state.activeAnimations.has(layer)) {
      if (this.state.activeAnimations.has(layer)) {
        const existing = this.state.activeAnimations.get(layer);
        if (existing?.onEnd) {
          existing.onEnd(this.vrm);
        }
      }

      if (animation.onStart) {
        animation.onStart(this.vrm);
      }

      this.state.activeAnimations.set(layer, animation);
      this.animationStartTimes.set(layer, this.globalTime);
      console.log(`🎬 Added animation: ${animation.name} (layer: ${layer}, priority: ${animation.priority})`);
    } else {
      const existing = this.state.activeAnimations.get(layer);
      if (existing && animation.priority > existing.priority) {
        if (existing.onEnd) {
          existing.onEnd(this.vrm);
        }

        if (animation.onStart) {
          animation.onStart(this.vrm);
        }

        this.state.activeAnimations.set(layer, animation);
        this.animationStartTimes.set(layer, this.globalTime);
        console.log(`🔄 Replaced animation with higher priority: ${animation.name}`);
      }
    }
  }

  removeAnimation(layer: AnimationLayer): void {
    const animation = this.state.activeAnimations.get(layer);
    if (animation) {
      if (animation.onEnd) {
        animation.onEnd(this.vrm);
      }
      this.state.activeAnimations.delete(layer);
      this.animationStartTimes.delete(layer);
      console.log(`🛑 Removed animation from layer: ${layer}`);
    }
  }

  removeAnimationByName(name: string): void {
    for (const [layer, animation] of this.state.activeAnimations.entries()) {
      if (animation.name === name) {
        this.removeAnimation(layer);
        break;
      }
    }
  }

  clearLayer(layer: AnimationLayer): void {
    this.removeAnimation(layer);
  }

  clearAllExceptBase(): void {
    const layers: AnimationLayer[] = ['gesture', 'emotion', 'locomotion', 'override'];
    layers.forEach(layer => this.removeAnimation(layer));
  }

  update(deltaTime: number): void {
    this.globalTime += deltaTime;

    this.resetBonesToRestPose();

    const layersToRemove: AnimationLayer[] = [];

    for (const [layer, animation] of this.state.activeAnimations.entries()) {
      const startTime = this.animationStartTimes.get(layer) || 0;
      const elapsed = this.globalTime - startTime;

      if (animation.duration !== Infinity && elapsed >= animation.duration) {
        if (animation.loop) {
          this.animationStartTimes.set(layer, this.globalTime);
          if (animation.onStart) {
            animation.onStart(this.vrm);
          }
        } else {
          layersToRemove.push(layer);
          continue;
        }
      }

      if (animation.update) {
        animation.update(this.vrm, elapsed, deltaTime);
      }
    }

    layersToRemove.forEach(layer => this.removeAnimation(layer));
  }

  private resetBonesToRestPose(): void {
    const humanoid = this.vrm.humanoid;
    if (!humanoid) return;

    const boneNames = [
      'hips', 'spine', 'chest', 'upperChest', 'neck', 'head',
      'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand',
      'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand',
      'leftUpperLeg', 'leftLowerLeg', 'leftFoot',
      'rightUpperLeg', 'rightLowerLeg', 'rightFoot'
    ];

    boneNames.forEach(boneName => {
      const bone = humanoid.getNormalizedBoneNode(boneName as any);
      if (bone) {
        bone.rotation.set(0, 0, 0);
      }
    });
  }

  setAction(action: ActionType | null): void {
    this.state.currentAction = action;
  }

  setEmotion(emotion: Emotion): void {
    this.state.currentEmotion = emotion;
  }

  getState(): Readonly<AnimationState> {
    return this.state;
  }

  isAnimationActive(name: string): boolean {
    for (const animation of this.state.activeAnimations.values()) {
      if (animation.name === name) {
        return true;
      }
    }
    return false;
  }

  getActiveAnimationNames(): string[] {
    return Array.from(this.state.activeAnimations.values()).map(anim => anim.name);
  }

  reset(): void {
    for (const [_layer, animation] of this.state.activeAnimations.entries()) {
      if (animation.onEnd) {
        animation.onEnd(this.vrm);
      }
    }

    this.state.activeAnimations.clear();
    this.animationStartTimes.clear();
    this.state.currentAction = null;
    this.state.isTransitioning = false;
    this.globalTime = 0;

    console.log('🔄 Animation state machine reset');
  }

  transitionToAction(
    action: ActionType | null,
    transitionDuration: number = 0.3
  ): void {
    this.state.isTransitioning = true;
    this.state.currentAction = action;

    setTimeout(() => {
      this.state.isTransitioning = false;
    }, transitionDuration * 1000);
  }
}

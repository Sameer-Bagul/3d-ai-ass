import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRM } from '@pixiv/three-vrm';
import { retargetMixamoToVRM } from './retargeting';

export interface AnimationOptions {
  loop?: boolean;
  crossFadeDuration?: number;
  timeScale?: number;
}

export class AnimationManager {
  private mixer: THREE.AnimationMixer;
  private vrm: VRM;
  private fbxLoader: FBXLoader;
  private animations: Map<string, THREE.AnimationClip> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private loadingPromises: Map<string, Promise<THREE.AnimationClip>> = new Map();

  // Available animations in /public/animations/
  private availableAnimations = [
    'idle',
    'breathing',
    'look-around',
    'waving',
    'talking',
    'thinking',
    'happy',
    'sad',
    'surprised',
    'angry',
    'dance',
    'jump',
    'backflip',
    'sitting',
    'standing-up',
    'walking',
    'running',
    'sneaking',
    'zombie-walk',
    'crouch-walk',
    'rifle-walk',
    'strafe-left',
    'strafe-right',
    'crawl',
    'death',
    'falling',
    'hit-reaction',
    'punch',
    'kick',
    'block',
    'dodge',
    'draw-sword',
    'sheathe-sword',
    'rifle-aim',
    'rifle-shoot',
    'pistol-shoot',
    'throw',
    'climb',
    'push',
  ];

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.mixer = new THREE.AnimationMixer(vrm.scene);
    this.fbxLoader = new FBXLoader();
    
    // CRITICAL: Ensure frustum culling stays disabled
    this.mixer.addEventListener('finished', () => {
      this.vrm.scene.traverse((obj) => {
        obj.frustumCulled = false;
      });
    });
  }

  /**
   * Load a single FBX animation and retarget it to VRM
   */
  async loadAnimation(name: string): Promise<THREE.AnimationClip> {
    // Check if already loaded
    if (this.animations.has(name)) {
      return this.animations.get(name)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    // Start loading
    const loadPromise = new Promise<THREE.AnimationClip>((resolve, reject) => {
      const url = `/animations/${name}.fbx`;
      
      this.fbxLoader.load(
        url,
        (fbx) => {
          // Get the first animation from the FBX
          const mixamoClip = fbx.animations[0];
          
          if (!mixamoClip) {
            reject(new Error(`No animation found in ${name}.fbx`));
            return;
          }

          // Retarget to VRM
          const retargetedClip = retargetMixamoToVRM(mixamoClip, this.vrm);
          retargetedClip.name = name;

          // Cache it
          this.animations.set(name, retargetedClip);
          this.loadingPromises.delete(name);

          console.log(`✅ Loaded and retargeted animation: ${name}`);
          resolve(retargetedClip);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading ${name}: ${percent.toFixed(0)}%`);
        },
        (error) => {
          this.loadingPromises.delete(name);
          console.error(`Failed to load animation ${name}:`, error);
          reject(error);
        }
      );
    });

    this.loadingPromises.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * Load all available animations
   */
  async loadAllAnimations(
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    const total = this.availableAnimations.length;
    let loaded = 0;

    console.log(`🎬 Loading ${total} animations...`);

    // Load animations in parallel (but limit concurrency)
    const batchSize = 5;
    for (let i = 0; i < this.availableAnimations.length; i += batchSize) {
      const batch = this.availableAnimations.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (name) => {
          try {
            await this.loadAnimation(name);
            loaded++;
            onProgress?.(loaded, total);
          } catch (error) {
            console.warn(`Skipping ${name} (file may not exist)`);
            loaded++;
            onProgress?.(loaded, total);
          }
        })
      );
    }

    console.log(`✅ Loaded ${this.animations.size}/${total} animations`);
  }

  /**
   * Play an animation by name
   */
  playAnimation(
    name: string,
    options: AnimationOptions = {}
  ): THREE.AnimationAction | null {
    const clip = this.animations.get(name);
    
    if (!clip) {
      console.error(`Animation "${name}" not loaded. Call loadAnimation() first.`);
      return null;
    }

    const {
      loop = true,
      crossFadeDuration = 0.5,
      timeScale = 1.0,
    } = options;

    // Create action
    const action = this.mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.timeScale = timeScale;

    // Cross-fade from current animation
    if (this.currentAction && this.currentAction !== action) {
      action.reset();
      action.play();
      this.currentAction.crossFadeTo(action, crossFadeDuration, true);
    } else {
      action.play();
    }

    this.currentAction = action;
    console.log(`▶️ Playing animation: ${name}`);
    
    return action;
  }

  /**
   * Stop current animation
   */
  stop(fadeDuration: number = 0.5): void {
    if (this.currentAction) {
      this.currentAction.fadeOut(fadeDuration);
      setTimeout(() => {
        this.currentAction?.stop();
        this.currentAction = null;
      }, fadeDuration * 1000);
    }
  }

  /**
   * Update animation mixer (call in render loop)
   */
  update(deltaTime: number): void {
    this.mixer.update(deltaTime);
  }

  /**
   * Get list of loaded animations
   */
  getLoadedAnimations(): string[] {
    return Array.from(this.animations.keys());
  }

  /**
   * Get list of available animations
   */
  getAvailableAnimations(): string[] {
    return [...this.availableAnimations];
  }

  /**
   * Check if animation is loaded
   */
  isLoaded(name: string): boolean {
    return this.animations.has(name);
  }

  /**
   * Get current playing animation name
   */
  getCurrentAnimation(): string | null {
    if (!this.currentAction) return null;
    return this.currentAction.getClip().name;
  }
}

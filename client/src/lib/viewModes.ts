import * as THREE from 'three';

export type ViewMode = 'full-body' | 'half-body' | 'head-only';

export interface CameraPosition {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

const VIEW_MODE_PRESETS: Record<ViewMode, CameraPosition> = {
  'full-body': {
    position: new THREE.Vector3(0, 1.4, 2.5),
    target: new THREE.Vector3(0, 1.0, 0),
    fov: 30
  },
  'half-body': {
    position: new THREE.Vector3(0, 1.4, 1.5),
    target: new THREE.Vector3(0, 1.2, 0),
    fov: 25
  },
  'head-only': {
    position: new THREE.Vector3(0, 1.5, 0.8),
    target: new THREE.Vector3(0, 1.5, 0),
    fov: 20
  }
};

export class ViewModeController {
  private currentMode: ViewMode = 'full-body';
  private targetMode: ViewMode = 'full-body';
  private camera: THREE.Camera | null = null;
  private controls: any = null;
  private transitionProgress: number = 1.0;
  private transitionDuration: number = 1.0;
  private startPosition = new THREE.Vector3();
  private startTarget = new THREE.Vector3();
  private startFov: number = 30;

  constructor() {
    console.log('📷 ViewModeController initialized');
  }

  initialize(camera: THREE.Camera, controls: any): void {
    this.camera = camera;
    this.controls = controls;
  }

  setViewMode(mode: ViewMode, duration: number = 1.0): void {
    if (!VIEW_MODE_PRESETS[mode]) {
      console.warn(`Unknown view mode: ${mode}`);
      return;
    }

    if (mode === this.currentMode) {
      return;
    }

    this.targetMode = mode;
    this.transitionDuration = duration;
    this.transitionProgress = 0.0;

    if (this.camera) {
      this.startPosition.copy(this.camera.position);
      this.startFov = (this.camera as THREE.PerspectiveCamera).fov;
    }

    if (this.controls && this.controls.target) {
      this.startTarget.copy(this.controls.target);
    }

    console.log(`📷 Transitioning to view mode: ${mode}`);
  }

  update(deltaTime: number): void {
    if (!this.camera || this.transitionProgress >= 1.0) return;

    this.transitionProgress = Math.min(
      1.0,
      this.transitionProgress + deltaTime / this.transitionDuration
    );

    const t = this.easeInOutCubic(this.transitionProgress);

    const preset = VIEW_MODE_PRESETS[this.targetMode];

    this.camera.position.lerpVectors(this.startPosition, preset.position, t);

    if (this.controls && this.controls.target) {
      this.controls.target.lerpVectors(this.startTarget, preset.target, t);
    }

    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.fov = THREE.MathUtils.lerp(this.startFov, preset.fov, t);
      this.camera.updateProjectionMatrix();
    }

    if (this.transitionProgress >= 1.0) {
      this.currentMode = this.targetMode;
      console.log(`📷 View mode transition complete: ${this.currentMode}`);
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getCurrentMode(): ViewMode {
    return this.currentMode;
  }

  isTransitioning(): boolean {
    return this.transitionProgress < 1.0;
  }

  getAvailableModes(): ViewMode[] {
    return ['full-body', 'half-body', 'head-only'];
  }
}

export default ViewModeController;

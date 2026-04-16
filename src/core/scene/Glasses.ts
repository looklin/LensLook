import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scaleLandmark, Landmark } from '../facemesh';

interface UserOffset {
  x: number;
  y: number;
}

// Shared loader instance
const loader = new GLTFLoader();

// Model cache: key = url, value = original model group
const modelCache = new Map<string, THREE.Group>();

function loadModel(file: string): Promise<THREE.Group> {
  // Check cache first
  if (modelCache.has(file)) {
    const cachedModel = modelCache.get(file)!;
    // Clone the cached model for use
    return Promise.resolve(cachedModel.clone());
  }

  return new Promise((res, rej) => {
    loader.load(
      file,
      (gltf) => {
        // Store original model in cache
        modelCache.set(file, gltf.scene);
        // Return a clone for actual use
        res(gltf.scene.clone());
      },
      undefined,
      (error) => rej(error)
    );
  });
}

// Clear cache for a specific URL (when user deletes a custom model)
export function clearModelCache(url: string): void {
  if (modelCache.has(url)) {
    const model = modelCache.get(url)!;
    model.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    modelCache.delete(url);
  }
}

export class Glasses {
  private scene: THREE.Scene;
  private width: number;
  private height: number;
  private needsUpdate: boolean = false;
  private landmarks: Landmark[] | null = null;
  private isTracking: boolean = false;
  private modelLoading: boolean = false;
  private glassesGroup: THREE.Group | null = null;
  private modelOffset: THREE.Vector3 = new THREE.Vector3();
  private scaleFactor: number = 1;
  private userOffset: UserOffset = { x: 0, y: 0 };
  private currentModelUrl: string | null = null;
  private inScene: boolean = false;

  // Reusable objects to avoid GC
  private readonly tempVec3 = new THREE.Vector3();
  private readonly tempVec3_2 = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly upVector = new THREE.Vector3();
  private readonly sideVector = new THREE.Vector3();
  private readonly targetQuat = new THREE.Quaternion();
  private readonly tempEuler = new THREE.Euler();

  constructor(scene: THREE.Scene, width: number, height: number, initialModelPath: string) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.loadGlasses(initialModelPath);
  }

  adjustPosition(dx: number, dy: number): void {
    this.userOffset.x += dx;
    this.userOffset.y += dy;
    this.needsUpdate = true;
  }

  resetPosition(): void {
    this.userOffset = { x: 0, y: 0 };
    this.needsUpdate = true;
  }

  private setupModel(model: THREE.Group): void {
    const bbox = new THREE.Box3().setFromObject(model);
    const center = bbox.getCenter(this.tempVec3);
    const size = bbox.getSize(this.tempVec3_2);

    this.glassesGroup = new THREE.Group();
    this.glassesGroup.name = 'glasses';

    this.modelOffset.copy(center);
    model.position.sub(center);
    this.glassesGroup.add(model);

    this.scaleFactor = size.x;
    this.needsUpdate = true;
  }

  async loadGlasses(modelPath: string): Promise<void> {
    this.modelLoading = true;
    this.currentModelUrl = modelPath;
    try {
      const model = await loadModel(modelPath);
      this.setupModel(model);
      if (this.landmarks) {
        this.addGlasses();
      }
    } catch (e) {
      console.error('Failed to load initial glasses model', e);
    } finally {
      this.modelLoading = false;
    }
  }

  async changeModel(fileUrl: string): Promise<void> {
    // Remove current glasses from scene (but don't dispose - cached model remains)
    if (this.glassesGroup) {
      this.removeGlasses();
      this.disposeGlassesGroup();
    }
    this.userOffset = { x: 0, y: 0 };
    this.modelLoading = true;
    this.currentModelUrl = fileUrl;

    try {
      const model = await loadModel(fileUrl);
      this.setupModel(model);
      if (this.landmarks) {
        this.addGlasses();
      }
    } catch (e) {
      console.error('Failed to load new glasses model', e);
    } finally {
      this.modelLoading = false;
    }
  }

  private disposeGlassesGroup(): void {
    if (!this.glassesGroup) return;

    // Only dispose the clone, not the cached original
    this.glassesGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    this.glassesGroup = null;
  }

  updateDimensions(width: number, height: number): void {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.needsUpdate = true;
    }
  }

  updateLandmarks(landmarks: Landmark[]): void {
    this.landmarks = landmarks;
    this.needsUpdate = true;
  }

  private updateGlasses(): void {
    if (!this.landmarks || !this.glassesGroup) return;

    // Use cached reusable vectors
    const midEyes = scaleLandmark(this.landmarks[168], this.width, this.height);
    const leftEyeInnerCorner = scaleLandmark(this.landmarks[463], this.width, this.height);
    const rightEyeInnerCorner = scaleLandmark(this.landmarks[243], this.width, this.height);
    const noseBottom = scaleLandmark(this.landmarks[2], this.width, this.height);
    const leftEyeUpper1 = scaleLandmark(this.landmarks[264], this.width, this.height);
    const rightEyeUpper1 = scaleLandmark(this.landmarks[34], this.width, this.height);

    this.targetPosition.set(
      midEyes.x + this.userOffset.x,
      midEyes.y + this.userOffset.y,
      midEyes.z
    );

    const eyeDist = Math.sqrt(
      (leftEyeUpper1.x - rightEyeUpper1.x) ** 2 +
      (leftEyeUpper1.y - rightEyeUpper1.y) ** 2 +
      (leftEyeUpper1.z - rightEyeUpper1.z) ** 2
    );

    const targetScale = eyeDist / this.scaleFactor;
    const currentScale = this.glassesGroup.scale.x;

    // Reuse vectors for calculations
    this.upVector.set(
      midEyes.x - noseBottom.x,
      midEyes.y - noseBottom.y,
      midEyes.z - noseBottom.z
    ).normalize();

    this.sideVector.set(
      leftEyeInnerCorner.x - rightEyeInnerCorner.x,
      leftEyeInnerCorner.y - rightEyeInnerCorner.y,
      leftEyeInnerCorner.z - rightEyeInnerCorner.z
    ).normalize();

    const zRot = this.tempVec3.set(1, 0, 0).angleTo(
      this.upVector.clone().projectOnPlane(this.tempVec3_2.set(0, 0, 1))
    ) - Math.PI / 2;

    const xRot = Math.PI / 2 - this.tempVec3.set(0, 0, 1).angleTo(
      this.upVector.clone().projectOnPlane(this.tempVec3_2.set(1, 0, 0))
    );

    const yRot = this.tempVec3.set(this.sideVector.x, 0, this.sideVector.z).angleTo(
      this.tempVec3_2.set(0, 0, 1)
    ) - Math.PI / 2;

    this.tempEuler.set(xRot, yRot, zRot);
    this.targetQuat.setFromEuler(this.tempEuler);

    if (!this.isTracking) {
      this.glassesGroup.position.copy(this.targetPosition);
      this.glassesGroup.scale.setScalar(targetScale);
      this.glassesGroup.quaternion.copy(this.targetQuat);
      this.isTracking = true;
    } else {
      this.glassesGroup.position.lerp(this.targetPosition, 0.4);
      this.glassesGroup.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.4));
      this.glassesGroup.quaternion.slerp(this.targetQuat, 0.4);
    }
  }

  private addGlasses(): void {
    if (this.glassesGroup && !this.inScene) {
      this.scene.add(this.glassesGroup);
      this.inScene = true;
    }
  }

  private removeGlasses(): void {
    if (this.glassesGroup && this.inScene) {
      this.scene.remove(this.glassesGroup);
      this.inScene = false;
    }
    this.isTracking = false;
  }

  update(): void {
    if (this.modelLoading) return;

    if (this.needsUpdate) {
      const shouldShow = !!this.landmarks;

      if (this.inScene) {
        shouldShow ? this.updateGlasses() : this.removeGlasses();
      } else {
        if (shouldShow) {
          this.addGlasses();
          this.updateGlasses();
        }
      }
    }
  }

  isModelLoading(): boolean {
    return this.modelLoading;
  }

  getCurrentModelUrl(): string | null {
    return this.currentModelUrl;
  }

  dispose(): void {
    this.removeGlasses();
    this.disposeGlassesGroup();
  }
}
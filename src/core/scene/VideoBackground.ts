import * as THREE from 'three';

export class VideoBackground {
  private scene: THREE.Scene;
  private image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | null = null;
  private plane: THREE.Mesh | null = null;
  private texture: THREE.CanvasTexture | null = null;
  private width: number;
  private height: number;
  private sizeUpdated: boolean = false;
  private imageUpdated: boolean = false;

  constructor(scene: THREE.Scene, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;
  }

  updateDimensions(width: number, height: number): void {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.sizeUpdated = true;
    }
  }

  setImage(image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): void {
    if (this.image !== image) {
      this.image = image;
      this.imageUpdated = true;
    }
  }

  private createPlane(): void {
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.position.set(0, 0, 0);
    this.scene.add(this.plane);
  }

  private updateTexture(): void {
    if (!this.image) return;

    if (!this.texture) {
      this.texture = new THREE.CanvasTexture(this.image);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.minFilter = THREE.LinearFilter;
      this.texture.magFilter = THREE.LinearFilter;
    } else if (this.imageUpdated) {
      this.texture.image = this.image;
      this.texture.needsUpdate = true;
    }

    if (this.plane && this.plane.material instanceof THREE.MeshBasicMaterial) {
      this.plane.material.map = this.texture;
      this.plane.material.needsUpdate = true;
    }
  }

  private updateGeometry(): void {
    if (!this.plane) return;

    const geometry = this.plane.geometry as THREE.PlaneGeometry;
    if (geometry) {
      geometry.dispose();
    }
    this.plane.geometry = new THREE.PlaneGeometry(this.width, this.height);
  }

  update(): void {
    if (!this.plane) {
      this.createPlane();
    }

    if (this.sizeUpdated) {
      this.updateGeometry();
      this.sizeUpdated = false;
    }

    if (this.imageUpdated || !this.texture) {
      this.updateTexture();
      this.imageUpdated = false;
    } else if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  dispose(): void {
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
    if (this.plane) {
      if (this.plane.geometry) {
        this.plane.geometry.dispose();
      }
      if (this.plane.material instanceof THREE.MeshBasicMaterial) {
        this.plane.material.dispose();
      }
      this.scene.remove(this.plane);
      this.plane = null;
    }
  }
}
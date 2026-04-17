import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Glasses } from './Glasses';
import { VideoBackground } from './VideoBackground';
import { Environment } from './Environment';
import type { Landmark } from '../facemesh';

const cameraDistance = (height: number, fov: number): number => {
  return (height / 2) / Math.tan((fov / 2) * Math.PI / 180);
};

// Limit pixel ratio to avoid performance issues on high DPI displays
const MAX_PIXEL_RATIO = 2;

export class SceneManager {
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private debug: boolean;
  private useOrtho: boolean;
  private renderer: THREE.WebGLRenderer;
  private camera!: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private controls: OrbitControls | null = null;
  private videoBg: VideoBackground | null = null;
  private glasses: Glasses | null = null;
  private fov: number = 63;
  private videoWidth: number = 0;
  private videoHeight: number = 0;
  private lastCanvasWidth: number = 0;
  private lastCanvasHeight: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    debug: boolean = false,
    useOrtho: boolean = true,
    initialModelPath: string
  ) {
    this.canvas = canvas;
    this.debug = debug;
    this.useOrtho = useOrtho;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    
    // Limit pixel ratio for better performance
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    this.buildCamera();
    this.buildControls();
    this.buildEnvironment();
    this.buildVideoBg();
    this.buildGlasses(initialModelPath);
  }

  private buildEnvironment(): void {
    new Environment(this.scene, this.renderer);
  }

  private buildVideoBg(): void {
    this.videoBg = new VideoBackground(
      this.scene,
      this.renderer.domElement.width,
      this.renderer.domElement.height
    );
  }

  private buildGlasses(initialModelPath: string): void {
    this.glasses = new Glasses(
      this.scene,
      this.renderer.domElement.width,
      this.renderer.domElement.height,
      initialModelPath
    );
  }

  private buildControls(): void {
    if (this.debug) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.update();
    }
  }

  private buildCamera(): void {
    if (this.useOrtho) {
      this.buildOrthoCamera();
    } else {
      this.buildPerspectiveCamera();
    }
  }

  private buildOrthoCamera(): void {
    this.camera = new THREE.OrthographicCamera(
      -this.renderer.domElement.width / 2,
      this.renderer.domElement.width / 2,
      this.renderer.domElement.height / 2,
      -this.renderer.domElement.height / 2,
      -2000,
      2000
    );
    this.camera.position.z = 1;
  }

  private buildPerspectiveCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.renderer.domElement.width / this.renderer.domElement.height,
      1.0,
      10000
    );
    this.camera.position.z = cameraDistance(
      this.renderer.domElement.height,
      this.fov
    );
  }

  private resizeRendererToDisplaySize(): boolean {
    const canvas = this.renderer.domElement;
    const container = canvas.parentElement;

    if (this.videoWidth > 0 && this.videoHeight > 0) {
      const containerWidth = container ? container.clientWidth : canvas.clientWidth;
      const aspect = this.videoWidth / this.videoHeight;
      const displayWidth = containerWidth;
      const displayHeight = Math.round(containerWidth / aspect);

      if (
        canvas.style.width !== `${displayWidth}px` ||
        canvas.style.height !== `${displayHeight}px`
      ) {
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
      }
    }

    const width = canvas.clientWidth | 0;
    const height = canvas.clientHeight | 0;
    
    // Cache check - avoid redundant resize operations
    if (width === this.lastCanvasWidth && height === this.lastCanvasHeight) {
      return false;
    }
    
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      this.renderer.setSize(width, height, false);
      this.lastCanvasWidth = width;
      this.lastCanvasHeight = height;
    }
    return needResize;
  }

  private updateCamera(): void {
    if (this.camera.type === 'OrthographicCamera') {
      const orthoCam = this.camera as THREE.OrthographicCamera;
      orthoCam.top = this.videoHeight / 2;
      orthoCam.bottom = -this.videoHeight / 2;
      orthoCam.left = -this.videoWidth / 2;
      orthoCam.right = this.videoWidth / 2;
      orthoCam.updateProjectionMatrix();
    } else {
      const perspCam = this.camera as THREE.PerspectiveCamera;
      perspCam.aspect = this.videoWidth / this.videoHeight;
      perspCam.position.z = cameraDistance(this.videoHeight, this.fov);
      perspCam.updateProjectionMatrix();
    }
  }

  animate(): void {
    if (this.controls) {
      this.controls.update();
    }

    if (this.resizeRendererToDisplaySize()) {
      if (this.glasses) {
        this.glasses.updateDimensions(
          this.renderer.domElement.width,
          this.renderer.domElement.height
        );
      }

      if (this.videoBg) {
        this.videoBg.updateDimensions(
          this.renderer.domElement.width,
          this.renderer.domElement.height
        );
      }

      this.updateCamera();
    }

    if (this.videoBg) {
      this.videoBg.update();
    }
    if (this.glasses) {
      this.glasses.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize(videoWidth: number, videoHeight: number): void {
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
  }

  onLandmarks(image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageBitmap, landmarks: Landmark[]): void {
    if (image && landmarks) {
      if (this.videoBg) {
        this.videoBg.setImage(image);
      }
      if (this.glasses) {
        this.glasses.updateLandmarks(landmarks);
      }
    }
  }

  getGlasses(): Glasses | null {
    return this.glasses;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    if (this.glasses) {
      this.glasses.dispose();
    }
    if (this.videoBg) {
      this.videoBg.dispose();
    }
    this.renderer.dispose();
  }
}
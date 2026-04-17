import { transformLandmarks } from './landmarks_helpers';
import type { Landmark } from './landmarks_helpers';

export interface FaceMeshResult {
  image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageBitmap;
  landmarks: Landmark[];
}

// MediaPipe FaceMesh 类型声明
interface MediaPipeFaceMesh {
  setOptions(options: {
    maxNumFaces?: number;
    refineLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }): void;
  onResults(callback: (results: MediaPipeResults) => void): void;
  send(input: { image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement }): Promise<void>;
  initialize(): Promise<void>;
  close(): void;
}

interface MediaPipeResults {
  image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageBitmap;
  multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number; visibility?: number }>>;
}

interface FaceMeshConstructor {
  new(config: { locateFile: (file: string) => string }): MediaPipeFaceMesh;
}

export class FacemeshLandmarksProvider {
  private callback: (result: FaceMeshResult) => void;
  private faceMesh: MediaPipeFaceMesh | null = null;
  private isReady = false;
  private lastProcessTime = 0;
  private processInterval = 50; // 每 50ms 处理一帧

  constructor(callback: (result: FaceMeshResult) => void) {
    this.callback = callback;
  }

  async send(image: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): Promise<void> {
    if (!this.faceMesh || !this.isReady) {
      return Promise.resolve();
    }

    // 控制处理频率
    const now = performance.now();
    if (now - this.lastProcessTime < this.processInterval) {
      return;
    }
    this.lastProcessTime = now;

    try {
      await this.faceMesh.send({ image });
    } catch (e) {
      console.error('Face detection error:', e);
    }
  }

  private onResults(results: MediaPipeResults): void {
    const { image, multiFaceLandmarks } = results;
    if (image && multiFaceLandmarks && multiFaceLandmarks.length > 0) {
      const transformed = transformLandmarks(multiFaceLandmarks[0]);
      if (transformed) {
        this.callback({
          image: image as HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageBitmap,
          landmarks: transformed,
        });
      }
    }
  }

  async initialize(): Promise<void> {
    console.log('Initializing face landmarks detector...');
    
    // 动态加载 MediaPipe script
    if (!(globalThis as any).FaceMesh) {
      await this.loadMediaPipeScript();
    }

    const FaceMeshCtor = (globalThis as any).FaceMesh as FaceMeshConstructor;
    if (!FaceMeshCtor) {
      throw new Error('FaceMesh not available after script load');
    }

    this.faceMesh = new FaceMeshCtor({
      locateFile: (file: string) => {
        return `/mediapipe/${file}`;
      },
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults(this.onResults.bind(this));

    await this.faceMesh.initialize();
    this.isReady = true;
    console.log('Face mesh initialized successfully');
  }

  private loadMediaPipeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      if ((globalThis as any).FaceMesh) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = '/mediapipe/face_mesh.js';
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('MediaPipe script loaded');
        // 给一点时间让 FaceMesh 构造函数可用
        setTimeout(() => {
          if ((globalThis as any).FaceMesh) {
            resolve();
          } else {
            reject(new Error('FaceMesh constructor not available'));
          }
        }, 100);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load MediaPipe script'));
      };

      document.body.appendChild(script);
    });
  }
}
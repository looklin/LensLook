export class CameraFrameProvider {
  private videoElement: HTMLVideoElement;
  private onFrame: (video: HTMLVideoElement) => void;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(videoElement: HTMLVideoElement, onFrame: (video: HTMLVideoElement) => void) {
    this.videoElement = videoElement;
    this.onFrame = onFrame;
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      this.isRunning = true;
      this.startFrameLoop();
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw error;
    }
  }

  private startFrameLoop(): void {
    const loop = () => {
      if (this.isRunning && this.videoElement.readyState >= 2) {
        this.onFrame(this.videoElement);
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.videoElement.srcObject = null;
    this.videoElement.pause();
  }
}
export class VideoFrameProvider {
  private videoElement: HTMLVideoElement;
  private onFrame: (video: HTMLVideoElement) => void;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(videoElement: HTMLVideoElement, onFrame: (video: HTMLVideoElement) => void) {
    this.videoElement = videoElement;
    this.onFrame = onFrame;

    // 监听视频加载完成
    this.videoElement.addEventListener('loadeddata', () => {
      if (this.isRunning) {
        this.startFrameLoop();
      }
    });

    // 监听视频播放
    this.videoElement.addEventListener('play', () => {
      if (this.isRunning) {
        this.startFrameLoop();
      }
    });

    // 监听视频暂停/结束
    this.videoElement.addEventListener('pause', () => {
      this.stopFrameLoop();
    });

    this.videoElement.addEventListener('ended', () => {
      this.stopFrameLoop();
    });
  }

  start(): void {
    this.isRunning = true;
    this.videoElement.play().catch((error) => {
      console.error('Failed to play video:', error);
    });

    // 如果视频已经准备好，立即开始帧循环
    if (this.videoElement.readyState >= 2) {
      this.startFrameLoop();
    }
  }

  private startFrameLoop(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    const loop = () => {
      if (this.isRunning && this.videoElement.readyState >= 2 && !this.videoElement.paused) {
        this.onFrame(this.videoElement);
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  private stopFrameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stop(): void {
    this.isRunning = false;
    this.stopFrameLoop();
    this.videoElement.pause();
  }
}
import { useRef, useCallback, useState, useEffect } from 'react';
import { VideoFrameProvider, CameraFrameProvider } from '@/core/frame-provider';
import type { FacemeshLandmarksProvider } from '@/core/facemesh';

export type VideoMode = 'camera' | 'video';

export function useVideoSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  facemeshRef: React.RefObject<FacemeshLandmarksProvider | null>,
  onError?: (message: string) => void
) {
  const [mode, setMode] = useState<VideoMode>('camera');
  const [isLoading, setIsLoading] = useState(true);
  const frameProviderRef = useRef<{ start: () => void | Promise<void>; stop: () => void } | null>(null);

  const onFrame = useCallback(async (video: HTMLVideoElement) => {
    try {
      if (facemeshRef.current && video.videoWidth > 0 && video.videoHeight > 0) {
        await facemeshRef.current.send(video);
      }
    } catch (e) {
      onError?.('面部检测出错');
      console.error('Frame processing error:', e);
    }
  }, [facemeshRef, onError]);

  const startVideoMode = useCallback(async () => {
    if (!videoRef.current) return;

    setIsLoading(true);

    // 清理之前的帧提供者
    if (frameProviderRef.current) {
      frameProviderRef.current.stop();
    }

    // 清理视频源
    const video = videoRef.current;
    video.pause();
    video.srcObject = null;
    const source = video.querySelector('source');
    if (source) source.remove();
    video.removeAttribute('src');
    video.load();

    // 设置视频文件源
    video.innerHTML = `<source src="/video/videoplayback2.mp4">`;
    video.load();

    const provider = new VideoFrameProvider(video, onFrame);
    frameProviderRef.current = provider;
    provider.start();

    setMode('video');
    setIsLoading(false);
  }, [videoRef, onFrame]);

  const startCameraMode = useCallback(async () => {
    if (!videoRef.current) return;

    setIsLoading(true);

    // 清理之前的帧提供者
    if (frameProviderRef.current) {
      frameProviderRef.current.stop();
    }

    // 清理视频源
    const video = videoRef.current;
    video.pause();
    video.srcObject = null;
    const source = video.querySelector('source');
    if (source) source.remove();
    video.removeAttribute('src');
    video.load();

    try {
      const provider = new CameraFrameProvider(video, onFrame);
      frameProviderRef.current = provider;
      await provider.start();

      setMode('camera');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to start camera:', error);
      onError?.('无法访问摄像头，请检查权限设置');
      setIsLoading(false);
    }
  }, [videoRef, onFrame, onError]);

  const toggleMode = useCallback(() => {
    if (mode === 'camera') {
      startVideoMode();
    } else {
      startCameraMode();
    }
  }, [mode, startCameraMode, startVideoMode]);

  const start = useCallback(async () => {
    await startCameraMode();
  }, [startCameraMode]);

  useEffect(() => {
    return () => {
      if (frameProviderRef.current) {
        frameProviderRef.current.stop();
      }
    };
  }, []);

  return {
    mode,
    isLoading,
    start,
    toggleMode,
    startCameraMode,
    startVideoMode,
  };
}
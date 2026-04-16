import { useRef, useEffect, useCallback } from 'react';
import { SceneManager } from '@/core/scene';
import { FacemeshLandmarksProvider } from '@/core/facemesh';
import type { FaceMeshResult } from '@/core/facemesh';

export function useSceneManager(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  mediaRef: React.RefObject<HTMLVideoElement | HTMLImageElement>,
  initialModelPath: string
) {
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const facemeshRef = useRef<FacemeshLandmarksProvider | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameProviderRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  const getMediaSize = useCallback(() => {
    let vw = 640;
    let vh = 480;
    const media = mediaRef.current;
    if (media) {
      if ('videoWidth' in media) {
        vw = (media as HTMLVideoElement).videoWidth || media.clientWidth || 640;
        vh = (media as HTMLVideoElement).videoHeight || media.clientHeight || 480;
      } else if ('naturalWidth' in media) {
        vw = (media as HTMLImageElement).naturalWidth || media.clientWidth || 640;
        vh = (media as HTMLImageElement).naturalHeight || media.clientHeight || 480;
      }
    }
    return { vw, vh };
  }, [mediaRef]);

  const initScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const sceneManager = new SceneManager(
      canvasRef.current,
      false,
      true,
      initialModelPath
    );
    sceneManagerRef.current = sceneManager;

    const facemesh = new FacemeshLandmarksProvider((result: FaceMeshResult) => {
      if (sceneManagerRef.current && mediaRef.current) {
        const { vw, vh } = getMediaSize();
        sceneManagerRef.current.resize(vw, vh);
        sceneManagerRef.current.onLandmarks(result.image, result.landmarks);
      }
    });
    facemeshRef.current = facemesh;

    await facemesh.initialize();
  }, [canvasRef, mediaRef, initialModelPath, getMediaSize]);

  const startAnimation = useCallback(() => {
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (sceneManagerRef.current && mediaRef.current) {
        const { vw, vh } = getMediaSize();
        sceneManagerRef.current.resize(vw, vh);
        sceneManagerRef.current.animate();
      }
    };
    animate();
  }, [mediaRef, getMediaSize]);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const setFrameProvider = useCallback((provider: { start: () => void; stop: () => void }) => {
    if (frameProviderRef.current) {
      frameProviderRef.current.stop();
    }
    frameProviderRef.current = provider;
    provider.start();
  }, []);

  const changeGlassesModel = useCallback((modelPath: string) => {
    if (sceneManagerRef.current) {
      const glasses = sceneManagerRef.current.getGlasses();
      if (glasses) {
        glasses.changeModel(modelPath);
      }
    }
  }, []);

  const adjustGlassesPosition = useCallback((dx: number, dy: number) => {
    if (sceneManagerRef.current) {
      const glasses = sceneManagerRef.current.getGlasses();
      if (glasses) {
        glasses.adjustPosition(dx, dy);
      }
    }
  }, []);

  const resetGlassesPosition = useCallback(() => {
    if (sceneManagerRef.current) {
      const glasses = sceneManagerRef.current.getGlasses();
      if (glasses) {
        glasses.resetPosition();
      }
    }
  }, []);

  const takeScreenshot = useCallback((): string | null => {
    if (sceneManagerRef.current) {
      const canvas = sceneManagerRef.current.getCanvas();
      try {
        return canvas.toDataURL('image/png');
      } catch (e) {
        console.error('Screenshot failed:', e);
        return null;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    return () => {
      stopAnimation();
      if (frameProviderRef.current) {
        frameProviderRef.current.stop();
      }
    };
  }, [stopAnimation]);

  return {
    initScene,
    startAnimation,
    stopAnimation,
    setFrameProvider,
    changeGlassesModel,
    adjustGlassesPosition,
    resetGlassesPosition,
    takeScreenshot,
    facemeshRef,
    sceneManagerRef,
  };
}
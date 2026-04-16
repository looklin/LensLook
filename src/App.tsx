import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Header,
  VideoSection,
  ModelSelector,
  ComparisonSection,
  Toast,
} from '@/components';
import {
  useToast,
  useComparison,
  useModels,
  useSceneManager,
  useVideoSource,
} from '@/hooks';

const POSITION_STEP = 5;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initializedRef = useRef(false);

  const { toasts, showToast, removeToast } = useToast();
  const { items, addItem, removeItem, clearItems } = useComparison();
  const {
    models,
    currentModelId,
    addCustomModel,
    selectModel,
    getCurrentModel,
  } = useModels();

  const [isLoading, setIsLoading] = useState(true);
  const [flashVisible, setFlashVisible] = useState(false);

  const onError = useCallback(
    (message: string) => {
      showToast(message, 'error');
    },
    [showToast]
  );

  const {
    initScene,
    startAnimation,
    changeGlassesModel,
    adjustGlassesPosition,
    resetGlassesPosition,
    takeScreenshot,
    facemeshRef,
  } = useSceneManager(
    canvasRef,
    videoRef,
    '/asserts/glasses/g1/scene.gltf'
  );

  const { mode, isLoading: videoLoading, start, toggleMode } = useVideoSource(
    videoRef,
    facemeshRef,
    onError
  );

  // 初始化场景 - 只执行一次
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      if (!canvasRef.current) return;

      try {
        console.log('Initializing scene...');
        await initScene();
        console.log('Scene initialized, starting animation...');
        startAnimation();
        setIsLoading(false);
        console.log('Animation started, starting video source...');
        await start();
        console.log('Video source started');
      } catch (error) {
        console.error('Initialization failed:', error);
        showToast('初始化失败，请刷新页面重试', 'error');
      }
    };

    init();
  }, []); // 空依赖数组，只执行一次

  // 处理截屏
  const handleScreenshot = useCallback(() => {
    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 300);

    const dataUrl = takeScreenshot();
    if (dataUrl) {
      const currentModel = getCurrentModel();
      addItem(dataUrl, currentModel?.name || '自定义模型', currentModelId);
      showToast('截屏已保存到对比栏！', 'success');
    } else {
      showToast('截屏失败，请重试', 'error');
    }
  }, [takeScreenshot, addItem, getCurrentModel, currentModelId, showToast]);

  // 处理模型选择
  const handleSelectModel = useCallback(
    (modelId: string, modelPath: string) => {
      selectModel(modelId);
      changeGlassesModel(modelPath);
      showToast('正在切换眼镜...', 'info');
    },
    [selectModel, changeGlassesModel, showToast]
  );

  // 处理模型上传
  const handleUploadModel = useCallback(
    (file: File) => {
      const model = addCustomModel(file);
      changeGlassesModel(model.path);
      showToast('自定义模型已加载！', 'success');
    },
    [addCustomModel, changeGlassesModel, showToast]
  );

  // 处理位置调整
  const handleMoveUp = useCallback(() => {
    adjustGlassesPosition(0, POSITION_STEP);
  }, [adjustGlassesPosition]);

  const handleMoveDown = useCallback(() => {
    adjustGlassesPosition(0, -POSITION_STEP);
  }, [adjustGlassesPosition]);

  const handleMoveLeft = useCallback(() => {
    adjustGlassesPosition(-POSITION_STEP, 0);
  }, [adjustGlassesPosition]);

  const handleMoveRight = useCallback(() => {
    adjustGlassesPosition(POSITION_STEP, 0);
  }, [adjustGlassesPosition]);

  const handleResetPosition = useCallback(() => {
    resetGlassesPosition();
    showToast('位置已重置', 'info');
  }, [resetGlassesPosition, showToast]);

  // 处理模式切换
  const handleToggleMode = useCallback(() => {
    toggleMode();
    if (mode === 'camera') {
      showToast('已切换到视频', 'info');
    } else {
      showToast('已切换到摄像头', 'info');
    }
  }, [toggleMode, mode, showToast]);

  return (
    <div id="app">
      <Header
        mode={mode}
        onToggleMode={handleToggleMode}
        onScreenshot={handleScreenshot}
      />

      <main className="main-content">
        <VideoSection
          isLoading={isLoading || videoLoading}
          mode={mode}
          videoRef={videoRef}
          canvasRef={canvasRef}
          flashVisible={flashVisible}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onReset={handleResetPosition}
        />

        <ModelSelector
          models={models}
          currentModelId={currentModelId}
          onSelectModel={handleSelectModel}
          onUploadModel={handleUploadModel}
        />

        <ComparisonSection
          items={items}
          onRemoveItem={removeItem}
          onClearItems={clearItems}
        />
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
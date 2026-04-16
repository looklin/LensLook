import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Upload, Download } from 'lucide-react';
import { useSceneManager, useModels, useToast } from '@/hooks';
import { ModelSelector } from './ModelSelector';
import { LoadingOverlay } from './LoadingOverlay';

interface ImageRenderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageRenderModal({ isOpen, onClose }: ImageRenderModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const { showToast } = useToast();
  const {
    models,
    currentModelId,
    addCustomModel,
    selectModel,
  } = useModels();

  const [isLoading, setIsLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const {
    initScene,
    startAnimation,
    stopAnimation,
    changeGlassesModel,
    takeScreenshot,
    facemeshRef,
  } = useSceneManager(
    canvasRef,
    imageRef,
    '/asserts/glasses/g1/scene.gltf'
  );

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setImageSrc(null);
    } else {
      stopAnimation();
    }
  }, [isOpen, stopAnimation]);

  const handleImageLoad = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current || !imageSrc) return;
    setIsLoading(true);
    try {
      await initScene();
      startAnimation();
      
      if (facemeshRef.current) {
        await facemeshRef.current.send(imageRef.current);
      }
    } catch (e) {
      showToast('图片处理失败，请换一张包含清晰面部的照片', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [initScene, startAnimation, facemeshRef, imageSrc, showToast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
  };

  const handleSelectModel = useCallback(
    (modelId: string, modelPath: string) => {
      selectModel(modelId);
      changeGlassesModel(modelPath);
      showToast('正在切换眼镜...', 'info');
    },
    [selectModel, changeGlassesModel, showToast]
  );
  
  const handleUploadModel = useCallback(
    (file: File) => {
      const model = addCustomModel(file);
      changeGlassesModel(model.path);
      showToast('自定义模型已加载！', 'success');
    },
    [addCustomModel, changeGlassesModel, showToast]
  );

  const handleDownload = () => {
    const dataUrl = takeScreenshot();
    if (!dataUrl) {
      showToast('截图失败', 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'lenslook-result.png';
    a.click();
    showToast('图片已保存', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'visible' : ''}`} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '640px', width: '90%', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>使用照片试戴</h2>
          <button className="btn btn-icon btn-outline" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="video-section" style={{ background: '#1a1a2e', minHeight: '300px', display: 'flex', alignItems: 'center', justifyItems: 'center', position: 'relative' }}>
          {!imageSrc ? (
            <label style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--white)', padding: '2rem' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={32} />
              </div>
              <span style={{ fontWeight: 700 }}>点击上传清晰的面部照片</span>
            </label>
          ) : (
            <div className="video-wrapper" style={{ width: '100%', height: '100%' }}>
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Upload"
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                onLoad={handleImageLoad}
              />
              <canvas ref={canvasRef} className="output_canvas" />
              {isLoading && <LoadingOverlay />}
            </div>
          )}
        </div>

        {imageSrc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-title" style={{ margin: 0 }}>选择眼镜模型</span>
              <button className="btn btn-sm btn-primary" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Download size={14} /> 保存截图
              </button>
            </div>
            <ModelSelector
              models={models}
              currentModelId={currentModelId}
              onSelectModel={handleSelectModel}
              onUploadModel={handleUploadModel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

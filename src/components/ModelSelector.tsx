import { useRef } from 'react';
import { Upload, Glasses, Check } from 'lucide-react';
import type { GlassesModel } from '@/hooks';

interface ModelSelectorProps {
  models: GlassesModel[];
  currentModelId: string;
  onSelectModel: (modelId: string, modelPath: string) => void;
  onUploadModel: (file: File) => void;
}

export function ModelSelector({
  models,
  currentModelId,
  onSelectModel,
  onUploadModel,
}: ModelSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.glb', '.gltf'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      alert('仅支持 .glb 和 .gltf 格式');
      return;
    }

    onUploadModel(file);
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="section-card">
      <div className="section-title">
        <span className="section-title-icon green">
          <Glasses size={14} />
        </span>
        选择眼镜款式
      </div>
      <div className="models-scroll">
        {models.map((model) => (
          <div
            key={model.id}
            className={`model-card ${model.id === currentModelId ? 'active' : ''}`}
            onClick={() => onSelectModel(model.id, model.path)}
          >
            <div className="model-card-check">
              <Check size={11} />
            </div>
            <div className="model-card-icon">
              {model.isCustom ? (
                <Glasses size={32} />
              ) : (
                <img src={model.preview} alt={model.name} style={{ width: '60px', height: '30px', objectFit: 'cover', borderRadius: '6px' }} />
              )}
            </div>
            <div className="model-card-name">{model.name}</div>
          </div>
        ))}
        <div className="upload-card" onClick={handleUploadClick}>
          <div className="upload-card-icon">
            <Upload size={28} />
          </div>
          <div className="upload-card-text">上传模型</div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden-input"
          accept=".glb,.gltf"
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
}
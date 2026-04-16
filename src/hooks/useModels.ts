import { useState, useCallback } from 'react';
import { clearModelCache } from '@/core/scene';

export interface GlassesModel {
  id: string;
  name: string;
  path: string;
  preview: string;
  isCustom?: boolean;
}

const DEFAULT_MODELS: GlassesModel[] = [
  { id: 'g1', name: '款式 1', path: '/asserts/glasses/g1/scene.gltf', preview: '/asserts/glasses/g1/preview.jpg' },
  { id: 'g2', name: '款式 2', path: '/asserts/glasses/g2/scene.gltf', preview: '/asserts/glasses/g2/preview.jpg' },
  { id: 'g3', name: '款式 3', path: '/asserts/glasses/g3/scene.gltf', preview: '/asserts/glasses/g3/preview.jpg' },
];

export function useModels() {
  const [models, setModels] = useState<GlassesModel[]>(DEFAULT_MODELS);
  const [currentModelId, setCurrentModelId] = useState<string>('g1');

  const addCustomModel = useCallback((file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const modelName = file.name.replace(/\.[^/.]+$/, '');
    const modelId = 'custom-' + Date.now();

    const newModel: GlassesModel = {
      id: modelId,
      name: modelName,
      path: fileUrl,
      preview: '',
      isCustom: true,
    };

    setModels((prev) => [...prev, newModel]);
    setCurrentModelId(modelId);

    return newModel;
  }, []);

  const selectModel = useCallback((modelId: string) => {
    setCurrentModelId(modelId);
  }, []);

  const getCurrentModel = useCallback(() => {
    return models.find((m) => m.id === currentModelId);
  }, [models, currentModelId]);

  const removeCustomModel = useCallback((modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (model && model.isCustom) {
      // Clear the model cache and revoke blob URL
      clearModelCache(model.path);
      if (model.path.startsWith('blob:')) {
        URL.revokeObjectURL(model.path);
      }
      setModels((prev) => prev.filter((m) => m.id !== modelId));
      // If removing current model, switch to default
      if (currentModelId === modelId) {
        setCurrentModelId('g1');
      }
    }
  }, [models, currentModelId]);

  return {
    models,
    currentModelId,
    addCustomModel,
    selectModel,
    getCurrentModel,
    removeCustomModel,
  };
}
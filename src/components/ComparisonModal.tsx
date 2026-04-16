import { X } from 'lucide-react';
import type { ComparisonItem } from '@/hooks';

interface ComparisonModalProps {
  visible: boolean;
  items: ComparisonItem[];
  onClose: () => void;
}

export function ComparisonModal({ visible, items, onClose }: ComparisonModalProps) {
  if (!visible) return null;

  return (
    <div className="comparison-modal-overlay visible" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <button className="comparison-modal-close" onClick={onClose}>
        <X size={20} />
      </button>
      <div className="comparison-modal">
        {items.map((item) => (
          <div key={item.id} className="comparison-modal-item">
            <img src={item.dataUrl} alt={item.name} />
            <div className="comparison-modal-item-label">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
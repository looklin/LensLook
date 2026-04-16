import { useState } from 'react';
import { Search, Camera, Trash2, Scale, X } from 'lucide-react';
import { ComparisonModal } from './ComparisonModal';
import type { ComparisonItem } from '@/hooks';

interface ComparisonSectionProps {
  items: ComparisonItem[];
  onRemoveItem: (id: number) => void;
  onClearItems: () => void;
}

export function ComparisonSection({
  items,
  onRemoveItem,
  onClearItems,
}: ComparisonSectionProps) {
  const [showModal, setShowModal] = useState(false);

  const handleCompare = () => {
    if (items.length < 2) {
      alert('至少需要2张截图才能对比');
      return;
    }
    setShowModal(true);
  };

  const handleItemClick = (_item: ComparisonItem) => {
    setShowModal(true);
  };

  return (
    <>
      <section className="comparison-section">
        <div className="section-title">
          <span className="section-title-icon purple">
            <Search size={14} />
          </span>
          试戴对比
          {items.length > 0 && (
            <span style={{ fontSize: '12px', color: '#AFAFAF', fontWeight: 600 }}>
              ({items.length})
            </span>
          )}
        </div>

        <div className="comparison-content">
          {items.length === 0 ? (
            <div className="comparison-empty">
              <div className="comparison-empty-icon">
                <Camera size={36} />
              </div>
              <div className="comparison-empty-text">
                点击截屏按钮，将试戴效果保存到这里对比
              </div>
            </div>
          ) : (
            <div className="comparison-grid">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="comparison-item"
                  onClick={() => handleItemClick(item)}
                >
                  <img
                    className="comparison-item-img"
                    src={item.dataUrl}
                    alt={item.name}
                  />
                  <div className="comparison-item-info">
                    <span className="comparison-item-name">{item.name}</span>
                    <button
                      className="comparison-item-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="comparison-actions">
            <button className="btn btn-outline btn-sm" onClick={onClearItems}>
              <Trash2 size={14} />
              清空
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleCompare}>
              <Scale size={14} />
              对比
            </button>
          </div>
        )}
      </section>

      <ComparisonModal
        visible={showModal}
        items={showModal && items.length === 1 ? [items[0]] : items}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
import { Camera, ImagePlus } from 'lucide-react';

interface HeaderProps {
  onScreenshot: () => void;
  onOpenImageModal?: () => void;
}

export function Header({ onScreenshot, onOpenImageModal }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-logo">
        <div className="app-logo-icon">
          👓
        </div>
        <span className="app-logo-text">LensLook</span>
        <span className="app-logo-sub">虚拟试戴</span>
      </div>
      <div className="header-actions">
        {onOpenImageModal && (
          <button
            className="btn btn-primary"
            onClick={onOpenImageModal}
            title="使用图片"
          >
            <ImagePlus size={16} /> 使用图片
          </button>
        )}
        <button
          className="btn btn-blue btn-icon"
          onClick={onScreenshot}
          title="截屏"
        >
          <Camera size={20} />
        </button>
      </div>
    </header>
  );
}
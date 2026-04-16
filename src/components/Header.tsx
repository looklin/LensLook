import { Camera, CameraOff, Download } from 'lucide-react';

interface HeaderProps {
  mode: 'camera' | 'video';
  onToggleMode: () => void;
  onScreenshot: () => void;
}

export function Header({ mode, onToggleMode, onScreenshot }: HeaderProps) {
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
        <button
          className="btn btn-blue btn-icon"
          onClick={onScreenshot}
          title="截屏"
        >
          <Camera size={20} />
        </button>
        {/* <button className="btn btn-outline btn-sm" onClick={onToggleMode}>
          {mode === 'camera' ? <Camera size={16} /> : <CameraOff size={16} />}
          {mode === 'camera' ? '切换视频' : '切换摄像头'}
        </button> */}
      </div>
    </header>
  );
}
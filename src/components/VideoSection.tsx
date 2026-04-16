import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, CircleDot, Film } from 'lucide-react';
import { LoadingOverlay } from './LoadingOverlay';

interface VideoSectionProps {
  isLoading: boolean;
  mode: 'camera' | 'video';
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  flashVisible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onReset: () => void;
}

export function VideoSection({
  isLoading,
  mode,
  videoRef,
  canvasRef,
  flashVisible,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onReset,
}: VideoSectionProps) {
  return (
    <section className="video-section">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          className="input_video"
          playsInline
          style={{ visibility: 'hidden', position: 'absolute', top: 0, left: 0 }}
        />
        <canvas ref={canvasRef} className="output_canvas" />
        
        <div className="video-overlay">
          <span className={`video-badge ${mode === 'camera' ? 'recording' : ''}`}>
            {mode === 'camera' ? <CircleDot size={12} /> : <Film size={12} />}
            {mode === 'camera' ? '摄像头' : '视频'}
          </span>
        </div>

        <div className="position-adjust-overlay">
          <div className="position-buttons-grid">
            <button className="position-btn" onClick={onMoveUp} title="向上">
              <ArrowUp size={16} />
            </button>
            <div className="position-middle-row">
              <button className="position-btn" onClick={onMoveLeft} title="向左">
                <ArrowLeft size={16} />
              </button>
              <button className="position-btn position-reset" onClick={onReset} title="重置">
                <RotateCcw size={16} />
              </button>
              <button className="position-btn" onClick={onMoveRight} title="向右">
                <ArrowRight size={16} />
              </button>
            </div>
            <button className="position-btn" onClick={onMoveDown} title="向下">
              <ArrowDown size={16} />
            </button>
          </div>
        </div>

        <div className={`screenshot-flash ${flashVisible ? 'active' : ''}`} />

        {isLoading && <LoadingOverlay />}
      </div>
    </section>
  );
}
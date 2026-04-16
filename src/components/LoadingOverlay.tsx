interface LoadingOverlayProps {
  text?: string;
}

export function LoadingOverlay({ text = '正在初始化...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <div className="loading-text">{text}</div>
    </div>
  );
}
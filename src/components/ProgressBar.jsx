const ProgressBar = ({ progress = 0, label }) => {
  const safeProgress = Math.max(0, Math.min(progress, 100));
  return (
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${safeProgress}%` }}></div>
      {label && <span className="progress-bar-label">{label}</span>}
    </div>
  );
};


export default ProgressBar;
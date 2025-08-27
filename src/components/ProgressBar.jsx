const ProgressBar = ({ progress, label }) => (
  <div className="progress-bar-container">
    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
    <span className="progress-bar-label">{label}</span>
  </div>
);

export default ProgressBar;
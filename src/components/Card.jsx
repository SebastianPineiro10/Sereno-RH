const Card = ({ title, children, className = '', onClick }) => (
  <div className={`glass-card ${className}`} onClick={onClick} role="button" tabIndex="0">
    <h3 className="card-title">{title}</h3>
    <div className="card-content">
      {children}
    </div>
  </div>
);

export default Card;
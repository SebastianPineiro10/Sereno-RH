

const Badge = ({ type, text }) => (
  <span className={`badge badge-${type}`}>{text}</span>
);

export default Badge;
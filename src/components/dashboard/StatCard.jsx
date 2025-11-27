import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = 'var(--primary-color)',
  loading = false
}) => {
  const isPositiveTrend = trend === 'up';
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: color }}>
          <Icon size={24} />
        </div>
        {trendValue && (
          <div className={`stat-card-trend ${isPositiveTrend ? 'trend-positive' : 'trend-negative'}`}>
            <TrendIcon size={16} />
            <span>{trendValue}%</span>
          </div>
        )}
      </div>

      <div className="stat-card-content">
        <p className="stat-card-title">{title}</p>
        {loading ? (
          <div className="stat-card-skeleton"></div>
        ) : (
          <h3 className="stat-card-value">{value}</h3>
        )}
      </div>
    </div>
  );
};

export default StatCard;

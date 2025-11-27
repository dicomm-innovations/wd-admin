import { useState, useEffect } from 'react';
import { TrendingUp, Users, Gift, Award, RefreshCw, Download, Target } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatCard from '../components/dashboard/StatCard';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { referralAdminAPI } from '../services/api';
import './ReferralAnalytics.css';

const ReferralAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { error: showError, info } = useNotification();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      const response = await referralAdminAPI.getReferralAnalytics(params);

      if (response) {
        setAnalytics(response);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      showError('Failed to load analytics');
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    info('Analytics refreshed');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    info('Export functionality coming soon');
  };

  if (loading && !analytics) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="analytics-page">
        {/* Header */}
        <div className="analytics-header">
          <h1>Referral Analytics</h1>
          <div className="analytics-actions">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              loading={refreshing}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              icon={Download}
            >
              Export Report
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <Card.Body>
            <div className="date-filter-grid">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Quick Select</label>
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    const now = new Date();
                    let start;

                    switch (value) {
                      case 'week':
                        start = new Date(now.setDate(now.getDate() - 7));
                        break;
                      case 'month':
                        start = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                      case 'quarter':
                        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                        break;
                      case 'year':
                        start = new Date(now.getFullYear(), 0, 1);
                        break;
                      default:
                        return;
                    }

                    setDateRange({
                      startDate: start.toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0]
                    });
                  }}
                >
                  <option value="">Custom Range</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {analytics && (
          <>
            {/* Summary Stats */}
            <div className="analytics-stats">
              <StatCard
                title="Total Referrals"
                value={analytics.summary.totalReferrals || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Conversion Rate"
                value={`${analytics.summary.conversionRate || 0}%`}
                icon={Target}
                color="green"
              />
              <StatCard
                title="Total Rewards"
                value={formatCurrency(analytics.summary.totalRewardsValue || 0)}
                icon={Gift}
                color="purple"
              />
              <StatCard
                title="ROI"
                value={`${analytics.summary.roi || 0}%`}
                icon={TrendingUp}
                color="yellow"
              />
            </div>

            {/* Conversion Funnel */}
            <Card>
              <Card.Header>
                <h3 className="section-title">Conversion Funnel</h3>
              </Card.Header>
              <Card.Body>
                {analytics.conversionFunnel ? (
                  <div className="conversion-funnel">
                    {Object.entries(analytics.conversionFunnel).map(([stage, count]) => {
                      const total = analytics.summary.totalReferrals;
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

                      const stageClasses = {
                        pending: 'funnel-bar-pending',
                        completed: 'funnel-bar-completed',
                        rewarded: 'funnel-bar-rewarded',
                        expired: 'funnel-bar-expired',
                        cancelled: 'funnel-bar-cancelled'
                      };

                      return (
                        <div key={stage} className="funnel-stage">
                          <div className="funnel-stage-header">
                            <div className="funnel-stage-info">
                              <span className="funnel-stage-name">{stage}</span>
                              <span className="funnel-stage-count">({count})</span>
                            </div>
                            <span className="funnel-stage-percentage">{percentage}%</span>
                          </div>
                          <div className="funnel-bar-container">
                            <div
                              className={`funnel-bar ${stageClasses[stage] || 'funnel-bar-expired'}`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 10 && (
                                <span className="funnel-bar-label">{count}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    No funnel data available
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Additional Metrics */}
            <div className="metrics-grid-3">
              <Card>
                <Card.Header>
                  <h3 className="section-title">Referral Breakdown</h3>
                </Card.Header>
                <Card.Body>
                  <div className="metric-list">
                    <div className="metric-row">
                      <span className="metric-label">Successful</span>
                      <span className="metric-value metric-value-green">
                        {analytics.summary.successfulReferrals}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Pending</span>
                      <span className="metric-value metric-value-yellow">
                        {analytics.conversionFunnel?.pending || 0}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Failed</span>
                      <span className="metric-value metric-value-red">
                        {(analytics.conversionFunnel?.expired || 0) + (analytics.conversionFunnel?.cancelled || 0)}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h3 className="section-title">Reward Distribution</h3>
                </Card.Header>
                <Card.Body>
                  <div className="metric-list">
                    <div className="metric-row">
                      <span className="metric-label">Rewards Issued</span>
                      <span className="metric-value metric-value-green">
                        {analytics.summary.rewardsIssued || 0}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Pending Rewards</span>
                      <span className="metric-value metric-value-yellow">
                        {analytics.summary.pendingRewards || 0}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Total Value</span>
                      <span className="metric-value">
                        {formatCurrency(analytics.summary.totalRewardsValue || 0)}
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h3 className="section-title">Performance Metrics</h3>
                </Card.Header>
                <Card.Body>
                  <div className="metric-list">
                    <div className="metric-row">
                      <span className="metric-label">Conversion Rate</span>
                      <span className="metric-value metric-value-green">
                        {analytics.summary.conversionRate || 0}%
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Avg. Referrals/User</span>
                      <span className="metric-value">
                        {analytics.summary.avgReferralsPerUser || 0}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">ROI</span>
                      <span className="metric-value metric-value-blue">
                        {analytics.summary.roi || 0}%
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            {/* Top Referrers */}
            <Card>
              <Card.Header>
                <h3 className="section-title">
                  <Award size={20} />
                  Top Referrers
                </h3>
              </Card.Header>
              <Card.Body>
                {analytics.topReferrers && analytics.topReferrers.length > 0 ? (
                  <div className="top-referrers-list">
                    {analytics.topReferrers.map((referrer, index) => (
                      <div key={referrer.customerId} className="referrer-card">
                        <div className="referrer-info">
                          <div className="referrer-rank">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="referrer-details-name">{referrer.customerName}</div>
                            <div className="referrer-details-stats">
                              {referrer.totalReferrals} referrals • {referrer.successfulReferrals} successful
                            </div>
                          </div>
                        </div>
                        <div className="referrer-earnings">
                          <div className="referrer-earnings-amount">
                            {formatCurrency(referrer.totalRewardsEarned)}
                          </div>
                          <div className="referrer-earnings-rate">
                            {referrer.conversionRate}% conversion
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    No referrer data available for this period
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Reward Type Breakdown */}
            <Card>
              <Card.Header>
                <h3 className="section-title">Reward Type Distribution</h3>
              </Card.Header>
              <Card.Body>
                {analytics.rewardTypeBreakdown && analytics.rewardTypeBreakdown.length > 0 ? (
                  <div className="reward-types-grid">
                    {analytics.rewardTypeBreakdown.map((type) => (
                      <div key={type._id} className="reward-type-card">
                        <div className="reward-type-label">
                          {type._id}
                        </div>
                        <div className="reward-type-count">{type.count} rewards</div>
                        <div className="reward-type-value">
                          {formatCurrency(type.totalValue)}
                        </div>
                        <div className="reward-type-progress">
                          <div
                            className="reward-type-progress-bar"
                            style={{
                              width: `${(type.count / analytics.summary.rewardsIssued) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    No reward type data available
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Referral Timeline */}
            <Card>
              <Card.Header>
                <h3 className="section-title">Referrals Over Time</h3>
              </Card.Header>
              <Card.Body>
                {analytics.referralsByDay && analytics.referralsByDay.length > 0 ? (
                  <div>
                    <div className="timeline-header">
                      <div>Date</div>
                      <div>Referrals</div>
                      <div style={{ textAlign: 'right' }}>Converted</div>
                    </div>
                    {analytics.referralsByDay.slice(-14).map((day) => (
                      <div key={day._id} className="timeline-row">
                        <div className="timeline-date">
                          {formatDate(day._id, 'MMM dd')}
                        </div>
                        <div className="timeline-bar-container">
                          <div className="timeline-bar-track">
                            <div
                              className="timeline-bar-fill"
                              style={{
                                width: `${(day.count / Math.max(...analytics.referralsByDay.map(d => d.count))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="timeline-bar-count">
                            {day.count}
                          </span>
                        </div>
                        <div className="timeline-converted">
                          {day.successful || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    No timeline data available for this period
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Incentive Performance */}
            {analytics.incentivePerformance && analytics.incentivePerformance.length > 0 && (
              <Card>
                <Card.Header>
                  <h3 className="section-title">Incentive Program Performance</h3>
                </Card.Header>
                <Card.Body>
                  <div className="incentive-list">
                    {analytics.incentivePerformance.map((incentive) => (
                      <div key={incentive.programId} className="incentive-card">
                        <div className="incentive-header">
                          <div>
                            <div className="incentive-title">{incentive.programName}</div>
                            <div className="incentive-type">{incentive.programType}</div>
                          </div>
                          <div className={`incentive-status-badge ${
                            incentive.isActive ? 'incentive-status-active' : 'incentive-status-inactive'
                          }`}>
                            {incentive.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        <div className="incentive-stats">
                          <div>
                            <div className="incentive-stat-label">Referrals</div>
                            <div className="incentive-stat-value">{incentive.totalReferrals}</div>
                          </div>
                          <div>
                            <div className="incentive-stat-label">Successful</div>
                            <div className="incentive-stat-value incentive-stat-value-success">{incentive.successfulReferrals}</div>
                          </div>
                          <div>
                            <div className="incentive-stat-label">Rewards Issued</div>
                            <div className="incentive-stat-value">{incentive.rewardsIssued}</div>
                          </div>
                          <div>
                            <div className="incentive-stat-label">Total Value</div>
                            <div className="incentive-stat-value">{formatCurrency(incentive.totalRewardsValue)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ReferralAnalytics;

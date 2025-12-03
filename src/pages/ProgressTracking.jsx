import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { progressAPI, customerAPI } from '../services/api';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Camera,
  Award,
  Activity,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const ProgressTracking = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [progressSummary, setProgressSummary] = useState(null);
  const [gymAnalytics, setGymAnalytics] = useState(null);
  const [spaAnalytics, setSpaAnalytics] = useState(null);
  const [progressGallery, setProgressGallery] = useState(null);
  const [selectedTab, setSelectedTab] = useState('gym');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadProgressData();
    }
  }, [selectedCustomer]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll({ limit: 100 });
      setCustomers(response.customers || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadProgressData = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    setError(null);

    try {
      const [summary, gallery, gymData, spaData] = await Promise.all([
        progressAPI.getProgressSummary(selectedCustomer._id),
        progressAPI.getProgressGallery(selectedCustomer._id, { type: 'all', limit: 50 }),
        progressAPI.getGymAnalytics(selectedCustomer._id).catch(() => null),
        progressAPI.getSpaAnalytics(selectedCustomer._id).catch(() => null),
      ]);

      setProgressSummary(summary?.summary || summary);
      setProgressGallery(gallery?.gallery || gallery);
      setGymAnalytics(gymData?.analytics || gymData);
      setSpaAnalytics(spaData?.analytics || spaData);
    } catch (err) {
      setError(err.message || 'Failed to load progress data');
      console.error('Error loading progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const handleDeletePhoto = async (type, photoId) => {
    if (!window.confirm('Are you sure you want to delete this progress photo?')) {
      return;
    }

    try {
      await progressAPI.deleteProgress(type, photoId);
      await loadProgressData();
      alert('Photo deleted successfully');
    } catch (err) {
      alert('Failed to delete photo: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAddComment = async (type, photoId) => {
    const text = commentInputs[photoId];
    if (!text || !text.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      if (type === 'gym') {
        await progressAPI.addGymComment(photoId, { comment: text.trim() });
      } else {
        await progressAPI.addSpaComment(photoId, { comment: text.trim() });
      }
      setCommentInputs(prev => ({ ...prev, [photoId]: '' }));
      await loadProgressData();
    } catch (err) {
      alert('Failed to add comment: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <Layout title="Progress Tracking" subtitle="Track customer progress for gym and spa treatments">
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', height: 'calc(100vh - 180px)' }}>
        {/* Customer Selection Sidebar */}
        <Card>
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              Select Customer
            </h2>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Customer List */}
            <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
              {filteredCustomers.map((customer) => (
                <button
                  key={customer._id}
                  onClick={() => setSelectedCustomer(customer)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    border: selectedCustomer?._id === customer._id ? '2px solid #8b5cf6' : '2px solid transparent',
                    backgroundColor: selectedCustomer?._id === customer._id ? '#f3e8ff' : '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCustomer?._id !== customer._id) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCustomer?._id !== customer._id) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                >
                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#1f2937' }}>
                    {customer.firstName} {customer.lastName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {customer.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Progress Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {!selectedCustomer ? (
            <Card>
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <Activity style={{ width: '64px', height: '64px', color: '#d1d5db', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>
                  No Customer Selected
                </h3>
                <p style={{ color: '#9ca3af' }}>
                  Select a customer to view their progress tracking data
                </p>
              </div>
            </Card>
          ) : loading ? (
            <Card>
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <RefreshCw style={{ width: '48px', height: '48px', color: '#8b5cf6', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading progress data...</p>
              </div>
            </Card>
          ) : error ? (
            <Card>
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
                <div style={{ color: '#ef4444', marginBottom: '8px', fontWeight: '500' }}>Error loading data</div>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>{error}</p>
                <button
                  onClick={loadProgressData}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Retry
                </button>
              </div>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              {progressSummary && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Card>
                    <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Gym Photos</p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#8b5cf6' }}>
                          {progressSummary.gym?.totalPhotos || 0}
                        </p>
                        {progressSummary.gym?.hasProgress && (
                          <div style={{ marginTop: '8px', fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp style={{ width: '14px', height: '14px' }} />
                            Progress Available
                          </div>
                        )}
                      </div>
                      <Camera style={{ width: '48px', height: '48px', color: '#c4b5fd' }} />
                    </div>
                  </Card>

                  <Card>
                    <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Spa Treatments</p>
                        <p style={{ fontSize: '32px', fontWeight: '700', color: '#ec4899' }}>
                          {progressSummary.spa?.totalTreatments || 0}
                        </p>
                        {progressSummary.spa?.activePlans > 0 && (
                          <div style={{ marginTop: '8px', fontSize: '13px', color: '#3b82f6' }}>
                            {progressSummary.spa.activePlans} Active Plans
                          </div>
                        )}
                      </div>
                      <Activity style={{ width: '48px', height: '48px', color: '#fbcfe8' }} />
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab Selector */}
              <Card>
                <div style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex' }}>
                    <button
                      onClick={() => setSelectedTab('gym')}
                      style={{
                        flex: 1,
                        padding: '16px',
                        border: 'none',
                        borderBottom: selectedTab === 'gym' ? '2px solid #8b5cf6' : '2px solid transparent',
                        backgroundColor: selectedTab === 'gym' ? '#f3e8ff' : 'transparent',
                        color: selectedTab === 'gym' ? '#8b5cf6' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      Gym Progress
                    </button>
                    <button
                      onClick={() => setSelectedTab('spa')}
                      style={{
                        flex: 1,
                        padding: '16px',
                        border: 'none',
                        borderBottom: selectedTab === 'spa' ? '2px solid #ec4899' : '2px solid transparent',
                        backgroundColor: selectedTab === 'spa' ? '#fce7f3' : 'transparent',
                        color: selectedTab === 'spa' ? '#ec4899' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      Spa Progress
                    </button>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {selectedTab === 'gym' ? (
                    <GymProgressView analytics={gymAnalytics} />
                  ) : (
                    <SpaProgressView analytics={spaAnalytics} />
                  )}
                </div>
              </Card>

              {/* Photo Gallery */}
              {progressGallery && (
                <Card>
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
                      Photo Gallery
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {selectedTab === 'gym' && progressGallery.gym?.map((photo) => (
                        <PhotoCard
                          key={photo.photoId}
                          photo={photo}
                          type="gym"
                          onDelete={handleDeletePhoto}
                        />
                      ))}
                      {selectedTab === 'spa' && progressGallery.spa?.map((photo) => (
                        <PhotoCard
                          key={photo.photoId}
                          photo={photo}
                          type="spa"
                          onDelete={handleDeletePhoto}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Notes & Comments */}
              {progressGallery && (
                <Card>
                  <div style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
                      Notes & Comments
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(selectedTab === 'gym' ? progressGallery.gym || [] : progressGallery.spa || []).map((entry) => {
                        const comments = entry.comments || [];
                        const measurementEntries = entry.measurements
                          ? Object.entries(entry.measurements).filter(([, val]) => val !== null && val !== undefined)
                          : [];

                        return (
                          <div
                            key={entry.photoId}
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              padding: '16px',
                              backgroundColor: '#f9fafb'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                {new Date(entry.dateTaken || entry.createdAt).toLocaleString()}
                              </div>
                              <Badge variant="secondary">
                                {selectedTab === 'gym' ? (entry.photoType || 'progress') : (entry.treatmentName || entry.treatmentType)}
                              </Badge>
                            </div>

                            {selectedTab === 'gym' && measurementEntries.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                {measurementEntries.map(([key, val]) => (
                                  <span
                                    key={key}
                                    style={{
                                      padding: '6px 10px',
                                      backgroundColor: '#eef2ff',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      color: '#4338ca'
                                    }}
                                  >
                                    {key.replace('_', ' ')}: {val}
                                  </span>
                                ))}
                              </div>
                            )}

                            {selectedTab === 'spa' && (entry.observations || entry.homeCarePlan || entry.therapistNotes?.shared) && (
                              <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {entry.observations && (
                                  <div style={{ fontSize: '13px', color: '#374151' }}>
                                    <strong>Observations: </strong>{entry.observations.skinTexture || entry.observations.overallCondition || JSON.stringify(entry.observations)}
                                  </div>
                                )}
                                {entry.therapistNotes?.shared && (
                                  <div style={{ fontSize: '13px', color: '#374151' }}>
                                    <strong>Therapist Notes: </strong>{entry.therapistNotes.shared}
                                  </div>
                                )}
                                {entry.homeCarePlan && (
                                  <div style={{ fontSize: '13px', color: '#374151' }}>
                                    <strong>Home Care: </strong>{entry.homeCarePlan}
                                  </div>
                                )}
                              </div>
                            )}

                            <div style={{ marginBottom: '12px', fontSize: '13px', color: '#111827' }}>
                              <strong>Client Notes: </strong>{entry.notes || entry.therapistNotes?.shared || 'No notes'}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ fontWeight: '600', color: '#1f2937' }}>Staff Comments</div>
                              {comments.length === 0 && (
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>No comments yet</div>
                              )}
                              {comments.map((c, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '8px',
                                    backgroundColor: '#fff',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                  }}
                                >
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                                    {c.authorName || 'Staff'} <span style={{ color: '#6b7280', fontWeight: '400' }}>({c.authorRole || 'staff'})</span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#374151', marginTop: '4px' }}>
                                    {c.comment}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                    {new Date(c.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              ))}

                              <textarea
                                value={commentInputs[entry.photoId] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [entry.photoId]: e.target.value }))}
                                placeholder="Add a staff comment..."
                                style={{
                                  width: '100%',
                                  minHeight: '60px',
                                  borderRadius: '8px',
                                  border: '1px solid #d1d5db',
                                  padding: '10px',
                                  fontSize: '13px'
                                }}
                              />
                              <button
                                onClick={() => handleAddComment(selectedTab, entry.photoId)}
                                style={{
                                  alignSelf: 'flex-end',
                                  padding: '8px 12px',
                                  backgroundColor: selectedTab === 'gym' ? '#8b5cf6' : '#ec4899',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                Post Comment
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
};

// Gym Progress View Component
const GymProgressView = ({ analytics }) => {
  if (!analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
        No gym progress data available
      </div>
    );
  }

  const { overallProgress, measurements, milestones, consistencyScore } = analytics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overall Progress */}
      {overallProgress && (
        <div style={{
          background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h4 style={{ fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Overall Progress</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#8b5cf6' }}>
                {overallProgress.score}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Progress Score</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#ec4899' }}>
                {overallProgress.grade}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Grade</div>
            </div>
          </div>
        </div>
      )}

      {/* Consistency */}
      {consistencyScore && (
        <div>
          <h4 style={{ fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Consistency Score</h4>
          <div style={{
            backgroundColor: '#e5e7eb',
            borderRadius: '9999px',
            height: '16px',
            marginBottom: '8px',
            overflow: 'hidden'
          }}>
            <div
              style={{
                backgroundColor: '#10b981',
                height: '100%',
                width: `${consistencyScore.score}%`,
                borderRadius: '9999px',
                transition: 'width 0.5s ease'
              }}
            ></div>
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>{consistencyScore.recommendation}</p>
        </div>
      )}

      {/* Measurements */}
      {measurements && Object.keys(measurements).length > 0 && (
        <div>
          <h4 style={{ fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Measurement Changes</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(measurements).map(([field, data]) => (
              <div key={field} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ fontWeight: '500', textTransform: 'capitalize', color: '#1f2937' }}>
                  {field.replace('_', ' ')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    {data.start} → {data.current}
                  </span>
                  {data.trend === 'increasing' ? (
                    <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
                  ) : data.trend === 'decreasing' ? (
                    <TrendingDown style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                  ) : null}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: data.change > 0 ? '#10b981' : '#ef4444'
                  }}>
                    {data.change > 0 ? '+' : ''}{data.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {milestones && milestones.length > 0 && (
        <div>
          <h4 style={{ fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>Milestones</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {milestones.map((milestone, index) => {
              const colors = {
                weight_loss: '#10b981',
                muscle_gain: '#3b82f6',
                body_fat_reduction: '#f59e0b',
                default: '#8b5cf6'
              };
              const color = colors[milestone.type] || colors.default;

              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    padding: '8px',
                    backgroundColor: `${color}20`,
                    borderRadius: '50%'
                  }}>
                    <Award style={{ width: '20px', height: '20px', color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>{milestone.description}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      {new Date(milestone.date).toLocaleDateString()}
                    </div>
                  </div>
                  {milestone.achievement === 'major' && (
                    <Award style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Spa Progress View Component
const SpaProgressView = ({ analytics }) => {
  if (!analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
        No spa progress data available
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {Object.entries(analytics).map(([treatmentType, data]) => (
        <div key={treatmentType} style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h4 style={{ fontWeight: '600', marginBottom: '12px', textTransform: 'capitalize', color: '#1f2937' }}>
            {treatmentType.replace('_', ' ')} Treatment
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Sessions</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                {data.totalSessions}
              </div>
            </div>
            {data.overallSatisfaction && (
              <div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Satisfaction</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {data.overallSatisfaction.score}/100
                </div>
              </div>
            )}
          </div>

          {data.improvements?.topImprovements && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#4b5563', marginBottom: '8px' }}>
                Top Improvements:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.improvements.topImprovements.map((imp, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: '#4b5563' }}>{imp.improvement}</span>
                    <span style={{ fontWeight: '700', color: '#10b981' }}>{imp.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Photo Card Component
const PhotoCard = ({ photo, type, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const photoUrl = type === 'gym' ? photo.photoUrl : (photo.beforePhoto || photo.afterPhoto);

  return (
    <div
      style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <img
        src={photoUrl}
        alt="Progress"
        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
      />
      {showActions && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <button
            onClick={() => window.open(photoUrl, '_blank')}
            style={{
              padding: '10px',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="View"
          >
            <Eye style={{ width: '20px', height: '20px', color: '#4b5563' }} />
          </button>
          <button
            onClick={() => onDelete(type, photo.photoId)}
            style={{
              padding: '10px',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Delete"
          >
            <Trash2 style={{ width: '20px', height: '20px', color: 'white' }} />
          </button>
        </div>
      )}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        fontSize: '11px',
        padding: '4px 8px',
        borderRadius: '4px'
      }}>
        {new Date(photo.dateTaken).toLocaleDateString()}
      </div>
    </div>
  );
};

export default ProgressTracking;

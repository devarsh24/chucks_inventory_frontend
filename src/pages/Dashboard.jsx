import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { BarChart3, Package, BookOpen, AlertTriangle, CheckCircle, Calendar, Trash2 } from 'lucide-react';

export default function Dashboard({ sessions, rawItems, recipes, onDeleteSession }) {
  // Compute basic stats
  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'completed');
  }, [sessions]);

  const stats = useMemo(() => {
    const latestSession = completedSessions[0];
    let totalShortage = 0;
    
    if (latestSession) {
      latestSession.variance.forEach(v => {
        if (v.varianceValue < 0) {
          totalShortage += Math.abs(v.varianceValue);
        }
      });
    }

    return {
      sessionsCount: completedSessions.length,
      itemsCount: rawItems.length,
      recipesCount: recipes.length,
      latestShortage: totalShortage
    };
  }, [completedSessions, rawItems, recipes]);

  // Format chart data for the latest session
  const latestSessionData = useMemo(() => {
    const latest = completedSessions[0];
    if (!latest || !latest.variance) return [];
    
    return latest.variance.map(v => ({
      name: v.rawItemId?.name || 'Unknown',
      variance: v.varianceValue,
      expected: v.expectedFinal,
      actual: v.actualFinal
    }));
  }, [completedSessions]);

  // Aggregate historical variance trend data
  const historicalTrendData = useMemo(() => {
    // Take up to 10 latest completed sessions, reverse to show chronological order
    const list = [...completedSessions].slice(0, 10).reverse();
    return list.map(session => {
      const dataPoint = {
        date: new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
      // For each raw item, add its variance to the data point
      session.variance.forEach(v => {
        if (v.rawItemId) {
          dataPoint[v.rawItemId.name] = v.varianceValue;
        }
      });
      return dataPoint;
    });
  }, [completedSessions]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Inventory summaries, spoilage analytics, and session history</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-card-container">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-label">Completed Days</div>
            <div className="stat-value">{stats.sessionsCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-label">Ingredients Tracked</div>
            <div className="stat-value">{stats.itemsCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-label">Portion Recipes</div>
            <div className="stat-value">{stats.recipesCount}</div>
          </div>
        </div>

        <div className="stat-card">
          {stats.latestShortage > 0 ? (
            <div className="stat-card-inner" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="stat-label">Latest Variance (Loss)</div>
                <div className="stat-value text-danger" style={{ color: 'var(--danger)' }}>-{stats.latestShortage.toFixed(1)}</div>
              </div>
            </div>
          ) : (
            <div className="stat-card-inner" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <div className="stat-label">System Health</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>Perfect</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Charts */}
      {completedSessions.length > 0 ? (
        <div className="dashboard-grid">
          {/* Latest Session Variance Chart */}
          <div className="card">
            <h2 className="form-label" style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} className="text-primary" /> Latest Session Variance Analysis
            </h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={latestSessionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#12141c', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="variance" fill="url(#colorVariance)" radius={[4, 4, 0, 0]}>
                    {latestSessionData.map((entry, index) => (
                      <defs key={`defs-${index}`}>
                        <linearGradient id="colorVariance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Trend Chart */}
          {rawItems.length > 0 && (
            <div className="card">
              <h2 className="form-label" style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={20} style={{ color: '#a855f7' }} /> Spoilage/Theft Trend (Last 10 Days)
              </h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={historicalTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#12141c', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    />
                    <Legend iconType="circle" />
                    {rawItems.slice(0, 4).map((item, index) => {
                      const colors = ['#f97316', '#a855f7', '#3b82f6', '#10b981'];
                      return (
                        <Line
                          key={item._id}
                          type="monotone"
                          dataKey={item.name}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', marginBottom: '2.5rem' }}>
          <AlertTriangle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>No Completed Sessions Yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
            To view variance analytics, start a daily inventory count, upload your sales data file, and submit your actual end-of-day counts.
          </p>
        </div>
      )}

      {/* History List */}
      <div className="card">
        <h2 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Inventory History</h2>
        
        {completedSessions.length > 0 ? (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sales CSV File</th>
                  <th>Ingredients Audited</th>
                  <th>Variance Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedSessions.map(session => {
                  const hasShortage = session.variance.some(v => v.varianceValue < 0);
                  const isPerfect = session.variance.every(v => v.varianceValue === 0);

                  return (
                    <tr key={session._id}>
                      <td style={{ fontWeight: 600 }}>
                        {new Date(session.date).toLocaleDateString(undefined, { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td style={{ color: '#fff', fontStyle: 'italic' }}>
                        {session.salesFile || 'Manual Entry'}
                      </td>
                      <td>
                        {session.variance.length} raw items
                      </td>
                      <td>
                        {isPerfect ? (
                          <span className="badge badge-success">No Variance</span>
                        ) : hasShortage ? (
                          <span className="badge badge-danger">Shortage / Loss</span>
                        ) : (
                          <span className="badge badge-warning">Overage</span>
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.8rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this historical inventory log?')) {
                              onDeleteSession(session._id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No session logs available.</p>
        )}
      </div>
    </div>
  );
}

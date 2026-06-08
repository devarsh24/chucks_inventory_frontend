import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { 
  BarChart3, Package, BookOpen, AlertTriangle, CheckCircle, Calendar, 
  Trash2, Eye, ArrowLeft, Search, ChevronLeft, ChevronRight, FileSpreadsheet 
} from 'lucide-react';

export default function Dashboard({ sessions, rawItems, recipes, onDeleteSession }) {
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailsSearchQuery, setDetailsSearchQuery] = useState('');
  const [detailsCurrentPage, setDetailsCurrentPage] = useState(1);
  const itemsPerPage = 25;

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

  if (selectedSession) {
    const filteredDetails = selectedSession.variance.filter(v => {
      const name = v.rawItemId?.name || 'Unknown';
      return name.toLowerCase().includes(detailsSearchQuery.toLowerCase());
    });

    const totalPagesDetails = Math.ceil(filteredDetails.length / itemsPerPage) || 1;
    const activePageDetails = Math.min(detailsCurrentPage, totalPagesDetails);
    const startIndexDetails = (activePageDetails - 1) * itemsPerPage;
    const paginatedDetails = filteredDetails.slice(startIndexDetails, startIndexDetails + itemsPerPage);

    // Compute stats
    let totalItems = selectedSession.variance.length;
    let shortageCount = 0;
    let overageCount = 0;
    let onTargetCount = 0;
    let totalLoss = 0;

    selectedSession.variance.forEach(v => {
      const val = v.varianceValue;
      if (val < -0.05) {
        shortageCount++;
        totalLoss += Math.abs(val);
      } else if (val > 0.05) {
        overageCount++;
      } else {
        onTargetCount++;
      }
    });

    const handleSearchChangeDetails = (e) => {
      setDetailsSearchQuery(e.target.value);
      setDetailsCurrentPage(1);
    };

    const handleExportCSV = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Ingredient,Unit,Initial Count,Used Count,Expected Remaining,Actual Count,Variance\n";
      selectedSession.variance.forEach(v => {
        const name = v.rawItemId?.name || 'Unknown';
        const unit = v.rawItemId?.unit || '';
        csvContent += `"${name.replace(/"/g, '""')}",${unit},${v.initial},${v.usage},${v.expectedFinal},${v.actualFinal},${v.varianceValue}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `inventory_variance_${selectedSession.date.split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setSelectedSession(null)} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}
            >
              <ArrowLeft size={16} /> Back to History
            </button>
            <h1 className="page-title">
              Audit Results - {new Date(selectedSession.date).toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Sales CSV File: <span style={{ color: '#fff', fontStyle: 'italic' }}>{selectedSession.salesFile || 'Manual Entry'}</span>
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderColor: 'var(--primary-glow)' }}
          >
            <FileSpreadsheet size={18} style={{ color: 'var(--primary)' }} /> Export Results to CSV
          </button>
        </div>

        {/* Audit Stats Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{totalItems}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'uppercase' }}>Audited Items</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: shortageCount > 0 ? 'var(--danger-glow)' : 'rgba(255, 255, 255, 0.02)', border: shortageCount > 0 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(255, 255, 255, 0.04)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: shortageCount > 0 ? 'var(--danger)' : '#fff' }}>{shortageCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'uppercase' }}>Loss Count</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: overageCount > 0 ? 'var(--success-glow)' : 'rgba(255, 255, 255, 0.02)', border: overageCount > 0 ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(255, 255, 255, 0.04)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: overageCount > 0 ? 'var(--success)' : '#fff' }}>{overageCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'uppercase' }}>Overage Count</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{onTargetCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'uppercase' }}>On Target</div>
          </div>
          <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: totalLoss > 0 ? 'var(--danger)' : '#fff' }}>-{totalLoss.toFixed(1)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textTransform: 'uppercase' }}>Total Net Loss</div>
          </div>
        </div>

        <div className="card">
          <h2 className="form-label" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clipboard size={20} style={{ color: 'var(--primary)' }} /> Variance Report Details
          </h2>

          {/* Search Box */}
          <div className="search-container" style={{ position: 'relative', marginBottom: '1.25rem' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} size={18} />
            <input
              type="text"
              placeholder="Search audited ingredients..."
              className="input-field"
              value={detailsSearchQuery}
              onChange={handleSearchChangeDetails}
              style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div className="table-container" style={{ marginBottom: '1rem' }}>
            <table className="custom-table responsive-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'right' }}>Initial Count</th>
                  <th style={{ textAlign: 'right' }}>Used Count (Expected Usage)</th>
                  <th style={{ textAlign: 'right' }}>Expected Remaining</th>
                  <th style={{ textAlign: 'right' }}>Actual Count</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Variance</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDetails.map(v => {
                  const name = v.rawItemId?.name || 'Unknown';
                  const unit = v.rawItemId?.unit || '';
                  const diff = v.varianceValue;

                  return (
                    <tr key={v._id}>
                      <td data-label="Ingredient" style={{ fontWeight: 600 }}>{name}</td>
                      <td data-label="Unit">
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {unit}
                        </span>
                      </td>
                      <td data-label="Initial Count" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{v.initial.toFixed(1)}</td>
                      <td data-label="Used Count" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{v.usage.toFixed(1)}</td>
                      <td data-label="Exp. Remaining" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{v.expectedFinal.toFixed(1)}</td>
                      <td data-label="Actual Count" style={{ textAlign: 'right', fontWeight: 600 }}>{v.actualFinal.toFixed(1)}</td>
                      <td data-label="Variance" style={{ textAlign: 'center' }}>
                        {diff > 0.05 ? (
                          <span className="badge" style={{ background: 'var(--success-glow)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success)', fontWeight: 600 }}>
                            +{diff.toFixed(1)}
                          </span>
                        ) : diff < -0.05 ? (
                          <span className="badge" style={{ background: 'var(--danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontWeight: 600 }}>
                            {diff.toFixed(1)}
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                            0.0
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {paginatedDetails.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                      No matching audited ingredients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls for details */}
          {totalPagesDetails > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.5rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Showing {startIndexDetails + 1} - {Math.min(startIndexDetails + itemsPerPage, filteredDetails.length)} of {filteredDetails.length} ingredients
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                  disabled={activePageDetails === 1}
                  onClick={() => setDetailsCurrentPage(activePageDetails - 1)}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, padding: '0 0.5rem' }}>
                  Page {activePageDetails} of {totalPagesDetails}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                  disabled={activePageDetails === totalPagesDetails}
                  onClick={() => setDetailsCurrentPage(activePageDetails + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            type="button"
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                            onClick={() => {
                              setSelectedSession(session);
                              setDetailsSearchQuery('');
                              setDetailsCurrentPage(1);
                            }}
                          >
                            <Eye size={15} style={{ color: 'var(--primary)' }} /> View Details
                          </button>
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
                        </div>
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

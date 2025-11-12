// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import api from '../api';
import { getUser } from '../utils/auth';
import '../Style/dashboard.css';

function KPI({ title, value, hint }) {
    return (
        <div className="kpi-card">
            <div className="kpi-value">{value ?? '-'}</div>
            <div className="kpi-title">{title}</div>
            {hint && <div className="kpi-hint">{hint}</div>}
        </div>
    );
}

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);
    const me = getUser(); // logged in user info

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            const res = await api.dashboardSummary();
            setData(res);
            setLoading(false);
        } catch (e) {
            setErr(e.message);
            setLoading(false);
        }
    }

    if (loading) return <div className="card">Loading dashboard...</div>;
    if (err) return <div className="error">{err}</div>;
    if (!data) return <div className="card">No dashboard data</div>;

    // 🧠 Check the role of the logged-in user
    const role = me?.role || 'user';

    return (
        <div className='dashboard-container'>
            <h1>Dashboard</h1>
            <p style={{ color: '#666' }}>
                Welcome, <strong>{me?.name || 'User'}</strong> 👋 ({role.toUpperCase()})
            </p>
            <p className="muted">
                Role-based dashboard automatically adjusts view and data according to user privileges.
            </p>


            {role === 'admin' || role === 'manager' ? (
                // ==============================
                // ADMIN / MANAGER DASHBOARD VIEW
                // ==============================
                <>
                    <div className="kpi-row">
                        <KPI title="Users" value={data.counts.users} hint="Total registered users" />
                        <KPI title="Floors" value={data.counts.floors} hint="Total floors" />
                        <KPI title="Spaces" value={data.counts.spaces} hint="Total spaces" />
                        <KPI title="Currently Inside" value={data.currentOpen.length} hint="People inside now" />
                    </div>

                    <div className="grid-3">
                        <div className="card">
                            <h3>Currently Inside</h3>
                            {data.currentOpen.length === 0 ? (
                                <div className="muted">No one is inside currently</div>
                            ) : (
                                <ul className="list-compact">
                                    {data.currentOpen.slice(0, 10).map(c => (
                                        <li key={c._id}>
                                            <strong>{c.user?.name || c.user || '-'}</strong> •{' '}
                                            {c.space?.spaceName || c.space?.floor?.floornumber || '-'}{' '}
                                            <span className="muted">
                                                ({c.lastSeen ? new Date(c.lastSeen).toLocaleTimeString() : '—'})
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="card">
                            <h3>Busiest Spaces (7d)</h3>
                            {data.busiest.length === 0 ? (
                                <div className="muted">No data</div>
                            ) : (
                                <ul className="list-compact">
                                    {data.busiest.map(b => (
                                        <li key={b.spaceId}>
                                            <strong>{b.spaceName}</strong> — {b.visits} visits
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="card">
                            <h3>Occupancy by Floor</h3>
                            {data.occPerFloor.length === 0 ? (
                                <div className="muted">No data</div>
                            ) : (
                                <ul className="list-compact">
                                    {data.occPerFloor.map(f => (
                                        <li key={f.floorId}>
                                            <strong>{f.floornumber}</strong> — {f.count} people inside
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3>Recent Access Logs</h3>
                        {data.recentLogs.length === 0 ? (
                            <div className="muted">No recent logs</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Space</th>
                                        <th>Entry</th>
                                        <th>Exit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentLogs.map(l => (
                                        <tr key={l._id}>
                                            <td>{l.user?.name || '-'}</td>
                                            <td>{l.space?.spaceName || '-'}</td>
                                            <td>{new Date(l.entryTime).toLocaleString()}</td>
                                            <td>{l.exitTime ? new Date(l.exitTime).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            ) : (
                // ==============================
                // USER DASHBOARD VIEW
                // ==============================
                <>
                    <div className="kpi-row">
                        <KPI title="Spaces You Can Access" value={data.allowedSpaces} />
                        <KPI title="Entries Today" value={data.todaysEntries} />
                        <KPI
                            title="Currently Inside"
                            value={data.currentlyInside || 'Outside'}
                            hint={data.currentlyInside ? 'Active session' : 'Not in any space'}
                        />
                        <KPI
                            title="Last Activity"
                            value={
                                data.lastActivity
                                    ? new Date(data.lastActivity).toLocaleTimeString()
                                    : '—'
                            }
                        />
                    </div>

                    <div className="card">
                        <h3>My Recent Access Logs</h3>
                        {data.recentLogs && data.recentLogs.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Space</th>
                                        <th>Entry</th>
                                        <th>Exit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentLogs.map(log => (
                                        <tr key={log._id}>
                                            <td>{log.space?.spaceName || '-'}</td>
                                            <td>{new Date(log.entryTime).toLocaleString()}</td>
                                            <td>
                                                {log.exitTime
                                                    ? new Date(log.exitTime).toLocaleString()
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="muted">No recent activity yet.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

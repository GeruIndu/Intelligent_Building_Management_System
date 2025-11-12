import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { getUser } from '../utils/auth';
import '../Style/AccessLogsPage.css'; // Import the new CSS file

export default function AccessLogsPage() {
    const [users, setUsers] = useState([]);
    const [spaces, setSpaces] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedSpace, setSelectedSpace] = useState('');
    const [err, setErr] = useState('');
    const currentLogRef = useRef(null); // store current open log object
    const heartbeatTimerRef = useRef(null);
    const HEARTBEAT_INTERVAL_MS = 20 * 1000; // 20s

    useEffect(() => {
        load();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            stopHeartbeat();
        };
    }, []);

    const load = async () => {
        try {
            const [u, s, l] = await Promise.all([api.getUsers(), api.getSpaces(), api.getLogs()]);
            setUsers(u); setSpaces(s); setLogs(l);
        } catch (e) { setErr(e.message); }
    };

    // create entry
    const createEntry = async (e) => {
        e.preventDefault();
        setErr('');
        if (!selectedUser || !selectedSpace) return setErr('Please select a user and a space.');
        try {
            const saved = await api.createLog({ user: selectedUser, space: selectedSpace });
            // saved is populated log
            currentLogRef.current = saved;
            startHeartbeat(); // start sending heartbeats for this log
            await load();
        } catch (e) { setErr(e.message); }
    };

    // Mark exit via API (normal fetch)
    const markExit = async (logId) => {
        try {
            await api.updateLog(logId, { exitTime: new Date() });
            if (currentLogRef.current && currentLogRef.current._id === logId) {
                currentLogRef.current = null;
                stopHeartbeat();
            }
            await load();
        } catch (e) { setErr(e.message); }
    };

    // Heartbeat: call API endpoint to update lastSeen
    const sendHeartbeat = async () => {
        try {
            const log = currentLogRef.current;
            if (!log) return;
            // prefer using fetch directly to avoid global api wrapper differences
            await api.heartbeat({ user: log.user._id || log.user, space: log.space._id || log.space, timestamp: new Date() });
        } catch (e) {
            console.warn('Heartbeat error:', e.message);
        }
    };

    const startHeartbeat = () => {
        stopHeartbeat();
        // send immediately then schedule
        sendHeartbeat();
        heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    };
    const stopHeartbeat = () => {
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
    };

    // beforeunload: sendBeacon to close log for best-effort (synchronous-ish)
    const handleBeforeUnload = (ev) => {
        const log = currentLogRef.current;
        if (!log) return;
        try {
            const payload = JSON.stringify({
                user: log.user._id || log.user,
                space: log.space._id || log.space
            });
            // ✅ Send as application/json Blob
            // Ensure REACT_APP_API_BASE is correctly configured in your environment
            const url =
                (process.env.REACT_APP_API_BASE || 'http://localhost:3000/api') +
                '/access-logs/close';
            navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        } catch (e) {
            console.error('sendBeacon error', e);
        }
    };

    // Polling useEffect (to refresh table data periodically)
    useEffect(() => {
        const POLL_MS = 15 * 1000; // 15 seconds
        const interval = setInterval(() => {
            load();
        }, POLL_MS);

        return () => clearInterval(interval);
    }, []);


    return (
        // Use .logs-container for page wrapper
        <div className="logs-container">
            <h2>🔒 Access Logs Monitoring</h2>

            {/* Use .alert.error class */}
            {err && <div className="alert error">{err}</div>}

            {/* --- Log Creation Form/Filter --- */}
            <div className="card">
                <form className="form-inline" onSubmit={createEntry}>
                    <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                        <option value="">Select User</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                    <select value={selectedSpace} onChange={e => setSelectedSpace(e.target.value)} required>
                        <option value="">Select Space</option>
                        {spaces.map(s => <option key={s._id} value={s._id}>{s.spaceName} ({s.floor?.floornumber || 'N/A'})</option>)}
                    </select>
                    {/* Use .btn class */}
                    <button className="btn primary" type="submit">Start Entry</button>
                </form>
            </div>

            {/* --- Logs Table --- */}
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Space</th>
                            <th>Entry</th>
                            <th>Last Seen</th>
                            <th>Exit</th>
                            <th className="action-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr><td colSpan="6" className="no-data">No access logs found.</td></tr>
                        ) : (
                            logs.map(l => (
                                <tr
                                    key={l._id}
                                    // Highlight active logs with .log-active class
                                    className={!l.exitTime ? 'log-active' : 'log-closed'}
                                >
                                    <td>{l.user?.name || 'N/A'}</td>
                                    <td>{l.space?.spaceName || 'N/A'}</td>
                                    <td>{new Date(l.entryTime).toLocaleString()}</td>
                                    <td>{l.lastSeen ? new Date(l.lastSeen).toLocaleString() : '-'}</td>
                                    <td>{l.exitTime ? new Date(l.exitTime).toLocaleString() : '-'}</td>
                                    <td>
                                        {!l.exitTime && (
                                            <button
                                                className="btn small"
                                                onClick={() => markExit(l._id)}
                                            >
                                                Mark Exit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
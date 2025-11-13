import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { getUser } from '../utils/auth';
import '../Style/AccessLogsPage.css';

export default function AccessLogsPage() {
    const me = getUser(); // { id, name, role, ... } - adjust to your getUser shape
    const isAdmin = me?.role === 'admin' || me?.role === 'manager';

    const [users, setUsers] = useState([]);
    const [spaces, setSpaces] = useState([]);
    const [logs, setLogs] = useState([]);

    // For admin: choose user to create entry for
    const [selectedUser, setSelectedUser] = useState(isAdmin ? '' : (me?._id || me?.id || ''));
    const [selectedSpace, setSelectedSpace] = useState('');
    const [err, setErr] = useState('');

    // current open log for this actor (if any)
    const currentLogRef = useRef(null);
    const heartbeatTimerRef = useRef(null);
    const HEARTBEAT_INTERVAL_MS = 20 * 1000; // 20s

    useEffect(() => {
        load();
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            stopHeartbeat();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load users (admin only), spaces (server returns allowed spaces for normal user),
    // logs (admin sees all, user sees own)
    const load = async () => {
        try {
            // fetch in parallel
            const promises = [api.getSpaces(), api.getLogs()];
            if (isAdmin) promises.unshift(api.getUsers()); // users first for admin
            const results = await Promise.all(promises);

            if (isAdmin) {
                // results: [users, spaces, logs]
                setUsers(results[0] || []);
                setSpaces(results[1] || []);
                setLogs(results[2] || []);
            } else {
                // results: [spaces, logs]
                setSpaces(results[0] || []);
                setLogs(results[1] || []);
            }

            // If a normal user has an open log (server returned in logs), set currentLogRef
            if (!isAdmin) {
                const open = (results[1] || []).find(l => !l.exitTime);
                if (open) {
                    currentLogRef.current = open;
                    startHeartbeat();
                } else {
                    currentLogRef.current = null;
                    stopHeartbeat();
                }
            }
        } catch (e) {
            console.error('Load error', e);
            setErr(e.message || 'Failed to load data');
        }
    };

    // create entry
    const createEntry = async (e) => {
        e?.preventDefault();
        setErr('');
        // validation
        if (!selectedSpace) return setErr('Please select a space.');
        // If admin, they must also choose a user
        if (isAdmin && !selectedUser) return setErr('Please select a user (admin).');

        try {
            let saved;
            if (isAdmin) {
                // admin can create on behalf of any user
                saved = await api.createLog({ user: selectedUser, space: selectedSpace });
            } else {
                // normal user: server will use req.user (do not send user id from client)
                saved = await api.createLog({ space: selectedSpace });
            }

            // saved is populated log; if the created log belongs to the current logged-in user, track it
            const createdUserId = saved.user?._id || saved.user;
            const myId = me?._id || me?.id || me;
            if (String(createdUserId) === String(myId)) {
                currentLogRef.current = saved;
                startHeartbeat();
            }

            await load();
        } catch (e) {
            console.error('Create entry error', e);
            setErr(e?.response?.data?.error || e.message || 'Failed to create entry');
        }
    };

    // Mark exit (preferred: call server close endpoint by space, server will find user's open log)
    // For admin you may want to allow target user param; here we close by passing space and optionally user (admin)
    const markExit = async (logOrSpace, maybeSpace) => {
        setErr('');
        try {
            // If called with (logId) from earlier code, translate to space
            // We prefer closing by space to ensure permission checks and atomic behavior on server
            let spaceId, userForAdmin;
            if (typeof logOrSpace === 'string' && maybeSpace === undefined) {
                // Single arg could be logId (old usage) - find corresponding log to get space
                const log = logs.find(x => x._id === logOrSpace);
                spaceId = log?.space?._id || log?.space;
                userForAdmin = log?.user?._id || log?.user;
            } else if (logOrSpace && logOrSpace.space) {
                // passed a log object
                spaceId = logOrSpace.space._id || logOrSpace.space;
                userForAdmin = logOrSpace.user?._id || logOrSpace.user;
            } else {
                // passed spaceId directly
                spaceId = logOrSpace;
            }

            if (!spaceId) return setErr('Space id not available for closing.');

            const payload = { space: spaceId };
            // If admin and closing for someone else, include user in payload
            if (isAdmin && userForAdmin) payload.user = userForAdmin;

            await api.closeLog(payload);


            // if currentLogRef matches this space, clear heartbeat
            const cur = currentLogRef.current;
            if (cur && (cur.space?._id || cur.space) === spaceId) {
                currentLogRef.current = null;
                stopHeartbeat();
            }

            await load();
        } catch (e) {
            console.error('Mark exit error', e);
            setErr(e?.response?.data?.error || e.message || 'Failed to mark exit');
        }
    };

    // Heartbeat: use access-logs/heartbeat endpoint
    const sendHeartbeat = async () => {
        try {
            const log = currentLogRef.current;
            if (!log) return;
            const userId = log.user?._id || log.user;
            const spaceId = log.space?._id || log.space;
            // Normal user: server will validate req.user; for admin it's okay to send user
            const payload = isAdmin ? { user: userId, space: spaceId, timestamp: new Date() } : { space: spaceId, timestamp: new Date() };
            // use api.heartbeat or raw post
            await api.heartbeat(payload);
        } catch (e) {
            console.warn('Heartbeat error:', e);
        }
    };

    const startHeartbeat = () => {
        stopHeartbeat();
        sendHeartbeat(); // immediate
        heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    };

    const stopHeartbeat = () => {
        if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
            heartbeatTimerRef.current = null;
        }
    };

    // beforeunload: try to close open log using sendBeacon (best-effort)
    const handleBeforeUnload = (ev) => {
        const log = currentLogRef.current;
        if (!log) return;
        try {
            const userId = log.user?._id || log.user;
            const spaceId = log.space?._id || log.space;
            const payloadObj = isAdmin ? { user: userId, space: spaceId } : { space: spaceId };
            const payload = JSON.stringify(payloadObj);
            const url = (process.env.REACT_APP_API_BASE || 'http://localhost:5000') + '/api/access-logs/close';
            // Note: sendBeacon expects a full url; ensure correct prefix + '/api/...'
            navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
        } catch (e) {
            console.error('sendBeacon error', e);
        }
    };

    // Polling: refresh table data periodically
    useEffect(() => {
        const POLL_MS = 15 * 1000; // 15 seconds
        const interval = setInterval(() => {
            load();
        }, POLL_MS);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Render
    return (
        <div className="logs-container">
            <h2>🔒 Access Logs Monitoring</h2>

            {err && <div className="alert error">{err}</div>}

            <div className="card">
                <form className="form-inline" onSubmit={createEntry}>
                    {isAdmin ? (
                        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                            <option value="">Select User</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    ) : (
                        // show a read-only disabled field for normal users (so they know who they are acting as)
                        <input type="text" value={me?.name || 'You'} disabled />
                    )}

                    <select value={selectedSpace} onChange={e => setSelectedSpace(e.target.value)} required>
                        <option value="">Select Space</option>
                        {spaces.map(s => (
                            <option key={s._id} value={s._1d || s._id}>{s.spaceName} ({s.floor?.floornumber || 'N/A'})</option>
                        ))}
                    </select>

                    <button className="btn primary" type="submit">Start Entry</button>
                </form>
            </div>

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
                                                onClick={() => markExit(l)}
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

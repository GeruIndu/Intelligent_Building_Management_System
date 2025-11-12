import React, { useEffect, useState } from 'react';
import api from '../api';
import { getUser } from '../utils/auth';
import '../Style/AdminPermissionsPage.css'; // Don't forget to import your CSS file

export default function AdminPermissionsPage() {
    const [users, setUsers] = useState([]);
    const [spaces, setSpaces] = useState([]);
    const [perms, setPerms] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedSpace, setSelectedSpace] = useState('');
    const [canEnter, setCanEnter] = useState(true);
    const [canManage, setCanManage] = useState(false);
    const [expiresAt, setExpiresAt] = useState('');
    const [err, setErr] = useState('');
    const me = getUser();

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [u, spacesData, permsData] = await Promise.all([
                api.getUsers(),
                api.getSpaces(),
                api.listPermissions(),
            ]);
            setUsers(u);
            setSpaces(spacesData);
            // Sort permissions to show active ones first
            const sortedPerms = permsData.sort((a, b) => (a.revoked === b.revoked) ? 0 : a.revoked ? 1 : -1);
            setPerms(sortedPerms);
        } catch (e) { setErr(e.message); }
    };

    const grant = async (e) => {
        e.preventDefault();
        setErr('');
        if (!selectedUser || !selectedSpace) return setErr('Choose user and space');
        try {
            const body = { user: selectedUser, space: selectedSpace, canEnter, canManage, expiresAt: expiresAt || null };
            // Using createPermission for initial grant/update
            await api.createPermission(body);
            await loadAll();
            // Reset form fields
            setSelectedUser(''); setSelectedSpace(''); setCanEnter(true); setCanManage(false); setExpiresAt('');
        } catch (e) { setErr(e.message); }
    };

    const revoke = async (id) => {
        if (!window.confirm('Revoke this permission?')) return;
        try {
            // Note: The API call assumes updatePermission handles the 'revoked' flag
            await api.updatePermission(id, { revoked: true });
            await loadAll();
        } catch (e) { setErr(e.message); }
    };

    // Helper to determine status class
    const getStatusClass = (isExpired, isRevoked, isPermission) => {
        if (isRevoked) return 'status-revoked';
        if (isExpired) return 'status-revoked'; // Treat expired as revoked visually
        if (isPermission) return 'status-yes';
        return 'status-no';
    };

    // Check if permission is expired
    const isExpired = (expiresAt) => {
        return expiresAt && new Date(expiresAt) < new Date();
    };

    return (
        // Use .permissions-container for page wrapper
        <div className="permissions-container">
            <h2>🔑 Permissions Management</h2>

            {/* Use .alert.error class */}
            {err && <div className="alert error">{err}</div>}

            {/* --- Permission Grant Form --- */}
            <div className="card">
                <h3>Grant New Permission / Update Existing</h3>
                <form className="form-inline" onSubmit={grant}>
                    <select
                        value={selectedUser}
                        onChange={e => setSelectedUser(e.target.value)}
                        required
                    >
                        <option value="">Select User</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}
                    </select>

                    <select
                        value={selectedSpace}
                        onChange={e => setSelectedSpace(e.target.value)}
                        required
                    >
                        <option value="">Select Space</option>
                        {spaces.map(s => <option key={s._id} value={s._id}>{s.spaceName || s.name || s.floornumber}</option>)}
                    </select>

                    {/* Checkbox Labels */}
                    <label>
                        <input type="checkbox" checked={canEnter} onChange={e => setCanEnter(e.target.checked)} /> Can Enter
                    </label>

                    <label>
                        <input type="checkbox" checked={canManage} onChange={e => setCanManage(e.target.checked)} /> Can Manage
                    </label>

                    <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        placeholder="Expires At (Optional)"
                    />

                    <button className="btn primary" type="submit">Grant / Update</button>
                </form>
            </div>

            {/* --- Existing Permissions Table --- */}
            <div className="card table-wrapper">
                <h3>Existing Permissions</h3>
                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Space</th>
                            <th>Enter</th>
                            <th>Manage</th>
                            <th>Expires</th>
                            <th>Status</th>
                            <th className="action-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {perms.length === 0 ? (
                            <tr><td colSpan="7" className="no-data">No permissions found.</td></tr>
                        ) : (
                            perms.map(p => {
                                const isPermExpired = isExpired(p.expiresAt);
                                const isPermActive = !p.revoked && !isPermExpired;
                                return (
                                    <tr
                                        key={p._id}
                                        className={!isPermActive ? 'revoked-row' : ''}
                                    >
                                        <td>{p.user?.name} ({p.user?.email})</td>
                                        <td>{p.space?.spaceName || p.space?.floornumber || p.space?.space}</td>

                                        <td className={getStatusClass(false, false, p.canEnter)}>{p.canEnter ? 'Yes' : 'No'}</td>
                                        <td className={getStatusClass(false, false, p.canManage)}>{p.canManage ? 'Yes' : 'No'}</td>

                                        <td>
                                            {p.expiresAt ? new Date(p.expiresAt).toLocaleString() : '-'}
                                        </td>
                                        <td className={`status-cell ${isPermActive ? 'status-active' : 'status-revoked'}`}>
                                            {isPermActive ? 'Active' : (p.revoked ? 'Revoked' : 'Expired')}
                                        </td>
                                        <td>
                                            {!p.revoked && !isPermExpired && (
                                                <button className="btn small danger" onClick={() => revoke(p._id)}>
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
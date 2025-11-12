import React, { useEffect, useState } from 'react';
import api from '../api';
import '../Style/UsersPage.css'; // Don't forget to import your CSS file

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [err, setErr] = useState('');

    useEffect(() => { load(); }, []);
    const load = async () => {
        try { const data = await api.getUsers(); setUsers(data); } catch (e) { setErr(e.message); }
    };

    // Helper function to get role-specific class name
    const getRoleClass = (role) => {
        if (!role) return '';
        return `role-${role.toLowerCase()}`;
    };

    return (
        // Use .users-container for page wrapper
        <div className="users-container">
            <h2>👥 Users Management</h2>

            {/* Use .alert.error class */}
            {err && <div className="alert error">{err}</div>}

            {/* --- Users Table --- */}
            {/* Wrap table in .table-wrapper for card styling and responsiveness */}
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan="3" className="no-data">No users found.</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u._id}>
                                    <td>**{u.name}**</td>
                                    <td>{u.email}</td>
                                    {/* Use conditional class to style the role */}
                                    <td className={`role-cell ${getRoleClass(u.role)}`}>
                                        {u.role.toUpperCase()}
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
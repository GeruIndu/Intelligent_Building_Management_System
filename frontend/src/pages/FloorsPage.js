import React, { useEffect, useState } from 'react';
import api from '../api';
// Import the new CSS file
import '../Style/FloorsPage.css';
import { getUser } from '../utils/auth';

export default function FloorsPage() {
    const [floors, setFloors] = useState([]);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [err, setErr] = useState('');

    const user = getUser();

    useEffect(() => { load(); }, []);
    const load = async () => {
        try { const data = await api.getFloors(); setFloors(data); } catch (e) { setErr(e.message); }
    };

    const create = async (e) => {
        e.preventDefault();
        setErr('');
        try {
            // Note: The API call assumes 'floornumber' and 'description' keys.
            await api.createFloor({ floornumber: name, description: desc });
            setName(''); setDesc('');
            load();
        } catch (err) { setErr(err.message); }
    };

    const remove = async (id) => {
        if (!window.confirm('Are you sure you want to delete this floor?')) return;
        await api.deleteFloor(id);
        load();
    };

    return (
        // .floors-container for overall page padding and centering
        <div className="floors-container">
            <h2>🏢 Floors Management</h2>

            {/* .alert.error class for styling error messages */}
            {err && <div className="alert error">{err}</div>}

            {/* --- Creation Form --- */}
            {/* .card for a boxed/shadowed section */}
            {user.role !== 'user' &&
                <>
                    <h3>Create New Floor</h3>
                    <div className="card">
                        {/* .form-inline for horizontal layout on desktop */}
                        <form className="form-inline" onSubmit={create}>
                            <input
                                type="text"
                                placeholder="Floor number (e.g., 1, B1)"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Description (e.g., Main Office Floor)"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                            />
                            {/* .btn.primary class for the submit button */}
                            <button className="btn primary" type="submit">Create Floor</button>
                        </form>
                    </div>
                </>}

            {/* --- Floor List Table --- */}
            <h3>Existing Floors</h3>
            {/* .card and .table-wrapper for table container and scrollability */}
            <div className="card table-wrapper">
                {/* .table class for the main table style */}
                <table className="table">
                    <thead>
                        <tr>
                            <th>Floor Number</th>
                            <th>Description</th>
                            {/* .action-column for right alignment */}
                            <th className="action-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {floors.length === 0 ? (
                            <tr><td colSpan="2" className="no-data">No floors found.</td></tr>
                        ) : (
                            floors.map(f => (
                                <tr key={f._id}>
                                    <td>{f.floornumber}</td>
                                    <td>{f.description}</td>
                                    <td>
                                        {/* .btn.small.danger classes for the delete button */}
                                        {user.role === 'user' ? 'No Action' : <button
                                            className="btn small danger"
                                            onClick={() => remove(f._id)}
                                        >
                                            Delete
                                        </button>}
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
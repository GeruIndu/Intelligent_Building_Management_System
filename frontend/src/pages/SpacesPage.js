import React, { useEffect, useState } from 'react';
import api from '../api';
import '../Style/SpacesPage.css'; // Don't forget to import your CSS file
import { getUser } from '../utils/auth';

export default function SpacesPage() {
    const [spaces, setSpaces] = useState([]);
    const [floors, setFloors] = useState([]);
    const [spaceName, setSpaceName] = useState('');
    const [spaceType, setSpaceType] = useState('');
    const [floor, setFloor] = useState('');
    const [err, setErr] = useState('');

    const user = getUser();

    useEffect(() => { load(); }, []);
    const load = async () => {
        try {
            // Fetch floors and spaces concurrently
            const [s, f] = await Promise.all([api.getSpaces(), api.getFloors()]);
            setSpaces(s); setFloors(f);
            // Ensure a default floor is selected if available
            if (f.length > 0 && !floor) setFloor(f[0]._id);
        } catch (e) { setErr(e.message); }
    };

    const create = async (e) => {
        // Use e.preventDefault() here since we are now wrapping the inputs in a <form>
        e.preventDefault();
        setErr('');

        if (!spaceName || !spaceType || !floor) {
            setErr('Please fill out all fields.');
            return;
        }

        try {
            await api.createSpace({ spaceName, spaceType, floor });
            setSpaceName(''); setSpaceType(''); setFloor(floors.length > 0 ? floors[0]._id : ''); // Reset to default floor
            load();
        } catch (error) { setErr(error.message); }
    };

    const remove = async (id) => {
        if (!window.confirm('Are you sure you want to delete this space?')) return;
        await api.deleteSpace(id);
        load();
    };

    return (
        // Use .spaces-container for page wrapper
        <div className="spaces-container">
            <h2>🏠 Space Management</h2>

            {/* Use .alert.error class */}
            {err && <div className="alert error">{err}</div>}

            {/* --- Creation Form --- */}
            {user.role !== 'user' && <div className="card">
                {/* Wrap inputs in a <form> and use onSubmit */}
                <form className="form-inline" onSubmit={create}>
                    <input
                        type="text"
                        placeholder="Space Name (e.g., Room 101)"
                        value={spaceName}
                        onChange={e => setSpaceName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Space Type (e.g., Office, Meeting Room)"
                        value={spaceType}
                        onChange={e => setSpaceType(e.target.value)}
                        required
                    />
                    <select
                        value={floor}
                        onChange={e => setFloor(e.target.value)}
                        required
                    >
                        {/* Empty option disabled if a default isn't chosen on load */}
                        <option value="" disabled={floors.length > 0}>Select floor</option>
                        {floors.map(f => <option value={f._id} key={f._id}>{f.floornumber}</option>)}
                    </select>
                    {/* The button type is submit which triggers the form onSubmit */}
                    <button className="btn primary" type="submit">Create Space</button>
                </form>
            </div>}

            {/* --- Spaces Table --- */}
            {/* Wrap table in .card.table-wrapper */}
            <div className="card table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Space</th>
                            <th>Type</th>
                            <th>Floor</th>
                            <th className="action-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {spaces.length === 0 ? (
                            <tr><td colSpan="2" className="no-data">No spaces found.</td></tr>
                        ) : (
                            spaces.map(s => (
                                <tr key={s._id}>
                                    <td>**{s.spaceName}**</td>
                                    <td>{s.spaceType}</td>
                                    {/* Safely access nested property */}
                                    <td>{s.floor?.floornumber || 'N/A'}</td>
                                    <td>
                                        {user.role === 'user' ? 'No Action' : <button
                                            className="btn small danger"
                                            onClick={() => remove(s._id)}
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
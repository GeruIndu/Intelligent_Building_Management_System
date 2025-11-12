import React, { useState } from 'react';
import api from '../api';
import { saveAuth } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../Style/register.css'; // Don't forget to import your CSS file

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contact, setContact] = useState('');
    const [role, setRole] = useState('');
    const [err, setErr] = useState('');
    const nav = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        try {
            // Note: If your API needs a default role (like 'user'), you may need to pass it here.
            const data = await api.register({ name, email, password, contact, role });
            saveAuth(data.token, data.user);
            nav('/');
        } catch (error) {
            setErr(error.message || 'Registration failed');
        }
    };

    return (
        // The main container for the split screen
        <div className="register-page-container">

            {/* 1. Left Pane: Design and Branding */}
            <div className="register-left-pane">
                <div className="left-content">
                    <h1>🚀 Join the IBMS Platform</h1>
                    <p>
                        Get access to modern tools for facility management, space configuration, and comprehensive access log tracking.
                    </p>

                </div>
            </div>

            {/* 2. Right Pane: Registration Form */}
            <div className="register-right-pane">
                <div className="register-card register-form">
                    <h2>Create Account</h2>
                    {err && <div className="error">{err}</div>}

                    <form onSubmit={submit}>

                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Name"
                            required
                        />

                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                        />

                        <label htmlFor="contact">Contact Number</label>
                        <input
                            id="contact"
                            type="tel"
                            value={contact}
                            onChange={e => setContact(e.target.value)}
                            placeholder="Enter Mobile number"
                            required
                        />

                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                            required
                        />

                        <label htmlFor="role">Role</label>
                        <input
                            id="role"
                            type="text"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            placeholder="(user/ admin/ manager)"
                            required
                        />

                        <button type="submit" className="btn">
                            Complete Registration
                        </button>
                    </form>

                    {/* Link back to login */}
                    <div className="auth-footer">
                        <p>
                            Already registered? <a href="/login">Log In here</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
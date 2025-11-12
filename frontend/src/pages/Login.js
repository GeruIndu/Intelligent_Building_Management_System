import React, { useState } from 'react';
import api from '../api';
import { saveAuth } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../Style/Login.css'; // Don't forget to import your CSS file

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const nav = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        try {
            const data = await api.login({ email, password });
            saveAuth(data.token, data.user);
            nav('/');
        } catch (error) {
            setErr(error.message || 'Login failed');
        }
    };

    return (
        // The main container for the split screen
        <div className="login-page-container">

            {/* 1. Left Pane: Design and Branding */}
            <div className="login-left-pane">
                <div className="left-content">
                    <h1>Intelligent Business Management System</h1>
                    <p>
                        Secure access to manage floors, spaces, and track all user activities within your facility.
                    </p>
                    {/* You could add an image or illustration here */}

                </div>
            </div>

            {/* 2. Right Pane: Login Form */}
            <div className="login-right-pane">
                <div className="login-card login-form">
                    <h2>Welcome Back</h2>

                    {err && <div className="error">{err}</div>}

                    <form onSubmit={submit}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                        />

                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />

                        <button type="submit" className="btn">
                            Login Securely
                        </button>

                        {/* Link back to login */}
                        <div className="auth-footer">
                            <p>
                                Create a Account? <a href="/register">Register here</a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
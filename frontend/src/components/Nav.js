import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import '../Style/Nav.css'; // Don't forget to import your CSS file

export default function Nav() {
    const navigate = useNavigate();
    const user = getUser();

    // Function to handle logout and redirect
    const logout = () => {
        clearAuth();
        navigate('/');
    };

    return (
        // Use the specific class name 'app-nav'
        <nav className="app-nav">
            <div className="nav-left">
                <Link to="/">IBMS</Link>
            </div>
            <div className="nav-right">
                {/* Always visible links */}
                {user && <>
                    <Link className='items' to="/dashboard">Dashboard</Link>
                    <Link className='items' to="/floors">Floors</Link>
                    <Link className='items' to="/spaces">Spaces</Link>
                </>
                }{
                    user && user?.role !== 'user' && <Link to="/access-logs">Access Logs</Link>
                }

                {/* Admin/Manager link */}
                {user && (user?.role === 'admin' || user?.role === 'manager') && <Link className='items' to="/users">Users</Link>}
                {user && (user?.role === 'admin' || user?.role === 'manager') && <Link className='items' to="/permissions">Permissions</Link>}

                {/* Conditional rendering for Auth state */}
                {user ? (
                    // Logged In State
                    <>
                        {/* The 'nav-user' class styles the Hi, {name} span */}
                        <span className="nav-user">Hi, {user.name}</span>
                        <button onClick={logout} className="btn small">
                            Logout
                        </button>
                    </>
                ) : (
                    // Logged Out State
                    <>
                        <Link className='items' to="/login">Login</Link>
                        <Link className='items' to="/register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
// src/pages/HomePage.js
import React from "react";
import { motion } from "framer-motion";
import "../Style/home.css";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const navigate = useNavigate();

    const features = [
        {
            title: "Intelligent Access Control",
            desc: "Grant or revoke user access in real-time. Ensure only authorized personnel can enter specific areas of the building.",
            icon: "🔐",
        },
        {
            title: "Smart Monitoring System",
            desc: "Automatically record entry and exit times for all users using virtual access logs without any hardware dependency.",
            icon: "📊",
        },
        {
            title: "Role-Based Dashboard",
            desc: "Admins, Managers, and Users each get personalized dashboards with role-based data visibility.",
            icon: "📋",
        },
        {
            title: "Permission Management",
            desc: "Admins can assign floor and space access with expiry times, making the system flexible and secure.",
            icon: "🧾",
        },
        {
            title: "Automatic Log Closure",
            desc: "Inactivity detection ensures access logs are auto-closed after a specified idle time using background cron jobs.",
            icon: "⏰",
        },
        {
            title: "Security & Analytics",
            desc: "View detailed reports of building usage and detect unusual patterns for enhanced security insights.",
            icon: "🧠",
        },
    ];

    return (
        <div className="home-container">
            {/* Hero Section */}
            <div className="hero-section" s>
                <motion.section
                    className="hero"
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    <h1>
                        <span>Intelligent Building Management System</span>
                    </h1>
                    <p>
                        A smart, secure, and automated system for managing user access, permissions,
                        and building activities — all through a modern web interface.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="explore-btn"
                        onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
                    >
                        Explore Features ↓
                    </motion.button>
                </motion.section>

            </div>
            {/* Features Section */}
            <section className="features">
                <h2>✨ Key Functionalities</h2>
                <div className="cards-grid">
                    {features.map((f, i) => (
                        <motion.div
                            className="feature-card"
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <div className="icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>
                    © {new Date().getFullYear()} Intelligent Building Management System — Designed
                    and Developed by <strong>Indrajit</strong>.
                </p>
            </footer>
        </div>
    );
}

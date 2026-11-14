import React from 'react';
import { Link } from 'react-router-dom';
import '../../Styles/LandingPage.css';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page-container">
      {/* Top Navbar Header */}
      <header className="landing-navbar">
        <div className="landing-brand">
          <span className="brand-icon">📖</span>
          <h3>AI EXAMINER</h3>
        </div>
        <div className="landing-auth-buttons">
          <Link to="/login" className="landing-btn landing-btn--secondary">Login</Link>
          <Link to="/register" className="landing-btn landing-btn--primary">Sign Up</Link>
        </div>
      </header>

      {/* Hero Content Grid */}
      <div className="landing-hero-grid">
        
        {/* Left Column: Hero Copy & Actions */}
        <div className="landing-hero-left">
          <span className="landing-badge">✨ Smarter Learning, Brighter Future</span>
          <h1 className="landing-title">
            Welcome to <span className="highlight-text">AI EXAMINER</span>
          </h1>
          <p className="landing-subtitle">
            Your AI-powered examination and learning platform. Prepare, Practice, and Perform Better with advanced automated assessments and real-time insights.
          </p>

          <div className="landing-features-list">
            <div className="landing-feature-item">
              <span className="feature-icon">🤖</span>
              <div>
                <h4>AI-Powered Assessment</h4>
                <p>Generate precise questions and evaluate answers instantly.</p>
              </div>
            </div>

            <div className="landing-feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <h4>Track Your Progress</h4>
                <p>Monitor performance analytics and examination success rates.</p>
              </div>
            </div>

            <div className="landing-feature-item">
              <span className="feature-icon">💡</span>
              <div>
                <h4>Smart Study Tools</h4>
                <p>Interactive syllabuses, exam halls, and streamlined workflows.</p>
              </div>
            </div>
          </div>

          <div className="landing-cta-row">
            <Link to="/register" className="landing-btn landing-btn--primary landing-btn--lg">
              Get Started &rarr;
            </Link>
            <Link to="/login" className="landing-btn landing-btn--secondary landing-btn--lg">
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Right Column: Floating Frosted Glass Preview Card */}
        <div className="landing-hero-right">
          <div className="landing-preview-card">
            <div className="preview-card-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
              <span className="preview-title">AI Examiner Studio</span>
            </div>

            <div className="preview-stats-box">
              <div className="stat-circle">
                <span className="stat-value">99.8%</span>
                <span className="stat-label">Accuracy Rate</span>
              </div>
              <div className="stat-details">
                <h4>Smart Insights</h4>
                <p>Automated grading backed by state-of-the-art language models and robust database engines.</p>
              </div>
            </div>

            <ul className="preview-task-list">
              <li>
                <span>📄 Exam Generation Studio</span>
                <span className="badge-active">Ready</span>
              </li>
              <li>
                <span>🎓 Secure Online Exam Hall</span>
                <span className="badge-active">Active</span>
              </li>
              <li>
                <span>📋 Faculty Student Assignment</span>
                <span className="badge-active">Live</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Footer info */}
      <footer className="landing-footer">
        <p>Trusted by Students & Faculty Everywhere &bull; Learn Smarter &bull; Achieve More &bull; Build Your Future</p>
      </footer>
    </div>
  );
};

export default LandingPage;
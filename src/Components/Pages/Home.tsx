import React from 'react';
import { Link } from 'react-router-dom';
import { CommonService } from '../../Services/commonServices';
import '../../Styles/Home.css';

export const Home: React.FC = () => {
  const isAuthenticated = CommonService.IsAuthenticated();

  if (!isAuthenticated) {
    return (
      <div className="home-container">
        <div className="landing-hero-wrapper">
          <div className="landing-hero-grid">
            
            {/* Left Content */}
            <div className="hero-content">
              <div className="landing-badge">
                <span>✨</span> Smarter Learning, Brighter Future
              </div>
              <h1>Welcome to<br />AI EXAMINER</h1>
              <p>Your AI-powered examination and learning platform. Prepare, Practice and Perform Better.</p>
              
              <div className="hero-features-row">
                <div className="hero-feature-item">
                  <div className="feature-icon-box">🤖</div>
                  <span>AI-Powered Assessment</span>
                </div>
                <div className="hero-feature-item">
                  <div className="feature-icon-box">📊</div>
                  <span>Track Your Progress</span>
                </div>
                <div className="hero-feature-item">
                  <div className="feature-icon-box">📖</div>
                  <span>Smart Study Tools</span>
                </div>
                <div className="hero-feature-item">
                  <div className="feature-icon-box">⚡</div>
                  <span>Instant Feedback</span>
                </div>
              </div>

              <div className="landing-actions">
                <Link to="/login" className="btn-primary-custom">
                  Get Started &rarr;
                </Link>
                
              </div>
            </div>

            {/* Right Graphic Mockup */}
            <div className="hero-graphic-container">
              <div className="graphic-backdrop-glow"></div>
              <div className="mockup-laptop-card">
                <div className="mockup-screen">
                  <div className="mockup-floating-icon">🎓</div>
                </div>
              </div>
              <div className="floating-badge-card stat-badge">
                <span>📈</span>
                <div>
                  <strong>99.8%</strong>
                  <p>Accuracy Rate</p>
                </div>
              </div>
              <div className="floating-badge-card bulb-badge">
                <span>💡</span>
                <p>Smart Insights</p>
              </div>
            </div>

          </div>

          <div className="trusted-footer-bar">
            <span>Trusted by Students Everywhere</span>
            <div className="trusted-brands">
              <span>📖 Learn Smarter</span>
              <span>🏆 Achieve More</span>
              <span>🚀 Build Your Future</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="dashboard-header">
        <h2>Dashboard Overview</h2>
        <p>Welcome back! Here is a summary of your management portals:</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Exams</h3>
          <p>Create, view, and manage your scheduled exams.</p>
          <Link to="/exams">Manage Exams &rarr;</Link>
        </div>
        <div className="dashboard-card">
          <h3>Syllabus</h3>
          <p>Configure topic outlines and max marks for exams.</p>
          <Link to="/syllabus">Manage Syllabus &rarr;</Link>
        </div>
        <div className="dashboard-card">
          <h3>Grades</h3>
          <p>Set up grade boundaries, CGPA rules, and pass criteria.</p>
          <Link to="/grades">Configure Grades &rarr;</Link>
        </div>
        <div className="dashboard-card">
          <h3>Questions & Sets</h3>
          <p>Build question papers, MCQ options, and sets.</p>
          <Link to="/questions">Manage Questions &rarr;</Link>
        </div>
        <div className="dashboard-card">
          <h3>Assessment Portal</h3>
          <p>Invite students, start exams, and take assessments.</p>
          <Link to="/assessment">View Assessment &rarr;</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CommonService } from '../../Services/commonServices';
import { AuthService } from '../../Services/authServices';
import LandingPage from './LandingPage';
import '../../Styles/Home.css';

const API_BASE_URL = "https://localhost:7240";

export const Home: React.FC = () => {
  const isAuthenticated = CommonService.IsAuthenticated();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState<string>('User');
  const [userInitial, setUserInitial] = useState<string>('U');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUserProfile = async () => {
      try {
        const profile = await AuthService.GetProfile();
        if (profile) {
          const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.userName || 'User';
          setDisplayName(fullName);
          setUserInitial(fullName.charAt(0).toUpperCase());

          if (profile.profileImageUrl) {
            const cleanPath = profile.profileImageUrl.replace(/\\/g, "/");
            const fullImg = cleanPath.startsWith("http") 
              ? cleanPath 
              : `${API_BASE_URL}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
            setAvatarUrl(fullImg);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile for dashboard top bar', err);
        try {
          const storedUser = localStorage.getItem('user') || localStorage.getItem('userInfo') || localStorage.getItem('currentUser');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            const name = parsed.firstName 
              ? `${parsed.firstName} ${parsed.lastName || ''}`.trim() 
              : parsed.name || parsed.userName || parsed.email || 'User';
            setDisplayName(name);
            setUserInitial(name.charAt(0).toUpperCase());
          }
        } catch (e) {
          // ignore
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="home-container">
      {/* Top Bar with Dynamic User Profile Pill */}
      <div className="home-topbar">
        <div className="home-search-wrapper">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search everything..." className="home-search-input" />
        </div>

        <div className="home-profile-container">
          <div 
            className="home-user-pill" 
            onClick={() => navigate('/profile')}
            title="Go to Profile"
            style={{ cursor: 'pointer' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="home-user-avatar-img" />
            ) : (
              <span className="user-avatar-initials">{userInitial}</span>
            )}
            <span className="user-fullname">{displayName}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-header-title">
        <h2>Dashboard Overview</h2>
      </div>

      {/* 2x2 Glassmorphism Dashboard Cards */}
      <div className="home-dashboard-grid">
        
        {/* CARD 1: Exam & Syllabus Management */}
        <div className="home-dash-card">
          <div className="home-card-header">
            <div className="home-card-icon">📄</div>
            <h3>Exam & Syllabus Management</h3>
          </div>

          <div className="home-stats-row">
            <div className="home-stat-box">
              <span className="home-stat-number">7</span>
              <span className="home-stat-label">Active Exams</span>
            </div>
            <div className="home-stat-divider"></div>
            <div className="home-stat-box">
              <span className="home-stat-number">2</span>
              <span className="home-stat-label">Pending Syllabuses</span>
            </div>
          </div>

          <ul className="home-syllabus-list">
            <li className="home-syllabus-item">
              <span>Syllabus.pdf</span>
              <div className="home-item-right">
                <span className="home-badge active">Active</span>
                <span className="home-dots">⋮</span>
              </div>
            </li>
            <li className="home-syllabus-item">
              <span>Syllabus.pdf</span>
              <div className="home-item-right">
                <span className="home-badge pending">Pending</span>
                <span className="home-dots">⋮</span>
              </div>
            </li>
          </ul>

          <Link to="/exams" className="home-btn home-btn--primary">
            Manage &rarr;
          </Link>
        </div>

        {/* CARD 2: AI Question Generation Studio */}
        <div className="home-dash-card">
          <div className="home-card-header">
            <div className="home-card-icon">✍️</div>
            <h3>AI Question Generation Studio</h3>
          </div>

          <div className="home-stats-row">
            <div className="home-stat-box">
              <span className="home-stat-number">358</span>
              <span className="home-stat-label">Total Questions Generated</span>
            </div>
            <div className="home-stat-divider"></div>
            <div className="home-stat-box">
              <span className="home-stat-number">12</span>
              <span className="home-stat-label">Drafts pending</span>
            </div>
          </div>

          <div className="home-prompt-box">
            <input type="text" placeholder="Quick AI Prompt Generator..." className="home-prompt-input" />
            <button className="home-btn home-btn--accent">+ Generate</button>
          </div>

          <Link to="/questions" className="home-btn home-btn--primary" style={{ marginTop: '12px' }}>
            View Studio &rarr;
          </Link>
        </div>

        {/* CARD 3: Exam Assessment & Student Assignment (Updated New Features) */}
        <div className="home-dash-card">
          <div className="home-card-header">
            <div className="home-card-icon">🎓</div>
            <h3>Exam Assessment & Assignment</h3>
          </div>

          <div className="home-stats-row">
            <div className="home-stat-box">
              <span className="home-stat-number">Active</span>
              <span className="home-stat-label">Student Exam Portal</span>
            </div>
            <div className="home-stat-divider"></div>
            <div className="home-stat-box">
              <span className="home-stat-number">Ready</span>
              <span className="home-stat-label">Faculty Assign Module</span>
            </div>
          </div>

          <div className="home-quick-links-grid">
            <Link to="/exam-assessment" className="home-sub-btn">
              🎓 Exam Assessment &rarr;
            </Link>
            <Link to="/faculty/assign-students" className="home-sub-btn">
              📋 Assign Students &rarr;
            </Link>
          </div>
        </div>

        {/* CARD 4: Performance Analytics & Reports */}
        <div className="home-dash-card">
          <div className="home-card-header">
            <div className="home-card-icon">📈</div>
            <h3>Performance Analytics & Reports</h3>
          </div>

          <div className="home-success-rate-block">
            <span className="home-success-rate">+12%</span>
            <span className="home-success-label">Exam Success Rate</span>
          </div>

          <div className="home-chart-wave">
            <div className="wave-line"></div>
            <div className="wave-point p1"></div>
            <div className="wave-point p2"></div>
            <div className="wave-point p3"></div>
            <div className="wave-point p4"></div>
          </div>

          <Link to="/grades" className="home-btn home-btn--primary">
            Detailed Reports &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Home;
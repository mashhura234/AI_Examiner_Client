import React, { useContext, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { LoginRequest } from "../../Models/userModel";
import { CommonService } from "../../Services/commonServices";
import { AuthService } from "../../Services/authServices";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../Contexts/auth/authContext";
import '../../Styles/Login.css';

export const Login: React.FC = () => {
  const { state, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [refreshAuth, setRefreshAuth] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (refreshAuth) {
      setRefreshAuth(false);
      dispatch({ type: "Refresh", data: undefined });
      if (state.accessToken) { navigate("/"); }
    }
  }, [refreshAuth, state.accessToken, dispatch, navigate]);

  const [form, setForm] = useState<LoginRequest>({ userName: "", password: "" });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (CommonService.IsEmptyValueInForm(form, [])) {
      alert("Please Provide Valid Username and Password!");
      return;
    }
    setLoading(true);
    AuthService.Login(form)
      .then((resp: any) => {
        const data = resp?.data || resp;
        if (!data || !data.accessToken) { throw new Error("AccessToken missing"); }
        CommonService.SaveDataToSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || "",
          username: data.username || form.userName,
          role: data.role || "Citizen"
        });
        dispatch({
          type: "LoginSuccess",
          data: { accessToken: data.accessToken, username: data.username || form.userName, role: data.role || "Citizen" }
        });
        navigate("/");
      })
      .catch((error: any) => {
        alert(error.response?.status === 401 ? "Invalid credentials" : "Login failed");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="auth-page-container">
      {/* Top-Left Clickable Brand Logo */}
      <Link to="/" className="auth-top-brand">
        <span className="auth-brand-icon" aria-hidden="true"></span>
        <span className="auth-brand-text">AI EXAMINER</span>
      </Link>

      {/* Centered Warm Glassmorphism Card */}
      <div className="auth-glass-card">
        <div className="auth-avatar-badge login-avatar" aria-hidden="true"></div>

        <div className="auth-card-header">
          <h2>Welcome Back</h2>
          <p>Login to continue your journey</p>
        </div>

        {/* Sliding Pill Switch Container */}
        <div className="auth-pill-switch">
          <div className="pill-slider-indicator"></div>
          <Link to="/login" className="pill-tab active">
            <span className="pill-icon lock-icon" aria-hidden="true"></span>
            Login
          </Link>
          <Link to="/register" className="pill-tab">
            <span className="pill-icon user-plus-icon" aria-hidden="true"></span>
            Sign Up
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label>Username or Email</label>
            <input
              type="text"
              name="userName"
              placeholder="Username or Email"
              value={form.userName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(prev => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login →"}
          </button>

          <div className="auth-footer-link">
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
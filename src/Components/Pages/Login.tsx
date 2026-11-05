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
      <div className="auth-split-card">
        {/* Left Hero Panel */}
        <div className="auth-hero-panel">
          <h3>AI EXAMINER</h3>
          <h2>Welcome<br />Back</h2>
          <p>Login to continue your journey</p>
          <div className="auth-hero-graphic">🎓</div>
        </div>

        {/* Right Form Container */}
        <div className="auth-form-container">
          <div className="auth-pill-switch">
            <Link to="/login" className="pill-tab active">Login</Link>
            <Link to="/register" className="pill-tab">Sign up</Link>
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
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
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
    </div>
  );
};

export default Login;
import React, { useState, type ChangeEvent, type FormEvent } from "react";
import type { RegisterRequest } from "../../Models/userModel";
import { CommonService } from "../../Services/commonServices";
import { AuthService } from "../../Services/authServices";
import { useNavigate, Link } from "react-router-dom";
import '../../Styles/Register.css';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [form, setForm] = useState<RegisterRequest>({
    userName: "", password: "", firstName: "", lastName: "", contactNumber: "", address: "", profileImage: null,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setForm((prev) => ({ ...prev, profileImage: file }));
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (CommonService.IsEmptyValueInForm(form, ["profileImage"])) {
      alert("Please fill in all mandatory text fields!");
      return;
    }
    setLoading(true);
    try {
      const formData = CommonService.buildFormData(form);
      await AuthService.Register(formData);
      alert("Registration successful! Please check your email to verify your account.");
      navigate("/login");
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data || "Registration failed.";
      alert(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Top-Left Clickable Brand Logo */}
      <Link to="/" className="auth-top-brand">
        <span className="auth-brand-icon" aria-hidden="true"></span>
        <span className="auth-brand-text">AI EXAMINER</span>
      </Link>

      {/* Centered Warm Glassmorphism Card */}
      <div className="auth-glass-card register-glass-card">
        <div className="auth-avatar-badge register-avatar" aria-hidden="true"></div>

        <div className="auth-card-header">
          <h2>Create Account</h2>
          <p>Start your journey with us</p>
        </div>

        {/* Sliding Pill Switch Container */}
        <div className="auth-pill-switch">
          <div className="pill-slider-indicator"></div>
          <Link to="/login" className="pill-tab">
            <span className="pill-icon lock-icon" aria-hidden="true"></span>
            Login
          </Link>
          <Link to="/register" className="pill-tab active">
            <span className="pill-icon user-plus-icon" aria-hidden="true"></span>
            Sign up
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="register-grid">
            <div className="auth-input-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={form.firstName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={form.lastName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <label>Email Address</label>
              <input
                type="text"
                name="userName"
                placeholder="Email Address"
                value={form.userName}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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

            <div className="auth-input-group">
              <label>Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                placeholder="Contact Number"
                value={form.contactNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="auth-input-group mt-3">
            <label>Profile Picture (Optional)</label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input-custom"
              />
              {profilePreview && (
                <img src={profilePreview} alt="Preview" className="register-avatar-preview" />
              )}
            </div>
          </div>

          <button type="submit" className="auth-submit-btn mt-4" disabled={loading}>
            {loading ? "Registering..." : "Create Account →"}
          </button>

          <div className="auth-footer-link">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
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
      <div className="auth-split-card">
        {/* Left Hero Panel */}
        <div className="auth-hero-panel">
          <h3>AI EXAMINER</h3>
          <h2>Create<br />Account</h2>
          <p>Start your journey with us</p>
          <div className="auth-hero-graphic">🚀</div>
        </div>

        {/* Right Form Container */}
        <div className="auth-form-container register-form-container">
          <div className="auth-pill-switch">
            <Link to="/login" className="pill-tab">Login</Link>
            <Link to="/register" className="pill-tab active">Sign up</Link>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="register-grid">
              <div className="auth-input-group">
                <label>Full Name</label>
                <input type="text" name="firstName" placeholder="First Name" value={form.firstName} onChange={handleInputChange} required />
              </div>
              <div className="auth-input-group">
                <label>Last Name</label>
                <input type="text" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleInputChange} required />
              </div>
              <div className="auth-input-group">
                <label>Email Address</label>
                <input type="text" name="userName" placeholder="johndoe@email.com" value={form.userName} onChange={handleInputChange} required />
              </div>
              <div className="auth-input-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleInputChange} required />
              </div>
              <div className="auth-input-group">
                <label>Contact Number</label>
                <input type="tel" name="contactNumber" placeholder="01712345678" value={form.contactNumber} onChange={handleInputChange} required />
              </div>
              <div className="auth-input-group">
                <label>Address</label>
                <input type="text" name="address" placeholder="Street / City" value={form.address} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="auth-input-group mt-3">
              <label>Profile Picture (Optional)</label>
              <input type="file" name="profileImage" accept="image/*" onChange={handleFileChange} className="file-input-custom" />
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
    </div>
  );
};

export default Register;
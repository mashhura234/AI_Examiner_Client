import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CommonService } from "../../Services/commonServices";
import "../../Styles/Navbar.css";

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const isAuthenticated = CommonService.IsAuthenticated();

    const handleLogout = () => {
        CommonService.ClearSession();
        navigate("/login");
    };

    return (
        <nav className="app-navbar">
            <h3 className="navbar-brand">
                <Link to="/">AI EXAMINER</Link>
            </h3>
            <div className="navbar-links">
                
                
                {!isAuthenticated ? (
                    <div className="nav-auth-buttons">
                        <Link to="/login" className="nav-login-btn">Login</Link>
                        <Link to="/register" className="nav-signup-btn">Sign Up</Link>
                    </div>
                ) : (
                    <>
                        <Link to="/exams">Exam</Link>
                        <Link to="/syllabus">Syllabus</Link>
                        <Link to="/assessment">Assessment Portal</Link>
                        <Link to="/grades">Grade</Link>
                        <Link to="/questions">Questions</Link>
                        <Link to="/profile">Profile</Link>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};
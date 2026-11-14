import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CommonService } from "../../Services/commonServices";
import "../../Styles/Navbar.css";

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = CommonService.IsAuthenticated();

    const handleLogout = () => {
        CommonService.ClearSession();
        navigate("/login");
    };

    const isExamManagementActive = [
        "/exams",
        "/syllabus",
        "/grades",
        "/questions"
    ].includes(location.pathname);

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
                        <Link 
                            to="/exams" 
                            className={isExamManagementActive ? "nav-item-active" : ""}
                        >
                            Exam & Syllabus Management
                        </Link>
                        <Link 
                            to="/exam-assessment" 
                            className={location.pathname === "/exam-assessment" ? "nav-item-active" : ""}
                        >
                            Exam Assessment
                        </Link>
                        <Link 
                            to="/faculty/assign-students" 
                            className={location.pathname === "/faculty/assign-students" ? "nav-item-active" : ""}
                        >
                            Faculty: Assign Students
                        </Link>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
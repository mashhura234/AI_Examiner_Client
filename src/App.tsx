import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { setNavigator } from './Services/navigatorService';
import { CommonService } from './Services/commonServices';
import { AuthProvider } from './Components/Contexts/auth/authProvider';
import { Navbar } from './Components/Layouts/Navbar';
import { Home } from './Components/Pages/Home';
import { Login } from './Components/Pages/Login';
import { Register } from './Components/Pages/Register';
import { Profile } from './Components/Pages/Profile';
import ESQ_Manage from './Components/Pages/ESQ_Manage';
import ExamAssessment from './Components/Pages/ExamAssessment';
import AssignStudents from './Components/Pages/AssignStudents';
import ExamHall from './Components/Pages/ExamHall';

function NavigatorSetup() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(CommonService.IsAuthenticated());

  // Re-check authentication status on every route change or storage update
  useEffect(() => {
    setIsAuthenticated(CommonService.IsAuthenticated());
  }, [location.pathname]);

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Active Application Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/exams" element={<ESQ_Manage />} />
        <Route path="/exam-assessment" element={<ExamAssessment />} />
        <Route path="/faculty/assign-students" element={<AssignStudents />} />
        <Route path="/exam-hall/:participantId" element={<ExamHall />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NavigatorSetup />
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
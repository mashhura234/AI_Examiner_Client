import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { setNavigator } from './Services/navigatorService';
import { AuthProvider } from './Components/Contexts/auth/authProvider';
import { Navbar } from './Components/Layouts/Navbar';
import { Home } from './Components/Pages/Home';
import { Login } from './Components/Pages/Login';
import { Register } from './Components/Pages/Register';
import { Profile } from './Components/Pages/Profile';
import { Exam } from './Components/Pages/Exam';
import { Syllabus } from './Components/Pages/Syllabus';
import { Grade } from './Components/Pages/Grade';
import AssessmentPortal from './Components/Pages/AssessmentPortal';
import Question from './Components/Pages/Question';

function NavigatorSetup() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);
  return null;
}

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Active Application Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/exams" element={<Exam />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/assessment" element={<AssessmentPortal />} />
        <Route path="/grades" element={<Grade />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/questions" element={<Question />} />
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
import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { setNavigator } from './Services/navigatorService';
import { AuthProvider } from './Components/Contexts/auth/authProvider';
import { Navbar } from './Components/Layouts/Navbar';
import { Home } from './Components/Pages/Home';
import { Login } from './Components/Pages/Login';
import { Register } from './Components/Pages/Register';
import { Profile } from './Components/Pages/Profile';
import ESQ_Manage from './Components/Pages/ESQ_Manage';
import AssessmentPortal from './Components/Pages/AssessmentPortal';


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
        <Route path="/exams" element={<ESQ_Manage />} />
        <Route path="/assessment" element={<AssessmentPortal />} />
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
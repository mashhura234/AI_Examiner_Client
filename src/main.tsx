import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './Styles/Global.css';
import './Styles/ESQ_Manage.css';  // [UI-ADDITION] shared theme for Exam, Syllabus, Question, Grade
import './Styles/Animations.css';  // [UI-ADDITION] all animations (delete this line to switch them off)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
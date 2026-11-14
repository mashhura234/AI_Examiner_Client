import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentPortalServices } from '../../Services/assessmentPortalServices';
import { AuthService } from '../../Services/authServices';
import type { ExamPaperResponse, SavedAnswerResponseDto, SaveAnswerDto } from '../../Models/assessmentPortalModel';
import '../../Styles/ExamHall.css';

export const ExamHall: React.FC = () => {
  const { participantId } = useParams<{ participantId: string }>();
  const navigate = useNavigate();

  const [examPaper, setExamPaper] = useState<ExamPaperResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answersMap, setAnswersMap] = useState<{ [questionId: number]: { optionId?: number | null; description?: string } }>({});
  const [savedStatusMap, setSavedStatusMap] = useState<{ [questionId: number]: boolean }>({});
  
  const [candidateName, setCandidateName] = useState<string>('Student');
  const [timeRemaining, setTimeRemaining] = useState<number>(5400); // Default 1.5 hours in seconds
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch Candidate Name & Exam Paper
  useEffect(() => {
    const initExamHall = async () => {
      try {
        setLoading(true);
        if (!participantId) return;

        // Fetch user profile for candidate name
        const profile = await AuthService.GetProfile();
        if (profile) {
          const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.userName;
          setCandidateName(fullName);
        }

        // Fetch exam paper and existing answers
        const pId = Number(participantId);
        const paper = await assessmentPortalServices.getExamPaper(pId);
        setExamPaper(paper);

        const existingAnswers = await assessmentPortalServices.getMyAnswers(pId);
        const map: { [qId: number]: { optionId?: number | null; description?: string } } = {};
        const statusMap: { [qId: number]: boolean } = {};
        
        existingAnswers.forEach((ans: SavedAnswerResponseDto) => {
          map[ans.questionId] = { optionId: ans.optionId, description: ans.description || '' };
          statusMap[ans.questionId] = true;
        });
        setAnswersMap(map);
        setSavedStatusMap(statusMap);

      } catch (err: any) {
        setError(err?.response?.data || 'Failed to load exam session. Please ensure the exam is started.');
      } finally {
        setLoading(false);
      }
    };

    initExamHall();
  }, [participantId]);

  // Timer Countdown Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentQuestion = examPaper?.questions[currentIndex];

  const handleAnswerChange = (questionId: number, optionId?: number | null, description?: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [questionId]: {
        optionId: optionId !== undefined ? optionId : prev[questionId]?.optionId,
        description: description !== undefined ? description : prev[questionId]?.description,
      },
    }));
    setSavedStatusMap(prev => ({ ...prev, [questionId]: false }));
  };

  const handleSaveProgress = async (questionId: number) => {
    if (!participantId) return;
    const ans = answersMap[questionId];
    const payload: SaveAnswerDto = {
      participantId: Number(participantId),
      questionId,
      optionId: ans?.optionId ?? null,
      description: ans?.description ?? null,
    };

    try {
      await assessmentPortalServices.saveAnswer(payload);
      setSavedStatusMap(prev => ({ ...prev, [questionId]: true }));
    } catch (err: any) {
      alert(err?.response?.data || 'Failed to save progress.');
    }
  };

  const handleAutoSubmit = async () => {
    if (!participantId) return;
    try {
      await assessmentPortalServices.submitExam(Number(participantId));
      alert('Exam time expired. Your exam has been automatically submitted.');
      navigate('/exam-assessment');
    } catch (err) {
      navigate('/exam-assessment');
    }
  };

  const handleSubmitExam = async () => {
    if (!participantId) return;
    if (!window.confirm('Are you sure you want to submit your exam? No further changes will be allowed.')) return;

    try {
      setIsSubmitting(true);
      await assessmentPortalServices.submitExam(Number(participantId));
      alert('Exam submitted successfully!');
      navigate('/exam-assessment');
    } catch (err: any) {
      alert(err?.response?.data || 'Failed to submit exam.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="exam-hall-loading">
        <div className="exam-spinner"></div>
        <p>Loading Online Exam Hall...</p>
      </div>
    );
  }

  if (error || !examPaper) {
    return (
      <div className="exam-hall-error">
        <div className="exam-card error-card">
          <h3>Exam Access Error</h3>
          <p>{error || 'Exam paper not found.'}</p>
          <button onClick={() => navigate('/exam-assessment')} className="exam-btn exam-btn--primary">
            Back to Assigned Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-hall-container">
      {/* Top Header */}
      <header className="exam-header">
        <div className="exam-brand">
          <span className="exam-brand-icon">📖</span>
          <h3>AI EXAMINER</h3>
        </div>

        <div className="exam-timer-box">
          <span className="timer-label">Time Remaining</span>
          <span className="timer-display">{formatTime(timeRemaining)}</span>
        </div>

        <div className="exam-header-right">
          <span className="candidate-info">Candidate: <strong>{candidateName}</strong></span>
          <button onClick={handleSubmitExam} disabled={isSubmitting} className="exam-submit-btn">
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="exam-body-grid">
        
        {/* Left Sidebar: Question Navigator */}
        <aside className="exam-sidebar">
          <h4 className="sidebar-title">Questions</h4>
          <div className="question-grid">
            {examPaper.questions.map((q, idx) => {
              const isAnswered = savedStatusMap[q.id] || (answersMap[q.id]?.optionId !== undefined && answersMap[q.id]?.optionId !== null) || (answersMap[q.id]?.description && answersMap[q.id]?.description?.trim() !== '');
              const isCurrent = idx === currentIndex;

              let btnClass = 'q-nav-btn';
              if (isCurrent) btnClass += ' current';
              else if (isAnswered) btnClass += ' answered';
              else btnClass += ' unanswered';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={btnClass}
                  title={`Question ${idx + 1}`}
                >
                  <span className="q-num">{idx + 1}</span>
                  <span className="q-label">Question {idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="question-legend">
            <div className="legend-item">
              <span className="legend-box answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-box current"></span>
              <span>Current</span>
            </div>
            <div className="legend-item">
              <span className="legend-box unanswered"></span>
              <span>Unanswered</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="exam-main-content">
          {currentQuestion && (
            <div className="exam-question-card">
              <div className="question-top-bar">
                <h3>Question {currentIndex + 1} of {examPaper.totalQuestions}</h3>
                <span className="marks-badge">{currentQuestion.marks} Marks</span>
              </div>

              <p className="question-text">{currentQuestion.title}</p>
              {currentQuestion.description && <p className="question-subtext">{currentQuestion.description}</p>}

              {/* Render Options if MCQ */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="options-container">
                  <p className="section-subtitle">Select your answer:</p>
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = answersMap[currentQuestion.id]?.optionId === opt.id;
                    const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D...

                    return (
                      <label 
                        key={opt.id} 
                        className={`option-label ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleAnswerChange(currentQuestion.id, opt.id)}
                      >
                        <input
                          type="radio"
                          name={`q_${currentQuestion.id}`}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(currentQuestion.id, opt.id)}
                        />
                        <span className="option-badge">({optionLetter})</span>
                        <span className="option-title">{opt.title}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                /* Render Descriptive Textarea */
                <div className="descriptive-container">
                  <div className="editor-toolbar">
                    <button type="button" title="Bold"><strong>B</strong></button>
                    <button type="button" title="Italic"><em>I</em></button>
                    <span className="toolbar-divider">|</span>
                    <button type="button" title="Bullet List">☰</button>
                    <button type="button" title="Numbered List">≡</button>
                    <button type="button" title="Code Block">&lt;/&gt;</button>
                  </div>
                  <textarea
                    rows={6}
                    placeholder="Type your detailed answer here..."
                    value={answersMap[currentQuestion.id]?.description || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, undefined, e.target.value)}
                    className="exam-textarea"
                  />
                </div>
              )}

              {/* Bottom Navigation */}
              <div className="exam-bottom-nav">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="exam-nav-btn back-btn"
                >
                  &larr; Back
                </button>

                <div className="save-progress-indicator">
                  <button 
                    onClick={() => handleSaveProgress(currentQuestion.id)} 
                    className="save-progress-btn"
                  >
                    Save Progress {savedStatusMap[currentQuestion.id] ? '✓' : ''}
                  </button>
                </div>

                <button
                  onClick={() => setCurrentIndex(prev => Math.min(examPaper.questions.length - 1, prev + 1))}
                  disabled={currentIndex === examPaper.questions.length - 1}
                  className="exam-nav-btn next-btn"
                >
                  Next Question &rarr;
                </button>
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};

export default ExamHall;
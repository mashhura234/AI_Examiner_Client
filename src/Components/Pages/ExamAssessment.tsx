import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentPortalServices } from '../../Services/assessmentPortalServices';
import type { MyExamDto, ExamPaperResponse, SavedAnswerResponseDto, SaveAnswerDto } from '../../Models/assessmentPortalModel';
import '../../Styles/AssessmentPortal.css';

export const ExamAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [myExams, setMyExams] = useState<MyExamDto[]>([]);
  const [activeParticipantId, setActiveParticipantId] = useState<number | null>(null);
  const [activeExamPaper, setActiveExamPaper] = useState<ExamPaperResponse | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswerResponseDto[]>([]);
  const [answersMap, setAnswersMap] = useState<{ [questionId: number]: { optionId?: number | null; description?: string } }>({});
  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMyExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assessmentPortalServices.getMyExams();
      setMyExams(data);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to fetch assigned exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyExams();
  }, []);

  const handleRespond = async (participantId: number, accept: boolean) => {
    try {
      setError(null);
      const res = await assessmentPortalServices.respondInvitation({ participantId, accept });
      setMessage(res.message);
      fetchMyExams();
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to respond to invitation.');
    }
  };

  const handleStartExam = async (participantId: number) => {
    try {
      setError(null);
      const res = await assessmentPortalServices.startExam(participantId);
      setMessage(res.message);
      navigate(`/exam-hall/${participantId}`);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to start exam.');
    }
  };

  const handleOpenExamPaper = (participantId: number) => {
    navigate(`/exam-hall/${participantId}`);
  };

  const getStatusName = (status: number) => {
    switch (status) {
      case 1: return 'Invited';
      case 2: return 'Accepted';
      case 3: return 'In-Progress (Attended)';
      case 4: return 'Completed';
      case 5: return 'Suspended/Declined';
      case 6: return 'Absent';
      default: return 'Unknown';
    }
  };

  const getStatusClass = (status: number) => {
    switch (status) {
      case 2: return 'ap-badge--accepted';
      case 3: return 'ap-badge--progress';
      case 4: return 'ap-badge--completed';
      case 5: return 'ap-badge--declined';
      default: return 'ap-badge--invited';
    }
  };

  return (
    <div className="ap-page">
      <h2>Exam Assessment & Answering Portal</h2>

      {message && <p className="ap-success">{message}</p>}
      {error && <p className="ap-error">{error}</p>}

      <div>
        <h3>My Assigned Exams</h3>
        {loading && <p className="ap-info">Loading exams...</p>}
        {!loading && myExams.length === 0 && <p className="ap-info">No exam invitations found.</p>}

        <ul className="ap-list">
          {myExams.map(exam => (
            <li key={exam.participantId} className="ap-card ap-exam-card">
              <div className="ap-exam-header">
                <h4>{exam.examName} - <span className="ap-set-title">{exam.setName}</span></h4>
                <span className={`ap-badge ${getStatusClass(exam.participantStatus)}`}>
                  {getStatusName(exam.participantStatus)}
                </span>
              </div>
              
              <p className="ap-meta-text">
                Starts: {new Date(exam.startDate).toLocaleString()} | Ends: {new Date(exam.endDate).toLocaleString()}
              </p>

              <div className="ap-action-row">
                {exam.participantStatus === 1 && (
                  <>
                    <button onClick={() => handleRespond(exam.participantId, true)} className="ap-btn ap-btn--success">
                      Accept Invitation
                    </button>
                    <button onClick={() => handleRespond(exam.participantId, false)} className="ap-btn ap-btn--danger">
                      Decline
                    </button>
                  </>
                )}

                {exam.participantStatus === 2 && (
                  <button onClick={() => handleStartExam(exam.participantId)} className="ap-btn ap-btn--primary">
                    Start Exam
                  </button>
                )}

                {exam.participantStatus === 3 && (
                  <button onClick={() => handleOpenExamPaper(exam.participantId)} className="ap-btn ap-btn--info">
                    Open Exam & Answer Portal
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExamAssessment;
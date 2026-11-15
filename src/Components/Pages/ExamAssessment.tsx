import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentPortalServices } from '../../Services/assessmentPortalServices';
import type { MyExamDto, ExamPaperResponse, SavedAnswerResponseDto, SaveAnswerDto } from '../../Models/assessmentPortalModel';
import ResultModal from './ResultModal'; // Adjust path if saved in Molecules or Modals
import '../../Styles/ExamAssessment.css';

export const ExamAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [myExams, setMyExams] = useState<MyExamDto[]>([]);
  const [activeParticipantId, setActiveParticipantId] = useState<number | null>(null);
  const [activeExamPaper, setActiveExamPaper] = useState<ExamPaperResponse | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswerResponseDto[]>([]);
  const [answersMap, setAnswersMap] = useState<{ [questionId: number]: { optionId?: number | null; description?: string } }>({});
  
  // State for opening the official score report modal
  const [selectedResultParticipantId, setSelectedResultParticipantId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMyExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await assessmentPortalServices.getMyExams();
      
      // Feature 1: Sort assigned exams by newest first (descending order by start/end date)
      const sortedData = data.sort((a, b) => {
        const timeA = new Date(a.startDate || a.endDate || 0).getTime();
        const timeB = new Date(b.startDate || b.endDate || 0).getTime();
        return timeB - timeA;
      });

      setMyExams(sortedData);
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

  // Feature 3: Check if exam end time has passed current time
  const isExamExpired = (exam: MyExamDto) => {
    if (!exam.endDate) return false;
    return new Date().getTime() > new Date(exam.endDate).getTime();
  };

  const handleStartExam = async (participantId: number) => {
    const exam = myExams.find(e => e.participantId === participantId);
    if (exam && isExamExpired(exam)) {
      setError('This exam has expired and can no longer be accessed.');
      return;
    }
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
    const exam = myExams.find(e => e.participantId === participantId);
    if (exam && isExamExpired(exam)) {
      setError('This exam has expired and can no longer be accessed.');
      return;
    }
    navigate(`/exam-hall/${participantId}`);
  };

  const getStatusName = (exam: MyExamDto) => {
    if (isExamExpired(exam) && exam.participantStatus !== 4) {
      return 'Expired';
    }
    switch (exam.participantStatus) {
      case 1: return 'Invited';
      case 2: return 'Accepted';
      case 3: return 'In-Progress (Attended)';
      case 4: return 'Completed';
      case 5: return 'Suspended/Declined';
      case 6: return 'Absent';
      default: return 'Unknown';
    }
  };

  const getStatusClass = (exam: MyExamDto) => {
    if (isExamExpired(exam) && exam.participantStatus !== 4) {
      return 'ap-badge--expired';
    }
    switch (exam.participantStatus) {
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
          {myExams.map(exam => {
            const expired = isExamExpired(exam);
            const syllabusLabel = (exam as any).syllabusName || (exam as any).syllabus?.topicName || (exam as any).syllabusTitle || 'Syllabus Assigned';

            return (
              <li key={exam.participantId} className="ap-card ap-exam-card">
                <div className="ap-exam-header">
                  <h4>{exam.examName} <span className="ap-set-title">{exam.setName}</span></h4>
                  <span className={`ap-badge ${getStatusClass(exam)}`}>
                    {getStatusName(exam)}
                  </span>
                </div>
                
                <p className="ap-meta-text">
                  <strong>Syllabus:</strong> {syllabusLabel} <br />
                  Starts: {new Date(exam.startDate).toLocaleString()} | Ends: {new Date(exam.endDate).toLocaleString()}
                </p>

                <div className="ap-action-row">
                  {!expired && exam.participantStatus === 1 && (
                    <>
                      <button onClick={() => handleRespond(exam.participantId, true)} className="ap-btn ap-btn--success">
                        Accept Invitation
                      </button>
                      <button onClick={() => handleRespond(exam.participantId, false)} className="ap-btn ap-btn--danger">
                        Decline
                      </button>
                    </>
                  )}

                  {!expired && exam.participantStatus === 2 && (
                    <button onClick={() => handleStartExam(exam.participantId)} className="ap-btn ap-btn--primary">
                      Start Exam
                    </button>
                  )}

                  {!expired && exam.participantStatus === 3 && (
                    <button onClick={() => handleOpenExamPaper(exam.participantId)} className="ap-btn ap-btn--info">
                      Open Exam & Answer Portal
                    </button>
                  )}

                  {/* Completed / Published Exam Action: View Result */}
                  {exam.participantStatus === 4 && (
                    <button 
                      onClick={() => setSelectedResultParticipantId(exam.participantId)} 
                      className="ap-btn ap-btn--success"
                    >
                      View Result
                    </button>
                  )}

                  {expired && exam.participantStatus !== 4 && (
                    <span className="ap-meta-text" style={{ fontStyle: 'italic', color: '#b91c1c', fontWeight: 600 }}>
                      Exam session expired. Entry is closed.
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Official Exam Score Report Modal popup */}
      {selectedResultParticipantId !== null && (
        <ResultModal 
          participantId={selectedResultParticipantId} 
          onClose={() => setSelectedResultParticipantId(null)} 
        />
      )}
    </div>
  );
};

export default ExamAssessment;
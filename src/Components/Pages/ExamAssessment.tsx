import React, { useEffect, useState } from 'react';
import axios from '../../interceptor';
import { assessmentPortalServices } from '../../Services/assessmentPortalServices';
import { examServices } from '../../Services/examServices';
import { syllabusServices } from '../../Services/syllabusServices';

// Matches AI_Examiner.Models.Enums.ParticipantStatus
const PARTICIPANT_STATUS = {
  Invited: 1,
  Accepted: 2,
  Attended: 3,   // In-progress
  Completed: 4,  // Submitted
  Suspended: 5,  // Declined / Suspended
  Absent: 6,
} as const;

// Matches AI_Examiner.Models.Enums.ResultStatus
const RESULT_STATUS = {
  Inactive: 1,
  Processing: 2,
  Published: 3,
  Suspended: 4,
} as const;

const formatCountdown = (diffMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
};

export const ExamAssessment: React.FC = () => {
  const [assignedExams, setAssignedExams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const [examSyllabusMap, setExamSyllabusMap] = useState<{ [key: string]: string }>({});
  const [examAssignedByMap, setExamAssignedByMap] = useState<{ [key: string]: string }>({});

  // Result Modal State
  const [isResultModalOpen, setIsResultModalOpen] = useState<boolean>(false);
  const [examResultData, setExamResultData] = useState<any>(null);

  // Live 1-second tick for pre-start countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAssignedExams = async () => {
    try {
      setLoading(true);
      setError(null);

      let examsList: any[] = [];

      try {
        const data = await assessmentPortalServices.getMyExams();
        if (Array.isArray(data) && data.length > 0) {
          examsList = data;
        }
      } catch (e) {
        console.warn('assessmentPortalServices.getMyExams failed, trying examServices...', e);
      }

      if (examsList.length === 0) {
        try {
          const data = await examServices.getMyExams();
          if (Array.isArray(data) && data.length > 0) {
            examsList = data;
          }
        } catch (e) {
          console.warn('examServices.getMyExams failed:', e);
        }
      }

      setAssignedExams(examsList);

      // Fetch master exams list to correctly resolve Exam IDs
      let masterExams: any[] = [];
      try {
        const res = await axios.get('/Exams');
        masterExams = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      } catch (e) {
        console.warn('Could not fetch master exams list', e);
      }

      const syllabusTempMap: { [key: string]: string } = {};
      const assignedByTempMap: { [key: string]: string } = {};

      for (const item of examsList) {
        const examObj = item.exam || item;
        const initialExamId = item.examId || examObj.id || item.id || item.ExamId;
        const examName = item.examName || item.ExamName || examObj.name;
        const participantId = item.participantId ?? item.ParticipantId ?? item.id;

        // 1. Check if syllabus is already embedded in the API response object
        let embeddedSyllabus = item.syllabus || examObj.syllabus || item.exam?.syllabus;
        let resolvedTopic = '';

        if (Array.isArray(embeddedSyllabus) && embeddedSyllabus.length > 0) {
          resolvedTopic = embeddedSyllabus
            .map((s: any) => s.title || s.topicName || '')
            .filter(Boolean)
            .join(', ');
        }

        // 2. If not embedded, fetch via master exams or syllabus service
        if (!resolvedTopic) {
          const foundMasterExam = masterExams.find(e =>
            e.id === initialExamId ||
            (e.name && examName && e.name.toLowerCase() === examName.toLowerCase())
          );
          const targetExamId = foundMasterExam?.id || initialExamId;

          if (targetExamId) {
            try {
              const sylResponse: any = await syllabusServices.getSyllabusByExamId(targetExamId);
              let syllabusArray: any[] = [];
              if (Array.isArray(sylResponse)) {
                syllabusArray = sylResponse;
              } else if (sylResponse && typeof sylResponse === 'object') {
                syllabusArray = sylResponse.syllabus || sylResponse.items || sylResponse.data || [];
              }

              if (syllabusArray.length > 0) {
                resolvedTopic = syllabusArray
                  .map((s: any) => s.title || s.topicName || '')
                  .filter(Boolean)
                  .join(', ');
              }
            } catch (err) {
              console.warn(`Could not fetch syllabus for exam ID ${targetExamId}`, err);
            }
          }
        }

        // 3. Fallback to 'General Syllabus' (NOT examName, so we don't mistake exam names for syllabus)
        const finalTopic = resolvedTopic || examObj.syllabusName || examObj.topicName || 'General Syllabus';

        syllabusTempMap[participantId] = finalTopic;
        if (initialExamId) syllabusTempMap[initialExamId] = finalTopic;

        assignedByTempMap[participantId] = 'Faculty / Admin';
        if (initialExamId) assignedByTempMap[initialExamId] = 'Faculty / Admin';
      }

      setExamSyllabusMap(syllabusTempMap);
      setExamAssignedByMap(assignedByTempMap);

    } catch (err: any) {
      console.error('Error in fetchAssignedExams:', err);
      setError('Failed to load assigned exams.');
      setAssignedExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedExams();
  }, []);

  const handleAccept = async (participantId: number) => {
    try {
      setError(null);
      await assessmentPortalServices.respondInvitation({ participantId: Number(participantId), accept: true });
      setMessage('Exam invitation accepted successfully.');
      fetchAssignedExams();
    } catch (err: any) {
      console.error('Accept invitation failed:', err?.response || err);
      const errDetail = err?.response?.data?.message || err?.response?.data || err?.message || 'Failed to accept invitation.';
      setError(typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail));
    }
  };

  const handleDecline = async (participantId: number) => {
    if (!window.confirm('Are you sure you want to decline this exam invitation?')) return;
    try {
      setError(null);
      await assessmentPortalServices.respondInvitation({ participantId: Number(participantId), accept: false });
      setMessage('Exam invitation declined.');
      fetchAssignedExams();
    } catch (err: any) {
      console.error('Decline invitation failed:', err?.response || err);
      const errDetail = err?.response?.data?.message || err?.response?.data || err?.message || 'Failed to decline invitation.';
      setError(typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail));
    }
  };

  const handleStartExam = async (participantId: number, startDateObj: Date | null) => {
    if (startDateObj && !isNaN(startDateObj.getTime()) && Date.now() < startDateObj.getTime()) {
      setError(`Entry blocked until exam starts (${startDateObj.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}).`);
      return;
    }

    try {
      setError(null);
      const res = await axios.post(`/Participants/start/${participantId}`);
      setMessage(res.data?.message || 'Exam started successfully!');
      window.location.href = `/exam-hall/${participantId}`;
    } catch (err: any) {
      const errDetail = err?.response?.data?.message || err?.response?.data || err?.message || 'Failed to start exam.';
      setError(typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail));
    }
  };

  const handleViewResult = async (participantId: number) => {
    try {
      setError(null);
      const res = await assessmentPortalServices.getMyResult(participantId);
      setExamResultData(res);
      setIsResultModalOpen(true);
    } catch (err: any) {
      const errDetail = err?.response?.data?.message || err?.response?.data || err?.message || 'Result not published or available yet.';
      setError(typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail));
    }
  };

  return (
    <div className="manage-page" style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Exam Assessment & Answering Portal</h2>

      {message && <p className="manage-success" style={{ color: '#2e7d32', marginBottom: '15px' }}>{message}</p>}
      {error && <p className="manage-error" style={{ color: '#dc3545', marginBottom: '15px' }}>{error}</p>}

      {/* --- RESULT POPUP MODAL --- */}
      {isResultModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: '0', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '30px', borderRadius: '16px', maxWidth: '650px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button 
              onClick={() => setIsResultModalOpen(false)} 
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>
            <h3 style={{ color: '#375534', marginBottom: '16px' }}>📊 Exam Result & Evaluation</h3>
            
            {examResultData ? (
              <div style={{ display: 'grid', gap: '15px', fontSize: '0.95rem', color: '#2b2a28' }}>
                {/* Summary Section */}
                <div style={{ background: 'rgba(55,85,52,0.05)', padding: '15px', borderRadius: '10px' }}>
                  <p style={{ margin: '0 0 6px 0' }}><strong>Exam Name:</strong> {examResultData.examName || examResultData.ExamName || 'N/A'}</p>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>Total Score:</strong> {examResultData.totalMarks ?? examResultData.TotalMarks ?? examResultData.totalScore ?? 'N/A'} / {examResultData.maxMarks ?? examResultData.MaxMarks ?? 100}
                  </p>
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>Grade Achieved:</strong> <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{examResultData.grade || examResultData.Grade || 'N/A'} (CGPA: {examResultData.cgpa ?? examResultData.CGPA ?? 'N/A'})</span>
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Status:</strong> {(examResultData.isPassed ?? examResultData.IsPassed) ? 'PASSED ✅' : 'FAILED ❌'}
                  </p>
                </div>

                {/* Question-wise Breakdown Section */}
                <h4 style={{ color: '#375534', margin: '4px 0 0 0' }}>Question-wise Evaluation:</h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {(examResultData.breakdown || examResultData.Breakdown || []).length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#666', margin: 0 }}>No question-wise breakdown available.</p>
                  ) : (
                    (examResultData.breakdown || examResultData.Breakdown || []).map((item: any, idx: number) => {
                      const qTitle = item.questionTitle || item.QuestionTitle || `Question ${idx + 1}`;
                      const awarded = item.awardedMarks ?? item.AwardedMarks ?? item.marks ?? item.Marks ?? 0;
                      const max = item.maxMarks ?? item.MaxMarks ?? 0;
                      const reason = item.reasonOfMarking || item.ReasonOfMarking || 'No feedback provided.';

                      return (
                        <div key={item.questionId || item.QuestionId || idx} style={{ background: '#f9f9f9', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, marginBottom: '6px' }}>
                            <span>Q{idx + 1}: {qTitle}</span>
                            <span style={{ color: '#2e7d32', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                              {awarded} / {max} Marks
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>
                            <strong>Reason / Feedback:</strong> {reason}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <p>Loading result details...</p>
            )}

            <button 
              onClick={() => setIsResultModalOpen(false)} 
              style={{ marginTop: '20px', width: '100%', background: '#375534', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="manage-card" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '20px', color: '#375534' }}>My Assigned Exams</h3>

        {loading ? (
          <p>Loading assigned exams...</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {assignedExams.map((item, idx) => {
              const examObj = item.exam || item;
              const participantId = item.participantId ?? item.ParticipantId ?? item.id;
              const examId = item.examId || examObj.id || item.id || item.ExamId;
              const examTitle = item.examName || item.ExamName || examObj.name || examObj.title || 'Untitled Exam';
              
              const startDateObj = examObj.startDate || item.startDate || item.StartDate ? new Date(examObj.startDate || item.startDate || item.StartDate) : null;
              const endDateObj = examObj.endDate || item.endDate || item.EndDate ? new Date(examObj.endDate || item.endDate || item.EndDate) : null;
              
              const startDateStr = startDateObj && !isNaN(startDateObj.getTime()) ? startDateObj.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
              const endDateStr = endDateObj && !isNaN(endDateObj.getTime()) ? endDateObj.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

              // Safely lookup syllabus topic by participantId or examId
              const syllabusTopic = 
                examSyllabusMap[participantId] || 
                examSyllabusMap[examId] || 
                'General Syllabus';

              const assignedByUser = examAssignedByMap[examId] || examAssignedByMap[participantId] || 'Faculty / Admin';

              const status = item.participantStatus ?? item.ParticipantStatus ?? item.status ?? examObj.status ?? PARTICIPANT_STATUS.Invited;
              const resultStatus = item.resultStatus ?? item.ResultStatus ?? RESULT_STATUS.Inactive;

              const isInvited = status === PARTICIPANT_STATUS.Invited;
              const isAcceptedOrAttended =
                status === PARTICIPANT_STATUS.Accepted || status === PARTICIPANT_STATUS.Attended;
              const isCompleted = status === PARTICIPANT_STATUS.Completed;
              const isSuspended = status === PARTICIPANT_STATUS.Suspended;
              const isAbsent = status === PARTICIPANT_STATUS.Absent;
              const canViewResult = isCompleted && resultStatus === RESULT_STATUS.Published;
              const isExpired = Boolean(endDateObj && !isNaN(endDateObj.getTime()) && endDateObj.getTime() < nowMs);
              const timeUntilStartMs = startDateObj && !isNaN(startDateObj.getTime())
                ? startDateObj.getTime() - nowMs
                : 0;
              const isWaitingForStart = timeUntilStartMs > 0;

              return (
                <div 
                  key={participantId || idx} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.85)', 
                    borderRadius: '12px', 
                    padding: '20px 24px', 
                    border: '1px solid rgba(55, 85, 52, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative'
                  }}
                >
                  {/* Status Badge */}
                  <div style={{ position: 'absolute', top: '20px', right: '24px' }}>
                    {isCompleted ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2e7d32', background: 'rgba(46, 125, 50, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>Completed</span>
                    ) : isSuspended ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc3545', background: 'rgba(220, 53, 69, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>Suspended</span>
                    ) : isAbsent ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc3545', background: 'rgba(220, 53, 69, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>Absent</span>
                    ) : status === PARTICIPANT_STATUS.Attended ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1d4ed8', background: 'rgba(29, 78, 216, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>In Progress</span>
                    ) : status === PARTICIPANT_STATUS.Accepted ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2e7d32', background: 'rgba(46, 125, 50, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>Accepted</span>
                    ) : isExpired ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc3545', background: 'rgba(220, 53, 69, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>Expired</span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d97706', background: 'rgba(217, 119, 6, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>Invited</span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '1.2rem', margin: 0, color: '#2b2a28' }}>{examTitle}</h4>
                  
                  <div style={{ fontSize: '0.95rem', color: '#375534' }}>
                    <strong>Syllabus:</strong> {syllabusTopic}
                  </div>

                  <div style={{ fontSize: '0.9rem', color: '#6b6252' }}>
                    <strong>Assigned By:</strong> {assignedByUser}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#6b6252' }}>
                    Starts: {startDateStr} | Ends: {endDateStr}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                    {isInvited && !isExpired && !isCompleted && !isSuspended && !isAbsent && (
                      <>
                        <button 
                          onClick={() => handleAccept(participantId)}
                          style={{ background: '#d97706', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          Accept Invitation
                        </button>
                        <button 
                          onClick={() => handleDecline(participantId)}
                          style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {isAcceptedOrAttended && !isExpired && !isCompleted && (
                      isWaitingForStart ? (
                        <div
                          style={{
                            background: 'rgba(217, 119, 6, 0.12)',
                            border: '1px solid rgba(217, 119, 6, 0.35)',
                            color: '#b45309',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span>🔒 Entry Locked — Starts in:</span>
                          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                            {formatCountdown(timeUntilStartMs)}
                          </span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStartExam(participantId, startDateObj)}
                          style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                        >
                          🚀 Start Exam / Enter Hall
                        </button>
                      )
                    )}

                    {canViewResult && (
                      <button 
                        onClick={() => handleViewResult(participantId)}
                        style={{ background: '#375534', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                      >
                        View Result
                      </button>
                    )}

                    {isCompleted && !canViewResult && (
                      <div style={{ fontSize: '0.85rem', color: '#6b6252', fontStyle: 'italic' }}>
                        Submitted. Result is not published yet.
                      </div>
                    )}

                    {isExpired && !isCompleted && !isSuspended && !isAbsent && (
                      <div style={{ fontSize: '0.85rem', color: '#dc3545', fontStyle: 'italic' }}>
                        Exam session expired. Entry is closed.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {assignedExams.length === 0 && (
              <p style={{ textAlign: 'center', color: '#6b6252', fontStyle: 'italic' }}>No assigned exams found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamAssessment;
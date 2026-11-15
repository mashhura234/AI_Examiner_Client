import React, { useEffect, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { GradingServices } from '../../Services/gradingServices';
import '../../Styles/Grading.css';

export const Grading: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Track evaluated/completed participant IDs locally
  const [completedParticipantIds, setCompletedParticipantIds] = useState<number[]>([]);

  const [loadingExams, setLoadingExams] = useState<boolean>(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active grading workspace state
  const [activeParticipantId, setActiveParticipantId] = useState<number | null>(null);
  const [gradingPaper, setGradingPaper] = useState<any | null>(null);
  const [marksMap, setMarksMap] = useState<{ [questionId: number]: { marks: number; reason: string } }>({});

  useEffect(() => {
    const fetchFacultyExams = async () => {
      try {
        setLoadingExams(true);
        const data = await examServices.getMyExams();
        const examArray = Array.isArray(data) ? data : [];
        setExams(examArray);
        if (examArray.length > 0) {
          setSelectedExamId(examArray[0].id);
        }
      } catch (err: any) {
        setError('Failed to load faculty exams.');
      } finally {
        setLoadingExams(false);
      }
    };
    fetchFacultyExams();
  }, []);

  const handleLoadSubmissions = async () => {
    if (!selectedExamId) return;
    try {
      setLoadingSubmissions(true);
      setError(null);
      setMessage(null);
      const data = await GradingServices.getPendingSubmissions(Number(selectedExamId));
      const subsArray = Array.isArray(data) ? data : [];
      setSubmissions(subsArray);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to load submissions for grading.');
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Filter out completed submissions from the pending table list
  const activePendingSubmissions = submissions.filter(sub => {
    const pId = sub.participantId || sub.ParticipantId;
    return !completedParticipantIds.includes(pId);
  });

  // Dynamic counts based on loaded submissions vs completed marking
  const totalLoadedCount = submissions.length;
  const completedCount = completedParticipantIds.length;
  const pendingCount = Math.max(0, totalLoadedCount - completedCount);

  const handleOpenGradingWorkspace = async (participantId: number) => {
    try {
      setError(null);
      setActiveParticipantId(participantId);
      const paper = await GradingServices.getSubmissionForGrading(participantId);
      setGradingPaper(paper);

      // Pre-fill marks map with existing scores if any
      const initialMap: { [qId: number]: { marks: number; reason: string } } = {};
      const questionsList = paper?.questions || (paper as any)?.Questions || [];
      questionsList.forEach((q: any) => {
        const qId = q.questionId || q.Id;
        initialMap[qId] = {
          marks: q.awardedMarks ?? q.AwardedMarks ?? 0,
          reason: q.reasonOfMarking || q.ReasonOfMarking || ''
        };
      });
      setMarksMap(initialMap);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to load participant answer sheet.');
    }
  };

  const handleMarkChange = (questionId: number, field: 'marks' | 'reason', value: number | string) => {
    setMarksMap(prev => ({
      ...prev,
      [questionId]: {
        marks: field === 'marks' ? Number(value) : (prev[questionId]?.marks || 0),
        reason: field === 'reason' ? String(value) : (prev[questionId]?.reason || '')
      }
    }));
  };

  const handleSaveEvaluation = async (participantId: number) => {
    try {
      setError(null);
      const evaluations = Object.keys(marksMap).map(qId => ({
        questionId: Number(qId),
        awardedMarks: marksMap[Number(qId)].marks,
        reasonOfMarking: marksMap[Number(qId)].reason
      }));

      const payload = {
        participantId: participantId,
        evaluations: evaluations
      };

      const res = await GradingServices.saveEvaluation(payload as any);
      setMessage(res?.message || 'Marks saved successfully.');

      // Mark as completed and close workspace
      if (!completedParticipantIds.includes(participantId)) {
        setCompletedParticipantIds(prev => [...prev, participantId]);
      }
      setActiveParticipantId(null);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to save evaluation marks.');
    }
  };

  const handleFinalizeAndPublish = async (participantId: number) => {
    if (!window.confirm('Are you sure you want to finalize and publish results for this student?')) return;
    try {
      setError(null);
      const res = await GradingServices.finalizeAndPublishResult(participantId);
      setMessage(res?.message || 'Result finalized and published successfully.');
      
      // Mark as completed and close workspace
      if (!completedParticipantIds.includes(participantId)) {
        setCompletedParticipantIds(prev => [...prev, participantId]);
      }
      setActiveParticipantId(null);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to publish result.');
    }
  };

  return (
    <div className="manage-page">
      <h2>Faculty Grading & Evaluation Portal</h2>

      {message && <p className="manage-success">{message}</p>}
      {error && <p className="manage-error">{error}</p>}

      {/* Load Exam Submissions Section */}
      <div className="manage-card" style={{ marginBottom: '20px' }}>
        <h3>Load Exam Submissions</h3>
        <div className="manage-row" style={{ alignItems: 'flex-end', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label><strong>Select Exam:</strong></label>
            <select 
              value={selectedExamId} 
              onChange={e => setSelectedExamId(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', marginTop: '5px' }}
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name} (ID: {ex.id})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleLoadSubmissions} 
            className="manage-btn manage-btn--primary"
            style={{ padding: '11px 22px' }}
          >
            {loadingSubmissions ? 'Loading...' : 'Load Submissions'}
          </button>
        </div>
      </div>

      {/* Evaluation Status Summary Counter Banner */}
      {submissions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255, 243, 205, 0.7)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
            <span style={{ fontSize: '0.85rem', color: '#856404', display: 'block' }}>Pending Mark Evaluations</span>
            <strong style={{ fontSize: '1.4rem', color: '#856404' }}>{pendingCount} Submissions</strong>
          </div>
          <div style={{ background: 'rgba(212, 237, 218, 0.7)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(40, 167, 69, 0.3)' }}>
            <span style={{ fontSize: '0.85rem', color: '#155724', display: 'block' }}>Completed / Evaluated</span>
            <strong style={{ fontSize: '1.4rem', color: '#155724' }}>{completedCount} Submissions</strong>
          </div>
        </div>
      )}

      {/* Submissions List Section */}
      <div className="manage-card">
        <h3>Pending Submissions & Answer Sheets</h3>
        {activePendingSubmissions.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#6b6252', padding: '10px 0' }}>
            {submissions.length > 0 ? 'All loaded submissions have been evaluated!' : (loadingSubmissions ? 'Fetching candidate answers...' : 'Click "Load Submissions" to view participant answer sheets from the database.')}
          </p>
        ) : (
          <ul className="manage-list">
            {activePendingSubmissions.map((sub: any) => {
              const pId = sub.participantId || sub.ParticipantId;
              const sName = sub.studentName || sub.StudentName || `Student #${pId}`;
              const sEmail = sub.studentEmail || sub.StudentEmail || '';
              const subStatus = sub.statusName || sub.StatusName || 'Pending Evaluation';

              return (
                <li key={pId} className="manage-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.6)', marginBottom: '10px', borderRadius: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{sName}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b6252' }}>{sEmail} | Status: <strong>{subStatus}</strong></p>
                  </div>
                  <button 
                    onClick={() => handleOpenGradingWorkspace(pId)} 
                    className="manage-btn manage-btn--success"
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    Evaluate Answer Sheet &rarr;
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Active Grading Workspace Modal / Drawer */}
      {activeParticipantId !== null && gradingPaper && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Evaluation Workspace: {gradingPaper.studentName || gradingPaper.StudentName}</h3>
              <button onClick={() => setActiveParticipantId(null)} className="modal-close-btn">&times;</button>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              {(gradingPaper.questions || gradingPaper.Questions || []).map((q: any, idx: number) => {
                const qId = q.questionId || q.Id;
                const maxMarks = q.maxMarks || q.MaxMarks || 5;
                const studentAns = q.studentAnswer || q.StudentAnswer || 'No answer provided.';

                return (
                  <div key={qId} style={{ background: 'rgba(255,255,255,0.5)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>Q{idx + 1}: {q.title || q.Title}</strong>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#375534' }}>Max Marks: {maxMarks}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#444', background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <strong>Student Answer:</strong> {studentAns}
                    </p>

                    <div className="manage-row" style={{ marginTop: '10px', gap: '10px' }}>
                      <div style={{ width: '120px' }}>
                        <label style={{ fontSize: '0.8rem' }}>Awarded Marks</label>
                        <input 
                          type="number" 
                          max={maxMarks}
                          min={0}
                          value={marksMap[qId]?.marks ?? 0}
                          onChange={e => handleMarkChange(qId, 'marks', e.target.value)}
                          style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem' }}>Faculty Feedback / Reason</label>
                        <input 
                          type="text" 
                          placeholder="Provide short feedback or justification..."
                          value={marksMap[qId]?.reason ?? ''}
                          onChange={e => handleMarkChange(qId, 'reason', e.target.value)}
                          style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => handleSaveEvaluation(activeParticipantId)} 
                className="manage-btn manage-btn--secondary"
              >
                Save Draft Marks
              </button>
              <button 
                onClick={() => handleFinalizeAndPublish(activeParticipantId)} 
                className="manage-btn manage-btn--primary"
              >
                Finalize & Publish Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grading;
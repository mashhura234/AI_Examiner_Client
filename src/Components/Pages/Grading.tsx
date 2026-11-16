import React, { useEffect, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { GradingServices } from '../../Services/gradingServices';
import '../../Styles/Grading.css';

export const Grading: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  const [submissions, setSubmissions] = useState<any[]>([]);

  const [loadingExams, setLoadingExams] = useState<boolean>(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [savingAction, setSavingAction] = useState<boolean>(false);
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

  // ResultStatus enum: 1 = Inactive, 2 = Processing, 3 = Published, 4 = Suspended
  const publishedCount = submissions.filter(sub => (sub.resultStatus ?? sub.ResultStatus) === 3).length;
  const pendingCount = Math.max(0, submissions.length - publishedCount);

  const getResultStatusLabel = (status?: number) => {
    switch (status) {
      case 2:
        return 'Draft Saved (Not Published)';
      case 3:
        return 'Published';
      case 4:
        return 'Suspended';
      default:
        return 'Pending Evaluation';
    }
  };

  const handleOpenGradingWorkspace = async (participantId: number) => {
    try {
      setError(null);
      setActiveParticipantId(participantId);
      const paper = await GradingServices.getSubmissionForGrading(participantId);
      setGradingPaper(paper);

      // Pre-fill marks map with existing scores or system-verified MCQ suggestions
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

  const buildEvaluationPayload = (participantId: number) => {
    const evaluations = Object.keys(marksMap).map(qId => ({
      questionId: Number(qId),
      marks: marksMap[Number(qId)].marks,
      awardedMarks: marksMap[Number(qId)].marks,
      reasonOfMarking: marksMap[Number(qId)].reason
    }));

    return {
      participantId,
      evaluations
    };
  };

  const handleSaveEvaluation = async (participantId: number) => {
    try {
      setSavingAction(true);
      setError(null);
      const payload = buildEvaluationPayload(participantId);
      const res = await GradingServices.saveEvaluation(payload as any);
      setMessage(res?.message || 'Draft marks saved. Click "Finalize & Publish Result" to release to the student.');

      // Update local submission status to Processing (2) without hiding the row
      setSubmissions(prev =>
        prev.map(sub => {
          const pId = sub.participantId || sub.ParticipantId;
          return pId === participantId ? { ...sub, resultStatus: 2, ResultStatus: 2 } : sub;
        })
      );
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to save evaluation marks.');
    } finally {
      setSavingAction(false);
    }
  };

  const handleFinalizeAndPublish = async (participantId: number) => {
    if (!window.confirm('Are you sure you want to finalize and publish results for this student?')) return;
    try {
      setSavingAction(true);
      setError(null);

      // 1. Save current marks to Results table first so SUM(Marks) is accurate
      const payload = buildEvaluationPayload(participantId);
      await GradingServices.saveEvaluation(payload as any);

      // 2. Finalize calculation and set ResultStatus = 3 (Published)
      const res = await GradingServices.finalizeAndPublishResult(participantId);
      setMessage(res?.message || 'Result finalized and published successfully.');

      // Update local submission status to Published (3) and close modal
      setSubmissions(prev =>
        prev.map(sub => {
          const pId = sub.participantId || sub.ParticipantId;
          return pId === participantId
            ? {
                ...sub,
                resultStatus: 3,
                ResultStatus: 3,
                totalMarks: res?.totalMarks ?? sub.totalMarks,
                grade: res?.grade ?? sub.grade
              }
            : sub;
        })
      );
      setActiveParticipantId(null);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to publish result.');
    } finally {
      setSavingAction(false);
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
              disabled={loadingExams}
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
            <span style={{ fontSize: '0.85rem', color: '#856404', display: 'block' }}>Unpublished / Pending</span>
            <strong style={{ fontSize: '1.4rem', color: '#856404' }}>{pendingCount} Submissions</strong>
          </div>
          <div style={{ background: 'rgba(212, 237, 218, 0.7)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(40, 167, 69, 0.3)' }}>
            <span style={{ fontSize: '0.85rem', color: '#155724', display: 'block' }}>Published Results</span>
            <strong style={{ fontSize: '1.4rem', color: '#155724' }}>{publishedCount} Submissions</strong>
          </div>
        </div>
      )}

      {/* Submissions List Section */}
      <div className="manage-card">
        <h3>Submissions & Answer Sheets</h3>
        {submissions.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: '#6b6252', padding: '10px 0' }}>
            {loadingSubmissions ? 'Fetching candidate answers...' : 'Click "Load Submissions" to view participant answer sheets from the database.'}
          </p>
        ) : (
          <ul className="manage-list">
            {submissions.map((sub: any) => {
              const pId = sub.participantId || sub.ParticipantId;
              const sName = sub.studentName || sub.StudentName || `Student #${pId}`;
              const sEmail = sub.studentEmail || sub.StudentEmail || '';
              const rStatus = sub.resultStatus ?? sub.ResultStatus;
              const isPublished = rStatus === 3;

              return (
                <li key={pId} className="manage-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.6)', marginBottom: '10px', borderRadius: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0' }}>{sName}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b6252' }}>
                      {sEmail} | Result Status:{' '}
                      <strong style={{ color: isPublished ? '#155724' : '#856404' }}>
                        {getResultStatusLabel(rStatus)}
                      </strong>
                      {isPublished && (sub.totalMarks ?? sub.TotalMarks) != null && (
                        <span> | Score: <strong>{sub.totalMarks ?? sub.TotalMarks}</strong> ({sub.grade || sub.Grade})</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenGradingWorkspace(pId)}
                    className="manage-btn manage-btn--success"
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  >
                    {isPublished ? 'Review / Re-publish' : 'Evaluate & Publish'} &rarr;
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
                const studentAns =
                  q.answerDescription ||
                  q.selectedOptionTitle ||
                  q.description ||
                  q.studentAnswer ||
                  q.StudentAnswer ||
                  'No answer provided.';

                return (
                  <div key={qId} style={{ background: 'rgba(255,255,255,0.5)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>Q{idx + 1}: {q.questionTitle || q.title || q.Title}</strong>
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
                disabled={savingAction}
                className="manage-btn manage-btn--secondary"
              >
                {savingAction ? 'Saving...' : 'Save Draft Marks'}
              </button>
              <button
                onClick={() => handleFinalizeAndPublish(activeParticipantId)}
                disabled={savingAction}
                className="manage-btn manage-btn--primary"
              >
                {savingAction ? 'Publishing...' : 'Finalize & Publish Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grading;
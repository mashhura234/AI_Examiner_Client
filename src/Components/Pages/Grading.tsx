import React, { useState, useEffect } from 'react';
import axios from '../../interceptor';
import { SubmissionReviewResponse, QuestionReviewItem, GradeQuestionItem } from '../../Models/GradingModel';
import '../../Styles/Grading.css';

export const Grading: React.FC = () => {
  const [examId, setExamId] = useState<number>(1);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionReviewResponse | null>(null);
  const [evaluations, setEvaluations] = useState<{ [questionId: number]: { marks: number; reason: string } }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (examId > 0) {
      loadPendingSubmissions(examId);
    }
  }, [examId]);

  const loadPendingSubmissions = async (targetExamId: number) => {
    try {
      setLoading(true);
      setMessage('');
      const response = await axios.get<any[]>(`/Grading/pending/exam/${targetExamId}`);
      setPendingSubmissions(response.data || []);
    } catch (err: any) {
      setMessage(`Error loading submissions: ${err.response?.data || err.message}`);
      setPendingSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectParticipant = async (participantId: number) => {
    try {
      setLoading(true);
      setMessage('');
      setSelectedParticipantId(participantId);
      const response = await axios.get<SubmissionReviewResponse>(`/Grading/submission/${participantId}`);
      setSubmissionDetails(response.data);

      const initialEvals: { [key: number]: { marks: number; reason: string } } = {};
      if (response.data && response.data.questions) {
        response.data.questions.forEach((q: QuestionReviewItem) => {
          initialEvals[q.questionId] = {
            marks: q.awardedMarks ?? 0,
            reason: q.reasonOfMarking ?? ''
          };
        });
      }
      setEvaluations(initialEvals);
    } catch (err: any) {
      setMessage(`Error loading submission details: ${err.response?.data || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (questionId: number, marks: number, maxMarks: number) => {
    const validatedMarks = Math.max(0, Math.min(marks, maxMarks));
    setEvaluations(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        marks: validatedMarks
      }
    }));
  };

  const handleReasonChange = (questionId: number, reason: string) => {
    setEvaluations(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        reason
      }
    }));
  };

  const handleSaveEvaluation = async () => {
    if (!selectedParticipantId) return;
    try {
      setLoading(true);
      setMessage('');
      const payloadItems: GradeQuestionItem[] = Object.keys(evaluations).map(qId => ({
        questionId: Number(qId),
        marks: evaluations[Number(qId)].marks,
        reasonOfMarking: evaluations[Number(qId)].reason
      }));

      await axios.post('/Grading/save-evaluation', {
        participantId: selectedParticipantId,
        evaluations: payloadItems
      });
      setMessage('Evaluation saved successfully as draft.');
    } catch (err: any) {
      setMessage(`Error saving evaluation: ${err.response?.data || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAndPublish = async () => {
    if (!selectedParticipantId) return;
    try {
      setLoading(true);
      setMessage('');
      const payloadItems: GradeQuestionItem[] = Object.keys(evaluations).map(qId => ({
        questionId: Number(qId),
        marks: evaluations[Number(qId)].marks,
        reasonOfMarking: evaluations[Number(qId)].reason
      }));

      await axios.post('/Grading/save-evaluation', {
        participantId: selectedParticipantId,
        evaluations: payloadItems
      });

      const response = await axios.post(`/Grading/finalize/${selectedParticipantId}`);
      const resData = response.data;
      setMessage(`Result published successfully! Grade: ${resData.grade} | Total: ${resData.totalMarks}/${resData.maxMarks} (${resData.percentage}%)`);
      
      loadPendingSubmissions(examId);
    } catch (err: any) {
      setMessage(`Error publishing result: ${err.response?.data || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grading-page-container">
      <div className="container-fluid py-4">
        <h2 className="text-white mb-4">Faculty Grading & Evaluation Portal</h2>
        
        <div className="row my-3 align-items-center">
          <div className="col-auto">
            <label htmlFor="examIdInput" className="col-form-label text-white"><strong>Enter Exam ID:</strong></label>
          </div>
          <div className="col-auto">
            <input
              id="examIdInput"
              type="number"
              className="form-control grading-input"
              value={examId}
              onChange={(e) => setExamId(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={() => loadPendingSubmissions(examId)}>
              Load Submissions
            </button>
          </div>
        </div>

        {message && <div className="alert alert-info my-2">{message}</div>}
        {loading && <div className="text-light my-2">Loading data...</div>}

        <div className="row mt-4">
          <div className="col-md-4">
            <h4 className="text-white">Pending Submissions</h4>
            {pendingSubmissions.length === 0 ? (
              <p className="text-light opacity-75">No pending submissions found for Exam ID {examId}.</p>
            ) : (
              <ul className="list-group">
                {pendingSubmissions.map((sub) => (
                  <li
                    key={sub.participantId}
                    className={`list-group-item grading-list-item ${selectedParticipantId === sub.participantId ? 'active' : ''}`}
                    onClick={() => handleSelectParticipant(sub.participantId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <strong>{sub.studentName}</strong> ({sub.studentEmail})<br />
                    <small>Set: {sub.setName} | Status: {sub.resultStatus === 1 ? 'Completed' : 'Pending'}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-md-8">
            {submissionDetails ? (
              <div className="grading-card p-4 shadow-lg">
                <h4>Reviewing Student: {submissionDetails.studentName}</h4>
                <p className="text-light opacity-75 mb-2">
                  Exam: <strong>{submissionDetails.examName}</strong> | Max Marks: {submissionDetails.examMaxMarks}
                </p>

                {submissionDetails.pdfAnswerSheetURL && (
                  <div className="mb-3">
                    <a
                      href={submissionDetails.pdfAnswerSheetURL}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-light"
                    >
                      📄 View Uploaded PDF Answer Sheet
                    </a>
                  </div>
                )}

                <hr className="border-light" />

                {submissionDetails.questions && submissionDetails.questions.map((q: QuestionReviewItem, index: number) => (
                  <div key={q.questionId} className="mb-4 p-3 rounded grading-card">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-1 text-white">Q{index + 1}: {q.questionTitle}</h5>
                      <span className="badge bg-secondary">Max Marks: {q.maxMarks}</span>
                    </div>
                    <p className="mb-2 text-light">{q.questionDescription}</p>

                    <div className="grading-response-box mb-3">
                      <strong>Student Response:</strong>
                      {q.selectedOptionTitle ? (
                        <div className="mt-1">
                          Selected Option: <code>{q.selectedOptionTitle}</code>{' '}
                          {q.isOptionCorrect ? <span className="text-success">✅ Correct</span> : <span className="text-danger">❌ Incorrect</span>}
                        </div>
                      ) : (
                        <div className="mt-1">{q.answerDescription || <em>No text response provided.</em>}</div>
                      )}
                    </div>

                    <div className="row g-2 align-items-center">
                      <div className="col-md-4">
                        <label className="form-label small text-white">Awarded Marks</label>
                        <input
                          type="number"
                          className="form-control form-control-sm grading-input"
                          max={q.maxMarks}
                          min={0}
                          step="0.5"
                          value={evaluations[q.questionId]?.marks ?? 0}
                          onChange={(e) => handleMarkChange(q.questionId, parseFloat(e.target.value) || 0, q.maxMarks)}
                        />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label small text-white">Feedback / Reason</label>
                        <input
                          type="text"
                          className="form-control form-control-sm grading-input"
                          value={evaluations[q.questionId]?.reason ?? ''}
                          onChange={(e) => handleReasonChange(q.questionId, e.target.value)}
                          placeholder="Enter feedback or grading note..."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-outline-light" onClick={handleSaveEvaluation}>
                    Save Draft
                  </button>
                  <button className="btn btn-success" onClick={handleFinalizeAndPublish}>
                    Finalize & Publish Result
                  </button>
                </div>
              </div>
            ) : (
              <div className="grading-card p-5 text-center text-light opacity-75">
                Select a student submission from the left panel to begin reviewing and grading.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grading;
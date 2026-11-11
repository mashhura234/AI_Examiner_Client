import React, { useEffect, useRef, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { questionServices } from '../../Services/questionServices';
import { syllabusServices } from '../../Services/syllabusServices';
import { assessmentPortalServices } from '../../Services/assessmentPortalServices';
import type { Exam } from '../../Models/examModel';
import type { QuestionSet } from '../../Models/questionModel';
import type { Syllabus } from '../../Models/syllabusModel';
import type { MyExamDto, ExamPaperResponse, AssignStudentsDto, SavedAnswerResponseDto, SaveAnswerDto, UserDto, UserFilter } from '../../Models/assessmentPortalModel';

import '../../Styles/AssessmentPortal.css';

export const AssessmentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'faculty'>('student');

  // Student Session & Answering States
  const [myExams, setMyExams] = useState<MyExamDto[]>([]);
  const [activeParticipantId, setActiveParticipantId] = useState<number | null>(null);
  const [activeExamPaper, setActiveExamPaper] = useState<ExamPaperResponse | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswerResponseDto[]>([]);
  const [answersMap, setAnswersMap] = useState<{ [questionId: number]: { optionId?: number | null; description?: string } }>({});
  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Faculty Assignment & User Filter States
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | ''>('');
  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<number | ''>('');
  const [examType, setExamType] = useState<number>(1); // 1: Online, 2: Offline
  
  const [usersList, setUsersList] = useState<UserDto[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userFilter, setUserFilter] = useState<UserFilter>({ search: '', pageNumber: 1, pageSize: 10 });

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

  const fetchFacultyExams = async () => {
    try {
      const data = await examServices.getMyExams();
      setExams(data);
      if (data.length > 0) setSelectedExamId(data[0].id);
    } catch (err) {
      setError('Failed to load exams for assignment.');
    }
  };

  const fetchFilteredUsers = async () => {
    try {
      const data = await assessmentPortalServices.getUsers(userFilter);
      setUsersList(data);
    } catch (err) {
      setUsersList([]);
    }
  };

  useEffect(() => {
    fetchMyExams();
    fetchFacultyExams();
    fetchFilteredUsers();
  }, [userFilter]);

  // Fetch Question Sets and Syllabus when Selected Exam changes
  useEffect(() => {
    if (selectedExamId === '') return;
    
    const fetchExamData = async () => {
      try {
        const setsData = await questionServices.getSetsByExam(Number(selectedExamId));
        setSets(setsData);
        if (setsData.length > 0) setSelectedSetId(setsData[0].id);
        else setSelectedSetId('');
      } catch (err) {
        setError('Failed to fetch question sets.');
      }

      try {
        const syllabusData = await syllabusServices.getSyllabusByExamId(Number(selectedExamId));
        setSyllabusList(syllabusData);
        if (syllabusData.length > 0) setSelectedSyllabusId(syllabusData[0].id);
        else setSelectedSyllabusId('');
      } catch (err) {
        setSyllabusList([]);
        setSelectedSyllabusId('');
      }
    };

    fetchExamData();
  }, [selectedExamId]);

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
      fetchMyExams();
      handleOpenExamPaper(participantId);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to start exam.');
    }
  };

  const handleOpenExamPaper = async (participantId: number) => {
    try {
      setError(null);
      setActiveParticipantId(participantId);
      const paper = await assessmentPortalServices.getExamPaper(participantId);
      setActiveExamPaper(paper);

      const existingAnswers = await assessmentPortalServices.getMyAnswers(participantId);
      setSavedAnswers(existingAnswers);

      const map: { [qId: number]: { optionId?: number | null; description?: string } } = {};
      existingAnswers.forEach(ans => {
        map[ans.questionId] = { optionId: ans.optionId, description: ans.description || '' };
      });
      setAnswersMap(map);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to load exam paper. Ensure the exam is started.');
    }
  };

  const handleAnswerChange = (questionId: number, optionId?: number | null, description?: string) => {
    setAnswersMap(prev => ({
      ...prev,
      [questionId]: {
        optionId: optionId !== undefined ? optionId : prev[questionId]?.optionId,
        description: description !== undefined ? description : prev[questionId]?.description,
      },
    }));
  };

  const handleSaveSingleAnswer = async (questionId: number) => {
    if (!activeParticipantId) return;
    const ans = answersMap[questionId];
    const payload: SaveAnswerDto = {
      participantId: activeParticipantId,
      questionId,
      optionId: ans?.optionId ?? null,
      description: ans?.description ?? null,
    };

    try {
      setError(null);
      const res = await assessmentPortalServices.saveAnswer(payload);
      setMessage(`Q${questionId}: ${res.message}`);
      const updated = await assessmentPortalServices.getMyAnswers(activeParticipantId);
      setSavedAnswers(updated);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to save answer.');
    }
  };

  const handleSubmitFinalExam = async () => {
    if (!activeParticipantId) return;
    if (!window.confirm('Are you sure you want to submit and lock your exam? No further changes will be allowed.')) return;

    try {
      setError(null);
      const res = await assessmentPortalServices.submitExam(activeParticipantId);
      setMessage(res.message);
      setActiveExamPaper(null);
      setActiveParticipantId(null);
      fetchMyExams();
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to submit exam.');
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = usersList.map(u => u.id);
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleAssignStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetId) {
      alert('Please select a question set.');
      return;
    }

    if (selectedUserIds.length === 0) {
      alert('Please select at least one student from the table.');
      return;
    }

    const dto: AssignStudentsDto = {
      setId: Number(selectedSetId),
      type: examType,
      userIds: selectedUserIds,
    };

    try {
      setError(null);
      const res = await assessmentPortalServices.assignStudents(dto);
      setMessage(res.message);
      setSelectedUserIds([]);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to assign students.');
    }
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

  // Helper labels for table display
  const currentExamName = exams.find(e => e.id === Number(selectedExamId))?.name || 'Selected Exam';
  const currentSetName = sets.find(s => s.id === Number(selectedSetId))?.name || 'Selected Set';
  const currentSyllabusName = syllabusList.find(s => s.id === Number(selectedSyllabusId))?.topicName || 'Selected Syllabus';
  const currentExamTypeName = examType === 1 ? 'Online' : 'Offline';

  return (
    <div className="ap-page">
      <h2>Exam Assessment & Participant Portal</h2>

      {/* Sub-Tabs Selector */}
      <div className="ap-subtabs">
        <button 
          onClick={() => setActiveTab('student')} 
          className={`ap-tab-btn ${activeTab === 'student' ? 'active' : ''}`}>
          My Student Exams & Answering Portal
        </button>
        <button 
          onClick={() => setActiveTab('faculty')} 
          className={`ap-tab-btn ${activeTab === 'faculty' ? 'active' : ''}`}>
          Faculty: Assign Students
        </button>
      </div>

      {message && <p className="ap-success">{message}</p>}
      {error && <p className="ap-error">{error}</p>}

      {activeTab === 'student' && (
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

          {activeExamPaper && activeParticipantId && (
            <div className="ap-card ap-workspace">
              <div className="ap-workspace-header">
                <h3>Active Examination Workspace <small>(Participant ID: {activeParticipantId})</small></h3>
                <span className="ap-total-questions">Total Questions: {activeExamPaper.totalQuestions}</span>
              </div>
              <hr className="ap-divider" />
              
              {activeExamPaper.questions.map((q, idx) => (
                <div key={q.id} className="ap-question-block">
                  <p className="ap-question-title">
                    <strong>Q{idx + 1}: {q.title}</strong> <span className="ap-marks">({q.marks} Marks)</span>
                  </p>
                  {q.description && <p className="ap-question-desc">{q.description}</p>}

                  {q.options && q.options.length > 0 ? (
                    <ul className="ap-options-list">
                      {q.options.map(opt => (
                        <li key={opt.id}>
                          <label className="ap-radio-label">
                            <input 
                              type="radio" 
                              name={`question_${q.id}`} 
                              checked={answersMap[q.id]?.optionId === opt.id}
                              onChange={() => handleAnswerChange(q.id, opt.id)} 
                            /> 
                            <span>{opt.title}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <textarea 
                      rows={3}
                      placeholder="Type your answer here..."
                      value={answersMap[q.id]?.description || ''}
                      onChange={e => handleAnswerChange(q.id, undefined, e.target.value)}
                      className="ap-textarea"
                    />
                  )}

                  <button 
                    onClick={() => handleSaveSingleAnswer(q.id)}
                    className="ap-btn ap-btn--success" style={{ marginTop: '10px' }}>
                    Save Answer
                  </button>
                </div>
              ))}

              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button 
                  onClick={handleSubmitFinalExam}
                  className="ap-btn ap-btn--danger" style={{ padding: '12px 24px', fontSize: '1.05rem' }}>
                  Submit & Finalize Exam Session
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'faculty' && (
        <form onSubmit={handleAssignStudents}>
          {/* SECTION 1: Exam Configuration */}
          <div className="ap-card ap-config-section">
            <h3>Exam Configuration</h3>
            <div className="ap-config-grid">
              <div className="ap-config-field">
                <label>Exam Name:</label>
                <select value={selectedExamId} onChange={e => setSelectedExamId(Number(e.target.value))}>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              <div className="ap-config-field">
                <label>Question Set:</label>
                <select value={selectedSetId} onChange={e => setSelectedSetId(Number(e.target.value))}>
                  {sets.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="ap-config-field">
                <label>Syllabus:</label>
                <select value={selectedSyllabusId} onChange={e => setSelectedSyllabusId(Number(e.target.value))}>
                  {syllabusList.map(s => (
                    <option key={s.id} value={s.id}>{s.topicName}</option>
                  ))}
                </select>
              </div>

              <div className="ap-config-field">
                <label>Exam Type:</label>
                <select value={examType} onChange={e => setExamType(Number(e.target.value))}>
                  <option value={1}>Online</option>
                  <option value={2}>Offline</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Select Students Table */}
          <div className="ap-card ap-table-section">
            <div className="ap-table-header-row">
              <h3>Select Students</h3>
              <div className="ap-search-wrapper">
                <input 
                  type="text" 
                  value={userFilter.search || ''} 
                  onChange={e => setUserFilter({ ...userFilter, search: e.target.value, pageNumber: 1 })} 
                  placeholder="Search students by name or ID..." 
                  className="ap-search-input"
                />
              </div>
            </div>

            <div className="ap-table-container">
              <table className="ap-student-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={usersList.length > 0 && selectedUserIds.length === usersList.length}
                      />
                    </th>
                    <th>Student</th>
                    <th>Exam Name</th>
                    <th>Question Set</th>
                    <th>Syllabus</th>
                    <th>Exam Type</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#6b6252', fontStyle: 'italic' }}>
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    usersList.map(user => {
                      const isChecked = selectedUserIds.includes(user.id);
                      return (
                        <tr key={user.id} className={isChecked ? 'selected-row' : ''} onClick={() => toggleUserSelection(user.id)} style={{ cursor: 'pointer' }}>
                          <td onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => toggleUserSelection(user.id)}
                            />
                          </td>
                          <td>
                            <div className="ap-student-info">
                              <strong>{user.firstName} {user.lastName}</strong>
                              <small>@{user.userName} (ID: {user.id})</small>
                            </div>
                          </td>
                          <td>{currentExamName}</td>
                          <td>{currentSetName}</td>
                          <td>{currentSyllabusName}</td>
                          <td>
                            <span className="ap-type-badge">{currentExamTypeName}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="ap-table-footer">
              <span>Selected Students Count: <strong>{selectedUserIds.length}</strong></span>
            </div>
          </div>

          {/* Action Button */}
          <button type="submit" className="ap-btn ap-btn--success ap-assign-btn">
            Assign & Invite Selected Students
          </button>
        </form>
      )}
    </div>
  );
};

export default AssessmentPortal;
import React, { useEffect, useRef, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { questionServices } from '../../Services/questionServices';
import { assessmentPortalServices } from '../../Services/assessmentPortalServices';
import type { Exam } from '../../Models/examModel';
import type { QuestionSet } from '../../Models/questionModel';
import type { MyExamDto, ExamPaperResponse, AssignStudentsDto, SavedAnswerResponseDto, SaveAnswerDto, UserDto, UserFilter } from '../../Models/assessmentPortalModel';

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
  const [examType, setExamType] = useState<number>(1); // 1: Online, 2: Offline
  
  const [usersList, setUsersList] = useState<UserDto[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userFilter, setUserFilter] = useState<UserFilter>({ search: '', pageNumber: 1, pageSize: 10 });
  
  // Dropdown UI Toggle State
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedExamId === '') return;
    const fetchSets = async () => {
      try {
        const data = await questionServices.getSetsByExam(Number(selectedExamId));
        setSets(data);
        if (data.length > 0) setSelectedSetId(data[0].id);
        else setSelectedSetId('');
      } catch (err) {
        setError('Failed to fetch question sets.');
      }
    };
    fetchSets();
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

  const handleAssignStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetId) {
      alert('Please select a question set.');
      return;
    }

    if (selectedUserIds.length === 0) {
      alert('Please select at least one student from the dropdown list.');
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

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Exam Assessment & Participant Portal</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('student')} 
          style={{ padding: '8px 16px', background: activeTab === 'student' ? '#007bff' : '#e2e8f0', color: activeTab === 'student' ? '#fff' : '#000', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
          My Student Exams & Answering Portal
        </button>
        <button 
          onClick={() => setActiveTab('faculty')} 
          style={{ padding: '8px 16px', background: activeTab === 'faculty' ? '#007bff' : '#e2e8f0', color: activeTab === 'faculty' ? '#fff' : '#000', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
          Faculty: Assign Students
        </button>
      </div>

      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      {activeTab === 'student' && (
        <div>
          <h3>My Assigned Exams</h3>
          {loading && <p>Loading exams...</p>}
          {!loading && myExams.length === 0 && <p>No exam invitations found.</p>}

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {myExams.map(exam => (
              <li key={exam.participantId} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px', background: '#f9f9f9' }}>
                <h4>{exam.examName} - <span style={{ color: '#007bff' }}>{exam.setName}</span></h4>
                <p><strong>Status:</strong> {getStatusName(exam.participantStatus)}</p>
                <p><small>Starts: {new Date(exam.startDate).toLocaleString()} | Ends: {new Date(exam.endDate).toLocaleString()}</small></p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {exam.participantStatus === 1 && (
                    <>
                      <button onClick={() => handleRespond(exam.participantId, true)} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>
                        Accept Invitation
                      </button>
                      <button onClick={() => handleRespond(exam.participantId, false)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>
                        Decline
                      </button>
                    </>
                  )}

                  {exam.participantStatus === 2 && (
                    <button onClick={() => handleStartExam(exam.participantId)} style={{ background: '#ffc107', color: '#000', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
                      Start Exam
                    </button>
                  )}

                  {exam.participantStatus === 3 && (
                    <button onClick={() => handleOpenExamPaper(exam.participantId)} style={{ background: '#17a2b8', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>
                      Open Exam & Answer Portal
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {activeExamPaper && activeParticipantId && (
            <div style={{ marginTop: '30px', border: '2px solid #007bff', padding: '20px', borderRadius: '8px', background: '#fff' }}>
              <h3>Active Examination Workspace (Participant ID: {activeParticipantId})</h3>
              <p><strong>Total Questions:</strong> {activeExamPaper.totalQuestions}</p>
              <hr />
              {activeExamPaper.questions.map((q, idx) => (
                <div key={q.id} style={{ marginBottom: '25px', borderBottom: '1px solid #ddd', paddingBottom: '15px' }}>
                  <p><strong>Q{idx + 1}: {q.title}</strong> ({q.marks} Marks)</p>
                  {q.description && <p>{q.description}</p>}

                  {q.options && q.options.length > 0 ? (
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                      {q.options.map(opt => (
                        <li key={opt.id} style={{ marginBottom: '5px' }}>
                          <label>
                            <input 
                              type="radio" 
                              name={`question_${q.id}`} 
                              checked={answersMap[q.id]?.optionId === opt.id}
                              onChange={() => handleAnswerChange(q.id, opt.id)} 
                            /> {opt.title}
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
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                  )}

                  <button 
                    onClick={() => handleSaveSingleAnswer(q.id)}
                    style={{ marginTop: '8px', padding: '6px 12px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                    Save Answer
                  </button>
                </div>
              ))}

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button 
                  onClick={handleSubmitFinalExam}
                  style={{ padding: '12px 20px', background: '#dc3545', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px' }}>
                  Submit & Finalize Exam Session
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'faculty' && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px', background: '#fff' }}>
          <h3>Assign Students to Question Set</h3>
          <form onSubmit={handleAssignStudents} style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label><strong>Select Exam:</strong></label>
              <select value={selectedExamId} onChange={e => setSelectedExamId(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label><strong>Select Question Set:</strong></label>
              <select value={selectedSetId} onChange={e => setSelectedSetId(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                {sets.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label><strong>Exam Type:</strong></label>
              <select value={examType} onChange={e => setExamType(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                <option value={1}>Online</option>
                <option value={2}>Offline</option>
              </select>
            </div>

            {/* Search Students with Dropdown Container */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <label><strong>Search & Select Students:</strong></label>
              <input 
                type="text" 
                value={userFilter.search || ''} 
                onClick={() => setIsDropdownOpen(true)}
                onChange={e => {
                  setUserFilter({ ...userFilter, search: e.target.value, pageNumber: 1 });
                  setIsDropdownOpen(true);
                }} 
                placeholder="Click or type to search students..." 
                style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} 
              />
              <small style={{ color: '#666' }}>Selected Students Count: {selectedUserIds.length}</small>

              {/* Dropdown List Container */}
              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  marginTop: '4px',
                  padding: '8px'
                }}>
                  {usersList.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic', padding: '5px', margin: 0 }}>No users found.</p>
                  ) : (
                    usersList.map(user => (
                      <div 
                        key={user.id} 
                        onClick={() => toggleUserSelection(user.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '6px 8px', 
                          cursor: 'pointer',
                          borderRadius: '3px',
                          background: selectedUserIds.includes(user.id) ? '#e6f2ff' : 'transparent'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={e => (e.currentTarget.style.background = selectedUserIds.includes(user.id) ? '#e6f2ff' : 'transparent')}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => {}} // Handled by parent div click
                          style={{ cursor: 'pointer' }}
                        />
                        <span>{user.firstName} {user.lastName} (@{user.userName})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button type="submit" style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
              Assign & Invite Selected Students
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AssessmentPortal;
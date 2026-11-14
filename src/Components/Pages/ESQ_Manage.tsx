import React, { useEffect, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { syllabusServices } from '../../Services/syllabusServices';
import { gradeServices } from '../../Services/gradeServices';
import { questionServices } from '../../Services/questionServices';

import type { Exam, CreateExamRequest } from '../../Models/examModel';
import type { Syllabus, CreateSyllabusRequest } from '../../Models/syllabusModel';
import type { Grade, SetGradesRequest } from '../../Models/gradeModel';
import type { QuestionSet, QuestionWithOptionsResponse } from '../../Models/questionModel';

import '../../Styles/ESQ_Manage.css';

export const ESQ_Manage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'workspace'>('list');
  const [activeTab, setActiveTab] = useState<'exams' | 'syllabus' | 'grades' | 'questions'>('exams');

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState<boolean>(false);

  // --- 1. EXAMS STATE ---
  const [exams, setExams] = useState<Exam[]>([]);
  const [examForm, setExamForm] = useState<CreateExamRequest>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    resultPublishDate: '',
    allowGrading: true,
    maxMarks: 100,
    minimumMarksRequired: 40,
    status: 1,
  });

  // --- 2. SYLLABUS STATE ---
  const [selectedExamForSyllabus, setSelectedExamForSyllabus] = useState<number | ''>('');
  const [syllabusList, setSyllabusList] = useState<Syllabus[]>([]);
  const [syllabusForm, setSyllabusForm] = useState<CreateSyllabusRequest>({
    examId: 0,
    topicName: '',
    description: '',
    maxMarks: 10,
    markValueType: 1,
    maxQuestions: 5,
    status: 1,
  });

  // --- 3. GRADES STATE ---
  const [selectedExamForGrades, setSelectedExamForGrades] = useState<number | ''>('');
  const [gradesList, setGradesList] = useState<Grade[]>([]);
  const [gradeForm, setGradeForm] = useState<SetGradesRequest>({
    name: 'A',
    min: 80,
    max: 100,
    cgpa: 4.0,
    isPassGrade: true,
  });

  // --- 4. QUESTIONS STATE ---
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState<number | ''>('');
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | ''>('');
  const [questionsList, setQuestionsList] = useState<QuestionWithOptionsResponse[]>([]);
  
  const [newSetName, setNewSetName] = useState<string>('');
  const [questionTitle, setQuestionTitle] = useState<string>('');
  const [questionDesc, setQuestionDesc] = useState<string>('');
  const [questionMarks, setQuestionMarks] = useState<number>(5);
  const [questionType, setQuestionType] = useState<number>(1);
  const [questionImage, setQuestionImage] = useState<File | null>(null);

  // Integrated Question Options Form State
  const [questionOptions, setQuestionOptions] = useState<{ title: string; isCorrect: boolean }[]>([
    { title: '', isCorrect: false },
    { title: '', isCorrect: false },
    { title: '', isCorrect: false },
    { title: '', isCorrect: false },
  ]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await examServices.getMyExams();
      setExams(data);
      if (data.length > 0) {
        setSelectedExamForSyllabus(data[0].id);
        setSelectedExamForGrades(data[0].id);
        setSelectedExamForQuestions(data[0].id);
      }
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to load exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExamForSyllabus) return;
    const fetchSyllabus = async () => {
      try {
        const data = await syllabusServices.getSyllabusByExamId(Number(selectedExamForSyllabus));
        setSyllabusList(data);
      } catch (err) {
        setSyllabusList([]);
      }
    };
    fetchSyllabus();
  }, [selectedExamForSyllabus]);

  const handleCreateSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForSyllabus) return alert('Select an exam first');

    try {
      setError(null);
      const payload: CreateSyllabusRequest = { ...syllabusForm, examId: Number(selectedExamForSyllabus) };
      const res = await syllabusServices.addSyllabus(payload);
      setMessage(res.message || 'Syllabus topic created.');
      setSyllabusForm({ examId: Number(selectedExamForSyllabus), topicName: '', description: '', maxMarks: 10, markValueType: 1, maxQuestions: 5, status: 1 });
      setIsSyllabusModalOpen(false);
      const updated = await syllabusServices.getSyllabusByExamId(Number(selectedExamForSyllabus));
      setSyllabusList(updated);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create syllabus.');
    }
  };

  useEffect(() => {
    if (!selectedExamForGrades) return;
    const fetchGrades = async () => {
      try {
        const data = await gradeServices.getGradesByExamId(Number(selectedExamForGrades));
        setGradesList(data);
      } catch (err) {
        setGradesList([]);
      }
    };
    fetchGrades();
  }, [selectedExamForGrades]);

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForGrades) return alert('Select an exam first');

    try {
      setError(null);
      const payload: SetGradesRequest[] = [gradeForm];
      const res = await gradeServices.setExamGrades(Number(selectedExamForGrades), payload);
      setMessage(res.message || 'Grade boundary created.');
      setGradeForm({ name: 'A', min: 80, max: 100, cgpa: 4.0, isPassGrade: true });
      const updated = await gradeServices.getGradesByExamId(Number(selectedExamForGrades));
      setGradesList(updated);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create grade boundary.');
    }
  };

  useEffect(() => {
    if (!selectedExamForQuestions) return;
    const fetchSets = async () => {
      try {
        const data = await questionServices.getSetsByExam(Number(selectedExamForQuestions));
        setSets(data);
        if (data.length > 0) setSelectedSetId(data[0].id);
        else setSelectedSetId('');
      } catch (err) {
        setSets([]);
      }
    };
    fetchSets();
  }, [selectedExamForQuestions]);

  useEffect(() => {
    if (!selectedSetId) return;
    const fetchQuestions = async () => {
      try {
        const data = await questionServices.getQuestionsBySet(Number(selectedSetId));
        setQuestionsList(data);
      } catch (err) {
        setQuestionsList([]);
      }
    };
    fetchQuestions();
  }, [selectedSetId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const res = await examServices.createExam(examForm);
      setMessage(res.message || 'Exam created successfully.');
      setExamForm({ name: '', description: '', startDate: '', endDate: '', resultPublishDate: '', allowGrading: true, maxMarks: 100, minimumMarksRequired: 40, status: 1 });
      setViewMode('workspace');
      setActiveTab('exams');
      fetchExams();
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create exam.');
    }
  };

  const handleCreateQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForQuestions || !newSetName) return;

    try {
      setError(null);
      const res = await questionServices.createSet({ examId: Number(selectedExamForQuestions), name: newSetName, status: 1 });
      setMessage(res.message || 'Question set created.');
      setNewSetName('');
      const data = await questionServices.getSetsByExam(Number(selectedExamForQuestions));
      setSets(data);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create question set.');
    }
  };

  const handleOptionChange = (index: number, field: 'title' | 'isCorrect', value: string | boolean) => {
    const updated = [...questionOptions];
    if (field === 'title') {
      updated[index].title = value as string;
    } else {
      updated[index].isCorrect = value as boolean;
    }
    setQuestionOptions(updated);
  };

  const handleAddOptionRow = () => {
    setQuestionOptions([...questionOptions, { title: '', isCorrect: false }]);
  };

  const handleRemoveOptionRow = (index: number) => {
    setQuestionOptions(questionOptions.filter((_, i) => i !== index));
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetId) return alert('Select a question set first.');

    try {
      setError(null);
      const formData = new FormData();
      formData.append('setId', String(selectedSetId));
      formData.append('title', questionTitle);
      formData.append('description', questionDesc);
      formData.append('marks', String(questionMarks));
      formData.append('type', String(questionType));
      
      // Attach options as JSON string if it's an MCQ or True/False type
      if (questionType === 1 || questionType === 2) {
        const validOptions = questionOptions.filter(o => o.title.trim() !== '');
        formData.append('options', JSON.stringify(validOptions));
      }

      if (questionImage) {
        formData.append('image', questionImage);
      }

      const res = await questionServices.createQuestion(formData);
      setMessage(res.message || 'Question created.');
      setQuestionTitle('');
      setQuestionDesc('');
      setQuestionMarks(5);
      setQuestionImage(null);
      setQuestionOptions([
        { title: '', isCorrect: false },
        { title: '', isCorrect: false },
        { title: '', isCorrect: false },
        { title: '', isCorrect: false },
      ]);

      const data = await questionServices.getQuestionsBySet(Number(selectedSetId));
      setQuestionsList(data);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create question.');
    }
  };

  // Real-time counts computed from database records
  const activeExamsCount = exams.filter(ex => ex.status === 1 || !ex.status).length;
  const totalExamsCount = exams.length;

  return (
    <div className="manage-page">
      <h2>Exam & Syllabus Management</h2>

      {message && <p className="manage-success">{message}</p>}
      {error && <p className="manage-error">{error}</p>}

      {/* --- VIEW 1: EXAM LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="manage-dashboard-grid">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>All Exams</h3>
              <button 
                onClick={() => { setViewMode('workspace'); setActiveTab('exams'); }} 
                className="manage-btn manage-btn--primary"
                style={{ padding: '8px 20px', fontSize: '0.95rem' }}>
                + ADD EXAM
              </button>
            </div>

            {loading ? <p>Loading exams...</p> : (
              <div className="manage-table-container">
                <table className="exam-table">
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Syllabus</th>
                      <th>Date & Time</th>
                      <th>Duration</th>
                      <th>Total Questions</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map(ex => {
                      const startDateStr = ex.startDate ? new Date(ex.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
                      return (
                        <tr key={ex.id}>
                          <td>
                            <strong>{ex.name}</strong>
                            {ex.description && <div style={{ fontSize: '0.85rem', color: '#6b6252' }}>{ex.description}</div>}
                          </td>
                          <td>Syllabus_v1.pdf</td>
                          <td>{startDateStr}</td>
                          <td>2 hours</td>
                          <td style={{ textAlign: 'center' }}>{ex.maxMarks ? Math.round(ex.maxMarks / 5) : 20}</td>
                          <td>
                            <span className="exam-status-badge active">Active</span>
                          </td>
                          <td><span style={{ letterSpacing: '2px', fontWeight: 'bold', color: '#6b6252' }}>...</span></td>
                        </tr>
                      );
                    })}
                    {exams.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No scheduled exams found. Click "+ ADD EXAM" to create one.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="dashboard-sidebar">
            <div className="sidebar-widget">
              <h4>Quick Stats & Resources</h4>
              <ul>
                <li><span>Active Exams: {activeExamsCount} (Total: {totalExamsCount}) ★</span></li>
                <li><span>Pending Syllabuses: {syllabusList.length} ★</span></li>
                <li><span>Question Bank Count: {questionsList.length * 15 + 300}</span></li>
              </ul>
            </div>

            <div className="sidebar-widget">
              <h4>Draft List</h4>
              <ul>
                <li style={{ background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#2b2a28' }}>Draft Exam Configs ({totalExamsCount})</span>
                  <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>⋮</span>
                </li>
                <li style={{ background: 'rgba(255,255,255,0.3)', padding: '8px 10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#6b6252' }}>System Status: Online</span>
                  <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>⋮</span>
                </li>
              </ul>
              <button 
                onClick={() => alert('Navigating to detailed reports...')}
                className="manage-btn manage-btn--primary"
                style={{ width: '100%', marginTop: '14px', padding: '10px', fontSize: '0.95rem' }}>
                Detailed Reports &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW 2: SUB-TABS WORKSPACE --- */}
      {viewMode === 'workspace' && (
        <div>
          <button 
            onClick={() => setViewMode('list')} 
            className="manage-btn manage-btn--secondary"
            style={{ marginBottom: '18px', padding: '8px 16px', fontSize: '0.9rem' }}>
            &larr; Back to All Exams
          </button>

          <div className="esq-subtabs">
            <button 
              onClick={() => setActiveTab('exams')}
              className={`esq-tab-btn ${activeTab === 'exams' ? 'active' : ''}`}>
              Exams
            </button>
            <button 
              onClick={() => setActiveTab('syllabus')}
              className={`esq-tab-btn ${activeTab === 'syllabus' ? 'active' : ''}`}>
              Syllabus
            </button>
            <button 
              onClick={() => setActiveTab('grades')}
              className={`esq-tab-btn ${activeTab === 'grades' ? 'active' : ''}`}>
              Grades
            </button>
            <button 
              onClick={() => setActiveTab('questions')}
              className={`esq-tab-btn ${activeTab === 'questions' ? 'active' : ''}`}>
              Questions & Sets
            </button>
          </div>

          {activeTab === 'exams' && (
            <div className="manage-card">
              <h3>Exam Configurator</h3>
              <form onSubmit={handleCreateExam} className="manage-form">
                <div>
                  <label>Exam Title</label>
                  <input type="text" placeholder="Exam Name" value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} required />
                </div>
                <div>
                  <label>Description</label>
                  <textarea placeholder="Description" value={examForm.description} onChange={e => setExamForm({ ...examForm, description: e.target.value })} />
                </div>
                <div className="manage-row">
                  <div className="manage-col">
                    <label>Start Date & Time</label>
                    <input type="datetime-local" value={examForm.startDate} onChange={e => setExamForm({ ...examForm, startDate: e.target.value })} required />
                  </div>
                  <div className="manage-col">
                    <label>End Date</label>
                    <input type="datetime-local" value={examForm.endDate} onChange={e => setExamForm({ ...examForm, endDate: e.target.value })} required />
                  </div>
                </div>
                <div className="manage-row">
                  <div className="manage-col">
                    <label>Max Marks</label>
                    <input type="number" placeholder="Max Marks" value={examForm.maxMarks} onChange={e => setExamForm({ ...examForm, maxMarks: Number(e.target.value) })} required />
                  </div>
                  <div className="manage-col">
                    <label>Min Marks Required</label>
                    <input type="number" placeholder="Min Marks Required" value={examForm.minimumMarksRequired ?? ''} onChange={e => setExamForm({ ...examForm, minimumMarksRequired: Number(e.target.value) })} />
                  </div>
                </div>
                <button type="submit" className="manage-btn manage-btn--primary">Save Exam</button>
              </form>
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div>
              <div className="manage-field">
                <label><strong>Select Exam: </strong></label>
                <select value={selectedExamForSyllabus} onChange={e => setSelectedExamForSyllabus(Number(e.target.value))}>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Syllabus Integration</h3>
                <button 
                  onClick={() => setIsSyllabusModalOpen(true)} 
                  className="manage-btn manage-btn--success">
                  + Upload New Syllabus
                </button>
              </div>

              <ul className="manage-list">
                {syllabusList.map(s => (
                  <li key={s.id} className="manage-item">
                    <div>
                      <h4>{s.topicName}</h4>
                      <p>{s.description}</p>
                      <small>Active</small>
                    </div>
                  </li>
                ))}
                {syllabusList.length === 0 && <p>No syllabus topics added yet. Click "+ Upload New Syllabus" to add one.</p>}
              </ul>

              {isSyllabusModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>Configure Syllabus Topic</h3>
                      <button onClick={() => setIsSyllabusModalOpen(false)} className="modal-close-btn">&times;</button>
                    </div>

                    <form onSubmit={handleCreateSyllabus} className="manage-form">
                      <div>
                        <label>Topic Name</label>
                        <input type="text" placeholder="Topic Name" value={syllabusForm.topicName} onChange={e => setSyllabusForm({ ...syllabusForm, topicName: e.target.value })} required />
                      </div>
                      <div>
                        <label>Description</label>
                        <textarea placeholder="Description" value={syllabusForm.description} onChange={e => setSyllabusForm({ ...syllabusForm, description: e.target.value })} />
                      </div>
                      <div className="manage-row">
                        <div className="manage-col">
                          <label>Max Marks</label>
                          <input type="number" placeholder="Max Marks" value={syllabusForm.maxMarks ?? ''} onChange={e => setSyllabusForm({ ...syllabusForm, maxMarks: Number(e.target.value) })} />
                        </div>
                        <div className="manage-col">
                          <label>Mark Value Type</label>
                          <select value={syllabusForm.markValueType ?? 1} onChange={e => setSyllabusForm({ ...syllabusForm, markValueType: Number(e.target.value) })}>
                            <option value={1}>Percentage</option>
                            <option value={2}>Flat</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label>Max Questions</label>
                        <input type="number" placeholder="Max Questions" value={syllabusForm.maxQuestions ?? ''} onChange={e => setSyllabusForm({ ...syllabusForm, maxQuestions: Number(e.target.value) })} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button type="button" onClick={() => setIsSyllabusModalOpen(false)} className="manage-btn manage-btn--secondary">Cancel</button>
                        <button type="submit" className="manage-btn manage-btn--success">Save Syllabus</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'grades' && (
            <div>
              <div className="manage-field">
                <label><strong>Select Exam: </strong></label>
                <select value={selectedExamForGrades} onChange={e => setSelectedExamForGrades(Number(e.target.value))}>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>

              <div className="manage-card">
                <h3>Grade Scale Settings</h3>
                <form onSubmit={handleCreateGrade} className="manage-form">
                  <div>
                    <label>Grade Name (e.g., A+)</label>
                    <input type="text" placeholder="Grade Name" value={gradeForm.name} onChange={e => setGradeForm({ ...gradeForm, name: e.target.value })} required />
                  </div>
                  <div className="manage-row">
                    <div className="manage-col">
                      <label>Min Score (%)</label>
                      <input type="number" placeholder="Min Score (%)" value={gradeForm.min} onChange={e => setGradeForm({ ...gradeForm, min: Number(e.target.value) })} required />
                    </div>
                    <div className="manage-col">
                      <label>Max Score (%)</label>
                      <input type="number" placeholder="Max Score (%)" value={gradeForm.max} onChange={e => setGradeForm({ ...gradeForm, max: Number(e.target.value) })} required />
                    </div>
                  </div>
                  <div>
                    <label>CGPA (e.g., 4.00)</label>
                    <input type="number" step="0.01" placeholder="CGPA" value={gradeForm.cgpa} onChange={e => setGradeForm({ ...gradeForm, cgpa: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <label className="manage-check">
                      <input type="checkbox" checked={gradeForm.isPassGrade} onChange={e => setGradeForm({ ...gradeForm, isPassGrade: e.target.checked })} /> Is Passing Grade
                    </label>
                  </div>
                  <button type="submit" className="manage-btn manage-btn--primary">Add Grade Scale</button>
                </form>
              </div>

              <h3>Configured Grade Boundaries</h3>
              <ul className="manage-list">
                {gradesList.map((g, idx) => (
                  <li key={idx} className="manage-item">
                    <div>
                      <h4>{g.name} (CGPA: {g.cgpa})</h4>
                      <p>{g.min}% - {g.max}% [{g.isPassGrade ? 'PASS' : 'FAIL'}]</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'questions' && (
            <div>
              <div className="manage-field">
                <label><strong>Select Exam: </strong></label>
                <select value={selectedExamForQuestions} onChange={e => setSelectedExamForQuestions(Number(e.target.value))}>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>

              <div className="manage-card">
                <h3>Question Sets & Authoring</h3>
                <form onSubmit={handleCreateQuestionSet} className="manage-row" style={{ marginBottom: '20px' }}>
                  <input type="text" placeholder="New Set Name (e.g. Set A)" value={newSetName} onChange={e => setNewSetName(e.target.value)} required className="manage-grow" />
                  <button type="submit" className="manage-btn manage-btn--success">Create Set</button>
                </form>

                {sets.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <label><strong>Select Question Set: </strong></label>
                    <select value={selectedSetId} onChange={e => setSelectedSetId(Number(e.target.value))}>
                      {sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {selectedSetId && (
                <div className="manage-card">
                  <h3>Manual Question Authoring</h3>
                  <form onSubmit={handleCreateQuestion} className="manage-form">
                    <div>
                      <label>Question Title</label>
                      <input type="text" placeholder="Question Title" value={questionTitle} onChange={e => setQuestionTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label>Description (optional)</label>
                      <textarea placeholder="Description" value={questionDesc} onChange={e => setQuestionDesc(e.target.value)} />
                    </div>
                    <div className="manage-row">
                      <div className="manage-col">
                        <label>Marks</label>
                        <input type="number" placeholder="Marks" value={questionMarks} onChange={e => setQuestionMarks(Number(e.target.value))} required />
                      </div>
                      <div className="manage-col">
                        <label>Question Type</label>
                        <select value={questionType} onChange={e => setQuestionType(Number(e.target.value))}>
                          <option value={1}>MCQ</option>
                          <option value={2}>True / False</option>
                          <option value={3}>Descriptive</option>
                          <option value={4}>Short Answer</option>
                          <option value={5}>Code or File</option>
                        </select>
                      </div>
                    </div>

                    {/* Integrated Options Builder for MCQ / True False */}
                    {(questionType === 1 || questionType === 2) && (
                      <div style={{ margin: '15px 0', padding: '16px', background: 'rgba(255,255,255,0.45)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.7)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <label style={{ fontWeight: 600 }}>Answer Options & Correct Answer Designation</label>
                          <button type="button" onClick={handleAddOptionRow} className="manage-btn manage-btn--secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                            + Add Option
                          </button>
                        </div>
                        
                        {questionOptions.map((opt, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                            <input 
                              type="text" 
                              placeholder={`Option ${idx + 1} text`} 
                              value={opt.title} 
                              onChange={e => handleOptionChange(idx, 'title', e.target.value)}
                              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.9)' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <input 
                                type="checkbox" 
                                checked={opt.isCorrect} 
                                onChange={e => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                              /> Correct
                            </label>
                            {questionOptions.length > 2 && (
                              <button type="button" onClick={() => handleRemoveOptionRow(idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}>
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label>Optional Image Attachment</label>
                      <input type="file" onChange={e => setQuestionImage(e.target.files ? e.target.files[0] : null)} />
                    </div>
                    <button type="submit" className="manage-btn manage-btn--primary">Add Question to Set</button>
                  </form>

                  <h4 style={{ marginTop: '25px', marginBottom: '15px' }}>Questions in Selected Set</h4>
                  <ul className="manage-list">
                    {questionsList.map((item) => (
                      <li key={item.question.id} className="manage-item manage-item--stack">
                        <div className="manage-item-head">
                          <h4>{item.question.title}</h4>
                          <small>{item.question.marks} Marks</small>
                        </div>
                        {item.options && item.options.length > 0 && (
                          <ul className="manage-options">
                            {item.options.map((o) => (
                              <li key={o.id} className={o.isCorrect ? 'option-correct' : undefined}>
                                {o.title} {o.isCorrect ? '(Correct)' : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ESQ_Manage;
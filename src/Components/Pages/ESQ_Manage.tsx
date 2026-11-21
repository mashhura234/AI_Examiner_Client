import React, { useEffect, useState } from 'react';
import axios from '../../interceptor';
import { examServices } from '../../Services/examServices';
import { syllabusServices } from '../../Services/syllabusServices';
import { gradeServices } from '../../Services/gradeServices';
import { questionServices } from '../../Services/questionServices';

import type { Exam, CreateExamRequest } from '../../Models/examModel';
import type { Syllabus, CreateSyllabusRequest } from '../../Models/syllabusModel';
import type { Grade, SetGradesRequest } from '../../Models/gradeModel';
import type { QuestionSet, QuestionWithOptionsResponse } from '../../Models/questionModel';

import '../../Styles/ESQ_Manage.css';

// **COMPONENT: ESQ_MANAGE MAIN CONTAINER**
export const ESQ_Manage: React.FC = () => {
  // **VIEW, TAB & FEEDBACK STATE**
  const [viewMode, setViewMode] = useState<'list' | 'workspace'>('list');
  const [activeTab, setActiveTab] = useState<'exams' | 'syllabus' | 'grades' | 'questions'>('exams');
  const [editingExamId, setEditingExamId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState<boolean>(false);
  const [isAiSuccessModalOpen, setIsAiSuccessModalOpen] = useState<boolean>(false);

  // **1. EXAMS STATE WITH PARTICIPANT MAPPING**
  const [exams, setExams] = useState<Exam[]>([]);
  const [examSyllabiMap, setExamSyllabiMap] = useState<{ [examId: number]: string }>({});
  const [examParticipantsMap, setExamParticipantsMap] = useState<{ [examId: number]: number }>({});

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

  // **2. SYLLABUS STATE**
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

  // **3. GRADES STATE**
  const [selectedExamForGrades, setSelectedExamForGrades] = useState<number | ''>('');
  const [gradesList, setGradesList] = useState<Grade[]>([]);
  const [standardGradesList, setStandardGradesList] = useState<Grade[]>([]);
  const [gradeForm, setGradeForm] = useState<SetGradesRequest>({
    name: 'A',
    min: 80,
    max: 100,
    cgpa: 4.0,
    isPassGrade: true,
  });

  // **4. QUESTIONS & SETS STATE**
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState<number | ''>('');
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | ''>('');
  const [questionsList, setQuestionsList] = useState<QuestionWithOptionsResponse[]>([]);
  
  const [questionExamSyllabi, setQuestionExamSyllabi] = useState<Syllabus[]>([]);
  const [showSyllabusRef, setShowSyllabusRef] = useState<boolean>(true);

  // **AI QUESTION GENERATION STATE**
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // **5. DASHBOARD STATS & QUESTION AUTHORING STATE**
  const [totalSyllabiCount, setTotalSyllabiCount] = useState<number>(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(0);
  
  const [newSetName, setNewSetName] = useState<string>('');
  const [questionTitle, setQuestionTitle] = useState<string>('');
  const [questionDesc, setQuestionDesc] = useState<string>('');
  const [questionMarks, setQuestionMarks] = useState<number>(5);
  const [questionType, setQuestionType] = useState<number>(1);
  const [questionImage, setQuestionImage] = useState<File | null>(null);

  const [questionOptions, setQuestionOptions] = useState<{ title: string; isCorrect: boolean; imageFile?: File | null }[]>([
    { title: '', isCorrect: false, imageFile: null },
    { title: '', isCorrect: false, imageFile: null },
    { title: '', isCorrect: false, imageFile: null },
    { title: '', isCorrect: false, imageFile: null },
  ]);

  // **FETCH EXAMS, SYLLABI SUMMARY & PARTICIPANT COUNTS**
  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await examServices.getMyExams();
      const examArray = Array.isArray(data) ? data : [];
      setExams(examArray);
      
      if (examArray.length > 0) {
        setSelectedExamForSyllabus(prev => (prev === '' ? examArray[0].id : prev));
        setSelectedExamForGrades(prev => (prev === '' ? examArray[0].id : prev));
        setSelectedExamForQuestions(prev => (prev === '' ? examArray[0].id : prev));

        const syllabiTempMap: { [id: number]: string } = {};
        const participantsTempMap: { [id: number]: number } = {};

        for (const ex of examArray) {
          try {
            const sylResponse: any = await syllabusServices.getSyllabusByExamId(ex.id);
            let syllabusArray: any[] = [];
            
            if (Array.isArray(sylResponse)) {
              syllabusArray = sylResponse;
            } else if (sylResponse && typeof sylResponse === 'object') {
              syllabusArray = sylResponse.syllabus || sylResponse.items || sylResponse.data || [];
            }

            if (syllabusArray.length > 0) {
              syllabiTempMap[ex.id] = syllabusArray
                .map((s: any) => s.title || s.topicName || '')
                .filter(Boolean)
                .join(', ');
            } else {
              syllabiTempMap[ex.id] = 'No Syllabus Assigned';
            }
          } catch {
            syllabiTempMap[ex.id] = 'No Syllabus Assigned';
          }

          participantsTempMap[ex.id] = 1;
        }

        setExamSyllabiMap(syllabiTempMap);
        setExamParticipantsMap(participantsTempMap);
      }
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to load exams.');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  // **INITIAL EXAMS & STANDARD GRADES EFFECT**
  useEffect(() => {
    fetchExams();
    gradeServices.getStandardGrades()
      .then(data => setStandardGradesList(Array.isArray(data) ? data : []))
      .catch(() => setStandardGradesList([]));
  }, []);

  // **EXAM DELETE, ARCHIVE & EDIT HANDLERS**
  const handleDeleteExam = async (examId: number) => {
    if (!window.confirm('Are you sure you want to delete this archived exam?')) return;
    try {
      setError(null);
      await examServices.deleteExam(examId);
      setMessage('Archived exam deleted successfully.');
      fetchExams();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data || 'Failed to delete exam.');
    }
  };

  const handleArchiveExam = async (examId: number) => {
    if (!window.confirm('Are you sure you want to archive this exam?')) return;
    try {
      setError(null);
      const res = await (examServices as any).archiveExam(examId);
      setMessage(res?.message || 'Exam archived successfully.');
      fetchExams();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data || 'Failed to archive exam.');
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExamId(exam.id);
    setExamForm({
      name: exam.name || (exam as any).title || '',
      description: exam.description || '',
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : '',
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : '',
      resultPublishDate: exam.resultPublishDate ? new Date(exam.resultPublishDate).toISOString().slice(0, 16) : '',
      allowGrading: exam.allowGrading ?? true,
      maxMarks: exam.maxMarks ?? 100,
      minimumMarksRequired: exam.minimumMarksRequired ?? 40,
      status: exam.status ?? 1,
    });
    setViewMode('workspace');
    setActiveTab('exams');
  };

  // **DASHBOARD TOTAL SYLLABI & QUESTIONS COUNTER EFFECT**
  useEffect(() => {
    const safeExamsList = Array.isArray(exams) ? exams : [];
    if (!safeExamsList.length) {
      setTotalSyllabiCount(0);
      setTotalQuestionsCount(0);
      return;
    }

    let isMounted = true;
    const calculateFrontendTotals = async () => {
      let syllabusSum = 0;
      let questionSum = 0;

      for (const ex of safeExamsList) {
        try {
          const syls = await syllabusServices.getSyllabusByExamId(ex.id);
          if (Array.isArray(syls)) {
            syllabusSum += syls.length;
          }
        } catch {}

        try {
          const setsData = await questionServices.getSetsByExam(ex.id);
          if (Array.isArray(setsData)) {
            for (const set of setsData) {
              const questions = await questionServices.getQuestionsBySet(set.id);
              if (Array.isArray(questions)) {
                questionSum += questions.length;
              }
            }
          }
        } catch {}
      }

      if (isMounted) {
        setTotalSyllabiCount(syllabusSum);
        setTotalQuestionsCount(questionSum);
      }
    };

    calculateFrontendTotals();

    return () => {
      isMounted = false;
    };
  }, [exams]);

  // **FETCH SYLLABUS FOR SELECTED SYLLABUS EXAM EFFECT**
  useEffect(() => {
    if (!selectedExamForSyllabus) return;
    const fetchSyllabus = async () => {
      try {
        const data = await syllabusServices.getSyllabusByExamId(Number(selectedExamForSyllabus));
        setSyllabusList(Array.isArray(data) ? data : []);
      } catch (err) {
        setSyllabusList([]);
      }
    };
    fetchSyllabus();
  }, [selectedExamForSyllabus]);

  // **FETCH SYLLABUS REFERENCE FOR SELECTED QUESTION EXAM EFFECT**
  useEffect(() => {
    if (!selectedExamForQuestions) {
      setQuestionExamSyllabi([]);
      return;
    }
    const fetchQuestionSyllabi = async () => {
      try {
        const data = await syllabusServices.getSyllabusByExamId(Number(selectedExamForQuestions));
        setQuestionExamSyllabi(Array.isArray(data) ? data : []);
      } catch (err) {
        setQuestionExamSyllabi([]);
      }
    };
    fetchQuestionSyllabi();
  }, [selectedExamForQuestions]);

  // **CREATE SYLLABUS TOPIC HANDLER**
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
      setSyllabusList(Array.isArray(updated) ? updated : []);
      
      if (selectedExamForQuestions === selectedExamForSyllabus) {
        setQuestionExamSyllabi(Array.isArray(updated) ? updated : []);
      }
      
      fetchExams();
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create syllabus.');
    }
  };

  // **FETCH GRADES FOR SELECTED EXAM EFFECT**
  useEffect(() => {
    if (!selectedExamForGrades) return;
    const fetchGrades = async () => {
      try {
        const data = await gradeServices.getGradesByExamId(Number(selectedExamForGrades));
        setGradesList(Array.isArray(data) ? data : []);
      } catch (err) {
        setGradesList([]);
      }
    };
    fetchGrades();
  }, [selectedExamForGrades]);

  // **CREATE OR UPDATE EXAM GRADE BOUNDARIES HANDLER**
  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForGrades) return alert('Select an exam first');

    try {
      setError(null);
      const safeGrades = Array.isArray(gradesList) ? gradesList : [];
      const updatedGradesPayload: SetGradesRequest[] = [
        ...safeGrades.map(g => ({
          examId: g.examId,
          name: g.name,
          min: g.min,
          max: g.max,
          cgpa: g.cgpa,
          isPassGrade: g.isPassGrade
        })),
        {
          examId: Number(selectedExamForGrades),
          name: gradeForm.name,
          min: gradeForm.min,
          max: gradeForm.max,
          cgpa: gradeForm.cgpa,
          isPassGrade: gradeForm.isPassGrade
        }
      ];

      const res = await gradeServices.setExamGrades(Number(selectedExamForGrades), updatedGradesPayload);
      setMessage(res.message || 'Custom exam grades configured successfully.');
      setGradeForm({ name: 'A', min: 80, max: 100, cgpa: 4.0, isPassGrade: true });
      const updated = await gradeServices.getGradesByExamId(Number(selectedExamForGrades));
      setGradesList(Array.isArray(updated) ? updated : []);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to configure grade boundaries.');
    }
  };

  // **FETCH QUESTION SETS FOR SELECTED EXAM EFFECT**
  useEffect(() => {
    if (!selectedExamForQuestions) return;
    const fetchSets = async () => {
      try {
        const data = await questionServices.getSetsByExam(Number(selectedExamForQuestions));
        const setsArray = Array.isArray(data) ? data : [];
        setSets(setsArray);
        if (setsArray.length > 0) {
          setSelectedSetId(setsArray[0].id);
        } else {
          setSelectedSetId('');
        }
      } catch (err) {
        setSets([]);
        setSelectedSetId('');
      }
    };
    fetchSets();
  }, [selectedExamForQuestions]);

  // **FETCH QUESTIONS FOR SELECTED SET EFFECT**
  useEffect(() => {
    if (!selectedSetId) return;
    const fetchQuestions = async () => {
      try {
        const data = await questionServices.getQuestionsBySet(Number(selectedSetId));
        setQuestionsList(Array.isArray(data) ? data : []);
      } catch (err) {
        setQuestionsList([]);
      }
    };
    fetchQuestions();
  }, [selectedSetId]);

  // **CREATE OR UPDATE EXAM HANDLER**
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const payload = {
        ...examForm,
        startDate: examForm.startDate ? `${examForm.startDate}:00` : '',
        endDate: examForm.endDate ? `${examForm.endDate}:00` : '',
        resultPublishDate: examForm.resultPublishDate ? `${examForm.resultPublishDate}:00` : null,
      };

      if (editingExamId) {
        const res = await examServices.updateExam(editingExamId, payload);
        setMessage(res?.message || 'Exam updated successfully.');
      } else {
        const res = await examServices.createExam(payload);
        setMessage(res?.message || 'Exam saved successfully.');
      }

      setEditingExamId(null);
      setExamForm({
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
      setViewMode('list');
      fetchExams();
    } catch (err: any) {
      console.error("Error saving exam:", err);
      const errorMsg = err?.response?.data?.message || err?.response?.data || err?.message || 'Failed to save exam.';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  // **CREATE QUESTION SET HANDLER**
  const handleCreateQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForQuestions || !newSetName) return;

    try {
      setError(null);
      const res = await questionServices.createSet({ examId: Number(selectedExamForQuestions), name: newSetName, status: 1 });
      setMessage(res.message || 'Question set created.');
      setNewSetName('');
      const data = await questionServices.getSetsByExam(Number(selectedExamForQuestions));
      const setsArray = Array.isArray(data) ? data : [];
      setSets(setsArray);
      if (setsArray.length > 0) {
        const newlyCreated = setsArray[setsArray.length - 1];
        setSelectedSetId(newlyCreated.id);
      }
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create question set.');
    }
  };

  // **AI QUESTION GENERATOR HANDLER**
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForQuestions || !selectedSetId) {
      alert('Please select an Exam and a Question Set first.');
      return;
    }
    if (!aiPrompt.trim()) {
      alert('Please enter generation rules or prompt.');
      return;
    }

    try {
      setAiLoading(true);
      setError(null);

      const promptStr = `Generate questions for examId:${selectedExamForQuestions} and setId:${selectedSetId}, rules: ${aiPrompt}`;
      
      const response = await axios.post(
        `http://localhost:7165/api/generate-questions?q=${encodeURIComponent(promptStr)}`,
        {},
        { timeout: 60000 }
      );
      
      if (response.data && response.data.success) {
        setMessage('✨ AI questions generated and saved to database successfully!');
        setAiPrompt('');
        setIsAiSuccessModalOpen(true);
        
        const data = await questionServices.getQuestionsBySet(Number(selectedSetId));
        setQuestionsList(Array.isArray(data) ? data : []);
        fetchExams();
      } else {
        setError('AI generation completed with warnings.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate AI questions (Timeout or Connection Error).');
    } finally {
      setAiLoading(false);
    }
  };

  // **OPTION ROW & OPTION IMAGE STATE HANDLERS**
  const handleOptionChange = (
    index: number,
    field: 'title' | 'isCorrect' | 'imageFile',
    value: string | boolean | File | null
  ) => {
    const updated = [...questionOptions];
    if (field === 'title') {
      updated[index].title = value as string;
    } else if (field === 'isCorrect') {
      updated[index].isCorrect = value as boolean;
    } else if (field === 'imageFile') {
      updated[index].imageFile = value as File | null;
    }
    setQuestionOptions(updated);
  };

  const handleAddOptionRow = () => {
    setQuestionOptions([...questionOptions, { title: '', isCorrect: false, imageFile: null }]);
  };

  const handleRemoveOptionRow = (index: number) => {
    setQuestionOptions(questionOptions.filter((_, i) => i !== index));
  };

  // **CREATE QUESTION WITH MAIN & PER-OPTION IMAGE FORM-DATA HANDLER**
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetId) return alert('Select a question set first.');

    try {
      setError(null);
      const formData = new FormData();
      formData.append('SetId', String(selectedSetId));
      formData.append('Title', questionTitle);
      formData.append('Description', questionDesc.trim() !== '' ? questionDesc : questionTitle);
      formData.append('Marks', String(questionMarks));
      formData.append('Type', String(questionType));

      if (questionType === 1 || questionType === 2) {
        const validOptions = questionOptions.filter(o => o.title.trim() !== '');
        formData.append(
          'Options',
          JSON.stringify(validOptions.map(({ title, isCorrect }) => ({ title, isCorrect })))
        );
        validOptions.forEach((opt, idx) => {
          if (opt.imageFile) {
            formData.append(`optionImages_${idx}`, opt.imageFile);
          }
        });
      }

      if (questionImage) {
        formData.append('imageFile', questionImage);
      }

      const res: any = await questionServices.createQuestion(formData);
      const successMessage = res?.data?.message || res?.message || 'Question created successfully.';
      setMessage(successMessage);

      setQuestionTitle('');
      setQuestionDesc('');
      setQuestionMarks(5);
      setQuestionImage(null);
      setQuestionOptions([
        { title: '', isCorrect: false, imageFile: null },
        { title: '', isCorrect: false, imageFile: null },
        { title: '', isCorrect: false, imageFile: null },
        { title: '', isCorrect: false, imageFile: null },
      ]);

      const data = await questionServices.getQuestionsBySet(Number(selectedSetId));
      setQuestionsList(Array.isArray(data) ? data : []);
      fetchExams();
    } catch (err: any) {
      console.error("Error creating question:", err);
      const errorMsg = err?.response?.data?.message || err?.response?.data || err?.message || 'Failed to create question.';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  // **SAFE DERIVED DATA & BACKEND IMAGE ORIGIN**
  const safeExams = Array.isArray(exams) ? exams : [];
  const safeSyllabusList = Array.isArray(syllabusList) ? syllabusList : [];
  const safeGradesList = Array.isArray(gradesList) ? gradesList : [];
  const safeSets = Array.isArray(sets) ? sets : [];
  const safeQuestionsList = Array.isArray(questionsList) ? questionsList : [];

  const activeExamsCount = safeExams.filter(ex => ex.status !== 2 && (ex as any).status !== 'Archived').length;
  const totalExamsCount = safeExams.length;

  // Backend origin for resolving relative image paths (/uploads/questions/...)
  const backendOrigin = 'https://localhost:7240';

  return (
    <div className="manage-page">
      {/* **PAGE HEADER & STATUS ALERTS** */}
      <h2>Exam & Syllabus Management</h2>

      {message && <p className="manage-success">{message}</p>}
      {error && <p className="manage-error">{error}</p>}

      {/* **AI GENERATION SUCCESS POP-UP MODAL** */}
      {isAiSuccessModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '30px', maxWidth: '420px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✨🎉</div>
            <h3 style={{ color: '#375534', marginBottom: '10px' }}>AI Generation Success</h3>
            <p style={{ fontSize: '1rem', color: '#2b2a28', marginBottom: '24px', lineHeight: '1.5' }}>
              AI questions generated and saved to database successfully!
            </p>
            <button 
              onClick={() => setIsAiSuccessModalOpen(false)} 
              className="manage-btn manage-btn--primary"
              style={{ padding: '10px 24px', width: '100%', fontSize: '1rem' }}
            >
              Awesome, View Questions
            </button>
          </div>
        </div>
      )}

      {/* **VIEW 1: EXAM LIST DASHBOARD VIEW** */}
      {viewMode === 'list' && (
        <div style={{ width: '100%' }}>
          {/* **DASHBOARD SUMMARY CARDS** */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div className="sidebar-widget" style={{ margin: 0 }}>
              <h4>Quick Stats & Resources</h4>
              <ul>
                <li><span>Active Exams: {activeExamsCount} (Total: {totalExamsCount}) ★</span></li>
                <li><span>Total Syllabi: {totalSyllabiCount} ★</span></li>
                <li><span>Question Bank Count: {totalQuestionsCount}</span></li>
              </ul>
            </div>
            <div className="sidebar-widget" style={{ margin: 0 }}>
              <h4>System Status</h4>
              <ul>
                <li style={{ background: 'rgba(255,255,255,0.3)', padding: '8px 10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#6b6252' }}>System Status: Online</span>
                  <span style={{ fontWeight: 'bold' }}>●</span>
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

          {/* **ALL EXAMS SECTION HEADER & ADD BUTTON** */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>All Exams</h3>
            <button 
              onClick={() => {
                setEditingExamId(null);
                setExamForm({
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
                setViewMode('workspace'); 
                setActiveTab('exams'); 
              }} 
              className="manage-btn manage-btn--primary"
              style={{ padding: '8px 20px', fontSize: '0.95rem' }}>
              + ADD EXAM
            </button>
          </div>

          {/* **ALL EXAMS TABLE WITH DYNAMIC DURATION** */}
          {loading ? <p>Loading exams...</p> : (
            <div className="manage-table-container" style={{ width: '100%', overflowX: 'auto' }}>
              <table className="exam-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Syllabus</th>
                    <th>Date Range</th>
                    <th>Time Range</th>
                    <th>Duration</th>
                    <th>Total Marks</th>
                    <th>Total Questions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {safeExams.map(ex => {
                    const startDateObj = ex.startDate ? new Date(ex.startDate) : null;
                    const endDateObj = ex.endDate ? new Date(ex.endDate) : null;

                    let dateRangeDisplay = 'N/A';
                    if (startDateObj && endDateObj && !isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
                      const startMonthName = startDateObj.toLocaleString('en-US', { month: 'short' });
                      const endMonthName = endDateObj.toLocaleString('en-US', { month: 'short' });
                      const startDay = startDateObj.getDate();
                      const endDay = endDateObj.getDate();
                      const startYear = startDateObj.getFullYear();
                      const endYear = endDateObj.getFullYear();

                      if (startMonthName === endMonthName && startYear === endYear) {
                        dateRangeDisplay = startDay === endDay 
                          ? `${startMonthName} ${startDay}, ${startYear}` 
                          : `${startMonthName} ${startDay} – ${endDay}, ${startYear}`;
                      } else {
                        dateRangeDisplay = `${startMonthName} ${startDay}, ${startYear} – ${endMonthName} ${endDay}, ${endYear}`;
                      }
                    }

                    const startTimeStr = startDateObj && !isNaN(startDateObj.getTime()) ? startDateObj.toLocaleTimeString([], { timeStyle: 'short' }) : '';
                    const endTimeStr = endDateObj && !isNaN(endDateObj.getTime()) ? endDateObj.toLocaleTimeString([], { timeStyle: 'short' }) : '';
                    const timeRangeDisplay = startTimeStr && endTimeStr ? `${startTimeStr} – ${endTimeStr}` : (startTimeStr || 'N/A');

                    let durationDisplay = (ex as any).duration || 'N/A';
                    if (startDateObj && endDateObj && !isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime())) {
                      const diffMs = endDateObj.getTime() - startDateObj.getTime();
                      if (diffMs > 0) {
                        const totalMinutes = Math.round(diffMs / 60000);
                        const days = Math.floor(totalMinutes / (60 * 24));
                        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
                        const minutes = totalMinutes % 60;

                        const parts: string[] = [];
                        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
                        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
                        if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);

                        durationDisplay = parts.length > 0 ? parts.join(' ') : '0 mins';
                      }
                    }

                    const totalMarks = ex.maxMarks ?? (ex as any).totalMarks ?? 100;
                    const totalQuestions = (ex as any).totalQuestions ?? (ex as any).questionsCount ?? (ex.maxMarks ? Math.round(ex.maxMarks / 5) : 20);

                    const syllabusTitle = examSyllabiMap[ex.id] || (ex as any).syllabusName || 'No Syllabus Assigned';
                    
                    const isArchived = ex.status === 2 || (ex as any).status === 'Archived';
                    const statusLabel = isArchived ? 'Archived' : 'Active';
                    const statusBadgeClass = isArchived ? 'archived' : 'active';

                    return (
                      <tr key={ex.id}>
                        <td>
                          <strong>{ex.name || (ex as any).title}</strong>
                          {ex.description && <div style={{ fontSize: '0.85rem', color: '#6b6252' }}>{ex.description}</div>}
                        </td>
                        <td>{syllabusTitle}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{dateRangeDisplay}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{timeRangeDisplay}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{durationDisplay}</td>
                        <td>{totalMarks}</td>
                        <td style={{ textAlign: 'center' }}>{totalQuestions}</td>
                        <td>
                          <span className={`exam-status-badge ${statusBadgeClass}`}>{statusLabel}</span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {!isArchived ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleEditExam(ex)}
                                title="Edit Active Exam"
                                style={{ background: '#375534', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleArchiveExam(ex.id)}
                                title="Archive Exam"
                                style={{ background: '#d97706', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Archive
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleDeleteExam(ex.id)}
                              title="Delete Archived Exam"
                              style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {safeExams.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>No scheduled exams found. Click "+ ADD EXAM" to create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* **VIEW 2: WORKSPACE SUB-TABS CONTAINER** */}
      {viewMode === 'workspace' && (
        <div>
          <button 
            onClick={() => { setEditingExamId(null); setViewMode('list'); }} 
            className="manage-btn manage-btn--secondary"
            style={{ marginBottom: '18px', padding: '8px 16px', fontSize: '0.9rem' }}>
            &larr; Back to All Exams
          </button>

          {/* **SUB-TABS NAVIGATION BAR** */}
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

          {/* **TAB 1: EXAM CONFIGURATOR FORM** */}
          {activeTab === 'exams' && (
            <div className="manage-card">
              <h3>{editingExamId ? 'Edit Exam' : 'Exam Configurator'}</h3>
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
                <button type="submit" className="manage-btn manage-btn--primary">
                  {editingExamId ? 'Update Exam' : 'Save Exam'}
                </button>
              </form>
            </div>
          )}

          {/* **TAB 2: SYLLABUS MANAGEMENT & MODAL** */}
          {activeTab === 'syllabus' && (
            <div>
              <div className="manage-field">
                <label><strong>Select Exam: </strong></label>
                <select value={selectedExamForSyllabus} onChange={e => setSelectedExamForSyllabus(Number(e.target.value))}>
                  {safeExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
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
                {safeSyllabusList.map(s => (
                  <li key={s.id} className="manage-item">
                    <div>
                      <h4>{s.topicName}</h4>
                      <p>{s.description}</p>
                      <small>Active</small>
                    </div>
                  </li>
                ))}
                {safeSyllabusList.length === 0 && <p>No syllabus topics added yet. Click "+ Upload New Syllabus" to add one.</p>}
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

          {/* **TAB 3: GRADE SCALE SETTINGS** */}
          {activeTab === 'grades' && (
            <div>
              <div className="manage-field">
                <label><strong>Select Exam: </strong></label>
                <select value={selectedExamForGrades} onChange={e => setSelectedExamForGrades(Number(e.target.value))}>
                  {safeExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>

              <div className="manage-card">
                <h3>Grade Scale Settings (Custom Exam Rubric / Fallback to Standard)</h3>
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
                  <button type="submit" className="manage-btn manage-btn--primary">Add / Update Grade Scale</button>
                </form>
              </div>

              <h3>Configured Grade Boundaries for Selected Exam</h3>
              <ul className="manage-list">
                {safeGradesList.map((g, idx) => (
                  <li key={idx} className="manage-item">
                    <div>
                      <h4>{g.name} (CGPA: {g.cgpa}) {g.examId ? <span style={{fontSize: '0.75rem', color: '#0d6efd'}}>[Custom Rubric]</span> : <span style={{fontSize: '0.75rem', color: '#6c757d'}}>[Standard Rubric Fallback]</span>}</h4>
                      <p>{g.min}% - {g.max}% [{g.isPassGrade ? 'PASS' : 'FAIL'}]</p>
                    </div>
                  </li>
                ))}
                {safeGradesList.length === 0 && <p>No custom grades configured. Using system standard grades.</p>}
              </ul>
            </div>
          )}

          {/* **TAB 4: QUESTIONS, SETS, AI GENERATOR & PREVIEW** */}
          {activeTab === 'questions' && (
            <div>
              <div className="manage-field">
                <label><strong>Select Exam: </strong></label>
                <select value={selectedExamForQuestions} onChange={e => setSelectedExamForQuestions(Number(e.target.value))}>
                  {safeExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>

              {/* **SYLLABUS REFERENCE GUIDE CARD** */}
              <div className="manage-card" style={{ background: 'rgba(245, 240, 230, 0.7)', marginBottom: '20px', border: '1px solid rgba(120,90,30,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowSyllabusRef(!showSyllabusRef)}>
                  <h4 style={{ margin: 0, color: '#375534' }}>📚 Syllabus Reference Guide (For Question Authoring)</h4>
                  <button type="button" className="manage-btn manage-btn--secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                    {showSyllabusRef ? 'Hide Reference' : 'Show Reference'}
                  </button>
                </div>

                {showSyllabusRef && (
                  <div style={{ marginTop: '12px', maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                    {questionExamSyllabi.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px' }}>
                        {questionExamSyllabi.map((s: any, idx: number) => (
                          <li key={idx} style={{ fontSize: '0.9rem', color: '#2b2a28' }}>
                            <strong>{s.topicName || s.title}:</strong> {s.description || 'No details provided.'} (Max Marks: {s.maxMarks})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontStyle: 'italic', color: '#6b6252', fontSize: '0.9rem' }}>
                        No syllabus topics linked to this exam yet. Faculty can author questions based on course guidelines.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* **QUESTION SETS & AUTHORING CARD** */}
              <div className="manage-card">
                <h3>Question Sets & Authoring</h3>
                <form onSubmit={handleCreateQuestionSet} className="manage-row" style={{ marginBottom: '20px' }}>
                  <input type="text" placeholder="New Set Name (e.g. Set A)" value={newSetName} onChange={e => setNewSetName(e.target.value)} required className="manage-grow" />
                  <button type="submit" className="manage-btn manage-btn--success">Create Set</button>
                </form>

                {safeSets.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <label><strong>Select Question Set: </strong></label>
                    <select value={selectedSetId} onChange={e => setSelectedSetId(Number(e.target.value))}>
                      {safeSets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* **AI AGENT QUESTION GENERATOR CARD** */}
              <div className="manage-card" style={{ background: 'linear-gradient(135deg, rgba(235, 245, 238, 0.85), rgba(245, 240, 230, 0.85))', border: '1px solid rgba(55, 85, 52, 0.3)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, color: '#375534' }}>✨ AI Agent Question Generator</h3>
                  <span style={{ fontSize: '0.8rem', color: '#375534', fontWeight: 600 }}>Gemini MCP Toolkit</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#6b6252', marginBottom: '12px' }}>
                  Provide rules and prompt instructions to let Gemini automatically fetch exam details, review the syllabus, and generate questions directly into your selected Question Set.
                </p>

                <form onSubmit={handleAiGenerate}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Generation Prompt & Rules</label>
                    <textarea 
                      placeholder="e.g., 2 MCQ questions with 3 options and 1 descriptive question on computer networks."
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.8)' }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#375534' }}>
                      Target: <strong>Exam #{selectedExamForQuestions || 'None'}</strong> | <strong>Set #{selectedSetId || 'None'}</strong>
                    </span>
                    <button 
                      type="submit" 
                      className="manage-btn manage-btn--primary" 
                      disabled={aiLoading || !selectedSetId}
                      style={{ padding: '8px 20px' }}
                    >
                      {aiLoading ? 'Generating with AI...' : '✨ Generate & Save Questions'}
                    </button>
                  </div>
                </form>
              </div>

              {/* **MANUAL QUESTION AUTHORING FORM** */}
              <div className="manage-card">
                <h3>Manual Question Authoring</h3>
                {!selectedSetId ? (
                  <p style={{ color: '#6b6252', fontStyle: 'italic' }}>Please create or select a question set above to start adding questions.</p>
                ) : (
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

                    {/* **OPTIONS & PER-OPTION IMAGE UPLOAD ROWS** */}
                    {(questionType === 1 || questionType === 2) && (
                      <div style={{ margin: '15px 0', padding: '16px', background: 'rgba(255,255,255,0.45)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.7)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <label style={{ fontWeight: 600 }}>Answer Options & Correct Answer Designation</label>
                          <button type="button" onClick={handleAddOptionRow} className="manage-btn manage-btn--secondary" style={{ padding: '4px 12px', fontSize: '0.85rem' }}>+ Add Option</button>
                        </div>
                        {questionOptions.map((opt, idx) => (
                          <div key={idx} className="esq-option-row">
                            <input 
                              type="text" 
                              placeholder={`Option ${idx + 1} text`} 
                              value={opt.title} 
                              onChange={e => handleOptionChange(idx, 'title', e.target.value)} 
                              className="esq-option-text-input"
                            />
                            <label className="esq-option-file-label" title="Attach Option Image (optional)">
                              <span>{opt.imageFile ? `🖼️ ${opt.imageFile.name}` : '📷 Image'}</span>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,image/*"
                                onChange={e => handleOptionChange(idx, 'imageFile', e.target.files ? e.target.files[0] : null)}
                              />
                            </label>
                            <label className="esq-option-correct-label">
                              <input 
                                type="checkbox" 
                                checked={opt.isCorrect} 
                                onChange={e => handleOptionChange(idx, 'isCorrect', e.target.checked)} 
                              /> Correct
                            </label>
                            {questionOptions.length > 2 && (
                              <button type="button" onClick={() => handleRemoveOptionRow(idx)} className="manage-btn manage-btn--danger esq-option-remove-btn">&times;</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* **MAIN QUESTION IMAGE UPLOAD INPUT** */}
                    <div>
                      <label>Attach Image (optional)</label>
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,image/*" onChange={e => setQuestionImage(e.target.files ? e.target.files[0] : null)} />
                    </div>

                    <button type="submit" className="manage-btn manage-btn--primary" style={{ marginTop: '15px' }}>Save Question</button>
                  </form>
                )}
              </div>

              {/* **CREATED QUESTIONS & OPTION IMAGES PREVIEW LIST** */}
              <div className="manage-card" style={{ marginTop: '20px' }}>
                <h3>Questions in Selected Set ({safeQuestionsList.length})</h3>
                <ul className="manage-list">
                  {safeQuestionsList.length > 0 ? (
                    safeQuestionsList.map((q: any, idx: number) => {
                      if (!q) return null;

                      const target = q.question || q.questionDetails || q;

                      const displayTitle = target.title || target.Title || target.questionText || target.QuestionText || target.name || target.Name || target.question || target.Question || target.text || target.Text || `Question ${idx + 1}`;
                      const displayMarks = target.marks ?? target.Marks ?? target.mark ?? target.Mark ?? target.score ?? target.Score ?? target.points ?? target.Points ?? target.maxMarks ?? target.MaxMarks ?? q.marks ?? q.Marks ?? 5;
                      const displayDesc = target.description || target.Description || target.details || target.Details || q.description || q.Description || '';
                      
                      const rawImageUrl: string = target.imageUrl || target.ImageUrl || target.imagePath || target.ImagePath || q.imageUrl || q.imagePath || '';
                      const fullImageUrl = rawImageUrl
                        ? (rawImageUrl.startsWith('http') ? rawImageUrl : `${backendOrigin}${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`)
                        : '';

                      let rawOptions = target.options || target.Options || q.options || q.Options || [];
                      if (typeof rawOptions === 'string') {
                        try { rawOptions = JSON.parse(rawOptions); } catch { rawOptions = []; }
                      }
                      const options = Array.isArray(rawOptions) ? rawOptions : [];

                      return (
                        <li key={q.id || q.Id || target.id || idx} className="manage-item" style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.6)', marginBottom: '12px', borderRadius: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <strong style={{ fontSize: '1rem', color: '#2b2a28' }}>Q{idx + 1}: {displayTitle}</strong>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#375534', background: 'rgba(55,85,52,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{displayMarks} Marks</span>
                          </div>
                          {displayDesc && (
                            <p style={{ fontSize: '0.9rem', color: '#6b6252', margin: '4px 0 8px 0' }}>{displayDesc}</p>
                          )}
                          
                          {fullImageUrl && (
                            <div style={{ margin: '10px 0' }}>
                              <img 
                                src={fullImageUrl} 
                                alt="Question Attachment" 
                                className="esq-preview-question-img"
                              />
                            </div>
                          )}

                          {options.length > 0 && (
                            <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid rgba(55,85,52,0.3)' }}>
                              <div style={{ fontSize: '0.80rem', fontWeight: 600, color: '#375534', marginBottom: '4px' }}>Options:</div>
                              <ul style={{ margin: 0, paddingLeft: '16px', display: 'grid', gap: '4px' }}>
                                {options.map((opt: any, optIdx: number) => {
                                  if (!opt) return null;
                                  const optTitle = typeof opt === 'string' ? opt : (opt.title || opt.Title || opt.text || opt.Text || opt.name || opt.Name || '');
                                  const isCorrect = typeof opt === 'object' ? (opt.isCorrect ?? opt.IsCorrect ?? false) : false;
                                  const rawOptImg: string = typeof opt === 'object' ? (opt.imageUrl || opt.ImageUrl || opt.imagePath || opt.ImagePath || '') : '';
                                  const fullOptImg = rawOptImg
                                    ? (rawOptImg.startsWith('http') ? rawOptImg : `${backendOrigin}${rawOptImg.startsWith('/') ? '' : '/'}${rawOptImg}`)
                                    : '';

                                  return (
                                    <li key={opt.id || opt.Id || optIdx} className={`esq-preview-option-item ${isCorrect ? 'is-correct' : ''}`}>
                                      <span>{String.fromCharCode(65 + optIdx)}. {optTitle} {isCorrect && '✓ (Correct)'}</span>
                                      {fullOptImg && (
                                        <img
                                          src={fullOptImg}
                                          alt={`Option ${String.fromCharCode(65 + optIdx)}`}
                                          className="esq-preview-option-img"
                                        />
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#6b6252' }}>No questions added to this set yet.</p>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ESQ_Manage;

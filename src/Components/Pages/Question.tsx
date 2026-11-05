import React, { useEffect, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { questionServices } from '../../Services/questionServices';
import type { Exam } from '../../Models/examModel';
import type { QuestionSet, QuestionWithOptionsResponse, CreateQuestionOptionDto } from '../../Models/questionModel';

export const Question: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | ''>('');
  
  const [questions, setQuestions] = useState<QuestionWithOptionsResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // New Set Form State
  const [setName, setSetName] = useState<string>('');

  // New Question Form State
  const [qType, setQType] = useState<number>(1); // 1: MCQ
  const [qTitle, setQTitle] = useState<string>('');
  const [qDescription, setQDescription] = useState<string>('');
  const [qMarks, setQMarks] = useState<number>(5);
  const [qIsRequired, setQIsRequired] = useState<boolean>(true);
  const [qImageFile, setQImageFile] = useState<File | null>(null);

  // MCQ Options State
  const [options, setOptions] = useState<CreateQuestionOptionDto[]>([
    { title: '', isCorrect: true },
    { title: '', isCorrect: false },
  ]);

  // Fetch Exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examServices.getMyExams();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id);
        }
      } catch (err: any) {
        setError('Failed to load exams.');
      }
    };
    fetchExams();
  }, []);

  // Fetch Question Sets when selectedExamId changes
  useEffect(() => {
    if (selectedExamId === '') return;
    const fetchSets = async () => {
      try {
        const data = await questionServices.getSetsByExam(Number(selectedExamId));
        setSets(data);
        if (data.length > 0) {
          setSelectedSetId(data[0].id);
        } else {
          setSelectedSetId('');
          setQuestions([]);
        }
      } catch (err: any) {
        setError('Failed to fetch question sets.');
      }
    };
    fetchSets();
  }, [selectedExamId]);

  // Fetch Questions when selectedSetId changes
  useEffect(() => {
    if (selectedSetId === '') return;
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await questionServices.getQuestionsBySet(Number(selectedSetId));
        setQuestions(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to fetch questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [selectedSetId]);

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !setName) return;
    try {
      await questionServices.createSet({ examId: Number(selectedExamId), name: setName, status: 1 });
      setSetName('');
      setMessage('Question set created successfully.');
      // Refresh sets
      const data = await questionServices.getSetsByExam(Number(selectedExamId));
      setSets(data);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create set.');
    }
  };

  const handleOptionChange = (index: number, field: keyof CreateQuestionOptionDto, value: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  const handleAddOption = () => {
    setOptions([...options, { title: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetId) {
      alert('Please select a Question Set first.');
      return;
    }

    const formData = new FormData();
    formData.append('SetId', String(selectedSetId));
    formData.append('Type', String(qType));
    formData.append('Title', qTitle);
    formData.append('Description', qDescription);
    formData.append('Marks', String(qMarks));
    formData.append('IsRequired', String(qIsRequired));

    if (qImageFile) {
      formData.append('ImageFile', qImageFile);
    }

    if (qType === 1 || qType === 2) {
      formData.append('Options', JSON.stringify(options));
    }

    try {
      setError(null);
      await questionServices.createQuestion(formData);
      setMessage('Question created successfully.');
      // Reset form
      setQTitle('');
      setQDescription('');
      setQImageFile(null);
      // Refresh questions list
      const data = await questionServices.getQuestionsBySet(Number(selectedSetId));
      setQuestions(data);
    } catch (err: any) {
      setError(err?.response?.data || 'Failed to create question.');
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await questionServices.deleteQuestion(id);
      setQuestions(questions.filter(q => q.question.id !== id));
    } catch (err: any) {
      alert('Failed to delete question.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Question & Question Set Management</h2>

      {message && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      {/* Select Exam & Set */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <label><strong>Select Exam: </strong></label>
          <select value={selectedExamId} onChange={e => setSelectedExamId(Number(e.target.value))} style={{ padding: '8px', width: '100%', marginTop: '5px' }}>
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label><strong>Select Question Set: </strong></label>
          <select value={selectedSetId} onChange={e => setSelectedSetId(Number(e.target.value))} style={{ padding: '8px', width: '100%', marginTop: '5px' }}>
            {sets.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create Set Form */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Create Question Set</h3>
        <form onSubmit={handleCreateSet} style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Set Name (e.g. Set A)" value={setName} onChange={e => setSetName(e.target.value)} required style={{ flex: 1, padding: '8px' }} />
          <button type="submit" style={{ padding: '8px 15px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            Create Set
          </button>
        </form>
      </div>

      {/* Create Question Form */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Add Question to Set</h3>
        <form onSubmit={handleCreateQuestion} style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Question Type:</label>
              <select value={qType} onChange={e => setQType(Number(e.target.value))} style={{ width: '100%', padding: '6px' }}>
                <option value={1}>MCQ</option>
                <option value={2}>True / False</option>
                <option value={3}>Descriptive</option>
                <option value={4}>Short Answer</option>
                <option value={5}>Code / File</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Marks:</label>
              <input type="number" value={qMarks} onChange={e => setQMarks(Number(e.target.value))} required style={{ width: '100%', padding: '6px' }} />
            </div>
          </div>
          <div>
            <label>Question Title / Statement:</label>
            <input type="text" value={qTitle} onChange={e => setQTitle(e.target.value)} required style={{ width: '100%', padding: '6px' }} />
          </div>
          <div>
            <label>Description / Instructions:</label>
            <textarea value={qDescription} onChange={e => setQDescription(e.target.value)} style={{ width: '100%', padding: '6px' }} />
          </div>
          <div>
            <label>Image Attachment:</label>
            <input type="file" onChange={e => setQImageFile(e.target.files?.[0] || null)} style={{ width: '100%' }} />
          </div>

          {/* Options for MCQ / TrueFalse */}
          {(qType === 1 || qType === 2) && (
            <div style={{ border: '1px dashed #bbb', padding: '10px', marginTop: '10px' }}>
              <h4>Options</h4>
              {options.map((opt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                  <input type="text" placeholder={`Option ${idx + 1}`} value={opt.title} onChange={e => handleOptionChange(idx, 'title', e.target.value)} required style={{ flex: 1, padding: '6px' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input type="checkbox" checked={opt.isCorrect} onChange={e => handleOptionChange(idx, 'isCorrect', e.target.checked)} /> Correct
                  </label>
                  <button type="button" onClick={() => handleRemoveOption(idx)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '4px 8px', cursor: 'pointer' }}>X</button>
                </div>
              ))}
              <button type="button" onClick={handleAddOption} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '3px' }}>
                + Add Option
              </button>
            </div>
          )}

          <button type="submit" style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px', marginTop: '10px' }}>
            Save Question
          </button>
        </form>
      </div>

      {/* Questions List */}
      <h3>Questions in Set</h3>
      {loading && <p>Loading questions...</p>}
      {!loading && questions.length === 0 && <p>No questions found in this set.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {questions.map((item, index) => (
          <li key={item.question.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px', background: '#f9f9f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h4>Q{index + 1}: {item.question.title} ({item.question.marks} Marks)</h4>
              <button onClick={() => handleDeleteQuestion(item.question.id)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '3px' }}>
                Delete
              </button>
            </div>
            <p>{item.question.description}</p>
            {item.options.length > 0 && (
              <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                {item.options.map(opt => (
                  <li key={opt.id} style={{ color: opt.isCorrect ? 'green' : 'inherit', fontWeight: opt.isCorrect ? 'bold' : 'normal' }}>
                    {opt.title} {opt.isCorrect && '✓ (Correct)'}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Question;
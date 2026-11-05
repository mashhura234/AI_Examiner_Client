import React, { useEffect, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { syllabusServices } from '../../Services/syllabusServices';
import type { Exam } from '../../Models/examModel';
import type { Syllabus as SyllabusType, CreateSyllabusRequest } from '../../Models/syllabusModel';

export const Syllabus: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  const [syllabusList, setSyllabusList] = useState<SyllabusType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateSyllabusRequest>({
    examId: 0,
    topicName: '',
    description: '',
    maxMarks: 20,
    markValueType: 1, // 1: Percentage, 2: Flat
    maxQuestions: 5,
    status: 1,
  });

  // Fetch exams on mount so user can link syllabus to an exam
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examServices.getMyExams();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id);
          setFormData((prev: CreateSyllabusRequest) => ({ ...prev, examId: data[0].id }));
        }
      } catch (err: any) {
        setError('Failed to load user exams.');
      }
    };
    fetchExams();
  }, []);

  // Fetch syllabus when selectedExamId changes
  useEffect(() => {
    if (selectedExamId === '') return;
    const fetchSyllabus = async () => {
      try {
        setLoading(true);
        const data = await syllabusServices.getSyllabusByExamId(Number(selectedExamId));
        setSyllabusList(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to fetch syllabus topics.');
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabus();
  }, [selectedExamId]);

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedExamId(id);
    setFormData((prev: CreateSyllabusRequest) => ({ ...prev, examId: id }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: CreateSyllabusRequest) => ({
      ...prev,
      [name]: value === '' ? null : Number(value) || value
    }));
  };

  const handleAddSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      alert('Please select an exam first.');
      return;
    }
    try {
      await syllabusServices.addSyllabus(formData);
      setFormData((prev: CreateSyllabusRequest) => ({
        ...prev,
        topicName: '',
        description: '',
        maxMarks: 20,
        maxQuestions: 5,
      }));
      // Refresh syllabus list
      const data = await syllabusServices.getSyllabusByExamId(Number(selectedExamId));
      setSyllabusList(data);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to add syllabus topic.');
    }
  };

  const handleDeleteSyllabus = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this syllabus topic?')) return;
    try {
      await syllabusServices.deleteSyllabus(id);
      setSyllabusList(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete syllabus topic.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>Syllabus Management</h2>

      {/* Select Exam Dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <label><strong>Select Exam: </strong></label>
        <select value={selectedExamId} onChange={handleExamChange} style={{ padding: '8px', width: '100%', marginTop: '5px' }}>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>
              {exam.name} (ID: {exam.id})
            </option>
          ))}
        </select>
      </div>

      {/* Add Syllabus Form */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Add Syllabus Topic</h3>
        <form onSubmit={handleAddSyllabus} style={{ display: 'grid', gap: '10px' }}>
          <div>
            <label>Topic Name: </label>
            <input type="text" name="topicName" value={formData.topicName} onChange={handleInputChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label>Description: </label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Max Marks: </label>
              <input type="number" name="maxMarks" value={formData.maxMarks ?? ''} onChange={handleInputChange} style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Mark Value Type (1: % , 2: Flat): </label>
              <select name="markValueType" value={formData.markValueType ?? 1} onChange={handleInputChange} style={{ width: '100%', padding: '6px' }}>
                <option value={1}>1 - Percentage</option>
                <option value={2}>2 - Flat</option>
              </select>
            </div>
          </div>
          <div>
            <label>Max Questions: </label>
            <input type="number" name="maxQuestions" value={formData.maxQuestions ?? ''} onChange={handleInputChange} style={{ width: '100%' }} />
          </div>
          <button type="submit" style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Add Syllabus Topic
          </button>
        </form>
      </div>

      {/* Syllabus List */}
      <h3>Topics for Selected Exam</h3>
      {loading && <p>Loading syllabus...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && syllabusList.length === 0 && <p>No syllabus topics found for this exam.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {syllabusList.map(item => (
          <li key={item.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>{item.topicName}</h4>
              <p>{item.description}</p>
              <small>Max Marks: {item.maxMarks} | Type: {item.markValueType === 1 ? 'Percentage' : 'Flat'} | Max Questions: {item.maxQuestions}</small>
            </div>
            <button onClick={() => handleDeleteSyllabus(item.id)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '3px' }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Syllabus;
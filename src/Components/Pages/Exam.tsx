import React, { useEffect, useState } from 'react';
import { examServices } from '../../Services/examServices';
import type { Exam as ExamType, CreateExamRequest } from '../../Models/examModel';

export const Exam: React.FC = () => {
  const [exams, setExams] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateExamRequest>({
    name: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    allowGrading: true,
    maxMarks: 100,
    minimumMarksRequired: 40,
    status: 1,
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await examServices.getMyExams();
      setExams(data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await examServices.createExam(formData);
      setFormData({
        name: '',
        description: '',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        allowGrading: true,
        maxMarks: 100,
        minimumMarksRequired: 40,
        status: 1,
      });
      fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create exam.');
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await examServices.deleteExam(id);
      fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete exam.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>Exam Management Dashboard</h2>

      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Create New Exam</h3>
        <form onSubmit={handleCreateExam} style={{ display: 'grid', gap: '10px' }}>
          <div>
            <label>Exam Name: </label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label>Description: </label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Start Date: </label>
              <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleInputChange} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>End Data: </label>
              <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleInputChange} required style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Max Marks: </label>
              <input type="number" name="maxMarks" value={formData.maxMarks} onChange={handleInputChange} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Min Marks Required: </label>
              <input type="number" name="minimumMarksRequired" value={formData.minimumMarksRequired ?? ''} onChange={handleInputChange} style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <label>
              <input type="checkbox" name="allowGrading" checked={formData.allowGrading} onChange={handleInputChange} /> Allow Grading
            </label>
          </div>
          <button type="submit" style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Create Exam
          </button>
        </form>
      </div>

      <h3>My Exams</h3>
      {loading && <p>Loading exams...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && exams.length === 0 && <p>No exams found.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {exams.map(exam => (
          <li key={exam.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4>{exam.name}</h4>
              <p>{exam.description}</p>
              <small>Max Marks: {exam.maxMarks} | Starts: {new Date(exam.startDate).toLocaleString()} | Ends: {new Date(exam.endDate).toLocaleString()}</small>
            </div>
            <button onClick={() => handleDeleteExam(exam.id)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '3px' }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Exam;
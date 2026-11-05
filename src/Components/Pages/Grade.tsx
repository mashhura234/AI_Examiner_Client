import React, { useEffect, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { gradeServices } from '../../Services/gradeServices';
import type { Exam } from '../../Models/examModel';
import type { Grade as GradeType, SetGradesRequest } from '../../Models/gradeModel';

export const Grade: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | ''>('');
  const [grades, setGrades] = useState<SetGradesRequest[]>([
    { name: 'A+', min: 80, max: 100, cgpa: 4.0, isPassGrade: true },
    { name: 'A', min: 70, max: 79, cgpa: 3.5, isPassGrade: true },
    { name: 'B', min: 60, max: 69, cgpa: 3.0, isPassGrade: true },
    { name: 'F', min: 0, max: 59, cgpa: 0.0, isPassGrade: false },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examServices.getMyExams();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id);
        }
      } catch (err: any) {
        setError('Failed to load user exams.');
      }
    };
    fetchExams();
  }, []);

  // Fetch existing grades when selectedExamId changes
  useEffect(() => {
    if (selectedExamId === '') return;
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const data = await gradeServices.getGradesByExamId(Number(selectedExamId));
        if (data && data.length > 0) {
          setGrades(data.map(g => ({
            name: g.name,
            min: g.min,
            max: g.max,
            cgpa: g.cgpa,
            isPassGrade: g.isPassGrade,
          })));
        }
        setError(null);
      } catch (err: any) {
        setError('Failed to fetch grades for this exam.');
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [selectedExamId]);

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedExamId(Number(e.target.value));
  };

  const handleGradeChange = (index: number, field: keyof SetGradesRequest, value: any) => {
    const updatedGrades = [...grades];
    updatedGrades[index] = {
      ...updatedGrades[index],
      [field]: field === 'name' ? value : field === 'isPassGrade' ? value : Number(value)
    };
    setGrades(updatedGrades);
  };

  const handleAddGradeRow = () => {
    setGrades([...grades, { name: '', min: 0, max: 0, cgpa: 0.0, isPassGrade: true }]);
  };

  const handleRemoveGradeRow = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      alert('Please select an exam first.');
      return;
    }
    try {
      setLoading(true);
      await gradeServices.setExamGrades(Number(selectedExamId), grades);
      setSuccessMessage('Grades configured successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save grades.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>Grade Configuration</h2>

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

      {successMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{successMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Grade Rules Form */}
      <form onSubmit={handleSaveGrades}>
        <h3>Configure Grade Rules</h3>
        {grades.map((grade, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label>Grade Name</label>
              <input type="text" value={grade.name} onChange={e => handleGradeChange(index, 'name', e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Min Mark</label>
              <input type="number" value={grade.min} onChange={e => handleGradeChange(index, 'min', e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Max Mark</label>
              <input type="number" value={grade.max} onChange={e => handleGradeChange(index, 'max', e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label>CGPA</label>
              <input type="number" step="0.1" value={grade.cgpa} onChange={e => handleGradeChange(index, 'cgpa', e.target.value)} required style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 0.8 }}>
              <label>Pass Grade</label>
              <select value={grade.isPassGrade ? 'true' : 'false'} onChange={e => handleGradeChange(index, 'isPassGrade', e.target.value === 'true')} style={{ width: '100%', padding: '4px' }}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <button type="button" onClick={() => handleRemoveGradeRow(index)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 10px', cursor: 'pointer', borderRadius: '3px', marginTop: '18px' }}>
              X
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button type="button" onClick={handleAddGradeRow} style={{ padding: '10px', background: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer' }}>
            + Add Grade Row
          </button>
          <button type="submit" disabled={loading} style={{ padding: '10px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Saving...' : 'Save Grades Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Grade;
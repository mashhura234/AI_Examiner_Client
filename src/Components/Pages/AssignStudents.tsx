import React, { useEffect, useState } from 'react';
import { examServices } from '../../Services/examServices';
import { questionServices } from '../../Services/questionServices';
import { syllabusServices } from '../../Services/syllabusServices';
import { assessmentPortalServices } from '../../Services/assessmentPortalServices';
import type { Exam } from '../../Models/examModel';
import type { QuestionSet } from '../../Models/questionModel';
import type { Syllabus } from '../../Models/syllabusModel';
import type { AssignStudentsDto, UserDto, UserFilter } from '../../Models/assessmentPortalModel';
import '../../Styles/AssessmentPortal.css';

export const AssignStudents: React.FC = () => {
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

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const currentExamName = exams.find(e => e.id === Number(selectedExamId))?.name || 'Selected Exam';
  const currentSetName = sets.find(s => s.id === Number(selectedSetId))?.name || 'Selected Set';
  const currentSyllabusName = syllabusList.find(s => s.id === Number(selectedSyllabusId))?.topicName || 'Selected Syllabus';
  const currentExamTypeName = examType === 1 ? 'Online' : 'Offline';

  return (
    <div className="ap-page">
      <h2>Faculty: Assign Students</h2>

      {message && <p className="ap-success">{message}</p>}
      {error && <p className="ap-error">{error}</p>}

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
    </div>
  );
};

export default AssignStudents;
// src/Services/gradeServices.ts
import axios from '../interceptor';
import { Grade, SetGradesRequest } from '../Models/gradeModel';

export const gradeServices = {
  // Get system-wide standard grades (ExamId IS NULL)
  getStandardGrades: async () => {
    const response = await axios.get<Grade[]>('/Grades/standard');
    return response.data;
  },

  // Get applicable grades for an exam (Custom or fallback to standard)
  getGradesByExamId: async (examId: number) => {
    const response = await axios.get<Grade[]>(`/Grades/exam/${examId}`);
    return response.data;
  },

  // Configure custom grades for a specific exam
  setExamGrades: async (examId: number, grades: SetGradesRequest[]) => {
    const response = await axios.post(`/Grades/exam/${examId}`, grades);
    return response.data;
  }
};
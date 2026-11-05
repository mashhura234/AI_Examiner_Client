import api from "../interceptor";
import { Grade, SetGradesRequest } from "../Models/gradeModel";

const API_URL = "/Grades";

export const gradeServices = {
  // Get grades by Exam ID
  getGradesByExamId: async (examId: number): Promise<Grade[]> => {
    const response = await api.get<Grade[]>(`${API_URL}/exam/${examId}`);
    return response.data;
  },

  // Set/Configure grades for an exam (replaces existing grades)
  setExamGrades: async (examId: number, grades: SetGradesRequest[]): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`${API_URL}/exam/${examId}`, grades);
    return response.data;
  },
};
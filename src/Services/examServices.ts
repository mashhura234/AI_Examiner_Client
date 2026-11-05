import api from "../interceptor";
import { Exam, CreateExamRequest, ExamDetailsResponse } from "../Models/examModel";

const API_URL = "/Exams";

export const examServices = {
  // Get all exams for the current logged-in user
  getMyExams: async (): Promise<Exam[]> => {
    const response = await api.get<Exam[]>(API_URL);
    return response.data;
  },

  // Get exam details by ID
  getExamById: async (id: number): Promise<ExamDetailsResponse> => {
    const response = await api.get<ExamDetailsResponse>(`${API_URL}/${id}`);
    return response.data;
  },

  // Create a new exam
  createExam: async (examData: CreateExamRequest): Promise<{ message: string; examId: number }> => {
    const response = await api.post<{ message: string; examId: number }>(API_URL, examData);
    return response.data;
  },

  // Update an existing exam
  updateExam: async (id: number, examData: CreateExamRequest): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`${API_URL}/${id}`, examData);
    return response.data;
  },

  // Delete an exam
  deleteExam: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`${API_URL}/${id}`);
    return response.data;
  },
};
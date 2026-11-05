import api from "../interceptor";
import { Syllabus, CreateSyllabusRequest } from "../Models/syllabusModel";

const API_URL = "/Syllabus";

export const syllabusServices = {
  // Get syllabus topics by Exam ID
  getSyllabusByExamId: async (examId: number): Promise<Syllabus[]> => {
    const response = await api.get<Syllabus[]>(`${API_URL}/exam/${examId}`);
    return response.data;
  },

  // Add a new syllabus topic
  addSyllabus: async (model: CreateSyllabusRequest): Promise<{ message: string; syllabusId: number }> => {
    const response = await api.post<{ message: string; syllabusId: number }>(API_URL, model);
    return response.data;
  },

  // Delete a syllabus topic by ID
  deleteSyllabus: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`${API_URL}/${id}`);
    return response.data;
  },
};
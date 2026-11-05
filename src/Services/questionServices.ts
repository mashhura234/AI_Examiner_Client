import api from "../interceptor";
import { QuestionSet, QuestionWithOptionsResponse } from "../Models/questionModel";

const API_URL = "/Questions";

export const questionServices = {
  // Create a question set (e.g., "Set A", "Set B")
  createSet: async (model: { examId: number; name: string; status: number }): Promise<{ message: string; setId: number }> => {
    const response = await api.post<{ message: string; setId: number }>(`${API_URL}/sets`, model);
    return response.data;
  },

  // Get question sets by exam ID
  getSetsByExam: async (examId: number): Promise<QuestionSet[]> => {
    const response = await api.get<QuestionSet[]>(`${API_URL}/sets/exam/${examId}`);
    return response.data;
  },

  // Create a manual question (multipart/form-data for image uploads and options JSON)
  createQuestion: async (formData: FormData): Promise<{ message: string; questionId: number; imageUrl: string }> => {
    const response = await api.post<{ message: string; questionId: number; imageUrl: string }>(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all questions in a specific question set
  getQuestionsBySet: async (setId: number): Promise<QuestionWithOptionsResponse[]> => {
    const response = await api.get<QuestionWithOptionsResponse[]>(`${API_URL}/set/${setId}`);
    return response.data;
  },

  // Delete a question by ID
  deleteQuestion: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`${API_URL}/${id}`);
    return response.data;
  },
};
// src/Services/GradingService.ts
import axios from '../interceptor';
import { SaveEvaluationRequest, SubmissionReviewResponse } from '../Models/GradingModel';

export const GradingServices = {
  // 1. Get all pending submissions for an exam
  getPendingSubmissions: async (examId: number) => {
    const response = await axios.get<any[]>(`/Grading/pending/exam/${examId}`);
    return response.data;
  },

  // 2. Get single student submission for review & grading
  getSubmissionForGrading: async (participantId: number) => {
    const response = await axios.get<SubmissionReviewResponse>(`/Grading/submission/${participantId}`);
    return response.data;
  },

  // 3. Save evaluation scores (per-question)
  saveEvaluation: async (payload: SaveEvaluationRequest) => {
    const response = await axios.post('/Grading/save-evaluation', payload);
    return response.data;
  },

  // 4. Finalize and publish exam result
  finalizeAndPublishResult: async (participantId: number) => {
    const response = await axios.post(`/Grading/finalize/${participantId}`);
    return response.data;
  }
};
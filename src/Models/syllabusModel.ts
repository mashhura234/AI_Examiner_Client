export interface Syllabus {
  id: number;
  examId: number;
  topicName: string;
  description: string;
  maxMarks?: number;
  markValueType?: number; // 1: Percentage, 2: Flat
  maxQuestions?: number;
  status?: number;
}

export interface CreateSyllabusRequest {
  examId: number;
  topicName: string;
  description: string;
  maxMarks?: number | null;
  markValueType?: number | null;
  maxQuestions?: number | null;
  status?: number;
}
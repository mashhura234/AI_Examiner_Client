// src/Models/GradingModels.ts

export enum QuestionType {
  MCQ = 0,
  TrueFalse = 1,
  ShortAnswer = 2,
  Descriptive = 3
}

export enum ParticipantType {
  Online = 0,
  PdfUpload = 1
}

export interface QuestionReviewItem {
  questionId: number;
  questionTitle: string;
  questionDescription: string;
  questionImageUrl?: string;
  questionType: QuestionType;
  maxMarks: number;

  // Student's response
  selectedOptionId?: number;
  selectedOptionTitle?: string;
  isOptionCorrect?: boolean;
  answerDescription?: string;
  answerImageUrl?: string;

  // Evaluation
  awardedMarks?: number;
  reasonOfMarking?: string;
}

export interface SubmissionReviewResponse {
  participantId: number;
  userId: number;
  studentName: string;
  studentEmail: string;
  examId: number;
  examName: string;
  examMaxMarks: number;
  minimumMarksRequired?: number;
  participantType: ParticipantType;
  pdfAnswerSheetURL?: string;
  questions: QuestionReviewItem[];
}

export interface GradeQuestionItem {
  questionId: number;
  marks: number;
  reasonOfMarking: string;
}

export interface SaveEvaluationRequest {
  participantId: number;
  evaluations: GradeQuestionItem[];
}
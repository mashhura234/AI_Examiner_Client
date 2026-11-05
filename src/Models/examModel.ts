export interface Exam {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  resultPublishDate?: string;
  allowGrading: boolean;
  ownerUserId: number;
  maxMarks: number;
  minimumMarksRequired?: number;
  status: number;
}

export interface CreateExamRequest {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  resultPublishDate?: string | null;
  allowGrading: boolean;
  maxMarks: number;
  minimumMarksRequired?: number | null;
  status: number;
}

export interface Syllabus {
  id: number;
  examId: number;
  title: string;
  content: string;
}

export interface Grade {
  id: number;
  examId: number;
  name: string;
  min: number;
  max: number;
}

export interface QuestionSet {
  id: number;
  examId: number;
  title: string;
  totalMarks: number;
}

// Fixed naming: changed to ExamDetailsResponse to match service import
export interface ExamDetailsResponse {
  exam: Exam;
  syllabus: Syllabus[];
  grades: Grade[];
  questionSets: QuestionSet[];
}
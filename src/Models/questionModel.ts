export interface QuestionSet {
  id: number;
  examId: number;
  name: string;
  status: number; // 1: Active, 2: Draft, 3: Archived
}

export interface QuestionOption {
  id: number;
  questionId: number;
  title: string;
  imageUrl?: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  setId: number;
  groupId?: number | null;
  type: number; // 1: MCQ, 2: TrueFalse, 3: Descriptive, 4: ShortAnswer, 5: CodeOrFile
  title: string;
  description: string;
  imageUrl: string;
  marks: number;
  isRequired: boolean;
}

export interface QuestionWithOptionsResponse {
  question: Question;
  options: QuestionOption[];
}

export interface CreateQuestionOptionDto {
  title: string;
  imageUrl?: string;
  isCorrect: boolean;
}
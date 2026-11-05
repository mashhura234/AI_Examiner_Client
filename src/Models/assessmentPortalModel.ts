// User & Filter Models (from UserDto.cs[cite: 31] & UserFilter.cs[cite: 32])
export interface UserDto {
  id: number;
  userName: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  contactNumber?: string | null;
  address?: string | null;
  userStatus: number;
}

export interface UserFilter {
  search?: string;
  pageNumber: number;
  pageSize: number;
}

// Participant & Exam Session Models
export interface AssignStudentsDto {
  setId: number;
  type: number; // 1: Online, 2: Offline
  userIds: number[];
}

export interface RespondInvitationDto {
  participantId: number;
  accept: boolean;
}

export interface MyExamDto {
  participantId: number;
  setId: number;
  type: number;
  participantStatus: number;
  resultStatus: number;
  setName: string;
  examName: string;
  startDate: string;
  endDate: string;
}

export interface StudentQuestionOptionDto {
  id: number;
  title: string;
  imageUrl?: string;
}

export interface StudentExamPaperQuestionDto {
  id: number;
  type: number;
  title: string;
  description?: string;
  imageUrl?: string;
  marks: number;
  isRequired: boolean;
  options: StudentQuestionOptionDto[];
}

export interface ExamPaperResponse {
  participantId: number;
  setId: number;
  totalQuestions: number;
  questions: StudentExamPaperQuestionDto[];
}

export interface Result {
  id: number;
  participantId: number;
  questionId: number;
  marks: number;
  reasonOfMarking: string;
}

// Answer & Submission Models
export interface SaveAnswerDto {
  participantId: number;
  questionId: number;
  optionId?: number | null;
  description?: string | null;
  imageUrl?: string | null;
}

export interface SavedAnswerResponseDto {
  id: number;
  participantId: number;
  questionId: number;
  optionId?: number | null;
  description?: string | null;
  imageUrl?: string | null;
}
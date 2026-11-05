import api from "../interceptor";
import type {
  AssignStudentsDto,
  RespondInvitationDto,
  MyExamDto,
  ExamPaperResponse,
  SaveAnswerDto,
  SavedAnswerResponseDto,
  UserDto,
  UserFilter,
} from "../Models/assessmentPortalModel";

export const assessmentPortalServices = {
  // User Filtering & Search (utilizing UserFilter & UserDto)[cite: 31, 32]
  getUsers: async (filter: UserFilter): Promise<UserDto[]> => {
    const response = await api.get<UserDto[]>("/Users", {
      params: {
        search: filter.search,
        pageNumber: filter.pageNumber,
        pageSize: filter.pageSize,
      },
    });
    return response.data;
  },

  // Participant Endpoints
  assignStudents: async (dto: AssignStudentsDto): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/Participants/assign", dto);
    return response.data;
  },

  getMyExams: async (): Promise<MyExamDto[]> => {
    const response = await api.get<MyExamDto[]>("/Participants/my-exams");
    return response.data;
  },

  respondInvitation: async (dto: RespondInvitationDto): Promise<{ message: string; status: number; statusName: string }> => {
    const response = await api.post<{ message: string; status: number; statusName: string }>("/Participants/respond", dto);
    return response.data;
  },

  startExam: async (participantId: number): Promise<{ message: string; setId: number; participantId: number }> => {
    const response = await api.post<{ message: string; setId: number; participantId: number }>(`/Participants/start/${participantId}`);
    return response.data;
  },

  getExamPaper: async (participantId: number): Promise<ExamPaperResponse> => {
    const response = await api.get<ExamPaperResponse>(`/Participants/exam-paper/${participantId}`);
    return response.data;
  },

  // Answer Endpoints
  saveAnswer: async (dto: SaveAnswerDto): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/Answers/save", dto);
    return response.data;
  },

  getMyAnswers: async (participantId: number): Promise<SavedAnswerResponseDto[]> => {
    const response = await api.get<SavedAnswerResponseDto[]>(`/Answers/my-answers/${participantId}`);
    return response.data;
  },

  submitExam: async (participantId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/Answers/submit/${participantId}`);
    return response.data;
  },
};
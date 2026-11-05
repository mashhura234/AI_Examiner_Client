export interface Grade {
  id: number;
  examId: number;
  name: string;
  min: number;
  max: number;
  cgpa: number;
  isPassGrade: boolean;
}

export interface SetGradesRequest {
  name: string;
  min: number;
  max: number;
  cgpa: number;
  isPassGrade: boolean;
}
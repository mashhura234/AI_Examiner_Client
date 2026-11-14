// src/Models/gradeModel.ts
export interface Grade {
  id: number;
  examId: number | null;
  name: string;
  min: number;
  max: number;
  cgpa: number;
  isPassGrade: boolean;
}

export interface SetGradesRequest {
  examId?: number | null;
  name: string;
  min: number;
  max: number;
  cgpa: number;
  isPassGrade: boolean;
}
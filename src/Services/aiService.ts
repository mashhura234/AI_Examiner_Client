import axios from '../interceptor'; // Uses your configured Axios instance with JWT headers

const AI_FUNCTION_URL = 'http://localhost:7071/api/generate-questions'; // Adjust port if your Azure Function runs on a different port

export interface AiGenerationResponse {
  success: boolean;
  result: string[];
}

export const generateExamQuestions = async (prompt: string): Promise<AiGenerationResponse> => {
  try {
    // Passing the prompt via query parameter 'q' matching your C# function setup
    const response = await axios.post(`${AI_FUNCTION_URL}?q=${encodeURIComponent(prompt)}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || 'Failed to generate AI questions.');
  }
};
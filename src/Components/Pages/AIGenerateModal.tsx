import React, { useState } from 'react';
import { generateExamQuestions } from '../../Services/aiService';
import './AIGenerateModal.css'; // Optional styling matching your glassmorphism theme

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AIGenerateModal: React.FC<AIGenerateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [examId, setExamId] = useState<string>('');
  const [setId, setSetId] = useState<string>('');
  const [rules, setRules] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId || !setId || !rules) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setLogs([]);

    // Construct the prompt for your MCP function tool loop
    const prompt = `Generate questions for examId:${examId} and setId:${setId}, rules: ${rules}`;

    try {
      const res = await generateExamQuestions(prompt);
      if (res.success) {
        setLogs(res.result);
        onSuccess(); // Refresh parent question set list
      } else {
        setError('Generation completed with warnings.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during AI generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-modal-overlay">
      <div className="ai-modal-content glass-card">
        <h2>✨ AI Question Generator</h2>
        <p className="subtitle">Let Gemini fetch exam details and populate question sets automatically.</p>

        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label>Exam ID</label>
            <input 
              type="number" 
              value={examId} 
              onChange={(e) => setExamId(e.target.value)} 
              placeholder="e.g. 2010" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Question Set ID</label>
            <input 
              type="number" 
              value={setId} 
              onChange={(e) => setSetId(e.target.value)} 
              placeholder="e.g. 2014" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Question Rules & Instructions</label>
            <textarea 
              value={rules} 
              onChange={(e) => setRules(e.target.value)} 
              placeholder="e.g., 2 MCQ questions with 3 options and 1 descriptive question on networking." 
              rows={3}
              required 
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {logs.length > 0 && (
            <div className="logs-container">
              <strong>Execution Output:</strong>
              <ul>
                {logs.map((log, index) => (
                  <li key={index}>{log}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Generating with AI...' : 'Generate & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
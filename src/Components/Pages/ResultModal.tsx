import React, { useEffect, useState } from 'react';
import { assessmentPortalServices } from '../../Services/assessmentPortalServices';
import '../../Styles/ExamAssessment.css'; // Reusing consistent glassmorphic styling

interface ResultModalProps {
  participantId: number;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ participantId, onClose }) => {
  const [resultData, setResultData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);
        // Calls GET /api/Participants/result/{participantId}
        const data = await assessmentPortalServices.getMyResult(participantId);
        setResultData(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.response?.data || 'Results have not been published yet or exam is still under review.');
      } finally {
        setLoading(false);
      }
    };

    if (participantId) {
      fetchResult();
    }
  }, [participantId]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Official Exam Score Report</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        {loading && <p className="ap-info">Loading your grade breakdown...</p>}
        {error && <p className="ap-error">{error}</p>}

        {resultData && (
          <div>
            {/* Summary Card */}
            <div className="ap-card" style={{ background: 'rgba(255,255,255,0.6)', padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#375534' }}>{resultData.examName || resultData.ExamName}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginTop: '15px' }}>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b6252', display: 'block' }}>Total Score</span>
                  <strong style={{ fontSize: '1.2rem', color: '#0f2a1d' }}>{resultData.totalMarks ?? resultData.TotalMarks} / {resultData.maxMarks ?? resultData.MaxMarks}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b6252', display: 'block' }}>Letter Grade</span>
                  <strong style={{ fontSize: '1.2rem', color: '#0f2a1d' }}>{resultData.grade ?? resultData.Grade}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b6252', display: 'block' }}>CGPA</span>
                  <strong style={{ fontSize: '1.2rem', color: '#0f2a1d' }}>{resultData.cgpa ?? resultData.CGPA ?? 'N/A'}</strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b6252', display: 'block' }}>Status</span>
                  <span className={`ap-badge ${(resultData.isPassed ?? resultData.IsPassed) ? 'ap-badge--accepted' : 'ap-badge--declined'}`}>
                    {(resultData.isPassed ?? resultData.IsPassed) ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Breakdown */}
            <h4 style={{ marginBottom: '15px' }}>Question-by-Question Breakdown</h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {(resultData.breakdown || resultData.Breakdown || []).map((item: any, idx: number) => {
                const qTitle = item.questionTitle || item.QuestionTitle;
                const awarded = item.awardedMarks ?? item.AwardedMarks ?? 0;
                const max = item.maxMarks ?? item.MaxMarks ?? 0;
                const reason = item.reasonOfMarking || item.ReasonOfMarking || 'No feedback provided.';

                return (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.45)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#2b2a28' }}>Q{idx + 1}: {qTitle}</strong>
                      <span className="ap-badge ap-badge--progress">{awarded} / {max} Marks</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#6b6252', margin: 0 }}><strong>Faculty Feedback / Reason:</strong> {reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="ap-btn ap-btn--secondary" style={{ padding: '10px 22px' }}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
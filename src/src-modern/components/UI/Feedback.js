// src/src-modern/components/UI/Feedback.js
import React, { useState } from 'react';
import { MessageSquare, Star, X } from 'lucide-react';
import { submitFeedback } from '../../utils/feedbackAPI';

const Feedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setLoading(true);
    setError(false);
    
    try {
      const success = await submitFeedback({ rating, feedback: comment });
      if (success) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setRating(0);
          setComment('');
        }, 2000);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSubmitted(false);
    setError(false);
    setRating(0);
    setComment('');
  };

  return (
    <>
      {/* Feedback button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          padding: '12px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          zIndex: 30,
          fontSize: '14px',
          fontWeight: '500',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Send Feedback"
      >
        <MessageSquare size={18} />
        Feedback
      </button>

      {/* Feedback modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                We value your feedback!
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {!submitted && !error ? (
              <form onSubmit={handleSubmit}>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#374151', 
                  marginBottom: '16px' 
                }}>
                  How do you like the app?
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '24px',
                  justifyContent: 'center'
                }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={32}
                      color={n <= rating ? '#fbbf24' : '#d1d5db'}
                      fill={n <= rating ? '#fbbf24' : 'none'}
                      onClick={() => setRating(n)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
                
                <textarea
                  placeholder="Additional comments (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{
                    width: '100%',
                    marginBottom: '20px',
                    minHeight: '100px',
                    resize: 'vertical',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
                
                <button
                  type="submit"
                  disabled={rating === 0 || loading}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: rating === 0 || loading ? '#e5e7eb' : '#3b82f6',
                    color: rating === 0 || loading ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: rating === 0 || loading ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {loading ? 'Sending...' : 'Submit Feedback'}
                </button>
              </form>
            ) : submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <p style={{ 
                  fontSize: '18px', 
                  color: '#10b981', 
                  fontWeight: '600' 
                }}>
                  Thanks for your feedback!
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#dc2626', 
                  marginBottom: '20px' 
                }}>
                  Failed to send feedback. Please try again.
                </p>
                <button
                  onClick={() => {
                    setError(false);
                    setSubmitted(false);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            <div style={{ 
              marginTop: '32px', 
              paddingTop: '24px', 
              borderTop: '1px solid #e5e7eb' 
            }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#374151', 
                marginBottom: '12px' 
              }}>
                Have a feature request?{' '}
                <a
                  href="https://safegendev.atlassian.net/jira/software/projects/SGEN/form/35?atlOrigin=eyJpIjoiM2Q0MWFmZjEwOThiNDdhNzk1ZmI0OGEzNDg1MDBjOTAiLCJwIjoiaiJ9"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#3b82f6', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Submit it here
                </a>
                .
              </p>
              
              <p style={{ 
                fontSize: '14px', 
                color: '#374151', 
                marginBottom: '12px' 
              }}>
                Found a bug?{' '}
                <a
                  href="https://safegendev.atlassian.net/jira/software/projects/SGEN/form/36?atlOrigin=eyJpIjoiMGUzOGNlODQyNjBhNDhkZDljYjVlMDNhYjM2YjlhMTMiLCJwIjoiaiJ9"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#3b82f6', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  Let us know
                </a>
                .
              </p>
              
              <p style={{ 
                fontSize: '14px', 
                color: '#374151' 
              }}>
                For support questions email{' '}
                <a 
                  href="mailto:support@safegenerations.org"
                  style={{ 
                    color: '#3b82f6', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  support@safegenerations.org
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Feedback;
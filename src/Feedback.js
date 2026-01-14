import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { submitFeedback } from './utils/feedbackAPI';

const starStyle = {
  cursor: 'pointer'
};

const Feedback = () => {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const submitRating = async () => {
    try {
      const success = await submitFeedback(rating, comment);
      setSubmitted(success);
      setError(!success);
    } finally {
      setLoading(false);
      setComment('');
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setSubmitted(false);
          setShow(true);
        }}
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          padding: '12px 20px',
          cursor: 'pointer',
          zIndex: 3000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        Feedback
      </button>
      {show && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow:
                '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0
                }}
              >
                We value your feedback!
              </h3>
              <button
                onClick={() => {
                  setShow(false);
                  setRating(0);
                  setSubmitted(false);
                }}
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
              How do you like the app?
            </p>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={24}
                  color={n <= rating ? '#fbbf24' : '#d1d5db'}
                  fill={n <= rating ? '#fbbf24' : 'none'}
                  onClick={() => setRating(n)}
                  style={starStyle}
                />
              ))}
            </div>
            <textarea
              placeholder="Additional comments (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%',
                marginBottom: '16px',
                minHeight: '80px',
                resize: 'vertical',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #d1d5db'
              }}
            />
            {submitted && !error && (
              <p style={{ fontSize: '14px', color: '#10b981', marginBottom: '16px' }}>
                Thanks for your feedback!
              </p>
            )}
            {error && (
              <p style={{ fontSize: '14px', color: '#dc2626', marginBottom: '16px' }}>
                Failed to send feedback.
              </p>
            )}
            {!submitted && !error && (
              <button
                onClick={() => {
                  setLoading(true);
                  submitRating();
                }}
                disabled={rating === 0 || loading}
                style={{
                  padding: '8px 12px',
                  marginBottom: '16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: rating === 0 || loading ? 'default' : 'pointer'
                }}
              >
                {loading ? 'Sending...' : 'Submit Feedback'}
              </button>
            )}
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
              Have a feature request?{' '}
              <a
                href="https://safegendev.atlassian.net/jira/software/projects/SGEN/form/35?atlOrigin=eyJpIjoiM2Q0MWFmZjEwOThiNDdhNzk1ZmI0OGEzNDg1MDBjOTAiLCJwIjoiaiJ9"
                target="_blank"
                rel="noopener noreferrer"
              >
                Submit it here
              </a>
              .
            </p>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
              Found a bug?{' '}
              <a
                href="https://safegendev.atlassian.net/jira/software/projects/SGEN/form/36?atlOrigin=eyJpIjoiMGUzOGNlODQyNjBhNDhkZDljYjVlMDNhYjM2YjlhMTMiLCJwIjoiaiJ9"
                target="_blank"
                rel="noopener noreferrer"
              >
                Let us know
              </a>
              .
            </p>
            <p style={{ fontSize: '14px', color: '#374151' }}>
              For support questions email{' '}
              <a href="mailto:support@safegenerations.org">
                support@safegenerations.org
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Feedback;

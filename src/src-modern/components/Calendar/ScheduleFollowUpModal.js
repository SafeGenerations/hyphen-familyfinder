// src/src-modern/components/Calendar/ScheduleFollowUpModal.js
// Modal component for scheduling follow-up calendar events

import React, { useState, useEffect } from 'react';
import {
  createFollowUpEvent,
  buildFollowUpEventData,
  getSuggestedFollowUpDates,
  getCalendarAuthStatus,
  initializeCalendarAuth
} from '../../services/calendarService';
import './ScheduleFollowUpModal.css';

export default function ScheduleFollowUpModal({ member, childId, onClose, onSuccess }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [contactType, setContactType] = useState('phone');
  const [notes, setNotes] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const suggestedDates = getSuggestedFollowUpDates(member.lastContactAt);

  // Check calendar auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setCheckingAuth(true);
    try {
      const status = await getCalendarAuthStatus();
      setAuthStatus(status);
    } catch (err) {
      console.error('Failed to check auth status:', err);
      setAuthStatus({ authorized: false });
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuthorizeCalendar = async () => {
    try {
      const { authUrl } = await initializeCalendarAuth();
      // Open auth URL in new window
      window.open(authUrl, '_blank', 'width=600,height=700');
      
      // Poll for auth completion
      const pollInterval = setInterval(async () => {
        const status = await getCalendarAuthStatus();
        if (status.authorized) {
          clearInterval(pollInterval);
          setAuthStatus(status);
        }
      }, 2000);

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
    } catch (err) {
      setError(`Authorization failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const eventData = buildFollowUpEventData(member, {
        childId,
        date,
        time,
        duration,
        notes,
        contactType,
        reminderMinutes
      });

      const result = await createFollowUpEvent(eventData);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSuggestedDate = (suggestedDate) => {
    setDate(suggestedDate);
  };

  const memberName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Member';

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Schedule Follow-up</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="modal-body">
          {checkingAuth ? (
            <div className="auth-checking">Checking calendar authorization...</div>
          ) : !authStatus?.authorized ? (
            <div className="auth-required">
              <div className="auth-icon">📅</div>
              <h4>Calendar Authorization Required</h4>
              <p>
                To schedule follow-up reminders, you need to authorize Family Finder
                to access your Google Calendar.
              </p>
              <button onClick={handleAuthorizeCalendar} className="authorize-btn">
                🔐 Authorize Google Calendar
              </button>
              <p className="auth-note">
                You'll be redirected to Google to grant permission. This is secure
                and you can revoke access at any time.
              </p>
            </div>
          ) : (
            <>
              <div className="member-info">
                <h4>{memberName}</h4>
                <p className="relationship">{member.relationship || 'Unknown relationship'}</p>
                {member.lastContactAt && (
                  <p className="last-contact">
                    Last contact: {new Date(member.lastContactAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {error && (
                <div className="error-message">⚠️ {error}</div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Suggested Dates */}
                <div className="form-section">
                  <label>Quick Select:</label>
                  <div className="suggested-dates">
                    {suggestedDates.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestedDate(suggestion.date)}
                        className={`suggested-date-btn ${date === suggestion.date ? 'active' : ''}`}
                        title={suggestion.reason}
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date and Time */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label>Time *</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Duration and Contact Type */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Duration</label>
                    <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Contact Type</label>
                    <select value={contactType} onChange={(e) => setContactType(e.target.value)}>
                      <option value="phone">📞 Phone Call</option>
                      <option value="email">📧 Email</option>
                      <option value="sms">💬 SMS</option>
                      <option value="visit">🏠 In-Person Visit</option>
                      <option value="video">📹 Video Call</option>
                    </select>
                  </div>
                </div>

                {/* Reminder */}
                <div className="form-group">
                  <label>Reminder</label>
                  <select value={reminderMinutes} onChange={(e) => setReminderMinutes(Number(e.target.value))}>
                    <option value={0}>No reminder</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                    <option value={1440}>1 day before</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Add any notes about this follow-up..."
                  />
                </div>

                {/* Member Contact Info Preview */}
                {(member.email || member.phone) && (
                  <div className="contact-info-preview">
                    <div className="preview-label">Member contact info:</div>
                    {member.email && (
                      <div className="preview-item">📧 {member.email}</div>
                    )}
                    {member.phone && (
                      <div className="preview-item">📞 {member.phone}</div>
                    )}
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading || !date}>
                    {loading ? 'Creating...' : '📅 Create Calendar Event'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

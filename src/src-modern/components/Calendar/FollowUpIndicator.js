// src/src-modern/components/Calendar/FollowUpIndicator.js
// Component to show follow-up status and schedule button

import React, { useState, useEffect, useCallback } from 'react';
import {
  checkFollowUpNeeded,
  listFollowUpEvents
} from '../../services/calendarService';
import ScheduleFollowUpModal from './ScheduleFollowUpModal';
import './FollowUpIndicator.css';

export default function FollowUpIndicator({ member, childId, compact = false }) {
  const [showModal, setShowModal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const followUpStatus = checkFollowUpNeeded(member.lastContactAt);

  const loadUpcomingEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listFollowUpEvents({
        memberId: member._id,
        childId,
        status: 'scheduled',
        startAfter: new Date().toISOString()
      });
      setUpcomingEvents(response.events || []);
    } catch (err) {
      console.error('Failed to load upcoming events:', err);
    } finally {
      setLoading(false);
    }
  }, [member._id, childId]);

  useEffect(() => {
    if (member._id && childId) {
      loadUpcomingEvents();
    }
  }, [member._id, childId, loadUpcomingEvents]);

  const handleEventCreated = () => {
    loadUpcomingEvents();
  };

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`follow-up-compact-btn urgency-${followUpStatus.urgency}`}
          title={followUpStatus.message}
        >
          📅
          {upcomingEvents.length > 0 && (
            <span className="event-count">{upcomingEvents.length}</span>
          )}
        </button>

        {showModal && (
          <ScheduleFollowUpModal
            member={member}
            childId={childId}
            onClose={() => setShowModal(false)}
            onSuccess={handleEventCreated}
          />
        )}
      </>
    );
  }

  return (
    <div className="follow-up-indicator">
      <div className={`status-badge urgency-${followUpStatus.urgency}`}>
        {followUpStatus.message}
      </div>

      {upcomingEvents.length > 0 && (
        <div className="upcoming-events">
          <div className="events-label">📅 Upcoming:</div>
          {upcomingEvents.slice(0, 2).map((event, idx) => (
            <div key={idx} className="event-item">
              {new Date(event.startTime).toLocaleDateString()} at{' '}
              {new Date(event.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          ))}
          {upcomingEvents.length > 2 && (
            <div className="more-events">+{upcomingEvents.length - 2} more</div>
          )}
        </div>
      )}

      <button
        onClick={() => setShowModal(true)}
        className="schedule-follow-up-btn"
        disabled={loading}
      >
        📅 Schedule Follow-up
      </button>

      {showModal && (
        <ScheduleFollowUpModal
          member={member}
          childId={childId}
          onClose={() => setShowModal(false)}
          onSuccess={handleEventCreated}
        />
      )}
    </div>
  );
}

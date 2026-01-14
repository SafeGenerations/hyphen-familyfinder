// src/AdminContactEventsPage.js
// Admin page for viewing and searching contact events

import React, { useState } from 'react';
import ContactEventSearch from './src-modern/components/Contacts/ContactEventSearch';
import AdminLayout from './AdminLayout';
import './AdminContactEventsPage.css';

export default function AdminContactEventsPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <AdminLayout>
      <div className="admin-contact-events-page">
      <div className="page-header">
        <h1>Contact Events Management</h1>
        <p className="page-description">
          View and search all contact events logged through webhooks or manual entry.
          Track outreach efforts, analyze engagement patterns, and export data for reporting.
        </p>
      </div>

      <ContactEventSearch onSelectEvent={setSelectedEvent} />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="event-detail-modal" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Event Details</h3>
              <button onClick={() => setSelectedEvent(null)} className="close-btn">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Event Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Type:</span>
                    <span className="value">{selectedEvent.type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Direction:</span>
                    <span className="value">{selectedEvent.direction}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Timestamp:</span>
                    <span className="value">
                      {selectedEvent.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Provider:</span>
                    <span className="value">{selectedEvent.provider}</span>
                  </div>
                </div>
              </div>

              {selectedEvent.member && (
                <div className="detail-section">
                  <h4>Member Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Name:</span>
                      <span className="value">{selectedEvent.member.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Relationship:</span>
                      <span className="value">{selectedEvent.member.relationship}</span>
                    </div>
                    {selectedEvent.member.email && (
                      <div className="detail-item">
                        <span className="label">Email:</span>
                        <span className="value">{selectedEvent.member.email}</span>
                      </div>
                    )}
                    {selectedEvent.member.phone && (
                      <div className="detail-item">
                        <span className="label">Phone:</span>
                        <span className="value">{selectedEvent.member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>Contact Details</h4>
                <div className="detail-grid">
                  {selectedEvent.details.to && (
                    <div className="detail-item full-width">
                      <span className="label">To:</span>
                      <span className="value">{selectedEvent.details.to}</span>
                    </div>
                  )}
                  {selectedEvent.details.from && (
                    <div className="detail-item full-width">
                      <span className="label">From:</span>
                      <span className="value">{selectedEvent.details.from}</span>
                    </div>
                  )}
                  {selectedEvent.details.subject && (
                    <div className="detail-item full-width">
                      <span className="label">Subject:</span>
                      <span className="value">{selectedEvent.details.subject}</span>
                    </div>
                  )}
                  {selectedEvent.details.body && (
                    <div className="detail-item full-width">
                      <span className="label">Body:</span>
                      <span className="value message-body">{selectedEvent.details.body}</span>
                    </div>
                  )}
                  {selectedEvent.details.messageId && (
                    <div className="detail-item full-width">
                      <span className="label">Message ID:</span>
                      <span className="value message-id">{selectedEvent.details.messageId}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <div className="notes-content">{selectedEvent.notes}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedEvent(null)} className="close-modal-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

/**
 * CaseGenogramView - Integrates GenogramCanvas with FamilyFinder case data
 *
 * This component bridges the genogram visualization with the FamilyFinder
 * case management system, allowing network members to be viewed and edited
 * using the full genogram canvas.
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import { GenogramProvider, useGenogram } from '../contexts/GenogramContext';
import GenogramCanvas from './Canvas/GenogramCanvas';
import FloatingToolbar from './UI/FloatingToolbar';
import SidePanel from './UI/SidePanel';
import ContextMenu from './UI/ContextMenu';
import QuickAddModal from './UI/QuickAddModal';
import DeleteConfirmationModal from './UI/DeleteConfirmationModal';
import NewPersonModal from './UI/NewPersonModal';
import { createMember, updateMember, deleteMember } from '../services/memberService';
import { createRelationship, updateRelationship, deleteRelationship } from '../services/networkDataService';

/**
 * Convert API network member to genogram person format
 */
function memberToGenogramPerson(member, index, isChild = false) {
  // Calculate position in circular layout around center
  const centerX = 400;
  const centerY = 300;
  const radius = isChild ? 0 : 200;
  const angle = (2 * Math.PI * index) / Math.max(1, index + 1) - Math.PI / 2;

  return {
    id: member._id || member.id,
    name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown',
    firstName: member.firstName || '',
    lastName: member.lastName || '',
    gender: member.gender || 'unknown',
    type: 'person',
    x: isChild ? centerX : centerX + radius * Math.cos(angle),
    y: isChild ? centerY : centerY + radius * Math.sin(angle),
    networkMember: true,
    networkNotes: member.notes || '',
    relationship: member.relationshipToChild || member.relationship || '',
    role: member.role || '',
    status: member.status || 'active',
    activityState: member.activityState || 'active',
    commitmentLevel: member.commitmentLevel || 'exploring',
    lastContactAt: member.lastContactAt,
    contactInfo: {
      phones: member.phones || [],
      emails: member.emails || [],
      addresses: member.addresses || []
    },
    // Visual styling based on activity state
    customColor: getActivityColor(member.activityState),
    // Store original API data for sync
    _apiData: member
  };
}

/**
 * Convert genogram person back to API member format
 */
function genogramPersonToMember(person, childId) {
  return {
    childId,
    firstName: person.firstName || person.name?.split(' ')[0] || '',
    lastName: person.lastName || person.name?.split(' ').slice(1).join(' ') || '',
    relationshipToChild: person.relationship || '',
    role: person.role || '',
    phones: person.contactInfo?.phones || [],
    emails: person.contactInfo?.emails || [],
    addresses: person.contactInfo?.addresses || [],
    commitmentLevel: person.commitmentLevel || 'exploring',
    status: person.status || 'active',
    notes: person.networkNotes || person.notes || ''
  };
}

/**
 * Convert API edge to genogram relationship
 */
function edgeToGenogramRelationship(edge) {
  return {
    id: edge._id || edge.id,
    person1Id: edge.memberIdA || edge.source,
    person2Id: edge.memberIdB || edge.target,
    type: edge.type || 'support',
    hasConflict: edge.conflictFlag || false,
    _apiData: edge
  };
}

/**
 * Get node color based on activity state
 */
function getActivityColor(activityState) {
  switch (activityState) {
    case 'active': return '#10b981'; // green
    case 'warming': return '#f59e0b'; // amber
    case 'cold': return '#ef4444'; // red
    default: return '#6b7280'; // gray
  }
}

/**
 * Inner component that uses genogram context
 */
function CaseGenogramContent({
  caseData,
  networkData,
  onMemberChange,
  onRelationshipChange,
  readOnly = false
}) {
  const { state, actions } = useGenogram();

  // Initialize genogram with network data
  useEffect(() => {
    if (!networkData) return;

    const nodes = networkData.nodes || [];
    const edges = networkData.edges || [];

    // Convert network members to genogram people
    const people = nodes.map((member, index) =>
      memberToGenogramPerson(member, index, false)
    );

    // Add the child as center node if we have case data
    if (caseData) {
      const childPerson = {
        id: `child-${caseData.caseId || caseData._id}`,
        name: caseData.childName || 'Child',
        firstName: caseData.childName?.split(' ')[0] || 'Child',
        lastName: caseData.childName?.split(' ').slice(1).join(' ') || '',
        gender: caseData.childGender || 'unknown',
        type: 'person',
        x: 400,
        y: 300,
        networkMember: false, // Child is the focus, not a network member
        isFocusChild: true,
        customColor: '#3b82f6' // Blue for focus child
      };
      people.unshift(childPerson);
    }

    // Recalculate positions in a circle around the child
    const nonChildPeople = people.filter(p => !p.isFocusChild);
    const childNode = people.find(p => p.isFocusChild);
    const centerX = childNode?.x || 400;
    const centerY = childNode?.y || 300;
    const radius = 200;

    nonChildPeople.forEach((person, index) => {
      const angle = (2 * Math.PI * index) / nonChildPeople.length - Math.PI / 2;
      person.x = centerX + radius * Math.cos(angle);
      person.y = centerY + radius * Math.sin(angle);
    });

    // Convert edges to relationships
    const relationships = edges.map(edge => edgeToGenogramRelationship(edge));

    // Load into genogram state
    actions.loadFromData({
      people,
      relationships,
      households: [],
      textBoxes: [],
      metadata: {
        caseId: caseData?.caseId || caseData?._id,
        childName: caseData?.childName,
        isCaseView: true
      }
    });

  }, [networkData, caseData, actions]);

  // Handle person updates - sync back to API
  const handlePersonUpdate = useCallback(async (personId, updates) => {
    if (readOnly) return;

    const person = state.people.find(p => p.id === personId);
    if (!person || person.isFocusChild) return;

    try {
      const memberData = genogramPersonToMember({ ...person, ...updates }, caseData?.caseId);

      if (person._apiData) {
        // Update existing member
        await updateMember(personId, memberData);
      } else {
        // Create new member
        const created = await createMember(memberData);
        // Update local state with new ID
        actions.updatePerson(personId, { _apiData: created, id: created._id });
      }

      if (onMemberChange) {
        onMemberChange();
      }
    } catch (error) {
      console.error('Failed to sync member:', error);
    }
  }, [state.people, caseData, readOnly, actions, onMemberChange]);

  // Handle person deletion
  const handlePersonDelete = useCallback(async (personId) => {
    if (readOnly) return;

    const person = state.people.find(p => p.id === personId);
    if (!person || person.isFocusChild) return;

    try {
      if (person._apiData) {
        await deleteMember(personId);
      }
      if (onMemberChange) {
        onMemberChange();
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  }, [state.people, readOnly, onMemberChange]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: '#fafbfc'
    }}>
      <GenogramCanvas />
      {!readOnly && (
        <>
          <FloatingToolbar />
          <SidePanel />
          <ContextMenu />
          <QuickAddModal />
          <DeleteConfirmationModal />
          <NewPersonModal />
        </>
      )}
    </div>
  );
}

/**
 * Main CaseGenogramView component
 */
export default function CaseGenogramView({
  caseData,
  networkData,
  onMemberChange,
  onRelationshipChange,
  readOnly = false,
  style = {}
}) {
  return (
    <div style={{
      width: '100%',
      height: '500px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      ...style
    }}>
      <GenogramProvider>
        <CaseGenogramContent
          caseData={caseData}
          networkData={networkData}
          onMemberChange={onMemberChange}
          onRelationshipChange={onRelationshipChange}
          readOnly={readOnly}
        />
      </GenogramProvider>
    </div>
  );
}

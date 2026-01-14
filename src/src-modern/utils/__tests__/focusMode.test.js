// src/src-modern/utils/__tests__/focusMode.test.js
import {
  buildFocusGraph,
  getConnectedNodeIds,
  createRelationshipLookup,
  getRelationshipParticipantIds,
  getHighlightedRelationshipIds
} from '../focusMode';

const toSortedArray = (iterable) => Array.from(iterable).sort();

describe('focusMode utilities', () => {
  const baseRelationships = [
    { id: 'rel-marriage', type: 'marriage', from: 'person-1', to: 'person-2' },
    { id: 'rel-child-a', type: 'child', from: 'rel-marriage', to: 'child-1' },
    { id: 'rel-child-b', type: 'child', from: 'rel-marriage', to: 'child-2' }
  ];

  it('buildFocusGraph returns direct connections for parents and children', () => {
    const graph = buildFocusGraph(baseRelationships);

    expect(toSortedArray(graph.get('person-1'))).toEqual(['child-1', 'child-2', 'person-2']);
    expect(toSortedArray(graph.get('person-2'))).toEqual(['child-1', 'child-2', 'person-1']);
    expect(toSortedArray(graph.get('child-1'))).toEqual(['person-1', 'person-2']);
    expect(toSortedArray(graph.get('child-2'))).toEqual(['person-1', 'person-2']);
  });

  it('getConnectedNodeIds returns neighbors of focused node', () => {
    const graph = buildFocusGraph(baseRelationships);

    expect(toSortedArray(getConnectedNodeIds('person-1', graph))).toEqual(['child-1', 'child-2', 'person-2']);
    expect(toSortedArray(getConnectedNodeIds('child-1', graph))).toEqual(['person-1', 'person-2']);
    expect(getConnectedNodeIds('missing', graph)).toEqual(new Set());
  });

  it('handles single-parent adoption relationships without duplicates', () => {
    const adoptionRelationships = [
      { id: 'rel-adopt', type: 'adoption', from: 'parent-1', to: 'parent-1' },
      { id: 'rel-adopt-child', type: 'child', from: 'rel-adopt', to: 'child-unique' }
    ];

    const graph = buildFocusGraph(adoptionRelationships);
    expect(toSortedArray(graph.get('parent-1'))).toEqual(['child-unique']);
    expect(toSortedArray(graph.get('child-unique'))).toEqual(['parent-1']);
  });

  it('getRelationshipParticipantIds collects all participant ids', () => {
    const relationships = [...baseRelationships];
    const lookup = createRelationshipLookup(relationships);

    const marriageParticipants = getRelationshipParticipantIds(relationships[0], lookup);
    expect(toSortedArray(marriageParticipants)).toEqual(['person-1', 'person-2']);

    const childParticipants = getRelationshipParticipantIds(relationships[1], lookup);
    expect(toSortedArray(childParticipants)).toEqual(['child-1', 'person-1', 'person-2']);
  });

  it('getHighlightedRelationshipIds returns relationships touching visible nodes', () => {
    const relationships = [...baseRelationships];
    const lookup = createRelationshipLookup(relationships);

    const visible = new Set(['person-1', 'child-1', 'child-2']);
    const highlighted = getHighlightedRelationshipIds(relationships, visible, lookup);

    expect(toSortedArray(highlighted)).toEqual(['rel-child-a', 'rel-child-b', 'rel-marriage']);
  });

  it('getHighlightedRelationshipIds returns empty when no nodes are visible', () => {
    const relationships = [...baseRelationships];
    const lookup = createRelationshipLookup(relationships);

    const highlighted = getHighlightedRelationshipIds(relationships, new Set(), lookup);
    expect(toSortedArray(highlighted)).toEqual([]);
  });

  it('getHighlightedRelationshipIds returns all ids when visibility set is not provided', () => {
    const relationships = [...baseRelationships];
    const lookup = createRelationshipLookup(relationships);

    const highlighted = getHighlightedRelationshipIds(relationships, undefined, lookup);
    expect(toSortedArray(highlighted)).toEqual(['rel-child-a', 'rel-child-b', 'rel-marriage']);
  });

  it('getHighlightedRelationshipIds excludes relationships that do not touch the focused node', () => {
    const relationships = [
      ...baseRelationships,
      { id: 'rel-child-marriage', type: 'marriage', from: 'child-1', to: 'partner-1' }
    ];
    const lookup = createRelationshipLookup(relationships);

    const visible = new Set(['person-1', 'person-2', 'child-1', 'child-2']);
    const highlighted = getHighlightedRelationshipIds(
      relationships,
      visible,
      lookup,
      'person-1'
    );

    expect(toSortedArray(highlighted)).toEqual(['rel-child-a', 'rel-child-b', 'rel-marriage']);
  });
});

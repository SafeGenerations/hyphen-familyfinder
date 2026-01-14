// NetworkSearchModal.js - Deep Network Search Interface
import React, { useState, useEffect } from 'react';
import { useGenogram } from '../contexts/GenogramContext';
import networkSearchService, { getDataSources, getRelationshipTypes, exportResultsToCSV } from '../services/networkSearchService';
import { Search, X, Filter, Download, UserPlus, Phone, Mail, MapPin, ExternalLink, AlertCircle, CheckCircle, TrendingUp, Heart, Shield } from 'lucide-react';
import './NetworkSearchModal.css';

const NetworkSearchModal = () => {
  const { state, actions } = useGenogram();
  const { searchingNetworkFor } = state;
  
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [sortBy, setSortBy] = useState('matchScore'); // matchScore, distance, willingness, confidence
  
  // Filter state
  const [filters, setFilters] = useState({
    relationshipTypes: getRelationshipTypes(),
    minConfidence: 70,
    sources: getDataSources().map(s => s.id),
    maxResults: 50
  });
  
  // Additional filters
  const [ageRange, setAgeRange] = useState([18, 70]);
  const [selectedGenders, setSelectedGenders] = useState(['M', 'F']);
  const [selectedReligions, setSelectedReligions] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    
    // Relationship types (if not all selected)
    if (filters.relationshipTypes.length < getRelationshipTypes().length) {
      count++;
    }
    
    // Data sources (if not all selected)
    if (filters.sources.length < getDataSources().length) {
      count++;
    }
    
    // Confidence threshold (if not default 70%)
    if (filters.minConfidence !== 70) {
      count++;
    }
    
    // Age range (if not default 18-70)
    if (ageRange[0] !== 18 || ageRange[1] !== 70) {
      count++;
    }
    
    // Gender (if not both selected)
    if (selectedGenders.length !== 2) {
      count++;
    }
    
    // Religion (if any selected)
    if (selectedReligions.length > 0) {
      count++;
    }
    
    // Languages (if any selected)
    if (selectedLanguages.length > 0) {
      count++;
    }
    
    return count;
  };

  const performSearch = async () => {
    if (!searchingNetworkFor) return;

    setIsSearching(true);
    setSelectedResult(null);

    try {
      const caseId =
        searchingNetworkFor.caseId ||
        searchingNetworkFor.id ||
        searchingNetworkFor.personId ||
        'default-case';

      const response = await networkSearchService.search(caseId, filters);
      const results = (Array.isArray(response)
        ? response
        : response?.results ?? [])
        .map((item) => ({
          ...item,
          languages: Array.isArray(item?.languages)
            ? item.languages
            : item?.languages
              ? [item.languages].flat().filter(Boolean)
              : [],
        }));

      setSearchResults(results);
    } catch (error) {
      console.error('Network search error:', error);
      alert('Failed to search network. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Perform search when modal opens
  useEffect(() => {
    if (searchingNetworkFor) {
      performSearch();
    } else {
      // Reset when modal closes
      setSearchResults([]);
      setSelectedResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchingNetworkFor]);

  const handleClose = () => {
    actions.setSearchingNetworkFor(null);
  };

  const handleAddToGenogram = (result) => {
    // Create a new person from search result
    const sourceName = result?.source?.name ?? 'Unknown source';
    const newPerson = {
      id: `person-${Date.now()}`,
      name: result.fullName,
      age: result.age,
      gender: result.gender === 'M' ? 'male' : 'female',
      x: searchingNetworkFor.x + 150, // Position near source person
      y: searchingNetworkFor.y + 100,
      // Add contact info from search result
      contactInfo: {
        phones: [{
          id: Date.now(),
          type: 'mobile',
          number: result.phone,
          notes: `From ${sourceName}`
        }],
        emails: [{
          id: Date.now() + 1,
          type: 'personal',
          address: result.email,
          notes: `From ${sourceName}`
        }],
        addresses: [{
          id: Date.now() + 2,
          type: 'home',
          street: '',
          city: result.city,
          state: result.state,
          zip: '',
          notes: `From ${sourceName}`
        }]
      },
      // Add case log entry documenting the search
      caseLog: [{
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'note',
        subject: `Added from network search`,
        details: `Found via ${sourceName}. Confidence: ${result.confidence}%. Relationship: ${result.relationshipType}. ${result.notes}`,
        worker: 'System'
      }],
      // Mark as network member
      networkMember: true,
      // Store search metadata
      searchMetadata: {
        source: sourceName,
        confidence: result.confidence,
        relationshipType: result.relationshipType,
        recordId: result.recordId,
        addedDate: new Date().toISOString()
      }
    };

    actions.addPerson(newPerson);
    
    // Close modal first
    handleClose();
    
    // Small delay to ensure person is added, then select it, center view, and open side panel
    setTimeout(() => {
      // Select the person
      actions.selectPerson(newPerson);
      
      // Pan to center the new person in view
      // Get current pan and zoom
      const currentZoom = state.zoom || 1;
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;
      
      // Calculate where the person should be to center it
      // Account for side panel width (typically 400px)
      const sidePanelWidth = state.sidePanelOpen ? 400 : 0;
      const effectiveWidth = canvasWidth - sidePanelWidth;
      
      // Target position: center of visible canvas area
      const targetX = (effectiveWidth / 2 - newPerson.x * currentZoom);
      const targetY = (canvasHeight / 2 - newPerson.y * currentZoom);
      
      actions.setPan({ x: targetX, y: targetY });
      
      // Zoom in a bit to focus on the person if zoomed out
      if (currentZoom < 1) {
        actions.setZoom(1);
      }
      
      // Open side panel to show all the prepopulated data
      actions.setSidePanelOpen(true);
    }, 100);
  };

  const handleExportResults = () => {
    const csv = exportResultsToCSV(searchResults);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-search-${searchingNetworkFor.name}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleRelationshipType = (type) => {
    setFilters(prev => ({
      ...prev,
      relationshipTypes: prev.relationshipTypes.includes(type)
        ? prev.relationshipTypes.filter(t => t !== type)
        : [...prev.relationshipTypes, type]
    }));
  };

  const toggleSource = (sourceId) => {
    setFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(sourceId)
        ? prev.sources.filter(s => s !== sourceId)
        : [...prev.sources, sourceId]
    }));
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#10b981'; // Green
    if (confidence >= 80) return '#3b82f6'; // Blue
    if (confidence >= 70) return '#f59e0b'; // Amber
    return '#6b7280'; // Gray
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 80) return 'High';
    if (confidence >= 70) return 'Medium';
    return 'Low';
  };

  if (!searchingNetworkFor) return null;

  return (
    <div className="network-search-modal-overlay">
      <div className="network-search-modal">
        {/* Header */}
        <div className="network-search-header">
          <div className="network-search-title">
            <Search size={24} color="#3b82f6" />
            <div>
              <h2>Network Search: {searchingNetworkFor.name}</h2>
              <p>Searching external databases for potential family connections</p>
            </div>
          </div>
          <button className="network-search-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="network-search-filter-bar">
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="filter-badge">{getActiveFilterCount()}</span>
            )}
          </button>
          
          <div className="filter-bar-actions">
            {searchResults.length > 0 && (
              <>
                <span className="result-count">{searchResults.length} results found</span>
                <button className="export-btn" onClick={handleExportResults}>
                  <Download size={18} />
                  Export
                </button>
              </>
            )}
            <button 
              className="search-btn" 
              onClick={performSearch}
              disabled={isSearching}
            >
              <Search size={18} />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="network-search-filters">
            {/* Relationship Types */}
            <div className="filter-section full-width">
              <label>Relationship Types:</label>
              <div className="filter-chips">
                {getRelationshipTypes().map(type => (
                  <button
                    key={type}
                    className={`filter-chip ${filters.relationshipTypes.includes(type) ? 'active' : ''}`}
                    onClick={() => toggleRelationshipType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Data Sources */}
            <div className="filter-section full-width">
              <label>Data Sources:</label>
              <div className="filter-chips">
                {getDataSources().map(source => (
                  <button
                    key={source.id}
                    className={`filter-chip ${filters.sources.includes(source.id) ? 'active' : ''}`}
                    onClick={() => toggleSource(source.id)}
                  >
                    <span>{source.icon}</span> {source.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Threshold */}
            <div className="filter-section">
              <label>
                Minimum Confidence: {filters.minConfidence}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={filters.minConfidence}
                onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: parseInt(e.target.value, 10) }))}
                className="confidence-slider"
              />
            </div>

            {/* Age Range Filter */}
            <div className="filter-section">
              <label>Age Range: {ageRange[0]} - {ageRange[1]} years</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={ageRange[0]}
                  onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])}
                  className="age-input"
                  placeholder="Min"
                />
                <span>to</span>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={ageRange[1]}
                  onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                  className="age-input"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Gender Filter */}
            <div className="filter-section">
              <label>Gender:</label>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${selectedGenders.includes('M') ? 'active' : ''}`}
                  onClick={() => setSelectedGenders(prev => 
                    prev.includes('M') ? prev.filter(g => g !== 'M') : [...prev, 'M']
                  )}
                >
                  Male
                </button>
                <button
                  className={`filter-chip ${selectedGenders.includes('F') ? 'active' : ''}`}
                  onClick={() => setSelectedGenders(prev => 
                    prev.includes('F') ? prev.filter(g => g !== 'F') : [...prev, 'F']
                  )}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Religion Filter */}
            <div className="filter-section full-width">
              <label>Religion (optional):</label>
              <div className="filter-chips">
                {['Christian', 'Catholic', 'Jewish', 'Muslim', 'Hindu', 'Buddhist', 'Non-denominational', 'No religious affiliation'].map(religion => (
                  <button
                    key={religion}
                    className={`filter-chip ${selectedReligions.includes(religion) ? 'active' : ''}`}
                    onClick={() => setSelectedReligions(prev => 
                      prev.includes(religion) ? prev.filter(r => r !== religion) : [...prev, religion]
                    )}
                  >
                    {religion}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="filter-section full-width">
              <label>Languages Spoken (optional):</label>
              <div className="filter-chips">
                {['English', 'Spanish', 'Mandarin', 'French', 'Vietnamese', 'Arabic', 'Tagalog', 'Korean', 'German', 'Russian'].map(language => (
                  <button
                    key={language}
                    className={`filter-chip ${selectedLanguages.includes(language) ? 'active' : ''}`}
                    onClick={() => setSelectedLanguages(prev => 
                      prev.includes(language) ? prev.filter(l => l !== language) : [...prev, language]
                    )}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="filter-section full-width">
              <label>Sort By:</label>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${sortBy === 'matchScore' ? 'active' : ''}`}
                  onClick={() => setSortBy('matchScore')}
                >
                  <TrendingUp size={14} /> Match %
                </button>
                <button
                  className={`filter-chip ${sortBy === 'distance' ? 'active' : ''}`}
                  onClick={() => setSortBy('distance')}
                >
                  <MapPin size={14} /> Distance
                </button>
                <button
                  className={`filter-chip ${sortBy === 'willingness' ? 'active' : ''}`}
                  onClick={() => setSortBy('willingness')}
                >
                  <Heart size={14} /> Willingness
                </button>
                <button
                  className={`filter-chip ${sortBy === 'confidence' ? 'active' : ''}`}
                  onClick={() => setSortBy('confidence')}
                >
                  <Shield size={14} /> Confidence
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="network-search-content">
          {isSearching ? (
            <div className="search-loading">
              <div className="spinner"></div>
              <p>Searching external databases...</p>
              <p className="search-loading-hint">This may take a moment as we query multiple sources</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="search-empty">
              <AlertCircle size={48} color="#6b7280" />
              <h3>No results yet</h3>
              <p>Click "Search" to find potential connections for {searchingNetworkFor.name}</p>
            </div>
          ) : (
            <div className="search-results">
              {/* Results List */}
              <div className="results-list">
                {searchResults
                  .filter(result => {
                    // Age filter
                    if (result.age < ageRange[0] || result.age > ageRange[1]) return false;
                    
                    // Gender filter
                    if (selectedGenders.length > 0 && !selectedGenders.includes(result.gender)) return false;
                    
                    // Religion filter
                    if (selectedReligions.length > 0 && !selectedReligions.includes(result.religion)) return false;
                    
                    // Language filter (person must speak at least one selected language)
                    if (selectedLanguages.length > 0) {
                      const resultLanguages = Array.isArray(result.languages)
                        ? result.languages
                        : typeof result.languages === 'string'
                          ? [result.languages]
                          : [];
                      const hasMatchingLanguage = resultLanguages.some(lang => selectedLanguages.includes(lang));
                      if (!hasMatchingLanguage) return false;
                    }
                    
                    return true;
                  })
                  .sort((a, b) => {
                    // Sort by selected criteria
                    if (sortBy === 'matchScore') {
                      return b.matchScore - a.matchScore; // Highest match first
                    } else if (sortBy === 'distance') {
                      return a.distance - b.distance; // Closest first
                    } else if (sortBy === 'willingness') {
                      const willingnessOrder = { 'High': 3, 'Medium': 2, 'Low': 1, 'Unknown': 0 };
                      return (willingnessOrder[b.willingness] || 0) - (willingnessOrder[a.willingness] || 0);
                    } else if (sortBy === 'confidence') {
                      return b.confidence - a.confidence; // Highest confidence first
                    }
                    return 0;
                  })
                  .map(result => (
                  <div
                    key={result.id}
                    className={`result-card ${selectedResult?.id === result.id ? 'selected' : ''}`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="result-header">
                      <div className="result-name">
                        <h4>{result.fullName}</h4>
                        <span className="result-relationship">{result.relationshipType}</span>
                      </div>
                      <div className="result-confidence" style={{ color: getConfidenceColor(result.confidence) }}>
                        <CheckCircle size={16} />
                        <span>{result.confidence}%</span>
                      </div>
                    </div>

                    <div className="result-match-metrics">
                      <span className={`match-badge ${result.matchScore >= 85 ? 'high' : result.matchScore >= 70 ? 'medium' : 'low'}`}>
                        <TrendingUp size={12} /> {result.matchScore}% Match
                      </span>
                      <span className="distance-badge">
                        <MapPin size={12} /> {result.distance} mi
                      </span>
                      <span className={`willingness-badge willingness-${result.willingness.toLowerCase()}`}>
                        <Heart size={12} /> {result.willingness}
                      </span>
                    </div>

                    <div className="result-details">
                      <div className="result-info">
                        <span className="result-age">{result.age} yo</span>
                        <span className="result-gender">{result.gender}</span>
                        <span className="result-location">{result.city}, {result.state}</span>
                      </div>
                      
                      <div className="result-source">
                        {(result.source?.icon ?? '📁')} {result.source?.name ?? 'Unknown source'}
                      </div>
                    </div>

                    <div className="result-actions">
                      <button
                        className="add-person-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToGenogram(result);
                        }}
                      >
                        <UserPlus size={16} />
                        Add to Genogram
                      </button>
                      <button
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(result);
                        }}
                      >
                        <ExternalLink size={16} />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Details Panel */}
              {selectedResult && (
                <div className="result-details-panel">
                  <div className="details-header">
                    <h3>{selectedResult.fullName}</h3>
                    <button onClick={() => setSelectedResult(null)}>
                      <X size={20} />
                    </button>
                  </div>

                  <div className="details-content">
                    {/* Kinship Care Match Assessment */}
                    <div className="detail-section">
                      <label><TrendingUp size={16} /> Kinship Care Match Assessment:</label>
                      <div className="match-breakdown">
                        <div className="match-item">
                          <span className="match-label">Overall Match</span>
                          <div className="match-bar">
                            <div className="match-fill" style={{ width: `${selectedResult.matchScore}%`, backgroundColor: '#10b981' }} />
                          </div>
                          <span className="match-value">{selectedResult.matchScore}%</span>
                        </div>
                        <div className="match-item">
                          <span className="match-label">Kinship Closeness (35%)</span>
                          <div className="match-bar">
                            <div className="match-fill" style={{ width: `${selectedResult.kinshipScore}%`, backgroundColor: '#3b82f6' }} />
                          </div>
                          <span className="match-value">{selectedResult.kinshipScore}%</span>
                        </div>
                        <div className="match-item">
                          <span className="match-label">Cultural Identity (20%)</span>
                          <div className="match-bar">
                            <div className="match-fill" style={{ width: `${selectedResult.culturalFitScore}%`, backgroundColor: '#8b5cf6' }} />
                          </div>
                          <span className="match-value">{selectedResult.culturalFitScore}%</span>
                        </div>
                        <div className="match-item">
                          <span className="match-label">Commitment Level (25%)</span>
                          <div className="match-bar">
                            <div className="match-fill" style={{ width: `${selectedResult.commitmentScore}%`, backgroundColor: '#ec4899' }} />
                          </div>
                          <span className="match-value">{selectedResult.commitmentScore}%</span>
                        </div>
                        <div className="match-item">
                          <span className="match-label">Support System (15%)</span>
                          <div className="match-bar">
                            <div className="match-fill" style={{ width: `${selectedResult.supportSystemScore}%`, backgroundColor: '#f59e0b' }} />
                          </div>
                          <span className="match-value">{selectedResult.supportSystemScore}%</span>
                        </div>
                        <div className="match-item">
                          <span className="match-label">Training & Resources (5%)</span>
                          <div className="match-bar">
                            <div className="match-fill" style={{ width: `${selectedResult.trainingScore}%`, backgroundColor: '#06b6d4' }} />
                          </div>
                          <span className="match-value">{selectedResult.trainingScore}%</span>
                        </div>
                      </div>
                      <div className="location-willingness-info" style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <MapPin size={14} /> <strong>Distance:</strong> {selectedResult.distance} miles
                        </div>
                        <div style={{ flex: 1 }}>
                          <Heart size={14} /> <strong>Willingness:</strong> <span className={`willingness-text willingness-${selectedResult.willingness.toLowerCase()}`}>{selectedResult.willingness}</span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="detail-section">
                      <label>Match Confidence:</label>
                      <div className="confidence-score">
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill" 
                            style={{ 
                              width: `${selectedResult.confidence}%`,
                              backgroundColor: getConfidenceColor(selectedResult.confidence)
                            }}
                          />
                        </div>
                        <span style={{ color: getConfidenceColor(selectedResult.confidence) }}>
                          {selectedResult.confidence}% - {getConfidenceLabel(selectedResult.confidence)}
                        </span>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="detail-section">
                      <label>Basic Information:</label>
                      <div className="detail-grid">
                        <div><strong>Age:</strong> {selectedResult.age} years old</div>
                        <div><strong>Gender:</strong> {selectedResult.gender === 'M' ? 'Male' : 'Female'}</div>
                        <div><strong>Relationship:</strong> {selectedResult.relationshipType}</div>
                        <div><strong>Record ID:</strong> {selectedResult.recordId}</div>
                        <div><strong>Religion:</strong> {selectedResult.religion}</div>
                        <div><strong>Languages:</strong> {Array.isArray(selectedResult.languages) && selectedResult.languages.length > 0
                          ? selectedResult.languages.join(', ')
                          : 'Not specified'}</div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="detail-section">
                      <label>Contact Information:</label>
                      <div className="contact-list">
                        <div className="contact-item">
                          <Phone size={16} />
                          <span>{selectedResult.phone}</span>
                        </div>
                        <div className="contact-item">
                          <Mail size={16} />
                          <span>{selectedResult.email}</span>
                        </div>
                        <div className="contact-item">
                          <MapPin size={16} />
                          <span>{selectedResult.city}, {selectedResult.state}</span>
                        </div>
                      </div>
                    </div>

                    {/* Source Information */}
                    <div className="detail-section">
                      <label>Data Source:</label>
                      <div className="source-info">
                        <span className="source-icon">{selectedResult.source?.icon ?? '📁'}</span>
                        <div>
                          <div className="source-name">{selectedResult.source?.name ?? 'Unknown source'}</div>
                          <div className="source-meta">
                            Last Updated: {selectedResult.lastUpdated || 'Not available'} • 
                            Last Contact: {selectedResult.lastContact || 'Not available'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="detail-section">
                      <label>Notes:</label>
                      <div className="notes-box">
                        {selectedResult.notes}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      className="add-person-btn-large"
                      onClick={() => handleAddToGenogram(selectedResult)}
                    >
                      <UserPlus size={20} />
                      Add {selectedResult.fullName} to Genogram
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkSearchModal;

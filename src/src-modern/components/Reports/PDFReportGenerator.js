// src/components/Reports/PDFReportGenerator.js
import html2pdf from 'html2pdf.js';
import { CareStatus, FosterCareStatus, PlacementStatus } from '../../constants/connectionStatus';

/**
 * Generates a comprehensive PDF report of the genogram
 * @param {Object} state - GenogramContext state
 * @param {SVGElement} svgElement - The SVG canvas element
 * @param {string} filename - Optional filename for the PDF
 */
export const generatePDFReport = async (state, svgElement, filename) => {
  try {
    console.log('PDF Report Generator - Starting...', { 
      peopleCount: state.people?.length, 
      relationshipsCount: state.relationships?.length,
      hasSVG: !!svgElement 
    });
    
    // Get SVG as data URL
    const svgDataUrl = await getSVGDataURL(svgElement);
    console.log('SVG Data URL generated:', svgDataUrl ? 'Success' : 'Failed');
    
    // Prepare data for report
    const reportData = prepareReportData(state);
    console.log('Report Data prepared:', reportData);
    
    // Generate HTML content
    const htmlContent = generateReportHTML(reportData, svgDataUrl, state.currentName || 'Untitled');
    console.log('HTML Content length:', htmlContent.length);
    
    // PDF options
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: filename || `genogram-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);
    
    console.log('Container created, generating PDF...');
    
    // Generate PDF
    await html2pdf().set(opt).from(container).save();
    
    console.log('PDF generated successfully');
    
    // Cleanup
    document.body.removeChild(container);
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

/**
 * Convert SVG element to data URL
 */
const getSVGDataURL = async (svgElement) => {
  if (!svgElement) return null;
  
  try {
    const originalGroup = svgElement.querySelector('g');
    const bbox = originalGroup ? originalGroup.getBBox() : svgElement.getBBox();
    
    const clonedSVG = svgElement.cloneNode(true);
    const clonedGroup = clonedSVG.querySelector('g');
    if (clonedGroup) {
      clonedGroup.setAttribute('transform', `translate(${-bbox.x} ${-bbox.y})`);
    }
    
    clonedSVG.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSVG.setAttribute('width', bbox.width);
    clonedSVG.setAttribute('height', bbox.height);
    clonedSVG.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSVG);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('SVG conversion failed:', error);
    return null;
  }
};

/**
 * Prepare and organize data for the report
 */
const prepareReportData = (state) => {
  const { people, relationships, households } = state;
  
  // Group people by categories
  const children = people.filter(p => 
    p.careStatus && p.careStatus !== CareStatus.NOT_APPLICABLE
  );
  
  const caregivers = people.filter(p => 
    p.fosterCareStatus && 
    [FosterCareStatus.LICENSED, FosterCareStatus.ACTIVE, FosterCareStatus.IN_PROCESS].includes(p.fosterCareStatus)
  );
  
  const networkMembers = people.filter(p => p.networkMember);
  
  const relatives = people.filter(p => 
    !children.includes(p) && 
    !caregivers.includes(p) &&
    relationships.some(r => 
      (r.from === p.id || r.to === p.id) && 
      r.relType && 
      !['friend', 'professional'].includes(r.relType.toLowerCase())
    )
  );
  
  const otherConnections = people.filter(p => 
    !children.includes(p) && 
    !caregivers.includes(p) && 
    !relatives.includes(p) &&
    !networkMembers.includes(p)
  );
  
  return {
    children,
    caregivers,
    networkMembers,
    relatives,
    otherConnections,
    households: households || [],
    totalPeople: people.length,
    totalRelationships: relationships.length,
    totalHouseholds: (households || []).length,
    state: state,
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
};

/**
 * Generate HTML content for the PDF report
 */
const generateReportHTML = (data, svgDataUrl, title) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #333;
        }
        
        .page {
          page-break-after: always;
        }
        
        .cover-page {
          padding: 1in;
          text-align: center;
        }
        
        .cover-title {
          font-size: 28pt;
          font-weight: bold;
          margin-top: 2in;
          margin-bottom: 0.5in;
          color: #1f2937;
        }
        
        .cover-subtitle {
          font-size: 14pt;
          color: #6b7280;
          margin-bottom: 0.3in;
        }
        
        .cover-date {
          font-size: 11pt;
          color: #9ca3af;
          margin-top: 1in;
        }
        
        .diagram-page {
          padding: 0.5in;
          text-align: center;
        }
        
        .diagram-title {
          font-size: 16pt;
          font-weight: bold;
          margin-bottom: 0.3in;
          color: #1f2937;
        }
        
        .diagram-container {
          width: 100%;
          max-height: 8.5in;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .diagram-container img {
          max-width: 100%;
          max-height: 8.5in;
          object-fit: contain;
        }
        
        .content-page {
          padding: 0.75in 0.5in;
        }
        
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 0.3in;
          margin-bottom: 0.2in;
          padding-bottom: 0.1in;
          border-bottom: 2px solid #e5e7eb;
          color: #1f2937;
          page-break-after: avoid;
        }
        
        .section-title:first-child {
          margin-top: 0;
        }
        
        .person-card {
          margin-bottom: 0.25in;
          padding: 0.15in;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background: #f9fafb;
          page-break-inside: avoid;
        }
        
        .person-name {
          font-size: 11pt;
          font-weight: bold;
          color: #111827;
          margin-bottom: 0.05in;
        }
        
        .person-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.05in 0.2in;
          font-size: 9pt;
          color: #4b5563;
        }
        
        .detail-label {
          font-weight: 600;
          color: #6b7280;
        }
        
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 8pt;
          font-weight: 600;
          margin-right: 4px;
          margin-top: 2px;
        }
        
        .badge-network {
          background: #ddd6fe;
          color: #5b21b6;
        }
        
        .badge-child {
          background: #fef3c7;
          color: #92400e;
        }
        
        .badge-caregiver {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .badge-placement {
          background: #d1fae5;
          color: #065f46;
        }
        
        .person-notes {
          margin-top: 0.1in;
          padding: 0.1in;
          background: white;
          border-left: 3px solid #6366f1;
          font-size: 9pt;
          color: #374151;
          font-style: italic;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.2in;
          margin: 0.2in 0;
          page-break-inside: avoid;
        }
        
        .stat-box {
          padding: 0.15in;
          background: #f3f4f6;
          border-radius: 4px;
          text-align: center;
        }
        
        .stat-number {
          font-size: 20pt;
          font-weight: bold;
          color: #6366f1;
        }
        
        .stat-label {
          font-size: 9pt;
          color: #6b7280;
          margin-top: 0.05in;
        }
        
        .footer {
          position: fixed;
          bottom: 0.3in;
          right: 0.5in;
          font-size: 8pt;
          color: #9ca3af;
        }
        
        .no-data {
          padding: 0.2in;
          text-align: center;
          color: #9ca3af;
          font-style: italic;
        }
        
        .connections-section {
          margin-top: 0.15in;
          padding-top: 0.15in;
          border-top: 1px solid #e5e7eb;
        }
        
        .connections-title {
          font-size: 10pt;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.08in;
        }
        
        .connections-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8.5pt;
        }
        
        .connections-table thead th {
          background: #f3f4f6;
          padding: 0.06in 0.08in;
          text-align: left;
          font-weight: 600;
          color: #6b7280;
          font-size: 8pt;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .connections-table tbody td {
          padding: 0.06in 0.08in;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
        }
        
        .connections-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .conn-name {
          font-weight: 500;
          color: #111827;
        }
        
        .conn-type {
          color: #6366f1;
          font-weight: 500;
        }
        
        .conn-abbrev {
          text-align: center;
          font-weight: 600;
          color: #8b5cf6;
          font-size: 8pt;
        }
        
        .conn-attr {
          font-size: 8pt;
          color: #6b7280;
        }
        
        .conn-placement {
          font-size: 8pt;
          color: #059669;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="page cover-page">
        <div class="cover-title">Family Network Report</div>
        <div class="cover-subtitle">${escapeHtml(title)}</div>
        <div class="summary-stats">
          <div class="stat-box">
            <div class="stat-number">${data.totalPeople}</div>
            <div class="stat-label">Total People</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${data.totalRelationships}</div>
            <div class="stat-label">Relationships</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${data.networkMembers.length}</div>
            <div class="stat-label">Network Members</div>
          </div>
        </div>
        <div class="cover-date">Generated on ${data.generatedDate}</div>
      </div>
      
      <!-- Diagram Page -->
      ${svgDataUrl ? `
      <div class="page diagram-page">
        <div class="diagram-title">Family Network Diagram</div>
        <div class="diagram-container">
          <img src="${svgDataUrl}" alt="Genogram Diagram" />
        </div>
      </div>
      ` : ''}
      
      <!-- Detailed Information Pages -->
      <div class="content-page">
        ${generateHouseholdSectionHTML('Households', data.households, data.state)}
        ${generateSectionHTML('Children in Care', data.children, data.state)}
        ${generateSectionHTML('Licensed Caregivers', data.caregivers, data.state)}
        ${generateSectionHTML('Network Members', data.networkMembers, data.state)}
        ${generateSectionHTML('Family & Relatives', data.relatives, data.state)}
        ${generateSectionHTML('Other Connections', data.otherConnections, data.state)}
      </div>
      
      <div class="footer">Generated by Genogram Builder - ${data.generatedDate}</div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML for households section
 */
const generateHouseholdSectionHTML = (title, households, state) => {
  if (!households || households.length === 0) {
    return `
      <div class="section-title">${title}</div>
      <div class="no-data">No households defined in this genogram.</div>
    `;
  }
  
  const peopleById = new Map(state.people.map(p => [p.id, p]));
  
  return `
    <div class="section-title">${title} (${households.length})</div>
    ${households.map(household => {
      const members = (household.members || [])
        .map(memberId => peopleById.get(memberId))
        .filter(Boolean);
      
      return `
        <div class="person-card">
          <div class="person-header">
            <div class="person-name">${escapeHtml(household.name || 'Unnamed Household')}</div>
            <div class="person-badges">
              <span class="badge" style="background: ${household.color || '#6366f1'}22; color: ${household.color || '#6366f1'}; border: 1px solid ${household.color || '#6366f1'}44;">
                ${members.length} member${members.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          ${members.length > 0 ? `
            <div class="connections-section">
              <div class="connections-title">Household Members</div>
              <table class="connections-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${members.map(member => `
                    <tr>
                      <td class="conn-name">${escapeHtml(member.name || 'Unnamed')}</td>
                      <td>${member.age || 'N/A'}</td>
                      <td>${member.gender || 'N/A'}</td>
                      <td>${member.isDeceased ? 'Deceased' : (member.networkMember ? 'Network Member' : 'Active')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<div class="no-data">No members in this household</div>'}
          ${household.notes ? `
            <div class="person-info">
              <div class="info-label">Notes:</div>
              <div class="info-value">${escapeHtml(household.notes)}</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  `;
};

/**
 * Generate HTML for a section of people
 */
const generateSectionHTML = (title, people, state) => {
  if (!people || people.length === 0) {
    return `
      <div class="section-title">${title}</div>
      <div class="no-data">No ${title.toLowerCase()} in this genogram.</div>
    `;
  }
  
  return `
    <div class="section-title">${title} (${people.length})</div>
    ${people.map(person => generatePersonCardHTML(person, state)).join('')}
  `;
};

/**
 * Get all connections for a person
 */
const getPersonConnections = (personId, state) => {
  const connections = [];
  const { people, relationships, placements } = state;
  const peopleById = new Map(people.map(p => [p.id, p]));
  
  relationships.forEach(rel => {
    if (!rel) return;
    
    // Handle child relationships (parent-child)
    if (rel.type === 'child') {
      // Find the parent relationship this child belongs to
      const parentRel = relationships.find(r => r.id === rel.from);
      if (!parentRel) return;
      
      // If this person is the child
      if (rel.to === personId) {
        const parent1 = peopleById.get(parentRel.from);
        const parent2 = peopleById.get(parentRel.to);
        
        if (parent1) {
          connections.push({
            personName: parent1.name || 'Unnamed',
            relType: 'Parent',
            relAbbreviation: 'P',
            relAttributes: getRelationshipAttributes(parentRel),
            placementStatus: getPlacementStatus(personId, parent1.id, placements)
          });
        }
        
        if (parent2) {
          connections.push({
            personName: parent2.name || 'Unnamed',
            relType: 'Parent',
            relAbbreviation: 'P',
            relAttributes: getRelationshipAttributes(parentRel),
            placementStatus: getPlacementStatus(personId, parent2.id, placements)
          });
        }
      }
      
      // If this person is a parent
      if (parentRel.from === personId || parentRel.to === personId) {
        const child = peopleById.get(rel.to);
        if (child) {
          connections.push({
            personName: child.name || 'Unnamed',
            relType: 'Child',
            relAbbreviation: 'C',
            relAttributes: getRelationshipAttributes(rel),
            placementStatus: getPlacementStatus(child.id, personId, placements)
          });
        }
      }
    } else {
      // Direct relationships (spouse, partner, friend, etc.)
      let connectedPersonId = null;
      if (rel.from === personId) {
        connectedPersonId = rel.to;
      } else if (rel.to === personId) {
        connectedPersonId = rel.from;
      }
      
      if (connectedPersonId) {
        const connectedPerson = peopleById.get(connectedPersonId);
        if (connectedPerson) {
          connections.push({
            personName: connectedPerson.name || 'Unnamed',
            relType: formatRelationType(rel.relType || rel.type || 'Connection'),
            relAbbreviation: getRelationshipAbbreviation(rel.relType || rel.type),
            relAttributes: getRelationshipAttributes(rel),
            placementStatus: getPlacementStatus(personId, connectedPersonId, placements)
          });
        }
      }
    }
  });
  
  return connections;
};

/**
 * Get relationship abbreviation
 */
const getRelationshipAbbreviation = (relType) => {
  const abbrevMap = {
    'married': 'M',
    'partnered': 'PTR',
    'divorced': 'DIV',
    'separated': 'SEP',
    'cohabiting': 'COH',
    'friend': 'FRD',
    'professional': 'PROF',
    'sibling': 'SIB',
    'cousin': 'COU',
    'aunt/uncle': 'AU',
    'uncle/aunt': 'AU',
    'grandparent': 'GP',
    'parent': 'P',
    'child': 'C',
    'other': 'OTH'
  };
  
  if (!relType) return 'N/A';
  return abbrevMap[relType.toLowerCase()] || relType.substring(0, 3).toUpperCase();
};

/**
 * Get relationship attributes as string
 */
const getRelationshipAttributes = (rel) => {
  const attrs = [];
  
  if (rel.connectionStatus) attrs.push(rel.connectionStatus);
  if (rel.quality) attrs.push(`Quality: ${rel.quality}`);
  if (rel.frequency) attrs.push(`Frequency: ${rel.frequency}`);
  if (rel.startDate) attrs.push(`Since: ${rel.startDate}`);
  if (rel.endDate) attrs.push(`Until: ${rel.endDate}`);
  if (rel.notes) attrs.push(rel.notes);
  
  return attrs.length > 0 ? attrs.join('; ') : 'None';
};

/**
 * Get placement status between two people
 */
const getPlacementStatus = (childId, caregiverId, placements) => {
  if (!placements || !Array.isArray(placements)) return 'N/A';
  
  const placement = placements.find(p => 
    p.childId === childId && p.caregiverId === caregiverId
  );
  
  return placement?.placementStatus || 'N/A';
};

/**
 * Format relationship type for display
 */
const formatRelationType = (type) => {
  if (!type) return 'Connected to';
  
  const typeMap = {
    'partner': 'Partner',
    'married': 'Married',
    'divorced': 'Divorced',
    'separated': 'Separated',
    'cohabiting': 'Cohabiting',
    'sibling': 'Sibling',
    'friend': 'Friend',
    'professional': 'Professional Contact',
    'other': 'Other Connection'
  };
  
  return typeMap[type.toLowerCase()] || type;
};

/**
 * Generate HTML table for connections with detailed 5-column format
 */
const generateConnectionsTableHTML = (connections) => {
  if (!connections || connections.length === 0) return '';
  
  return `
    <div class="connections-section">
      <div class="connections-title">Relationships & Connections</div>
      <table class="connections-table">
        <thead>
          <tr>
            <th>Connected Person</th>
            <th>Relationship Type</th>
            <th>Abbrev.</th>
            <th>Relationship Attributes</th>
            <th>Placement Status</th>
          </tr>
        </thead>
        <tbody>
          ${connections.map(conn => `
            <tr>
              <td class="conn-name">${escapeHtml(conn.personName)}</td>
              <td class="conn-type">${escapeHtml(conn.relType)}</td>
              <td class="conn-abbrev">${escapeHtml(conn.relAbbreviation)}</td>
              <td class="conn-attr">${escapeHtml(conn.relAttributes)}</td>
              <td class="conn-placement">${escapeHtml(conn.placementStatus)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

/**
 * Generate HTML for a person card with relationship details
 */
const generatePersonCardHTML = (person, state) => {
  const badges = [];
  
  if (person.networkMember) {
    badges.push('<span class="badge badge-network">Network Member</span>');
  }
  
  if (person.careStatus && person.careStatus !== CareStatus.NOT_APPLICABLE) {
    badges.push(`<span class="badge badge-child">${person.careStatus}</span>`);
  }
  
  if (person.fosterCareStatus && person.fosterCareStatus !== FosterCareStatus.NOT_APPLICABLE) {
    badges.push(`<span class="badge badge-caregiver">${person.fosterCareStatus}</span>`);
  }
  
  if (person.placementStatus && person.placementStatus !== PlacementStatus.NOT_APPLICABLE) {
    badges.push(`<span class="badge badge-placement">${person.placementStatus}</span>`);
  }
  
  // Get all relationships for this person
  const connections = getPersonConnections(person.id, state);
  
  return `
    <div class="person-card">
      <div class="person-name">
        ${escapeHtml(person.name || 'Unnamed')}
        ${person.deceased ? ' †' : ''}
      </div>
      ${badges.length > 0 ? `<div style="margin: 0.05in 0;">${badges.join('')}</div>` : ''}
      <div class="person-details">
        ${person.age ? `<div><span class="detail-label">Age:</span> ${escapeHtml(person.age)} years old</div>` : ''}
        ${person.gender ? `<div><span class="detail-label">Gender:</span> ${escapeHtml(person.gender)}</div>` : ''}
        ${person.birthdate ? `<div><span class="detail-label">Birth Date:</span> ${escapeHtml(person.birthdate)}</div>` : ''}
        ${person.deceased && person.dateOfDeath ? `<div><span class="detail-label">Date of Death:</span> ${escapeHtml(person.dateOfDeath)}</div>` : ''}
        ${person.phone ? `<div><span class="detail-label">Phone:</span> ${escapeHtml(person.phone)}</div>` : ''}
        ${person.email ? `<div><span class="detail-label">Email:</span> ${escapeHtml(person.email)}</div>` : ''}
        ${person.address ? `<div style="grid-column: 1 / -1;"><span class="detail-label">Address:</span> ${escapeHtml(person.address)}</div>` : ''}
        ${person.networkRole ? `<div style="grid-column: 1 / -1;"><span class="detail-label">Network Role:</span> ${escapeHtml(person.networkRole)}</div>` : ''}
      </div>
      ${person.notes ? `<div class="person-notes">${escapeHtml(person.notes)}</div>` : ''}
      ${connections.length > 0 ? generateConnectionsTableHTML(connections) : ''}
    </div>
  `;
};

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export default generatePDFReport;

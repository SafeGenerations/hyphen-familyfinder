import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import AdminDashboard from './AdminDashboard';
import AdminSearchSourcesPage from './AdminSearchSourcesPage';
import AdminContactEventsPage from './AdminContactEventsPage';
import AdminAuditLogsPage from './AdminAuditLogsPage';
import AdminActivityLogTable from './AdminActivityLogTable';
import FamilyFinderLanding from './src-modern/pages/FamilyFinderLanding';
import MyFamiliesDashboard from './src-modern/pages/MyFamiliesDashboard';
import CaseDetailPage from './src-modern/pages/CaseDetailPage';
import reportWebVitals from './reportWebVitals';
import Analytics from './Analytics';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <> {/* React.StrictMode temporarily disabled to fix canvas duplication */}
    <Analytics />
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/family-finder" element={<FamilyFinderLanding />} />
        <Route path="/family-finder/cases" element={<MyFamiliesDashboard />} />
        <Route path="/family-finder/cases/:caseId" element={<CaseDetailPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/search-sources" element={<AdminSearchSourcesPage />} />
        <Route path="/admin/contact-events" element={<AdminContactEventsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="/admin/activity" element={<AdminActivityLogTable />} />
      </Routes>
    </Router>
  </>
);

reportWebVitals();

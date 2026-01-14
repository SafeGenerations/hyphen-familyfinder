// Family Finder Landing Page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Activity, TrendingUp } from 'lucide-react';
import './FamilyFinderLanding.css';

const FamilyFinderLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users size={32} />,
      title: 'Network Mapping',
      description: 'Visualize family connections and relationships at a glance',
      color: '#3b82f6'
    },
    {
      icon: <Search size={32} />,
      title: 'Smart Search',
      description: 'Find potential kin across multiple databases with provenance tracking',
      color: '#10b981'
    },
    {
      icon: <Activity size={32} />,
      title: 'Contact Tracking',
      description: 'Log interactions and maintain engagement with network members',
      color: '#f59e0b'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Health Analytics',
      description: 'Monitor network health and identify areas needing attention',
      color: '#8b5cf6'
    }
  ];

  const approaches = [
    {
      number: 1,
      title: 'Network-First Approach',
      description: 'Visualize relationships before diving into details. See the complete picture of a child\'s support network in one view.'
    },
    {
      number: 2,
      title: 'Activity-Based Insights',
      description: 'Color-coded indicators show engagement levels at a glance. Quickly identify relationships that need attention.'
    },
    {
      number: 3,
      title: 'Mobile-Optimized',
      description: 'Access and update family information from anywhere. Quick actions for field workers on the go.'
    }
  ];

  return (
    <div className="family-finder-landing">
      <header className="ff-header">
        <div className="ff-brand">
          <h1>SafeGenerations</h1>
          <p>Family Finder</p>
        </div>
        <button className="dmm-button" onClick={() => navigate('/')}>
          DMM
        </button>
      </header>

      <section className="ff-hero">
        <h2>Welcome to Family Finder</h2>
        <p className="ff-subtitle">
          Discover, connect, and maintain family relationships to support permanency and well-being
        </p>
      </section>

      <section className="ff-features">
        {features.map((feature, index) => (
          <div key={index} className="ff-feature-card">
            <div className="ff-feature-icon" style={{ background: `${feature.color}15`, color: feature.color }}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="ff-get-started">
        <h2>Get Started</h2>
        <p className="ff-section-subtitle">
          View your family caseload and explore the demo to see how Family Finder
          helps caseworkers build and maintain connections for children in care.
        </p>
        <button className="ff-primary-button" onClick={() => navigate('/family-finder/cases')}>
          <Users size={20} />
          My Families
        </button>
      </section>

      <section className="ff-approaches">
        {approaches.map((approach) => (
          <div key={approach.number} className="ff-approach-card">
            <div className="ff-approach-number">{approach.number}</div>
            <div className="ff-approach-content">
              <h3>{approach.title}</h3>
              <p>{approach.description}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="ff-footer">
        <p>SafeGenerations Family Finder - Built for child welfare professionals.</p>
      </footer>
    </div>
  );
};

export default FamilyFinderLanding;

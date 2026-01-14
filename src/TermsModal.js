import React from 'react';

const TermsModal = ({ show, onAgree }) => {
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', maxWidth: '600px', width: '90%' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 16px 0' }}>
          SafeGenerations Genogram App – User Agreement
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 16px 0' }}>
          Welcome! Before using the Genogram App, please review and accept the following:
        </p>
        <ul style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px 20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>You Control Your Data:</strong> All genograms you create are stored only where you choose—on your local device, a private drive, or another secure location. We do not collect, access, or store any of your data.</li>
          <li style={{ marginBottom: '8px' }}><strong>HIPAA-Aligned Design:</strong> This app is built to support HIPAA compliance. However, you are responsible for how and where you store your data.</li>
          <li style={{ marginBottom: '8px' }}><strong>No Server-Side Storage:</strong> We don’t store your genograms on our servers. You decide where to save your files, and they remain available even after you close your browser—as long as you’ve saved them to a location you control.</li>
          <li style={{ marginBottom: '8px' }}><strong>Use Responsibly:</strong> By continuing, you agree to use the app in a secure and responsible manner.</li>
        </ul>
        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
          By clicking “I Agree”, you confirm that you understand and accept these terms. For more details, please review our{' '}
          <a href="https://safegenerations.org/terms-and-conditions/" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>{' '}
          and{' '}
          <a href="https://safegenerations.org/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
        </p>
        <div style={{ textAlign: 'right' }}>
          <button onClick={onAgree} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>I Agree</button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;

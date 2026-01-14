// src/src-modern/components/UI/BannerPromo.js
import React, { useState } from 'react';
import { X, Star, Calendar, Mail, Gift } from 'lucide-react';
import { getActivePromotion } from '../../config/promoConfig';

const BannerPromo = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const promotion = getActivePromotion();
  
  if (!promotion) return null;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      // Replace with your actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Email submitted:', email);
      setSubmitted(true);
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render course promotion
  const renderCoursePromo = (content) => (
    <>
      {/* Course Badge */}
      {(content.badges.new || content.badges.limitedTime) && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', 
          borderRadius: '16px', 
          padding: '20px', 
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          {content.badges.new && (
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: 'white' 
            }}>NEW COURSE</h3>
          )}
          {content.badges.limitedTime && (
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: 'white', 
              opacity: 0.9 
            }}>Limited Time Offer</p>
          )}
        </div>
      )}

      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '16px',
        textAlign: 'center',
        lineHeight: '1.3'
      }}>
        {content.title}
      </h2>

      <p style={{
        fontSize: '14px',
        opacity: 0.9,
        marginBottom: '24px',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        {content.description}
      </p>

      {/* Benefits */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '16px',
          opacity: 0.95
        }}>
          What You'll Get:
        </h3>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: '14px',
          lineHeight: '1.8'
        }}>
          {content.benefits.map((benefit, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pricing */}
      {content.pricing && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '16px',
          padding: '16px', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div>
            <p style={{ 
              margin: 0, 
              fontSize: '12px', 
              opacity: 0.8
            }}>Special Price</p>
            <p style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: 'bold'
            }}>
              {content.pricing.currency}{content.pricing.current}
            </p>
          </div>
          <div>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              textDecoration: 'line-through',
              opacity: 0.7
            }}>
              {content.pricing.currency}{content.pricing.original}
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#fbbf24'
            }}>
              Save {Math.round((1 - content.pricing.current / content.pricing.original) * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <a
        href={content.cta.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          background: 'white',
          color: '#667eea',
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          transform: 'scale(1)'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        {content.cta.text}
      </a>

      {/* Social Proof */}
      {content.socialProof && (
        <p style={{
          fontSize: '12px',
          opacity: 0.7,
          textAlign: 'center',
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}>
          <Star size={14} />
          Rated {content.socialProof.rating} by {content.socialProof.count} professionals
        </p>
      )}
    </>
  );

  // Render webinar promotion
  const renderWebinarPromo = (content) => (
    <>
      {content.badges.free && (
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          borderRadius: '16px', 
          padding: '20px', 
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: 'white' 
          }}>FREE WEBINAR</h3>
        </div>
      )}

      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '16px',
        textAlign: 'center',
        lineHeight: '1.3'
      }}>
        {content.title}
      </h2>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '24px',
        fontSize: '16px',
        opacity: 0.9
      }}>
        <Calendar size={18} />
        <span>{content.date} at {content.time}</span>
      </div>

      <p style={{
        fontSize: '14px',
        opacity: 0.9,
        marginBottom: '24px',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        {content.description}
      </p>

      {/* Benefits */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '16px',
          opacity: 0.95
        }}>
          What You'll Learn:
        </h3>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: '14px',
          lineHeight: '1.8'
        }}>
          {content.benefits.map((benefit, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <a
        href={content.cta.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 16px',
          borderRadius: '8px',
          border: 'none',
          background: 'white',
          color: '#10b981',
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          transform: 'scale(1)'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        {content.cta.text}
      </a>
    </>
  );

  // Render newsletter promotion
  const renderNewsletterPromo = (content) => (
    <>
      <div style={{
        textAlign: 'center',
        marginBottom: '32px'
      }}>
        <Mail size={48} style={{ marginBottom: '16px', opacity: 0.9 }} />
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '16px',
          lineHeight: '1.3'
        }}>
          {content.title}
        </h2>
        <p style={{
          fontSize: '14px',
          opacity: 0.9,
          lineHeight: '1.5'
        }}>
          {content.description}
        </p>
      </div>

      {/* Benefits */}
      <div style={{ marginBottom: '32px' }}>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: '14px',
          lineHeight: '1.8'
        }}>
          {content.benefits.map((benefit, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ marginRight: '8px', fontSize: '16px' }}>📧</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Incentive */}
      {content.incentive && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <Gift size={20} />
          <p style={{ margin: 0, fontSize: '14px' }}>{content.incentive}</p>
        </div>
      )}

      {/* Email Form */}
      {!submitted ? (
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px',
              marginBottom: '16px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'white',
              color: '#667eea',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Subscribing...' : content.cta.text}
          </button>
        </form>
      ) : (
        <div style={{
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
          <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
            You're subscribed!
          </p>
          <p style={{ fontSize: '14px', opacity: 0.9 }}>
            Check your inbox for confirmation.
          </p>
        </div>
      )}
    </>
  );

  // Render custom HTML promotion
  const renderCustomPromo = (content) => (
    <div dangerouslySetInnerHTML={{ __html: content.html }} />
  );

  // Determine which promo to render
  const renderPromoContent = () => {
    switch (promotion.type) {
      case 'course':
        return renderCoursePromo(promotion.content);
      case 'webinar':
        return renderWebinarPromo(promotion.content);
      case 'newsletter':
        return renderNewsletterPromo(promotion.content);
      case 'custom':
        return renderCustomPromo(promotion.content);
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '320px',
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
      zIndex: 20,
      animation: 'slideIn 0.3s ease-out'
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.2s',
          zIndex: 1
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
      >
        <X size={18} />
      </button>

      {/* Content */}
      <div style={{ 
        padding: '32px 24px', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/sg_logo_bug_only.png"
            alt="SafeGenerations"
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            }}
          />
        </div>

        {/* Dynamic content based on promotion type */}
        {renderPromoContent()}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BannerPromo;
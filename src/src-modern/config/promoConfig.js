// src/src-modern/config/promoConfig.js

// This configuration file controls all promotional content in the app
// To update promotions, simply edit this file - no need to touch the component code!

/**
 * PROMO VERSION SYSTEM
 * 
 * The 'version' field controls when users see promotions:
 * - When you want to show a new promotion to ALL users (even those who dismissed previous ones),
 *   simply update the 'version' field to a new unique value
 * - Recommended format: 'YYYY-MM-DD-v1' (e.g., '2025-01-27-v1')
 * - Users who dismissed a specific version won't see that version again
 * - But they WILL see new versions, even if they dismissed older ones
 * 
 * Examples:
 * - Initial promotion: version: '2025-01-27-v1'
 * - New course offering: version: '2025-02-15-v1'
 * - Updated pricing: version: '2025-02-15-v2'
 * - Special webinar: version: '2025-03-01-v1'
 * 
 * To test locally:
 * - In browser console: localStorage.removeItem('genogram_promo_dismissed_version')
 * - Or set to older version: localStorage.setItem('genogram_promo_dismissed_version', '2025-01-01-v1')
 */

const promoConfig = {
  // Master switch - set to false to hide all promos
  enabled: true,

  // Whether the promo sidebar should be shown on initial load
  showPromo: true,
  
  // Promotion version - increment this to force all users to see the promo again
  // Format: 'YYYY-MM-DD-v1' or any unique identifier
  version: '2025-01-27-v1',
  
  // Current active promotion (can be 'course', 'webinar', 'newsletter', 'custom')
  activeType: 'course',
  
  // Course promotion configuration
  course: {
    title: "Introduction to PAINT: Aligning Practice with Aspirations",
    description: "Transform your social services practice with our innovative PAINT methodology.",
    benefits: [
      "Practical implementation strategies",
      "Evidence-based approaches", 
      "Tools for client engagement",
      "Self-care and sustainability"
    ],
    pricing: {
      current: 20,
      original: 49,
      currency: "$"
    },
    cta: {
      text: "Enroll Now →",
      url: "https://safegenerationsuniversity.usefedora.com/p/paint-prep-prepare-for-your-practice-alignment-intensive"
    },
    badges: {
      new: true,
      limitedTime: true,
      ceus: true
    },
    socialProof: {
      rating: "4.9/5",
      count: "500+"
    }
  },
  
  // Webinar promotion configuration
  webinar: {
    title: "Free Webinar: Advanced Genogram Techniques",
    date: "January 30, 2025",
    time: "2:00 PM EST",
    description: "Join us for a deep dive into advanced genogram creation techniques.",
    benefits: [
      "Learn advanced symbols and notations",
      "Explore cultural considerations",
      "Q&A with experts",
      "Certificate of attendance"
    ],
    cta: {
      text: "Register Free →",
      url: "https://safegenerations.org/webinar-signup"
    },
    badges: {
      free: true,
      live: true,
      ceus: false
    }
  },
  
  // Newsletter signup configuration
  newsletter: {
    title: "Stay Updated",
    description: "Get the latest tips, resources, and updates delivered to your inbox.",
    benefits: [
      "Weekly genogram tips",
      "Case study examples",
      "New feature announcements",
      "Exclusive discounts"
    ],
    cta: {
      text: "Subscribe →",
      url: "https://safegenerations.org/newsletter"
    },
    incentive: "Get our free Genogram Symbol Guide when you subscribe!"
  },
  
  // Custom HTML promotion (for maximum flexibility)
  custom: {
    // You can put any HTML here and it will be rendered
    // Use inline styles for consistency
    html: `
      <div style="text-align: center; padding: 20px;">
        <h3 style="color: #6366f1; margin-bottom: 16px;">Special Announcement</h3>
        <p style="color: #64748b; margin-bottom: 20px;">
          We're launching something big next month!
        </p>
        <a href="https://safegenerations.org" 
           style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px;">
          Learn More
        </a>
      </div>
    `
  },
  
  // Rotation configuration (optional)
  rotation: {
    enabled: false,
    schedule: [
      { type: 'course', startDate: '2025-01-01', endDate: '2025-01-31' },
      { type: 'webinar', startDate: '2025-02-01', endDate: '2025-02-15' },
      { type: 'newsletter', startDate: '2025-02-16', endDate: '2025-02-28' }
    ]
  },
  
  // A/B testing configuration (optional)
  abTesting: {
    enabled: false,
    variants: {
      A: { activeType: 'course' },
      B: { activeType: 'webinar' }
    }
  }
};

// Helper function to get the active promotion based on date
export const getActivePromotion = () => {
  if (!promoConfig.enabled) return null;
  
  // Check if rotation is enabled
  if (promoConfig.rotation.enabled) {
    const today = new Date();
    const activeSchedule = promoConfig.rotation.schedule.find(item => {
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      return today >= start && today <= end;
    });
    
    if (activeSchedule) {
      return {
        type: activeSchedule.type,
        content: promoConfig[activeSchedule.type],
        version: promoConfig.version
      };
    }
  }
  
  // Return the manually set active promotion
  return {
    type: promoConfig.activeType,
    content: promoConfig[promoConfig.activeType],
    version: promoConfig.version
  };
};

export default promoConfig;
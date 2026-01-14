import React from 'react';
import promoConfig from '../../config/promoConfig';
import BannerPromo from './BannerPromo';

// Wrapper component used by the main app. It simply forwards the onClose
// handler to the more fully‑featured BannerPromo component and respects
// the showPromo flag from promoConfig.
const PromoSidebar = ({ show, onClose }) => {
  if (!show || !promoConfig.showPromo) return null;

  return <BannerPromo onClose={onClose} />;
};

export default PromoSidebar;

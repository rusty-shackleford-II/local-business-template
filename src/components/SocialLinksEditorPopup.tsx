'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaInstagram, 
  FaFacebookF, 
  FaLinkedinIn, 
  FaTiktok,
  FaYelp,
  FaGoogle,
  FaYoutube
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { SocialLinksConfig } from '../types';
import {
  EditorModal,
  EditorToggle,
  EditorSlider,
  EditorInfoBox,
} from './editor-ui';

interface SocialLinksEditorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when cancel button is clicked - parent should restore original values */
  onCancel?: () => void;
  socialLinks?: SocialLinksConfig;
  onEdit?: (path: string, value: any) => void;
  targetElement?: HTMLElement | null; // Used for smart positioning
}

// Icon for the modal header
const SocialIcon = () => (
  <FaInstagram className="w-3.5 h-3.5 text-white" />
);

// Size presets for sliders
const SIZE_PRESETS = [
  { value: 0.75, label: '75%' },
  { value: 1.0, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
];

// Social platform configurations
const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: FaFacebookF, placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', icon: FaInstagram, placeholder: 'https://instagram.com/yourprofile' },
  { key: 'twitter', label: 'X (Twitter)', icon: FaXTwitter, placeholder: 'https://x.com/yourhandle' },
  { key: 'linkedin', label: 'LinkedIn', icon: FaLinkedinIn, placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'youtube', label: 'YouTube', icon: FaYoutube, placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok', label: 'TikTok', icon: FaTiktok, placeholder: 'https://tiktok.com/@yourprofile' },
  { key: 'yelp', label: 'Yelp', icon: FaYelp, placeholder: 'https://yelp.com/biz/yourbusiness' },
  { key: 'googleBusinessProfile', label: 'Google', icon: FaGoogle, placeholder: 'https://g.page/yourbusiness' },
];

const SocialLinksEditorPopup: React.FC<SocialLinksEditorPopupProps> = ({ 
  isOpen, 
  onClose, 
  onCancel,
  socialLinks, 
  onEdit,
  targetElement,
}) => {
  // Local state for form values (synced with props)
  const [localHeroIconSize, setLocalHeroIconSize] = useState(socialLinks?.heroSocialIconSize ?? 1.0);
  const [localContactIconSize, setLocalContactIconSize] = useState(socialLinks?.contactSocialIconSize ?? 1.0);
  const [localLinks, setLocalLinks] = useState<Record<string, string>>({});
  const [localShowInHero, setLocalShowInHero] = useState(socialLinks?.showInHero ?? false);
  const [localShowInContact, setLocalShowInContact] = useState(socialLinks?.showInContact ?? true);
  
  // Sync local state with props when popup opens
  useEffect(() => {
    if (isOpen) {
      setLocalHeroIconSize(socialLinks?.heroSocialIconSize ?? 1.0);
      setLocalContactIconSize(socialLinks?.contactSocialIconSize ?? 1.0);
      setLocalLinks({
        facebook: socialLinks?.links?.facebook || '',
        instagram: socialLinks?.links?.instagram || '',
        twitter: socialLinks?.links?.twitter || '',
        linkedin: socialLinks?.links?.linkedin || '',
        youtube: socialLinks?.links?.youtube || '',
        tiktok: socialLinks?.links?.tiktok || '',
        yelp: socialLinks?.links?.yelp || '',
        googleBusinessProfile: socialLinks?.links?.googleBusinessProfile || '',
      });
      setLocalShowInHero(socialLinks?.showInHero ?? false);
      setLocalShowInContact(socialLinks?.showInContact ?? true);
    }
  }, [isOpen, socialLinks]);

  const handleHeroSizeChange = (size: number) => {
    setLocalHeroIconSize(size);
    onEdit?.('socialLinks.heroSocialIconSize', size);
  };

  const handleContactSizeChange = (size: number) => {
    setLocalContactIconSize(size);
    onEdit?.('socialLinks.contactSocialIconSize', size);
  };

  const handleLinkChange = (platform: string, value: string) => {
    setLocalLinks(prev => ({ ...prev, [platform]: value }));
    onEdit?.(`socialLinks.links.${platform}`, value);
  };
  
  const handleShowInHeroChange = (checked: boolean) => {
    setLocalShowInHero(checked);
    onEdit?.('socialLinks.showInHero', checked);
  };

  const handleShowInContactChange = (checked: boolean) => {
    setLocalShowInContact(checked);
    onEdit?.('socialLinks.showInContact', checked);
  };

  return (
    <EditorModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      showCancelButton={!!onCancel}
      title="Social Links"
      icon={<SocialIcon />}
      width="lg"
      backdropOpacity={0}
      closeOnBackdropClick={true}
      targetElement={targetElement}
    >
      {/* Show in Hero Toggle + Size */}
      <div className="space-y-2">
        <EditorToggle
          label="Show in Hero"
          checked={localShowInHero}
          onChange={handleShowInHeroChange}
        />
        {localShowInHero && (
          <div className="ml-3 pl-3 border-l border-white/10">
            <EditorSlider
              label="Icon Size"
              value={localHeroIconSize}
              onChange={handleHeroSizeChange}
              min={0.5}
              max={2.0}
              step={0.05}
              presets={SIZE_PRESETS}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              hideMinMax
            />
          </div>
        )}
      </div>

      {/* Show in Contact Toggle + Size */}
      <div className="space-y-2">
        <EditorToggle
          label="Show in Contact"
          checked={localShowInContact}
          onChange={handleShowInContactChange}
        />
        {localShowInContact && (
          <div className="ml-3 pl-3 border-l border-white/10">
            <EditorSlider
              label="Icon Size"
              value={localContactIconSize}
              onChange={handleContactSizeChange}
              min={0.5}
              max={2.0}
              step={0.05}
              presets={SIZE_PRESETS}
              formatValue={(v) => `${Math.round(v * 100)}%`}
              hideMinMax
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 -mx-4" />

      {/* Social Link Inputs */}
      <div className="space-y-2">
        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          Social Links
        </label>
        <div className="space-y-1.5">
          {PLATFORMS.map(({ key, icon: Icon, placeholder }) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded bg-gray-800/50 border border-white/10 text-gray-400 flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <input
                type="url"
                value={localLinks[key] || ''}
                onChange={(e) => handleLinkChange(key, e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-2.5 py-1.5 bg-gray-800/50 border border-white/10 rounded text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
              {localLinks[key] && (
                <button
                  onClick={() => handleLinkChange(key, '')}
                  className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                  title="Clear"
                >
                  <XMarkIcon className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info tip */}
      {localShowInHero && (
        <EditorInfoBox variant="tip">
          Drag the icons to reposition them in the hero
        </EditorInfoBox>
      )}
    </EditorModal>
  );
};

export default SocialLinksEditorPopup;

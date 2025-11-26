import React, { useState } from 'react';
import TimeSelector from './TimeSelector';
import { useI18nContext } from './I18nProvider';

interface BusinessHoursEditorProps {
  day: string;
  hours: string | { open: string; close: string } | undefined;
  editable?: boolean;
  onEdit?: (path: string, value: string | { open: string; close: string }) => void;
  path: string;
}

const BusinessHoursEditor: React.FC<BusinessHoursEditorProps> = ({
  day,
  hours,
  editable = false,
  onEdit,
  path
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const i18n = useI18nContext();
  const t = i18n?.t || ((key: string, defaultValue?: string) => defaultValue || key);

  // DEBUG
  console.log('[BusinessHoursEditor] render', { day, hours, editable, hasOnEdit: !!onEdit, path });

  const formatHours = (hours: string | { open: string; close: string } | undefined): string => {
    if (!hours) return t('contact.closed', 'Closed');
    if (typeof hours === 'string') {
      return hours === 'closed' ? t('contact.closed', 'Closed') : hours;
    }
    
    // Check if it's a 24-hour business (multiple formats for backwards compatibility)
    const is24Hours = 
      (hours.open === 'Open 24 hours' && hours.close === 'Open 24 hours') ||
      (hours.open === '12:00 AM' && hours.close === '11:59 PM') ||
      (hours.open === '00:00' && hours.close === '23:59');
    
    if (is24Hours) {
      return t('contact.open24Hours', 'Open 24 hours');
    }
    
    return `${hours.open} - ${hours.close}`;
  };

  const handleToggleClosed = () => {
    if (!onEdit) return;
    
    if (typeof hours === 'string' && hours === 'closed') {
      // Switch from closed to open with default hours
      onEdit(path, { open: '9:00 AM', close: '5:00 PM' });
    } else {
      // Switch to closed
      onEdit(path, 'closed');
    }
  };

  const handleTimeChange = (timeType: 'open' | 'close', newTime: string) => {
    console.log('[BusinessHoursEditor] handleTimeChange called', { 
      timeType, 
      newTime, 
      hours, 
      hasOnEdit: !!onEdit,
      hoursType: typeof hours 
    });
    
    if (!onEdit) {
      console.log('[BusinessHoursEditor] BLOCKED: no onEdit callback');
      return;
    }
    if (typeof hours === 'string') {
      console.log('[BusinessHoursEditor] BLOCKED: hours is a string:', hours);
      return;
    }
    
    const currentHours = hours || { open: '9:00 AM', close: '5:00 PM' };
    const updatedHours = {
      ...currentHours,
      [timeType]: convertTo12Hour(newTime)
    };
    
    console.log('[BusinessHoursEditor] calling onEdit', { path, updatedHours });
    onEdit(path, updatedHours);
  };

  // Utility functions for time conversion (same as TimeSelector)
  const convertTo24Hour = (time12h: string): string => {
    try {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') {
        hours = '00';
      }
      if (modifier === 'PM') {
        hours = String(parseInt(hours, 10) + 12);
      }
      return `${hours.padStart(2, '0')}:${minutes}`;
    } catch {
      return time12h;
    }
  };

  const convertTo12Hour = (time24h: string): string => {
    try {
      const [hours, minutes] = time24h.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time24h;
    }
  };

  const isClosed = typeof hours === 'string' && hours === 'closed';
  const isOpen = typeof hours === 'object';

  if (!editable) {
    return <span>{formatHours(hours)}</span>;
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Closed/Open Toggle */}
      <label className="flex items-center space-x-1">
        <input
          type="checkbox"
          checked={isClosed}
          onChange={handleToggleClosed}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-500">{t('contact.closed', 'Closed')}</span>
      </label>

      {/* Time Selectors (only show if not closed) */}
      {!isClosed && (
        <>
          <TimeSelector
            value={isOpen ? convertTo24Hour(hours.open) : convertTo24Hour('9:00 AM')}
            onChange={(newTime) => handleTimeChange('open', newTime)}
            editable={editable}
            placeholder="9:00 AM"
            className="text-sm"
          />
          <span className="text-xs text-gray-500">{t('contact.to', 'to')}</span>
          <TimeSelector
            value={isOpen ? convertTo24Hour(hours.close) : convertTo24Hour('5:00 PM')}
            onChange={(newTime) => handleTimeChange('close', newTime)}
            editable={editable}
            placeholder="5:00 PM"
            className="text-sm"
          />
        </>
      )}

      {/* Show "Closed" text if closed */}
      {isClosed && (
        <span className="text-sm text-gray-500">{t('contact.closed', 'Closed')}</span>
      )}
    </div>
  );
};

export default BusinessHoursEditor;

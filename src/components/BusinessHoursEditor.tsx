import React, { useState } from 'react';
import TimeSelector from './TimeSelector';

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

  const formatHours = (hours: string | { open: string; close: string } | undefined): string => {
    if (!hours) return 'Closed';
    if (typeof hours === 'string') {
      return hours === 'closed' ? 'Closed' : hours;
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
    if (!onEdit || typeof hours === 'string') return;
    
    const currentHours = hours || { open: '9:00 AM', close: '5:00 PM' };
    const updatedHours = {
      ...currentHours,
      [timeType]: convertTo12Hour(newTime)
    };
    
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
        <span className="text-xs text-gray-500">Closed</span>
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
          <span className="text-xs text-gray-500">to</span>
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
        <span className="text-sm text-gray-500">Closed</span>
      )}
    </div>
  );
};

export default BusinessHoursEditor;

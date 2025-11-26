import React, { useState, useRef, useEffect } from 'react';

interface TimeSelectorProps {
  value?: string; // 24-hour format like "18:00"
  onChange: (time: string) => void;
  className?: string;
  editable?: boolean;
  placeholder?: string;
}

// Utility functions for time conversion
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

const TimeSelector: React.FC<TimeSelectorProps> = ({ 
  value, 
  onChange, 
  className = '', 
  editable = false,
  placeholder = 'Select time'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track if a change was made to prevent blur from closing prematurely
  const changeInProgressRef = useRef(false);

  const displayValue = value ? convertTo12Hour(value) : placeholder;

  // DEBUG
  console.log('[TimeSelector] render', { value, editable, isEditing, displayValue });

  const handleClick = () => {
    console.log('[TimeSelector] handleClick', { editable });
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    console.log('[TimeSelector] handleTimeChange FIRED', { newTime, previousValue: value });
    changeInProgressRef.current = true;
    onChange(newTime);
    // Small delay to ensure state update completes before unmounting
    setTimeout(() => {
      console.log('[TimeSelector] closing after change');
      setIsEditing(false);
      changeInProgressRef.current = false;
    }, 50);
  };

  const handleBlur = () => {
    console.log('[TimeSelector] handleBlur FIRED', { changeInProgress: changeInProgressRef.current });
    // Delay blur handling to allow time picker selection to register
    // This prevents the input from closing before a selection is made
    setTimeout(() => {
      console.log('[TimeSelector] blur timeout, changeInProgress:', changeInProgressRef.current);
      if (!changeInProgressRef.current) {
        setIsEditing(false);
      }
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.showPicker?.();
    }
  }, [isEditing]);

  if (!editable) {
    return <span className={className}>{displayValue}</span>;
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="time"
        value={value || "12:00"}
        onChange={handleTimeChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${className} px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
      />
    );
  }

  return (
    <span 
      className={`${className} ${editable ? 'cursor-pointer hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400/60 focus:ring-2 focus:ring-blue-400/50' : ''}`}
      onClick={handleClick}
      tabIndex={editable ? 0 : -1}
      role={editable ? "button" : undefined}
      aria-label={editable ? "Click to edit time" : undefined}
    >
      {displayValue}
    </span>
  );
};

export default TimeSelector;

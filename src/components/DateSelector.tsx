import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DateSelectorProps {
  value?: string; // ISO date format like "2025-01-15"
  onChange: (date: string) => void;
  className?: string;
  editable?: boolean;
  placeholder?: string;
  displayFormat?: 'prominent' | 'full' | 'short';
}

const DateSelector: React.FC<DateSelectorProps> = ({ 
  value, 
  onChange, 
  className = '', 
  editable = false,
  placeholder = 'Select date',
  displayFormat = 'short'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Position the calendar below the trigger, centered horizontally
      const top = rect.bottom + scrollTop + 8; // 8px gap
      const left = rect.left + scrollLeft + (rect.width / 2) - 150; // 150px is approximate half width of calendar
      
      // Ensure the calendar doesn't go off screen
      const adjustedLeft = Math.max(10, Math.min(left, window.innerWidth - 310)); // 310px is approximate calendar width
      
      setPosition({ top, left: adjustedLeft });
    }
  }, []);

  // Update position when window resizes or scrolls
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      calculatePosition();
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, calculatePosition]);

  // Convert string value to Date object
  const dateValue = value ? new Date(value) : null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return placeholder;
    
    try {
      const date = new Date(dateString);
      
      switch (displayFormat) {
        case 'prominent':
          return {
            month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: date.getDate().toString(),
            year: date.getFullYear().toString()
          };
        case 'full':
          return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'short':
        default:
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
      }
    } catch {
      return dateString || placeholder;
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Convert to ISO string format (YYYY-MM-DD)
      const isoString = date.toISOString().split('T')[0];
      onChange(isoString);
    }
    setIsOpen(false);
  };

  const handleClick = () => {
    if (editable) {
      calculatePosition();
      setIsOpen(true);
    }
  };

  if (!editable) {
    const formatted = formatDate(value);
    if (displayFormat === 'prominent' && typeof formatted === 'object') {
      return (
        <div className={`${className} bg-white/95 backdrop-blur-sm rounded-lg p-3 text-center shadow-lg`}>
          <div className="text-primary-600 text-xs font-bold tracking-wide">
            {formatted.month}
          </div>
          <div className="text-gray-900 text-2xl font-bold leading-none">
            {formatted.day}
          </div>
          <div className="text-gray-600 text-xs font-medium">
            {formatted.year}
          </div>
        </div>
      );
    }
    return <span className={className}>{typeof formatted === 'string' ? formatted : placeholder}</span>;
  }

  const formatted = formatDate(value);
  
  if (displayFormat === 'prominent' && typeof formatted === 'object') {
    return (
      <>
        <div 
          ref={triggerRef}
          className={`${className} bg-white/95 backdrop-blur-sm rounded-lg p-3 text-center shadow-lg cursor-pointer hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400/60 focus:ring-2 focus:ring-blue-400/50`}
          onClick={handleClick}
          tabIndex={editable ? 0 : -1}
          role={editable ? "button" : undefined}
          aria-label={editable ? "Click to edit date" : undefined}
        >
          <div className="text-primary-600 text-xs font-bold tracking-wide">
            {formatted.month}
          </div>
          <div className="text-gray-900 text-2xl font-bold leading-none">
            {formatted.day}
          </div>
          <div className="text-gray-600 text-xs font-medium">
            {formatted.year}
          </div>
        </div>
        
        {isOpen && typeof document !== 'undefined' && createPortal(
          <div 
            className="fixed z-[9999]"
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px` 
            }}
          >
            <DatePicker
              selected={dateValue}
              onChange={handleDateChange}
              onClickOutside={() => setIsOpen(false)}
              inline
              calendarClassName="shadow-xl border border-gray-200 rounded-lg"
            />
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <>
      <span 
        ref={triggerRef}
        className={`${className} ${editable ? 'cursor-pointer hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400/60 focus:ring-2 focus:ring-blue-400/50' : ''}`}
        onClick={handleClick}
        tabIndex={editable ? 0 : -1}
        role={editable ? "button" : undefined}
        aria-label={editable ? "Click to edit date" : undefined}
      >
        {typeof formatted === 'string' ? formatted : placeholder}
      </span>
      
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[9999]"
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px` 
          }}
        >
          <DatePicker
            selected={dateValue}
            onChange={handleDateChange}
            onClickOutside={() => setIsOpen(false)}
            inline
            calendarClassName="shadow-xl border border-gray-200 rounded-lg"
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default DateSelector;

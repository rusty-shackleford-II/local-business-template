import type { UpcomingEventItem } from '../types';

export interface EventInstance {
  id: string;
  originalEvent: UpcomingEventItem;
  date: string;
  time?: string;
}

/**
 * Generate future event instances from a recurring event pattern
 */
export function generateRecurringEventInstances(
  event: UpcomingEventItem,
  maxInstances: number = 10,
  maxMonthsAhead: number = 12
): EventInstance[] {
  if (!event.isRecurring || !event.recurringPattern || !event.date) {
    return [{
      id: event.id,
      originalEvent: event,
      date: event.date || '',
      time: event.time
    }];
  }

  const instances: EventInstance[] = [];
  const startDate = new Date(event.date);
  const endDate = event.recurringPattern.endDate ? new Date(event.recurringPattern.endDate) : null;
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + maxMonthsAhead);
  
  let currentDate = new Date(startDate);
  let instanceCount = 0;

  while (instanceCount < maxInstances && currentDate <= maxDate) {
    // Check if we've passed the end date
    if (endDate && currentDate > endDate) {
      break;
    }

    // Add this instance if it's in the future or today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (currentDate >= today) {
      instances.push({
        id: `${event.id}-${currentDate.toISOString().split('T')[0]}`,
        originalEvent: event,
        date: currentDate.toISOString().split('T')[0],
        time: event.time
      });
      instanceCount++;
    }

    // Calculate next occurrence based on pattern
    currentDate = getNextOccurrence(currentDate, event.recurringPattern);
  }

  return instances;
}

/**
 * Calculate the next occurrence based on recurring pattern
 */
function getNextOccurrence(
  currentDate: Date,
  pattern: NonNullable<UpcomingEventItem['recurringPattern']>
): Date {
  const nextDate = new Date(currentDate);

  switch (pattern.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + pattern.interval);
      break;

    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        // Find next occurrence on specified days of week
        const currentDayOfWeek = nextDate.getDay();
        const sortedDays = [...pattern.daysOfWeek].sort((a, b) => a - b);
        
        // Find next day in this week
        let nextDay = sortedDays.find(day => day > currentDayOfWeek);
        
        if (nextDay !== undefined) {
          // Next occurrence is later this week
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDayOfWeek));
        } else {
          // Next occurrence is next week (or later based on interval)
          const daysToAdd = (7 * pattern.interval) - currentDayOfWeek + sortedDays[0];
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        }
      } else {
        // Default to weekly interval
        nextDate.setDate(nextDate.getDate() + (7 * pattern.interval));
      }
      break;

    case 'monthly':
      if (pattern.dayOfMonth) {
        // Set to specific day of month
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        nextDate.setDate(pattern.dayOfMonth);
        
        // Handle months with fewer days (e.g., Feb 30 -> Feb 28)
        if (nextDate.getDate() !== pattern.dayOfMonth) {
          nextDate.setDate(0); // Go to last day of previous month
        }
      } else {
        // Keep same day of month
        const targetDay = currentDate.getDate();
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        nextDate.setDate(targetDay);
        
        // Handle months with fewer days
        if (nextDate.getDate() !== targetDay) {
          nextDate.setDate(0); // Go to last day of previous month
        }
      }
      break;

    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
      break;
  }

  return nextDate;
}

/**
 * Get the next future occurrence date for an event (for sorting purposes)
 */
export function getNextFutureEventDate(event: UpcomingEventItem): Date | null {
  if (!event.date) return null;

  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If it's not recurring, just return the event date
  if (!event.isRecurring || !event.recurringPattern) {
    return eventDate >= today ? eventDate : null;
  }

  // For recurring events, find the next future occurrence
  const instances = generateRecurringEventInstances(event, 1, 12);
  return instances.length > 0 ? new Date(instances[0].date) : null;
}

/**
 * Get all future event instances for display, sorted by date
 */
export function getAllFutureEventInstances(
  events: UpcomingEventItem[],
  maxInstancesPerEvent: number = 5
): EventInstance[] {
  const allInstances: EventInstance[] = [];

  for (const event of events) {
    const instances = generateRecurringEventInstances(event, maxInstancesPerEvent, 12);
    allInstances.push(...instances);
  }

  // Sort by date
  return allInstances.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
}

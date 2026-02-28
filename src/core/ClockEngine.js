/**
 * Bauhaus World Clock Framework
 * ClockEngine - Time calculations and timezone handling
 *
 * Pure functions for time-related calculations.
 * No rendering, no side effects - just math.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TIMEZONE DATABASE (Common zones)
// ═══════════════════════════════════════════════════════════════════════════

const TIMEZONE_DATA = {
  // Americas
  'America/New_York': { offset: -5, dst: true, city: 'New York', abbr: 'EST' },
  'America/Chicago': { offset: -6, dst: true, city: 'Chicago', abbr: 'CST' },
  'America/Denver': { offset: -7, dst: true, city: 'Denver', abbr: 'MST' },
  'America/Los_Angeles': { offset: -8, dst: true, city: 'Los Angeles', abbr: 'PST' },
  'America/Anchorage': { offset: -9, dst: true, city: 'Anchorage', abbr: 'AKST' },
  'America/Toronto': { offset: -5, dst: true, city: 'Toronto', abbr: 'EST' },
  'America/Mexico_City': { offset: -6, dst: true, city: 'Mexico City', abbr: 'CST' },
  'America/Sao_Paulo': { offset: -3, dst: false, city: 'São Paulo', abbr: 'BRT' },
  'America/Buenos_Aires': { offset: -3, dst: false, city: 'Buenos Aires', abbr: 'ART' },
  'America/Bogota': { offset: -5, dst: false, city: 'Bogotá', abbr: 'COT' },

  // Europe
  'Europe/London': { offset: 0, dst: true, city: 'London', abbr: 'GMT' },
  'Europe/Paris': { offset: 1, dst: true, city: 'Paris', abbr: 'CET' },
  'Europe/Berlin': { offset: 1, dst: true, city: 'Berlin', abbr: 'CET' },
  'Europe/Rome': { offset: 1, dst: true, city: 'Rome', abbr: 'CET' },
  'Europe/Madrid': { offset: 1, dst: true, city: 'Madrid', abbr: 'CET' },
  'Europe/Amsterdam': { offset: 1, dst: true, city: 'Amsterdam', abbr: 'CET' },
  'Europe/Moscow': { offset: 3, dst: false, city: 'Moscow', abbr: 'MSK' },
  'Europe/Istanbul': { offset: 3, dst: false, city: 'Istanbul', abbr: 'TRT' },

  // Africa & Middle East
  'Africa/Cairo': { offset: 2, dst: false, city: 'Cairo', abbr: 'EET' },
  'Africa/Johannesburg': { offset: 2, dst: false, city: 'Johannesburg', abbr: 'SAST' },
  'Asia/Dubai': { offset: 4, dst: false, city: 'Dubai', abbr: 'GST' },
  'Asia/Jerusalem': { offset: 2, dst: true, city: 'Jerusalem', abbr: 'IST' },

  // Asia
  'Asia/Mumbai': { offset: 5.5, dst: false, city: 'Mumbai', abbr: 'IST' },
  'Asia/Kolkata': { offset: 5.5, dst: false, city: 'Kolkata', abbr: 'IST' },
  'Asia/Bangkok': { offset: 7, dst: false, city: 'Bangkok', abbr: 'ICT' },
  'Asia/Singapore': { offset: 8, dst: false, city: 'Singapore', abbr: 'SGT' },
  'Asia/Hong_Kong': { offset: 8, dst: false, city: 'Hong Kong', abbr: 'HKT' },
  'Asia/Shanghai': { offset: 8, dst: false, city: 'Shanghai', abbr: 'CST' },
  'Asia/Beijing': { offset: 8, dst: false, city: 'Beijing', abbr: 'CST' },
  'Asia/Tokyo': { offset: 9, dst: false, city: 'Tokyo', abbr: 'JST' },
  'Asia/Seoul': { offset: 9, dst: false, city: 'Seoul', abbr: 'KST' },

  // Oceania
  'Australia/Sydney': { offset: 10, dst: true, city: 'Sydney', abbr: 'AEST' },
  'Australia/Melbourne': { offset: 10, dst: true, city: 'Melbourne', abbr: 'AEST' },
  'Australia/Perth': { offset: 8, dst: false, city: 'Perth', abbr: 'AWST' },
  'Pacific/Auckland': { offset: 12, dst: true, city: 'Auckland', abbr: 'NZST' },
  'Pacific/Honolulu': { offset: -10, dst: false, city: 'Honolulu', abbr: 'HST' }
};

// ═══════════════════════════════════════════════════════════════════════════
// TIME CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get current time components for a timezone
 * @param {string} timezone - IANA timezone string or 'local'
 * @returns {Object} Time components
 */
function getTimeForZone(timezone = 'local') {
  const now = new Date();

  if (timezone === 'local') {
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      milliseconds: now.getMilliseconds(),
      date: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      dayOfWeek: now.getDay(),
      timestamp: now.getTime()
    };
  }

  // Try using Intl API for accurate timezone handling
  try {
    const options = {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    const getValue = (type) => {
      const part = parts.find(p => p.type === type);
      return part ? parseInt(part.value, 10) : 0;
    };

    // Get date parts separately
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      weekday: 'short'
    });
    const dateParts = dateFormatter.formatToParts(now);

    return {
      hours: getValue('hour'),
      minutes: getValue('minute'),
      seconds: getValue('second'),
      milliseconds: now.getMilliseconds(), // ms is same in all zones
      date: parseInt(dateParts.find(p => p.type === 'day')?.value || '1', 10),
      month: parseInt(dateParts.find(p => p.type === 'month')?.value || '1', 10) - 1,
      year: parseInt(dateParts.find(p => p.type === 'year')?.value || '2024', 10),
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        .indexOf(dateParts.find(p => p.type === 'weekday')?.value || 'Sun'),
      timestamp: now.getTime()
    };
  } catch (e) {
    // Fallback to offset calculation (rare - only if Intl fails)
    const zoneData = TIMEZONE_DATA[timezone];
    if (zoneData) {
      let offset = zoneData.offset;

      // Attempt DST correction for zones that observe it
      if (zoneData.dst) {
        // Use a heuristic: check if we're in northern or southern hemisphere DST period
        // Northern: roughly March-November, Southern: roughly October-April
        const month = now.getMonth(); // 0-11

        // Northern hemisphere DST (US/Europe rules approximation)
        const isNorthernHemisphere = offset < 10; // Rough: Australia/NZ have offset >= 10
        const inNorthernDST = isNorthernHemisphere && month >= 2 && month <= 9; // Mar-Oct
        const inSouthernDST = !isNorthernHemisphere && (month >= 9 || month <= 2); // Oct-Mar

        if (inNorthernDST || inSouthernDST) {
          offset += 1; // Add 1 hour for DST
        }
      }

      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const zoneTime = new Date(utc + (offset * 3600000));
      return {
        hours: zoneTime.getHours(),
        minutes: zoneTime.getMinutes(),
        seconds: zoneTime.getSeconds(),
        milliseconds: zoneTime.getMilliseconds(),
        date: zoneTime.getDate(),
        month: zoneTime.getMonth(),
        year: zoneTime.getFullYear(),
        dayOfWeek: zoneTime.getDay(),
        timestamp: zoneTime.getTime()
      };
    }

    // Final fallback - local time
    console.warn(`Unknown timezone: ${timezone}, using local time`);
    return getTimeForZone('local');
  }
}

/**
 * Get the user's local timezone
 * @returns {string} IANA timezone string
 */
function getLocalTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return 'local';
  }
}

/**
 * Get timezone offset from UTC in hours
 */
function getTimezoneOffset(timezone) {
  if (timezone === 'local') {
    return -new Date().getTimezoneOffset() / 60;
  }

  const zoneData = TIMEZONE_DATA[timezone];
  if (zoneData) {
    return zoneData.offset;
  }

  // Try to calculate from Intl API
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate - utcDate) / 3600000;
  } catch (e) {
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HAND ANGLE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate the angle for the hour hand
 * @param {number} hours - Hour (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @returns {number} Angle in degrees (0 = 12 o'clock, clockwise)
 */
function getHourAngle(hours, minutes = 0) {
  const hour12 = hours % 12;
  // Each hour = 30°, each minute adds 0.5° to hour hand
  return (hour12 * 30) + (minutes * 0.5);
}

/**
 * Calculate the angle for the minute hand
 * @param {number} minutes - Minutes (0-59)
 * @param {number} seconds - Seconds (0-59)
 * @returns {number} Angle in degrees (0 = 12 o'clock, clockwise)
 */
function getMinuteAngle(minutes, seconds = 0) {
  // Each minute = 6°, each second adds 0.1° to minute hand
  return (minutes * 6) + (seconds * 0.1);
}

/**
 * Calculate the angle for the second hand
 * @param {number} seconds - Seconds (0-59)
 * @param {number} milliseconds - Milliseconds (0-999)
 * @param {boolean} smooth - If true, include milliseconds for smooth movement
 * @returns {number} Angle in degrees (0 = 12 o'clock, clockwise)
 */
function getSecondAngle(seconds, milliseconds = 0, smooth = true) {
  if (smooth) {
    return (seconds * 6) + (milliseconds * 0.006);
  }
  return seconds * 6;
}

/**
 * Get all hand angles for a time
 * @param {Object} time - Time object from getTimeForZone
 * @param {boolean} smooth - If true, animate smoothly
 * @returns {Object} Angles for hour, minute, second hands
 */
function getHandAngles(time, smooth = true) {
  return {
    hour: getHourAngle(time.hours, time.minutes),
    minute: getMinuteAngle(time.minutes, time.seconds),
    second: getSecondAngle(time.seconds, smooth ? time.milliseconds : 0, smooth)
  };
}

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert angle (0° = 12 o'clock) to SVG coordinate angle (0° = 3 o'clock)
 * SVG angles start at 3 o'clock and go clockwise
 */
function clockAngleToSvgAngle(clockAngle) {
  return clockAngle - 90;
}

/**
 * Get endpoint coordinates for a hand
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} length - Hand length
 * @param {number} angleDegrees - Angle in degrees (0 = 12 o'clock)
 * @returns {Object} {x, y} endpoint coordinates
 */
function getHandEndpoint(centerX, centerY, length, angleDegrees) {
  const radians = degreesToRadians(clockAngleToSvgAngle(angleDegrees));
  return {
    x: centerX + length * Math.cos(radians),
    y: centerY + length * Math.sin(radians)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DAY/NIGHT CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine if it's day or night based on hour
 * Simple approximation: day = 6am to 6pm
 */
function isDaytime(hours) {
  return hours >= 6 && hours < 18;
}

/**
 * Get time-of-day period
 * @param {number} hours - Hour (0-23)
 * @returns {string} 'dawn' | 'day' | 'dusk' | 'night'
 */
function getTimeOfDay(hours) {
  if (hours >= 5 && hours < 8) return 'dawn';
  if (hours >= 8 && hours < 17) return 'day';
  if (hours >= 17 && hours < 20) return 'dusk';
  return 'night';
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKER ANGLE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get angles for hour markers
 * @param {number} count - Number of markers (typically 4 or 12)
 * @returns {Array<number>} Array of angles in degrees
 */
function getMarkerAngles(count = 12) {
  const angles = [];
  const step = 360 / count;
  for (let i = 0; i < count; i++) {
    angles.push(i * step);
  }
  return angles;
}

/**
 * Check if a marker is a cardinal position (12, 3, 6, 9)
 */
function isCardinalMarker(angle) {
  return angle % 90 === 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMEZONE INFO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get display information for a timezone
 */
function getTimezoneInfo(timezone) {
  if (timezone === 'local') {
    const localTz = getLocalTimezone();
    const data = TIMEZONE_DATA[localTz];
    return {
      timezone: localTz,
      city: data?.city || 'Local',
      abbr: data?.abbr || 'LOC',
      offset: getTimezoneOffset('local'),
      offsetString: formatOffset(getTimezoneOffset('local'))
    };
  }

  const data = TIMEZONE_DATA[timezone];
  if (data) {
    return {
      timezone,
      city: data.city,
      abbr: data.abbr,
      offset: data.offset,
      offsetString: formatOffset(data.offset)
    };
  }

  // Unknown timezone
  const offset = getTimezoneOffset(timezone);
  return {
    timezone,
    city: timezone.split('/').pop().replace(/_/g, ' '),
    abbr: '',
    offset,
    offsetString: formatOffset(offset)
  };
}

/**
 * Format offset as string (e.g., "+5:30", "-8:00")
 */
function formatOffset(offset) {
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - hours) * 60);
  return `${sign}${hours}${minutes > 0 ? ':' + String(minutes).padStart(2, '0') : ''}`;
}

/**
 * Get all available timezones
 */
function getAvailableTimezones() {
  return Object.keys(TIMEZONE_DATA);
}

/**
 * Search timezones by city name
 */
function searchTimezones(query) {
  const lowerQuery = query.toLowerCase();
  return Object.entries(TIMEZONE_DATA)
    .filter(([tz, data]) =>
      data.city.toLowerCase().includes(lowerQuery) ||
      tz.toLowerCase().includes(lowerQuery)
    )
    .map(([tz, data]) => ({ timezone: tz, ...data }));
}

// ═══════════════════════════════════════════════════════════════════════════
// TIME FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format time as HH:MM
 */
function formatTime(hours, minutes) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Format time as HH:MM:SS
 */
function formatTimeWithSeconds(hours, minutes, seconds) {
  return `${formatTime(hours, minutes)}:${String(seconds).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
  // Time
  getTimeForZone,
  getLocalTimezone,
  getTimezoneOffset,

  // Hand angles
  getHourAngle,
  getMinuteAngle,
  getSecondAngle,
  getHandAngles,
  getHandEndpoint,

  // Markers
  getMarkerAngles,
  isCardinalMarker,

  // Day/Night
  isDaytime,
  getTimeOfDay,

  // Timezone info
  getTimezoneInfo,
  getAvailableTimezones,
  searchTimezones,

  // Formatting
  formatTime,
  formatTimeWithSeconds,
  formatOffset,

  // Utilities
  degreesToRadians,
  clockAngleToSvgAngle,

  // Data
  TIMEZONE_DATA
};

export default {
  getTimeForZone,
  getLocalTimezone,
  getHandAngles,
  getHandEndpoint,
  getMarkerAngles,
  getTimezoneInfo,
  getAvailableTimezones,
  isDaytime,
  getTimeOfDay
};

/**
 * Bauhaus World Clock - Optimized vanilla JS implementation
 * Original concept by Will Jennings and Alex Dodge
 * Enhanced with seasonal colors and map overlay
 */
(function() {
  'use strict';

  const WIDTH = 500;
  const HEIGHT = 500;
  const CLOCK_CENTER_X = 250;
  const CLOCK_CENTER_Y = 250;
  const TARGET_FPS = 30;
  const FRAME_TIME = 1000 / TARGET_FPS;

  // Accessibility: WCAG 2.1 recommends minimum 44x44px touch targets
  const TOUCH_TARGET_RADIUS = 22;
  const CITY_FONT_SIZE = 18;

  // Clock ring sizes - adjusted for overlay on map
  const RINGS = {
    day: 480,
    hour: 360,
    minute: 240,
    second: 120
  };

  // Seasonal color palettes (HSB hues)
  // Each season has: day, hour, minute, second ring colors
  const SEASONS = {
    spring: {
      name: 'Spring',
      day: 150,      // Fresh green
      hour: 330,     // Cherry blossom pink
      minute: 270,   // Lavender
      second: 45,    // Warm yellow
      saturation: 70,
      bgTint: 'rgba(144, 238, 144, 0.1)' // Light green tint
    },
    summer: {
      name: 'Summer',
      day: 45,       // Golden orange
      hour: 60,      // Bright yellow
      minute: 190,   // Ocean cyan
      second: 0,     // Vibrant red
      saturation: 90,
      bgTint: 'rgba(255, 223, 128, 0.1)' // Warm golden tint
    },
    fall: {
      name: 'Fall',
      day: 25,       // Burnt orange
      hour: 40,      // Amber gold
      minute: 280,   // Deep purple
      second: 350,   // Crimson
      saturation: 85,
      bgTint: 'rgba(205, 133, 63, 0.1)' // Warm brown tint
    },
    winter: {
      name: 'Winter',
      day: 200,      // Ice blue
      hour: 220,     // Steel blue
      minute: 260,   // Violet
      second: 180,   // Teal
      saturation: 50,
      bgTint: 'rgba(176, 224, 230, 0.1)' // Cool blue tint
    }
  };

  // Timezone ranges (x-coordinate ranges mapped to timezone offsets)
  const TIMEZONE_RANGES = [
    { min: 0, max: 16, offset: 18 },    // GMT-11
    { min: 16, max: 24, offset: 19 },   // GMT-10
    { min: 24, max: 60, offset: 20 },   // GMT-9
    { min: 60, max: 83, offset: 21 },   // GMT-8
    { min: 83, max: 90, offset: 22 },   // GMT-7
    { min: 90, max: 120, offset: 23 },  // GMT-6
    { min: 120, max: 139, offset: 0 },  // GMT-5 (Eastern)
    { min: 139, max: 160, offset: 1 },  // GMT-4
    { min: 160, max: 189, offset: 2 },  // GMT-3
    { min: 189, max: 190, offset: 3 },  // GMT-2
    { min: 190, max: 208, offset: 4 },  // GMT-1
    { min: 208, max: 232, offset: 5 },  // GMT(0)
    { min: 232, max: 260, offset: 6 },  // GMT+1
    { min: 260, max: 274, offset: 7 },  // GMT+2
    { min: 274, max: 309, offset: 8 },  // GMT+3
    { min: 309, max: 320, offset: 9 },  // GMT+4
    { min: 320, max: 330, offset: 10 }, // GMT+5
    { min: 330, max: 350, offset: 11 }, // GMT+6
    { min: 350, max: 410, offset: 12 }, // GMT+7
    { min: 410, max: 440, offset: 13 }, // GMT+8
    { min: 440, max: 450, offset: 14 }, // GMT+9
    { min: 450, max: 460, offset: 15 }, // GMT+10
    { min: 460, max: 470, offset: 16 }, // GMT+11
    { min: 470, max: 500, offset: 17 }  // GMT+12
  ];

  // City data - coordinates transformed for 500x500 canvas
  // Original: map at (-15, 510) size (500, 250)
  // New: map at (0, 0) size (500, 500)
  // Transform: new_x = old_x + 15, new_y = (old_y - 510) * 2
  const CITIES = [
    { name: "Anchorage", x: 42, y: 46, tz: -9 },
    { name: "Los Angeles", x: 83, y: 122, tz: -8 },
    { name: "Salt Lake City", x: 90, y: 104, tz: -7 },
    { name: "Mexico City", x: 112, y: 172, tz: -6 },
    { name: "Dallas", x: 114, y: 136, tz: -6 },
    { name: "Chicago", x: 130, y: 98, tz: -6 },
    { name: "Santiago", x: 151, y: 346, tz: -3 },
    { name: "Buenos Aires", x: 171, y: 344, tz: -3 },
    { name: "Bogota", x: 149, y: 226, tz: -5 },
    { name: "Caracas", x: 154, y: 204, tz: -4 },
    { name: "Ottawa", x: 143, y: 92, tz: -5 },
    { name: "New York", x: 147, y: 114, tz: -5 },
    { name: "Brasilia", x: 180, y: 286, tz: -3 },
    { name: "Halifax", x: 172, y: 84, tz: -4 },
    { name: "Nuuk", x: 180, y: 32, tz: -3 },
    { name: "Reykjavik", x: 225, y: 36, tz: 0 },
    { name: "London", x: 247, y: 72, tz: 0 },
    { name: "Barcelona", x: 246, y: 106, tz: 1 },
    { name: "Dakar", x: 225, y: 188, tz: 0 },
    { name: "Paris", x: 257, y: 86, tz: 1 },
    { name: "Rome", x: 273, y: 108, tz: 1 },
    { name: "Berlin", x: 268, y: 70, tz: 1 },
    { name: "Minsk", x: 287, y: 68, tz: 3 },
    { name: "Warsaw", x: 280, y: 72, tz: 1 },
    { name: "Moscow", x: 299, y: 64, tz: 3 },
    { name: "Athens", x: 285, y: 112, tz: 2 },
    { name: "Tehran", x: 324, y: 122, tz: 3.5 },
    { name: "Dubai", x: 322, y: 156, tz: 4 },
    { name: "Astana", x: 344, y: 76, tz: 6 },
    { name: "Mumbai", x: 351, y: 166, tz: 5.5 },
    { name: "Dhaka", x: 374, y: 162, tz: 6 },
    { name: "Bangkok", x: 391, y: 198, tz: 7 },
    { name: "Jakarta", x: 398, y: 254, tz: 7 },
    { name: "Beijing", x: 412, y: 116, tz: 8 },
    { name: "Tokyo", x: 444, y: 122, tz: 9 },
    { name: "Port Moresby", x: 450, y: 258, tz: 10 },
    { name: "Brisbane", x: 462, y: 326, tz: 10 },
    { name: "Wellington", x: 490, y: 368, tz: 12 },
    { name: "Magadan", x: 495, y: 38, tz: 11 },
    { name: "Port Elizabeth", x: 288, y: 342, tz: 2 },
    { name: "Walvis Bay", x: 271, y: 306, tz: 2 },
    { name: "Luanda", x: 271, y: 262, tz: 1 },
    { name: "Abuja", x: 262, y: 210, tz: 1 },
    { name: "Djibouti", x: 308, y: 208, tz: 3 },
    { name: "Cairo", x: 295, y: 138, tz: 2 },
    { name: "Amman", x: 301, y: 130, tz: 3 },
    { name: "Benghazi", x: 281, y: 136, tz: 2 },
    { name: "Khartoum", x: 296, y: 184, tz: 2 },
    { name: "Dar es Salaam", x: 303, y: 250, tz: 3 },
    { name: "Antananarivo", x: 314, y: 296, tz: 3 }
  ];

  // Get user's timezone offset in hours (e.g., -5 for EST)
  function getUserTimezoneHours() {
    return -new Date().getTimezoneOffset() / 60;
  }

  // Convert GMT offset to internal timezone offset (0-23 system)
  function gmtToInternalOffset(gmtHours) {
    return ((Math.round(gmtHours) + 5) % 24 + 24) % 24;
  }

  // Find the closest city to user's timezone
  function findClosestCity(userTzHours) {
    let closest = CITIES[11]; // Default to New York
    let minDiff = Infinity;

    for (const city of CITIES) {
      const diff = Math.abs(city.tz - userTzHours);
      if (diff < minDiff) {
        minDiff = diff;
        closest = city;
      }
    }
    return closest;
  }

  // Determine current season based on date (Northern Hemisphere)
  function getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();

    // Approximate equinox/solstice dates
    if ((month === 2 && day >= 20) || month === 3 || month === 4 || (month === 5 && day < 21)) {
      return SEASONS.spring;
    } else if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day < 22)) {
      return SEASONS.summer;
    } else if ((month === 8 && day >= 22) || month === 9 || month === 10 || (month === 11 && day < 21)) {
      return SEASONS.fall;
    } else {
      return SEASONS.winter;
    }
  }

  class BauhausClock {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');

      // Set canvas size
      this.canvas.width = WIDTH;
      this.canvas.height = HEIGHT;

      // Get current season
      this.season = getCurrentSeason();

      // Auto-detect user's timezone
      const userTzHours = getUserTimezoneHours();
      const defaultCity = findClosestCity(userTzHours);

      // State - initialize with user's local timezone
      this.timezone = gmtToInternalOffset(userTzHours);
      this.selectedCity = defaultCity;
      this.markerCity = { x: defaultCity.x, y: defaultCity.y };
      this.mouseX = 0;
      this.mouseY = 0;
      this.mousePressed = false;

      // Initial time values for smooth animation
      const now = new Date();
      this.initSeconds = now.getSeconds();
      this.initMinutes = now.getMinutes();
      this.initHours = now.getHours();

      // Image
      this.mapImage = new Image();
      this.mapLoaded = false;

      // Animation
      this.lastFrameTime = 0;
      this.animationId = null;

      this.init();
    }

    init() {
      // Load map image
      this.mapImage.onload = () => {
        this.mapLoaded = true;
      };
      this.mapImage.src = 'world_1.png';

      // Event listeners - mouse
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.canvas.addEventListener('mouseup', () => this.mousePressed = false);
      this.canvas.addEventListener('mouseleave', () => this.mousePressed = false);

      // Event listeners - touch (for mobile accessibility)
      this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

      // Start animation
      this.animate(0);
    }

    handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;

      // Update cursor
      this.canvas.style.cursor = 'crosshair';

      // Check for city hover (using accessible touch target size)
      for (const city of CITIES) {
        if (Math.abs(this.mouseX - city.x) <= TOUCH_TARGET_RADIUS &&
            Math.abs(this.mouseY - city.y) <= TOUCH_TARGET_RADIUS) {
          this.selectedCity = city;
          break;
        }
      }
    }

    handleMouseDown(e) {
      this.mousePressed = true;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      this.handleInteraction(x, y);
    }

    handleTouchStart(e) {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      this.mouseX = x;
      this.mouseY = y;

      // Check for city selection on touch
      for (const city of CITIES) {
        if (Math.abs(x - city.x) <= TOUCH_TARGET_RADIUS &&
            Math.abs(y - city.y) <= TOUCH_TARGET_RADIUS) {
          this.selectedCity = city;
          break;
        }
      }

      this.handleInteraction(x, y);
    }

    handleTouchMove(e) {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const touch = e.touches[0];
      this.mouseX = (touch.clientX - rect.left) * scaleX;
      this.mouseY = (touch.clientY - rect.top) * scaleY;
    }

    handleInteraction(x, y) {
      // Update timezone based on interaction position
      for (const range of TIMEZONE_RANGES) {
        if (x >= range.min && x <= range.max) {
          this.timezone = range.offset;
          this.markerCity = { x: this.selectedCity.x, y: this.selectedCity.y };
          break;
        }
      }
    }

    // Convert HSB to RGB
    hsbToRgb(h, s, b) {
      h = h / 360;
      s = s / 100;
      b = b / 100;

      let r, g, bl;

      if (s === 0) {
        r = g = bl = b;
      } else {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = b * (1 - s);
        const q = b * (1 - f * s);
        const t = b * (1 - (1 - f) * s);

        switch (i % 6) {
          case 0: r = b; g = t; bl = p; break;
          case 1: r = q; g = b; bl = p; break;
          case 2: r = p; g = b; bl = t; break;
          case 3: r = p; g = q; bl = b; break;
          case 4: r = t; g = p; bl = b; break;
          case 5: r = b; g = p; bl = q; break;
        }
      }

      return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(bl * 255)
      };
    }

    drawArc(x, y, diameter, startAngle, endAngle, h, s, b, a) {
      const rgb = this.hsbToRgb(h, s, b);
      const radius = diameter / 2;

      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.arc(x, y, radius, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a / 100})`;
      this.ctx.fill();
    }

    calculateBrightness() {
      const cTime = (this.initHours + this.timezone) % 24;
      if (cTime >= 12) {
        return (24 - cTime) / 12 * 100;
      }
      return cTime / 12 * 100;
    }

    draw(timestamp) {
      const ctx = this.ctx;
      const millis = timestamp % 86400000; // Wrap at 24 hours
      const bright = Math.max(30, this.calculateBrightness()); // Minimum brightness for visibility
      const season = this.season;

      // Clear canvas
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw map image as background
      if (this.mapLoaded) {
        ctx.globalAlpha = 0.4;
        ctx.drawImage(this.mapImage, 0, 0, WIDTH, HEIGHT);
        ctx.globalAlpha = 1;
      }

      // Seasonal background tint
      ctx.fillStyle = season.bgTint;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Calculate angles
      const dayBase = ((this.initSeconds / 3600) + (this.initMinutes / 60) + this.initHours) * 15;
      const hourBase = ((this.initSeconds / 3600) + (this.initMinutes / 60) + this.initHours) * 30;
      const minBase = this.initSeconds * 6;

      const dayOffset = (millis / 86400000) * 360;
      const hourOffset = (millis / 3600000) * 360;
      const minOffset = ((millis % 60000) / 60000) * 360;
      const secOffset = ((millis % 1000) / 1000) * 360;

      const dayAngle = dayBase + dayOffset + (this.timezone * 15);
      const hourAngle = hourBase + hourOffset + (this.timezone * 30);
      const minAngle = minBase + minOffset;

      // Draw clock rings with seasonal colors
      const sat = season.saturation;

      // Day ring (outermost)
      const dStart = (-90 + dayAngle) * Math.PI / 180;
      const dEnd = (90 + dayAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.day, dStart, dEnd, season.day, sat, bright / 2, 25);

      // Hour ring
      const hStart = (-90 + hourAngle) * Math.PI / 180;
      const hEnd = (90 + hourAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.hour, hStart, hEnd, season.hour, sat, bright, 30);

      // Minute ring
      const mStart = (-90 + minAngle) * Math.PI / 180;
      const mEnd = (90 + minAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.minute, mStart, mEnd, season.minute, sat, bright, 35);

      // Second ring (innermost)
      const sStart = (-90 + secOffset) * Math.PI / 180;
      const sEnd = (90 + secOffset) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.second, sStart, sEnd, season.second, sat, bright, 40);

      // Draw city markers
      for (const city of CITIES) {
        // Only draw cities that are visible (within canvas)
        if (city.y >= 0 && city.y <= HEIGHT) {
          ctx.beginPath();
          ctx.arc(city.x, city.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(city.x, city.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fill();
        }
      }

      // Draw selected/active city marker (highlighted)
      if (this.markerCity.y >= 0 && this.markerCity.y <= HEIGHT) {
        ctx.beginPath();
        ctx.arc(this.markerCity.x, this.markerCity.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.markerCity.x, this.markerCity.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff6464';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      }

      // Draw city name with background for readability
      if (this.selectedCity.y >= 0 && this.selectedCity.y <= HEIGHT) {
        ctx.font = `bold ${CITY_FONT_SIZE}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
        const textOffset = 14;
        const textX = this.selectedCity.x < WIDTH - 100 ? this.selectedCity.x + textOffset : this.selectedCity.x - textOffset;
        const textAlign = this.selectedCity.x < WIDTH - 100 ? 'left' : 'right';
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';

        // Text background
        const textWidth = ctx.measureText(this.selectedCity.name).width;
        const bgX = textAlign === 'left' ? textX - 4 : textX - textWidth - 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(bgX, this.selectedCity.y - 12, textWidth + 8, 24);

        // Text
        ctx.fillStyle = '#333333';
        ctx.fillText(this.selectedCity.name, textX, this.selectedCity.y);
      }

      // Draw season indicator
      ctx.font = '14px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.fillText(season.name, WIDTH - 10, 10);
    }

    animate(timestamp) {
      // Throttle to target FPS
      if (timestamp - this.lastFrameTime >= FRAME_TIME) {
        this.lastFrameTime = timestamp;
        this.draw(timestamp);
      }

      this.animationId = requestAnimationFrame((t) => this.animate(t));
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.bauhausClock = new BauhausClock('worldcloc');
    });
  } else {
    window.bauhausClock = new BauhausClock('worldcloc');
  }
})();

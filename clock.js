/**
 * Bauhaus World Clock - Optimized vanilla JS implementation
 * Original concept by Will Jennings and Alex Dodge
 */
(function() {
  'use strict';

  const WIDTH = 500;
  const HEIGHT = 750;
  const CLOCK_CENTER_X = 250;
  const CLOCK_CENTER_Y = 250;
  const MAP_TOP = 510;
  const TARGET_FPS = 30;
  const FRAME_TIME = 1000 / TARGET_FPS;

  // Accessibility: WCAG 2.1 recommends minimum 44x44px touch targets
  const TOUCH_TARGET_RADIUS = 22;
  const CITY_FONT_SIZE = 32; // Larger font for better readability

  // Clock ring sizes
  const RINGS = {
    day: 400,
    hour: 300,
    minute: 200,
    second: 100
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

  // City data with timezone offsets for auto-detection
  const CITIES = [
    { name: "Anchorage", x: 27, y: 533, tz: -9 },
    { name: "Los Angeles", x: 68, y: 571, tz: -8 },
    { name: "Salt Lake City", x: 75, y: 562, tz: -7 },
    { name: "Mexico City", x: 97, y: 596, tz: -6 },
    { name: "Dallas", x: 99, y: 578, tz: -6 },
    { name: "Chicago", x: 115, y: 559, tz: -6 },
    { name: "Santiago", x: 136, y: 683, tz: -3 },
    { name: "Buenos Aires", x: 156, y: 682, tz: -3 },
    { name: "Bogota", x: 134, y: 623, tz: -5 },
    { name: "Caracas", x: 139, y: 612, tz: -4 },
    { name: "Ottawa", x: 128, y: 556, tz: -5 },
    { name: "New York", x: 132, y: 567, tz: -5 },
    { name: "Brasilia", x: 165, y: 653, tz: -3 },
    { name: "Halifax", x: 157, y: 552, tz: -4 },
    { name: "Nuuk", x: 165, y: 526, tz: -3 },
    { name: "Reykjavik", x: 210, y: 528, tz: 0 },
    { name: "London", x: 232, y: 546, tz: 0 },
    { name: "Barcelona", x: 231, y: 563, tz: 1 },
    { name: "Dakar", x: 210, y: 604, tz: 0 },
    { name: "Paris", x: 242, y: 553, tz: 1 },
    { name: "Rome", x: 258, y: 564, tz: 1 },
    { name: "Berlin", x: 253, y: 545, tz: 1 },
    { name: "Belarus", x: 272, y: 544, tz: 3 },
    { name: "Warsaw", x: 265, y: 546, tz: 1 },
    { name: "Moscow", x: 284, y: 542, tz: 3 },
    { name: "Athens", x: 270, y: 566, tz: 2 },
    { name: "Tehran", x: 309, y: 571, tz: 3.5 },
    { name: "Dubai", x: 307, y: 588, tz: 4 },
    { name: "Astana", x: 329, y: 548, tz: 6 },
    { name: "Mumbai", x: 336, y: 593, tz: 5.5 },
    { name: "Dhaka", x: 359, y: 591, tz: 6 },
    { name: "Bangkok", x: 376, y: 609, tz: 7 },
    { name: "Jakarta", x: 383, y: 637, tz: 7 },
    { name: "Beijing", x: 397, y: 568, tz: 8 },
    { name: "Tokyo", x: 429, y: 571, tz: 9 },
    { name: "Port Moresby", x: 435, y: 639, tz: 10 },
    { name: "Brisbane", x: 447, y: 673, tz: 10 },
    { name: "Wellington", x: 475, y: 694, tz: 12 },
    { name: "Magadan", x: 480, y: 529, tz: 11 },
    { name: "Port Elizabeth", x: 273, y: 681, tz: 2 },
    { name: "Walvis Bay", x: 256, y: 663, tz: 2 },
    { name: "Luanda", x: 256, y: 641, tz: 1 },
    { name: "Abuja", x: 247, y: 615, tz: 1 },
    { name: "Djibouti", x: 293, y: 614, tz: 3 },
    { name: "Cairo", x: 280, y: 579, tz: 2 },
    { name: "Amman", x: 286, y: 575, tz: 3 },
    { name: "Benghazi", x: 266, y: 578, tz: 2 },
    { name: "Khartoum", x: 281, y: 602, tz: 2 },
    { name: "Dar es Salaam", x: 288, y: 635, tz: 3 },
    { name: "Antananarivo", x: 299, y: 658, tz: 3 }
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

  class BauhausClock {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');

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
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;

      // Update cursor
      this.canvas.style.cursor = this.mouseY > MAP_TOP ? 'crosshair' : 'default';

      // Check for city hover (using accessible touch target size)
      if (this.mouseY >= MAP_TOP) {
        for (const city of CITIES) {
          if (Math.abs(this.mouseX - city.x) <= TOUCH_TARGET_RADIUS &&
              Math.abs(this.mouseY - city.y) <= TOUCH_TARGET_RADIUS) {
            this.selectedCity = city;
            break;
          }
        }
      }
    }

    handleMouseDown(e) {
      this.mousePressed = true;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleInteraction(x, y);
    }

    handleTouchStart(e) {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.mouseX = x;
      this.mouseY = y;

      // Check for city selection on touch
      if (y >= MAP_TOP) {
        for (const city of CITIES) {
          if (Math.abs(x - city.x) <= TOUCH_TARGET_RADIUS &&
              Math.abs(y - city.y) <= TOUCH_TARGET_RADIUS) {
            this.selectedCity = city;
            break;
          }
        }
      }

      this.handleInteraction(x, y);
    }

    handleTouchMove(e) {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = touch.clientX - rect.left;
      this.mouseY = touch.clientY - rect.top;
    }

    handleInteraction(x, y) {
      if (y >= MAP_TOP) {
        // Update timezone based on interaction position
        for (const range of TIMEZONE_RANGES) {
          if (x >= range.min && x <= range.max) {
            this.timezone = range.offset;
            this.markerCity = { x: this.selectedCity.x, y: this.selectedCity.y };
            break;
          }
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
      const bright = this.calculateBrightness();

      // Semi-transparent white overlay for fade effect (instead of accumulating)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, WIDTH, MAP_TOP);

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

      // Draw clock rings (HSB: hue, saturation, brightness, alpha)
      // Day ring (green)
      const dStart = (-90 + dayAngle) * Math.PI / 180;
      const dEnd = (90 + dayAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.day, dStart, dEnd, 120, 100, bright / 2, 19.6);

      // Hour ring (yellow)
      const hStart = (-90 + hourAngle) * Math.PI / 180;
      const hEnd = (90 + hourAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.hour, hStart, hEnd, 60, 100, bright, 19.6);

      // Minute ring (blue)
      const mStart = (-90 + minAngle) * Math.PI / 180;
      const mEnd = (90 + minAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.minute, mStart, mEnd, 240, 100, bright, 19.6);

      // Second ring (red)
      const sStart = (-90 + secOffset) * Math.PI / 180;
      const sEnd = (90 + secOffset) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.second, sStart, sEnd, 0, 100, bright, 19.6);

      // Draw map area
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, MAP_TOP, WIDTH, HEIGHT - MAP_TOP);

      // Draw map image
      if (this.mapLoaded) {
        ctx.globalAlpha = 0.6;
        ctx.drawImage(this.mapImage, -15, MAP_TOP, WIDTH, HEIGHT - MAP_TOP);
        ctx.globalAlpha = 1;
      }

      // Draw city markers (larger visible dots for accessibility)
      for (const city of CITIES) {
        ctx.beginPath();
        ctx.arc(city.x, city.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
        ctx.fill();
      }

      // Draw selected/active city marker (highlighted)
      ctx.beginPath();
      ctx.arc(this.markerCity.x, this.markerCity.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.markerCity.x, this.markerCity.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Draw city name with accessible font size
      ctx.font = `${CITY_FONT_SIZE}px HelveticaNeue-Light, "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.fillStyle = '#323232';
      const textOffset = 12;
      const textX = this.selectedCity.x < WIDTH - 120 ? this.selectedCity.x + textOffset : this.selectedCity.x - textOffset;
      ctx.textAlign = this.selectedCity.x < WIDTH - 120 ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.selectedCity.name, textX, this.selectedCity.y);
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

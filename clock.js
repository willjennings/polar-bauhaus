/**
 * Bauhaus World Clock - Optimized vanilla JS implementation
 * Original concept by Will Jennings and Alex Dodge
 * Enhanced with seasonal colors and map overlay
 */
(function() {
  'use strict';

  // Canvas dimensions - 2:1 aspect ratio for world map
  const WIDTH = 800;
  const HEIGHT = 400;
  const CLOCK_CENTER_X = WIDTH / 2;
  const CLOCK_CENTER_Y = HEIGHT / 2;
  const TARGET_FPS = 30;
  const FRAME_TIME = 1000 / TARGET_FPS;

  // Accessibility: WCAG 2.1 recommends minimum 44x44px touch targets
  const TOUCH_TARGET_RADIUS = 22;
  const CITY_FONT_SIZE = 14;

  // Clock ring sizes - adjusted for wider canvas
  const RINGS = {
    day: 380,
    hour: 280,
    minute: 180,
    second: 80
  };

  // Seasonal color palettes (HSB hues)
  const SEASONS = {
    spring: {
      name: 'Spring',
      day: 150,
      hour: 330,
      minute: 270,
      second: 45,
      saturation: 70,
      bgTint: 'rgba(144, 238, 144, 0.1)'
    },
    summer: {
      name: 'Summer',
      day: 45,
      hour: 60,
      minute: 190,
      second: 0,
      saturation: 90,
      bgTint: 'rgba(255, 223, 128, 0.1)'
    },
    fall: {
      name: 'Fall',
      day: 25,
      hour: 40,
      minute: 280,
      second: 350,
      saturation: 85,
      bgTint: 'rgba(205, 133, 63, 0.1)'
    },
    winter: {
      name: 'Winter',
      day: 200,
      hour: 220,
      minute: 260,
      second: 180,
      saturation: 50,
      bgTint: 'rgba(176, 224, 230, 0.1)'
    }
  };

  // Timezone ranges scaled for 800px width
  const TIMEZONE_RANGES = [
    { min: 0, max: 33, offset: 18 },     // GMT-11
    { min: 33, max: 67, offset: 19 },    // GMT-10
    { min: 67, max: 100, offset: 20 },   // GMT-9
    { min: 100, max: 133, offset: 21 },  // GMT-8
    { min: 133, max: 167, offset: 22 },  // GMT-7
    { min: 167, max: 200, offset: 23 },  // GMT-6
    { min: 200, max: 233, offset: 0 },   // GMT-5 (Eastern)
    { min: 233, max: 267, offset: 1 },   // GMT-4
    { min: 267, max: 300, offset: 2 },   // GMT-3
    { min: 300, max: 333, offset: 3 },   // GMT-2
    { min: 333, max: 367, offset: 4 },   // GMT-1
    { min: 367, max: 400, offset: 5 },   // GMT(0)
    { min: 400, max: 433, offset: 6 },   // GMT+1
    { min: 433, max: 467, offset: 7 },   // GMT+2
    { min: 467, max: 500, offset: 8 },   // GMT+3
    { min: 500, max: 533, offset: 9 },   // GMT+4
    { min: 533, max: 567, offset: 10 },  // GMT+5
    { min: 567, max: 600, offset: 11 },  // GMT+6
    { min: 600, max: 633, offset: 12 },  // GMT+7
    { min: 633, max: 667, offset: 13 },  // GMT+8
    { min: 667, max: 700, offset: 14 },  // GMT+9
    { min: 700, max: 733, offset: 15 },  // GMT+10
    { min: 733, max: 767, offset: 16 },  // GMT+11
    { min: 767, max: 800, offset: 17 }   // GMT+12
  ];

  // City data with real geographic coordinates converted to canvas positions
  // Formula: x = (longitude + 180) / 360 * WIDTH, y = (90 - latitude) / 180 * HEIGHT
  const CITIES = [
    { name: "Anchorage", x: 67, y: 64, tz: -9 },
    { name: "Los Angeles", x: 137, y: 124, tz: -8 },
    { name: "Salt Lake City", x: 151, y: 109, tz: -7 },
    { name: "Mexico City", x: 180, y: 157, tz: -6 },
    { name: "Dallas", x: 185, y: 127, tz: -6 },
    { name: "Chicago", x: 205, y: 107, tz: -6 },
    { name: "Santiago", x: 243, y: 274, tz: -3 },
    { name: "Buenos Aires", x: 270, y: 277, tz: -3 },
    { name: "Bogota", x: 235, y: 190, tz: -5 },
    { name: "Caracas", x: 251, y: 177, tz: -4 },
    { name: "Ottawa", x: 232, y: 99, tz: -5 },
    { name: "New York", x: 236, y: 110, tz: -5 },
    { name: "Brasilia", x: 294, y: 235, tz: -3 },
    { name: "Halifax", x: 259, y: 101, tz: -4 },
    { name: "Nuuk", x: 285, y: 57, tz: -3 },
    { name: "Reykjavik", x: 351, y: 57, tz: 0 },
    { name: "London", x: 400, y: 86, tz: 0 },
    { name: "Barcelona", x: 405, y: 108, tz: 1 },
    { name: "Dakar", x: 361, y: 167, tz: 0 },
    { name: "Paris", x: 405, y: 91, tz: 1 },
    { name: "Rome", x: 428, y: 107, tz: 1 },
    { name: "Berlin", x: 430, y: 83, tz: 1 },
    { name: "Minsk", x: 461, y: 80, tz: 3 },
    { name: "Warsaw", x: 447, y: 84, tz: 1 },
    { name: "Moscow", x: 484, y: 76, tz: 3 },
    { name: "Athens", x: 453, y: 116, tz: 2 },
    { name: "Tehran", x: 514, y: 121, tz: 3.5 },
    { name: "Dubai", x: 523, y: 144, tz: 4 },
    { name: "Astana", x: 559, y: 86, tz: 6 },
    { name: "Mumbai", x: 562, y: 158, tz: 5.5 },
    { name: "Dhaka", x: 601, y: 147, tz: 6 },
    { name: "Bangkok", x: 623, y: 169, tz: 7 },
    { name: "Jakarta", x: 637, y: 214, tz: 7 },
    { name: "Beijing", x: 658, y: 111, tz: 8 },
    { name: "Tokyo", x: 710, y: 121, tz: 9 },
    { name: "Port Moresby", x: 727, y: 221, tz: 10 },
    { name: "Brisbane", x: 740, y: 261, tz: 10 },
    { name: "Wellington", x: 788, y: 292, tz: 12 },
    { name: "Magadan", x: 735, y: 68, tz: 11 },
    { name: "Port Elizabeth", x: 457, y: 276, tz: 2 },
    { name: "Walvis Bay", x: 432, y: 251, tz: 2 },
    { name: "Luanda", x: 429, y: 220, tz: 1 },
    { name: "Abuja", x: 416, y: 180, tz: 1 },
    { name: "Djibouti", x: 496, y: 174, tz: 3 },
    { name: "Cairo", x: 469, y: 133, tz: 2 },
    { name: "Amman", x: 480, y: 129, tz: 3 },
    { name: "Benghazi", x: 445, y: 129, tz: 2 },
    { name: "Khartoum", x: 472, y: 166, tz: 2 },
    { name: "Dar es Salaam", x: 487, y: 215, tz: 3 },
    { name: "Antananarivo", x: 506, y: 242, tz: 3 }
  ];

  function getUserTimezoneHours() {
    return -new Date().getTimezoneOffset() / 60;
  }

  function gmtToInternalOffset(gmtHours) {
    return ((Math.round(gmtHours) + 5) % 24 + 24) % 24;
  }

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

  function getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

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

      this.canvas.width = WIDTH;
      this.canvas.height = HEIGHT;

      this.season = getCurrentSeason();

      const userTzHours = getUserTimezoneHours();
      const defaultCity = findClosestCity(userTzHours);

      this.timezone = gmtToInternalOffset(userTzHours);
      this.selectedCity = defaultCity;
      this.markerCity = { x: defaultCity.x, y: defaultCity.y };
      this.mouseX = 0;
      this.mouseY = 0;
      this.mousePressed = false;

      const now = new Date();
      this.initSeconds = now.getSeconds();
      this.initMinutes = now.getMinutes();
      this.initHours = now.getHours();

      this.mapImage = new Image();
      this.mapLoaded = false;

      this.lastFrameTime = 0;
      this.animationId = null;

      this.init();
    }

    init() {
      this.mapImage.onload = () => {
        this.mapLoaded = true;
      };
      this.mapImage.src = 'world_1.png';

      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.canvas.addEventListener('mouseup', () => this.mousePressed = false);
      this.canvas.addEventListener('mouseleave', () => this.mousePressed = false);

      this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

      this.animate(0);
    }

    handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;

      this.canvas.style.cursor = 'crosshair';

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
      for (const range of TIMEZONE_RANGES) {
        if (x >= range.min && x <= range.max) {
          this.timezone = range.offset;
          this.markerCity = { x: this.selectedCity.x, y: this.selectedCity.y };
          break;
        }
      }
    }

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
      const millis = timestamp % 86400000;
      const bright = Math.max(30, this.calculateBrightness());
      const season = this.season;

      // Clear canvas
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw map image as background (preserving aspect ratio)
      if (this.mapLoaded) {
        ctx.globalAlpha = 0.5;
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
        ctx.beginPath();
        ctx.arc(city.x, city.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60, 60, 60, 0.5)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(city.x, city.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
      }

      // Draw selected/active city marker
      ctx.beginPath();
      ctx.arc(this.markerCity.x, this.markerCity.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.markerCity.x, this.markerCity.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ff6464';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Draw city name with background
      ctx.font = `bold ${CITY_FONT_SIZE}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      const textOffset = 12;
      const textX = this.selectedCity.x < WIDTH - 100 ? this.selectedCity.x + textOffset : this.selectedCity.x - textOffset;
      const textAlign = this.selectedCity.x < WIDTH - 100 ? 'left' : 'right';
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'middle';

      const textWidth = ctx.measureText(this.selectedCity.name).width;
      const bgX = textAlign === 'left' ? textX - 4 : textX - textWidth - 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(bgX, this.selectedCity.y - 10, textWidth + 8, 20);

      ctx.fillStyle = '#333333';
      ctx.fillText(this.selectedCity.name, textX, this.selectedCity.y);

      // Draw season indicator
      ctx.font = '12px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.fillText(season.name, WIDTH - 10, 10);
    }

    animate(timestamp) {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.bauhausClock = new BauhausClock('worldcloc');
    });
  } else {
    window.bauhausClock = new BauhausClock('worldcloc');
  }
})();

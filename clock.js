/**
 * Bauhaus World Clock - Optimized vanilla JS implementation
 * Original concept by Will Jennings and Alex Dodge
 * Enhanced with seasonal colors and watercolor map overlay
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

  // Accessibility
  const TOUCH_TARGET_RADIUS = 20;
  const CITY_FONT_SIZE = 13;

  // Clock ring sizes - fits within the map
  const RINGS = {
    day: 360,
    hour: 260,
    minute: 160,
    second: 70
  };

  // Seasonal color palettes - complementing watercolor aesthetic
  const SEASONS = {
    spring: {
      name: 'Spring',
      day: 140,      // Soft green
      hour: 320,     // Soft pink
      minute: 180,   // Soft cyan
      second: 50,    // Soft gold
      saturation: 45,
      bgTint: 'rgba(200, 230, 200, 0.08)'
    },
    summer: {
      name: 'Summer',
      day: 35,       // Warm orange
      hour: 55,      // Golden yellow
      minute: 185,   // Turquoise
      second: 15,    // Coral
      saturation: 55,
      bgTint: 'rgba(255, 240, 200, 0.08)'
    },
    fall: {
      name: 'Fall',
      day: 25,       // Burnt sienna
      hour: 45,      // Amber
      minute: 270,   // Plum
      second: 5,     // Deep red
      saturation: 50,
      bgTint: 'rgba(220, 180, 140, 0.08)'
    },
    winter: {
      name: 'Winter',
      day: 220,      // Soft blue (matches watercolor)
      hour: 260,     // Soft purple (matches watercolor)
      minute: 200,   // Teal
      second: 240,   // Lavender
      saturation: 40,
      bgTint: 'rgba(180, 200, 230, 0.08)'
    }
  };

  // Timezone ranges for 800px width
  const TIMEZONE_RANGES = [
    { min: 0, max: 33, offset: 18 },
    { min: 33, max: 67, offset: 19 },
    { min: 67, max: 100, offset: 20 },
    { min: 100, max: 133, offset: 21 },
    { min: 133, max: 167, offset: 22 },
    { min: 167, max: 200, offset: 23 },
    { min: 200, max: 233, offset: 0 },
    { min: 233, max: 267, offset: 1 },
    { min: 267, max: 300, offset: 2 },
    { min: 300, max: 333, offset: 3 },
    { min: 333, max: 367, offset: 4 },
    { min: 367, max: 400, offset: 5 },
    { min: 400, max: 433, offset: 6 },
    { min: 433, max: 467, offset: 7 },
    { min: 467, max: 500, offset: 8 },
    { min: 500, max: 533, offset: 9 },
    { min: 533, max: 567, offset: 10 },
    { min: 567, max: 600, offset: 11 },
    { min: 600, max: 633, offset: 12 },
    { min: 633, max: 667, offset: 13 },
    { min: 667, max: 700, offset: 14 },
    { min: 700, max: 733, offset: 15 },
    { min: 733, max: 767, offset: 16 },
    { min: 767, max: 800, offset: 17 }
  ];

  // City coordinates matched to the watercolor SVG map
  const CITIES = [
    // North America
    { name: "Anchorage", x: 55, y: 68, tz: -9 },
    { name: "Los Angeles", x: 85, y: 135, tz: -8 },
    { name: "Salt Lake City", x: 100, y: 115, tz: -7 },
    { name: "Mexico City", x: 115, y: 170, tz: -6 },
    { name: "Dallas", x: 125, y: 145, tz: -6 },
    { name: "Chicago", x: 145, y: 115, tz: -6 },
    { name: "Ottawa", x: 175, y: 100, tz: -5 },
    { name: "New York", x: 180, y: 115, tz: -5 },
    { name: "Halifax", x: 200, y: 95, tz: -4 },
    { name: "Caracas", x: 190, y: 195, tz: -4 },
    { name: "Bogota", x: 175, y: 200, tz: -5 },
    // South America
    { name: "Brasilia", x: 210, y: 260, tz: -3 },
    { name: "Santiago", x: 175, y: 320, tz: -3 },
    { name: "Buenos Aires", x: 195, y: 330, tz: -3 },
    // Greenland/Iceland
    { name: "Nuuk", x: 280, y: 55, tz: -3 },
    { name: "Reykjavik", x: 350, y: 52, tz: 0 },
    // Europe
    { name: "London", x: 385, y: 80, tz: 0 },
    { name: "Paris", x: 400, y: 90, tz: 1 },
    { name: "Barcelona", x: 400, y: 105, tz: 1 },
    { name: "Berlin", x: 430, y: 78, tz: 1 },
    { name: "Rome", x: 430, y: 100, tz: 1 },
    { name: "Warsaw", x: 450, y: 78, tz: 1 },
    { name: "Athens", x: 455, y: 108, tz: 2 },
    { name: "Minsk", x: 465, y: 72, tz: 3 },
    { name: "Moscow", x: 490, y: 70, tz: 3 },
    // Africa
    { name: "Dakar", x: 365, y: 165, tz: 0 },
    { name: "Abuja", x: 420, y: 190, tz: 1 },
    { name: "Luanda", x: 430, y: 255, tz: 1 },
    { name: "Cairo", x: 470, y: 145, tz: 2 },
    { name: "Khartoum", x: 475, y: 175, tz: 2 },
    { name: "Benghazi", x: 450, y: 145, tz: 2 },
    { name: "Djibouti", x: 500, y: 195, tz: 3 },
    { name: "Dar es Salaam", x: 490, y: 255, tz: 3 },
    { name: "Walvis Bay", x: 435, y: 295, tz: 2 },
    { name: "Port Elizabeth", x: 465, y: 325, tz: 2 },
    { name: "Antananarivo", x: 518, y: 300, tz: 3 },
    // Middle East / Central Asia
    { name: "Amman", x: 485, y: 145, tz: 3 },
    { name: "Tehran", x: 520, y: 135, tz: 3.5 },
    { name: "Dubai", x: 535, y: 160, tz: 4 },
    { name: "Astana", x: 560, y: 78, tz: 6 },
    { name: "Mumbai", x: 560, y: 175, tz: 5.5 },
    { name: "Dhaka", x: 595, y: 165, tz: 6 },
    // East/Southeast Asia
    { name: "Bangkok", x: 620, y: 195, tz: 7 },
    { name: "Jakarta", x: 640, y: 225, tz: 7 },
    { name: "Beijing", x: 660, y: 110, tz: 8 },
    { name: "Tokyo", x: 715, y: 115, tz: 9 },
    { name: "Magadan", x: 730, y: 68, tz: 11 },
    // Oceania
    { name: "Port Moresby", x: 720, y: 250, tz: 10 },
    { name: "Brisbane", x: 740, y: 295, tz: 10 },
    { name: "Wellington", x: 788, y: 345, tz: 12 }
  ];

  function getUserTimezoneHours() {
    return -new Date().getTimezoneOffset() / 60;
  }

  function gmtToInternalOffset(gmtHours) {
    return ((Math.round(gmtHours) + 5) % 24 + 24) % 24;
  }

  function findClosestCity(userTzHours) {
    let closest = CITIES.find(c => c.name === "New York") || CITIES[0];
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
      this.mapImage.src = 'world_map.svg';

      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
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
      const bright = Math.max(40, this.calculateBrightness());
      const season = this.season;

      // Clear with off-white background
      ctx.fillStyle = '#fefefe';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw watercolor map
      if (this.mapLoaded) {
        ctx.drawImage(this.mapImage, 0, 0, WIDTH, HEIGHT);
      }

      // Subtle seasonal tint
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

      // Draw clock rings with softer, more translucent colors
      // Day ring (outermost)
      const dStart = (-90 + dayAngle) * Math.PI / 180;
      const dEnd = (90 + dayAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.day, dStart, dEnd, season.day, sat, bright / 2, 22);

      // Hour ring
      const hStart = (-90 + hourAngle) * Math.PI / 180;
      const hEnd = (90 + hourAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.hour, hStart, hEnd, season.hour, sat, bright, 26);

      // Minute ring
      const mStart = (-90 + minAngle) * Math.PI / 180;
      const mEnd = (90 + minAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.minute, mStart, mEnd, season.minute, sat, bright, 30);

      // Second ring (innermost)
      const sStart = (-90 + secOffset) * Math.PI / 180;
      const sEnd = (90 + secOffset) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.second, sStart, sEnd, season.second, sat, bright, 35);

      // Draw city markers with subtle styling
      for (const city of CITIES) {
        ctx.beginPath();
        ctx.arc(city.x, city.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(100, 100, 120, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw selected city marker
      ctx.beginPath();
      ctx.arc(this.markerCity.x, this.markerCity.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(180, 100, 130, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw city name with elegant styling
      ctx.font = `600 ${CITY_FONT_SIZE}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      const textOffset = 14;
      const textX = this.selectedCity.x < WIDTH - 100 ? this.selectedCity.x + textOffset : this.selectedCity.x - textOffset;
      const textAlign = this.selectedCity.x < WIDTH - 100 ? 'left' : 'right';
      ctx.textAlign = textAlign;
      ctx.textBaseline = 'middle';

      // Text with subtle shadow
      const textWidth = ctx.measureText(this.selectedCity.name).width;
      const bgX = textAlign === 'left' ? textX - 6 : textX - textWidth - 6;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.roundRect(bgX, this.selectedCity.y - 11, textWidth + 12, 22, 4);
      ctx.fill();

      ctx.fillStyle = '#4a5568';
      ctx.fillText(this.selectedCity.name, textX, this.selectedCity.y);

      // Season indicator
      ctx.font = '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(90, 90, 110, 0.6)';
      ctx.fillText(season.name, WIDTH - 12, 12);
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

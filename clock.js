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

  // Seasonal color palettes - Bold Bauhaus primary colors
  const SEASONS = {
    spring: {
      name: 'Spring',
      day: 120,      // Vibrant green
      hour: 50,      // Golden yellow
      minute: 340,   // Magenta pink
      second: 200,   // Cyan blue
      saturation: 90,
      bgTint: 'rgba(200, 255, 200, 0.04)'
    },
    summer: {
      name: 'Summer',
      day: 50,       // Bright yellow
      hour: 15,      // Orange-red
      minute: 220,   // Royal blue
      second: 140,   // Teal green
      saturation: 95,
      bgTint: 'rgba(255, 250, 200, 0.04)'
    },
    fall: {
      name: 'Fall',
      day: 30,       // Deep orange
      hour: 0,       // Pure red
      minute: 270,   // Purple
      second: 50,    // Gold yellow
      saturation: 90,
      bgTint: 'rgba(255, 220, 180, 0.04)'
    },
    winter: {
      name: 'Winter',
      day: 220,      // Bold blue
      hour: 0,       // Bold red
      minute: 50,    // Bold yellow
      second: 140,   // Bold green
      saturation: 100,
      bgTint: 'rgba(220, 235, 255, 0.04)'
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

  // City coordinates based on real lat/long for 800x400 equirectangular projection
  // Formula: x = (lon + 180) / 360 * 800, y = (90 - lat) / 180 * 400
  const CITIES = [
    // North America
    { name: "Anchorage", x: 67, y: 64, tz: -9 },      // 61.2°N, 149.9°W
    { name: "Los Angeles", x: 137, y: 124, tz: -8 },  // 34.05°N, 118.24°W
    { name: "Salt Lake City", x: 151, y: 109, tz: -7 }, // 40.76°N, 111.89°W
    { name: "Mexico City", x: 180, y: 157, tz: -6 },  // 19.43°N, 99.13°W
    { name: "Dallas", x: 185, y: 127, tz: -6 },       // 32.78°N, 96.8°W
    { name: "Chicago", x: 205, y: 107, tz: -6 },      // 41.88°N, 87.63°W
    { name: "Ottawa", x: 232, y: 99, tz: -5 },        // 45.42°N, 75.7°W
    { name: "New York", x: 235, y: 109, tz: -5 },     // 40.71°N, 74.01°W
    { name: "Halifax", x: 259, y: 101, tz: -4 },      // 44.65°N, 63.57°W
    { name: "Caracas", x: 251, y: 177, tz: -4 },      // 10.48°N, 66.9°W
    { name: "Bogota", x: 235, y: 189, tz: -5 },       // 4.71°N, 74.07°W
    // South America
    { name: "Brasilia", x: 294, y: 235, tz: -3 },     // 15.79°S, 47.88°W
    { name: "Santiago", x: 243, y: 274, tz: -3 },     // 33.45°S, 70.67°W
    { name: "Buenos Aires", x: 270, y: 277, tz: -3 }, // 34.6°S, 58.38°W
    // Greenland/Iceland
    { name: "Nuuk", x: 285, y: 57, tz: -3 },          // 64.17°N, 51.74°W
    { name: "Reykjavik", x: 351, y: 57, tz: 0 },      // 64.15°N, 21.94°W
    // Europe
    { name: "London", x: 400, y: 86, tz: 0 },         // 51.51°N, 0.13°W
    { name: "Paris", x: 405, y: 91, tz: 1 },          // 48.86°N, 2.35°E
    { name: "Barcelona", x: 405, y: 108, tz: 1 },     // 41.39°N, 2.17°E
    { name: "Berlin", x: 430, y: 83, tz: 1 },         // 52.52°N, 13.4°E
    { name: "Rome", x: 428, y: 107, tz: 1 },          // 41.9°N, 12.5°E
    { name: "Warsaw", x: 447, y: 84, tz: 1 },         // 52.23°N, 21.01°E
    { name: "Athens", x: 453, y: 116, tz: 2 },        // 37.98°N, 23.73°E
    { name: "Minsk", x: 461, y: 80, tz: 3 },          // 53.9°N, 27.57°E
    { name: "Moscow", x: 484, y: 76, tz: 3 },         // 55.76°N, 37.62°E
    // Africa
    { name: "Dakar", x: 361, y: 167, tz: 0 },         // 14.69°N, 17.44°W
    { name: "Abuja", x: 416, y: 180, tz: 1 },         // 9.08°N, 7.4°E
    { name: "Luanda", x: 429, y: 220, tz: 1 },        // 8.84°S, 13.23°E
    { name: "Cairo", x: 469, y: 133, tz: 2 },         // 30.04°N, 31.24°E
    { name: "Khartoum", x: 472, y: 166, tz: 2 },      // 15.5°N, 32.56°E
    { name: "Benghazi", x: 445, y: 129, tz: 2 },      // 32.12°N, 20.07°E
    { name: "Djibouti", x: 496, y: 174, tz: 3 },      // 11.59°N, 43.15°E
    { name: "Dar es Salaam", x: 487, y: 215, tz: 3 }, // 6.79°S, 39.21°E
    { name: "Walvis Bay", x: 432, y: 251, tz: 2 },    // 22.96°S, 14.51°E
    { name: "Port Elizabeth", x: 457, y: 276, tz: 2 },// 33.96°S, 25.6°E
    { name: "Antananarivo", x: 506, y: 242, tz: 3 },  // 18.88°S, 47.51°E
    // Middle East / Central Asia
    { name: "Amman", x: 480, y: 129, tz: 3 },         // 31.95°N, 35.93°E
    { name: "Tehran", x: 514, y: 121, tz: 3.5 },      // 35.69°N, 51.39°E
    { name: "Dubai", x: 523, y: 144, tz: 4 },         // 25.2°N, 55.27°E
    { name: "Astana", x: 559, y: 86, tz: 6 },         // 51.17°N, 71.45°E
    { name: "Mumbai", x: 562, y: 158, tz: 5.5 },      // 19.08°N, 72.88°E
    { name: "Dhaka", x: 601, y: 147, tz: 6 },         // 23.81°N, 90.41°E
    // East/Southeast Asia
    { name: "Bangkok", x: 623, y: 169, tz: 7 },       // 13.76°N, 100.5°E
    { name: "Jakarta", x: 637, y: 214, tz: 7 },       // 6.21°S, 106.85°E
    { name: "Beijing", x: 658, y: 111, tz: 8 },       // 39.9°N, 116.41°E
    { name: "Tokyo", x: 710, y: 121, tz: 9 },         // 35.68°N, 139.69°E
    { name: "Magadan", x: 735, y: 68, tz: 11 },       // 59.56°N, 150.8°E
    // Oceania
    { name: "Port Moresby", x: 727, y: 221, tz: 10 }, // 9.44°S, 147.18°E
    { name: "Brisbane", x: 740, y: 261, tz: 10 },     // 27.47°S, 153.03°E
    { name: "Wellington", x: 788, y: 292, tz: 12 }    // 41.29°S, 174.78°E
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
      this.mapImage.src = 'world_1.svg';

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
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw world map with watercolor tinting
      if (this.mapLoaded) {
        // Draw the base map
        ctx.globalAlpha = 0.7;
        ctx.drawImage(this.mapImage, 0, 0, WIDTH, HEIGHT);
        ctx.globalAlpha = 1;

        // Apply watercolor color overlay using multiply blend
        ctx.globalCompositeOperation = 'multiply';
        const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
        gradient.addColorStop(0, 'rgba(74, 111, 165, 0.5)');    // Blue
        gradient.addColorStop(0.3, 'rgba(107, 91, 149, 0.5)');  // Purple
        gradient.addColorStop(0.6, 'rgba(65, 105, 170, 0.5)');  // Blue
        gradient.addColorStop(1, 'rgba(123, 104, 166, 0.5)');   // Purple
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.globalCompositeOperation = 'source-over';
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

      // Draw clock rings with bold Bauhaus colors
      // Day ring (outermost)
      const dStart = (-90 + dayAngle) * Math.PI / 180;
      const dEnd = (90 + dayAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.day, dStart, dEnd, season.day, sat, bright, 35);

      // Hour ring
      const hStart = (-90 + hourAngle) * Math.PI / 180;
      const hEnd = (90 + hourAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.hour, hStart, hEnd, season.hour, sat, bright, 40);

      // Minute ring
      const mStart = (-90 + minAngle) * Math.PI / 180;
      const mEnd = (90 + minAngle) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.minute, mStart, mEnd, season.minute, sat, bright, 45);

      // Second ring (innermost)
      const sStart = (-90 + secOffset) * Math.PI / 180;
      const sEnd = (90 + secOffset) * Math.PI / 180;
      this.drawArc(CLOCK_CENTER_X, CLOCK_CENTER_Y, RINGS.second, sStart, sEnd, season.second, sat, bright, 50);

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

/**
 * Bauhaus World Clock - Multi-timezone display with history
 * Original concept by Will Jennings and Alex Dodge
 */
(function() {
  'use strict';

  const WIDTH = 800;
  const HEIGHT = 400;
  const TARGET_FPS = 30;
  const FRAME_TIME = 1000 / TARGET_FPS;
  const MAX_HISTORY = 5;

  // Bauhaus color palette
  const COLORS = {
    red: '#E53935',
    blue: '#1E88E5',
    yellow: '#FDD835',
    green: '#43A047',
    black: '#212121',
    white: '#FAFAFA',
    gray: '#757575'
  };

  // City data with timezone offsets
  const CITIES = [
    { name: "Anchorage", x: 67, y: 64, tz: -9 },
    { name: "Los Angeles", x: 137, y: 124, tz: -8 },
    { name: "Mexico City", x: 180, y: 157, tz: -6 },
    { name: "Chicago", x: 205, y: 107, tz: -6 },
    { name: "New York", x: 235, y: 109, tz: -5 },
    { name: "Bogota", x: 235, y: 189, tz: -5 },
    { name: "Brasilia", x: 294, y: 235, tz: -3 },
    { name: "Buenos Aires", x: 270, y: 277, tz: -3 },
    { name: "Reykjavik", x: 351, y: 57, tz: 0 },
    { name: "London", x: 400, y: 86, tz: 0 },
    { name: "Paris", x: 405, y: 91, tz: 1 },
    { name: "Berlin", x: 430, y: 83, tz: 1 },
    { name: "Rome", x: 428, y: 107, tz: 1 },
    { name: "Cairo", x: 469, y: 133, tz: 2 },
    { name: "Moscow", x: 484, y: 76, tz: 3 },
    { name: "Dubai", x: 523, y: 144, tz: 4 },
    { name: "Mumbai", x: 562, y: 158, tz: 5.5 },
    { name: "Bangkok", x: 623, y: 169, tz: 7 },
    { name: "Beijing", x: 658, y: 111, tz: 8 },
    { name: "Tokyo", x: 710, y: 121, tz: 9 },
    { name: "Sydney", x: 755, y: 275, tz: 11 },
    { name: "Wellington", x: 788, y: 292, tz: 12 }
  ];

  function getUserTimezone() {
    return -new Date().getTimezoneOffset() / 60;
  }

  function getTimeForTimezone(tz) {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const tzTime = new Date(utc + (tz * 3600000));
    return {
      hours: tzTime.getHours(),
      minutes: tzTime.getMinutes(),
      seconds: tzTime.getSeconds(),
      ms: tzTime.getMilliseconds()
    };
  }

  function formatTime(hours, minutes) {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return { h, m };
  }

  function getRandomCities(count, exclude = []) {
    const available = CITIES.filter(c => !exclude.some(e => e.name === c.name));
    const result = [];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      result.push(available.splice(idx, 1)[0]);
    }
    return result;
  }

  class BauhausClock {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = WIDTH;
      this.canvas.height = HEIGHT;

      // Get user's local timezone city or default
      const userTz = getUserTimezone();
      const localCity = CITIES.find(c => c.tz === userTz) ||
                        CITIES.find(c => c.name === "New York");

      // Initialize with local + 2 random cities
      this.clockHistory = [localCity, ...getRandomCities(2, [localCity])];
      this.selectedCity = localCity;
      this.hoveredCity = null;

      this.mapImage = new Image();
      this.mapLoaded = false;
      this.lastFrameTime = 0;

      this.init();
    }

    init() {
      this.mapImage.onload = () => { this.mapLoaded = true; };
      this.mapImage.src = 'world_1.svg';

      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('click', (e) => this.handleClick(e));
      this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });

      this.animate(0);
    }

    getCanvasCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    handleMouseMove(e) {
      const { x, y } = this.getCanvasCoords(e);
      this.hoveredCity = null;

      for (const city of CITIES) {
        if (Math.abs(x - city.x) <= 15 && Math.abs(y - city.y) <= 15) {
          this.hoveredCity = city;
          this.canvas.style.cursor = 'pointer';
          return;
        }
      }
      this.canvas.style.cursor = 'default';
    }

    handleClick(e) {
      const { x, y } = this.getCanvasCoords(e);

      for (const city of CITIES) {
        if (Math.abs(x - city.x) <= 15 && Math.abs(y - city.y) <= 15) {
          this.addToHistory(city);
          return;
        }
      }
    }

    handleTouch(e) {
      e.preventDefault();
      this.handleClick(e);
    }

    addToHistory(city) {
      // Remove if already in history
      this.clockHistory = this.clockHistory.filter(c => c.name !== city.name);
      // Add to front
      this.clockHistory.unshift(city);
      // Limit history
      if (this.clockHistory.length > MAX_HISTORY) {
        this.clockHistory.pop();
      }
      this.selectedCity = city;
    }

    drawMiniClock(ctx, x, y, radius, time, colorIndex) {
      const colors = [COLORS.blue, COLORS.red, COLORS.yellow, COLORS.green, COLORS.gray];
      const color = colors[colorIndex % colors.length];

      // Clock face
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.white;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Hour hand
      const hourAngle = ((time.hours % 12) + time.minutes / 60) * 30 - 90;
      const hourRad = hourAngle * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(hourRad) * radius * 0.5, y + Math.sin(hourRad) * radius * 0.5);
      ctx.strokeStyle = COLORS.black;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Minute hand
      const minAngle = (time.minutes + time.seconds / 60) * 6 - 90;
      const minRad = minAngle * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(minRad) * radius * 0.75, y + Math.sin(minRad) * radius * 0.75);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    drawBauhausElement(ctx, x, y, type, size, color) {
      ctx.fillStyle = color;
      switch(type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'square':
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size, y + size);
          ctx.lineTo(x - size, y + size);
          ctx.closePath();
          ctx.fill();
          break;
      }
    }

    draw(timestamp) {
      const ctx = this.ctx;

      // Background
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw map faintly
      if (this.mapLoaded) {
        ctx.globalAlpha = 0.15;
        ctx.drawImage(this.mapImage, 0, 0, WIDTH, HEIGHT);
        ctx.globalAlpha = 1;
      }

      // Draw geometric Bauhaus decorations
      this.drawBauhausElement(ctx, 50, 50, 'circle', 20, COLORS.yellow);
      this.drawBauhausElement(ctx, WIDTH - 50, HEIGHT - 50, 'square', 15, COLORS.green);
      this.drawBauhausElement(ctx, 50, HEIGHT - 50, 'triangle', 18, COLORS.blue);

      // Draw diagonal lines (Bauhaus style)
      ctx.strokeStyle = COLORS.black;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 60);
        ctx.lineTo(i * 60, 0);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Main time display (current selected city)
      const mainTime = getTimeForTimezone(this.selectedCity.tz);
      const formatted = formatTime(mainTime.hours, mainTime.minutes);

      // Large digital time
      ctx.font = 'bold 120px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = COLORS.black;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatted.h, WIDTH / 2 - 80, HEIGHT / 2 - 20);

      ctx.font = 'bold 80px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = COLORS.gray;
      ctx.fillText(formatted.m, WIDTH / 2 + 60, HEIGHT / 2 + 20);

      // City name
      ctx.font = 'bold 18px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = COLORS.black;
      ctx.textAlign = 'center';
      ctx.fillText(this.selectedCity.name.toUpperCase(), WIDTH / 2, HEIGHT / 2 + 80);

      // Timezone indicator
      const tzStr = this.selectedCity.tz >= 0 ? `UTC+${this.selectedCity.tz}` : `UTC${this.selectedCity.tz}`;
      ctx.font = '14px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = COLORS.gray;
      ctx.fillText(tzStr, WIDTH / 2, HEIGHT / 2 + 100);

      // Draw mini clocks for history (right side)
      const clockStartX = WIDTH - 80;
      const clockStartY = 60;
      const clockSpacing = 75;
      const clockRadius = 28;

      ctx.font = 'bold 10px "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';

      this.clockHistory.forEach((city, i) => {
        const time = getTimeForTimezone(city.tz);
        const y = clockStartY + i * clockSpacing;

        this.drawMiniClock(ctx, clockStartX, y, clockRadius, time, i);

        // City label
        ctx.fillStyle = COLORS.black;
        ctx.fillText(city.name.substring(0, 8), clockStartX, y + clockRadius + 12);
      });

      // Draw city markers on map
      for (const city of CITIES) {
        const isInHistory = this.clockHistory.some(c => c.name === city.name);
        const isHovered = this.hoveredCity?.name === city.name;
        const isSelected = this.selectedCity.name === city.name;

        ctx.beginPath();
        ctx.arc(city.x, city.y, isHovered ? 8 : (isInHistory ? 6 : 4), 0, Math.PI * 2);

        if (isSelected) {
          ctx.fillStyle = COLORS.red;
        } else if (isInHistory) {
          ctx.fillStyle = COLORS.blue;
        } else if (isHovered) {
          ctx.fillStyle = COLORS.yellow;
        } else {
          ctx.fillStyle = 'rgba(33, 33, 33, 0.3)';
        }
        ctx.fill();

        if (isHovered || isSelected) {
          ctx.strokeStyle = COLORS.black;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Hovered city tooltip
      if (this.hoveredCity && this.hoveredCity.name !== this.selectedCity.name) {
        const time = getTimeForTimezone(this.hoveredCity.tz);
        const fmt = formatTime(time.hours, time.minutes);
        const label = `${this.hoveredCity.name} ${fmt.h}:${fmt.m}`;

        ctx.font = 'bold 12px "Helvetica Neue", Arial, sans-serif';
        const textWidth = ctx.measureText(label).width;

        const tooltipX = Math.min(this.hoveredCity.x + 15, WIDTH - textWidth - 20);
        const tooltipY = this.hoveredCity.y - 10;

        ctx.fillStyle = COLORS.black;
        ctx.fillRect(tooltipX - 5, tooltipY - 12, textWidth + 10, 20);
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = 'left';
        ctx.fillText(label, tooltipX, tooltipY);
      }

      // Season/date indicator
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = COLORS.gray;
      ctx.textAlign = 'right';
      ctx.fillText(dateStr, WIDTH - 15, HEIGHT - 15);
    }

    animate(timestamp) {
      if (timestamp - this.lastFrameTime >= FRAME_TIME) {
        this.lastFrameTime = timestamp;
        this.draw(timestamp);
      }
      requestAnimationFrame((t) => this.animate(t));
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

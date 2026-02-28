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
    constructor(canvasId, options = {}) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = WIDTH;
      this.canvas.height = HEIGHT;

      // Tunable settings with defaults
      this.settings = {
        // Circle visibility toggles
        showMilliseconds: true,
        showSeconds: true,
        showHours: true,

        // Custom colors (null = use time-of-day colors)
        msColor: null,
        secColor: null,
        hourColor: null,

        // Shape for each ring: 'circle', 'square', 'triangle'
        msShape: 'circle',
        secShape: 'circle',
        hourShape: 'circle',

        // Use time-of-day adaptive colors
        useTimeColors: true,

        ...options
      };

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

      // Animation state
      this.lastSecond = -1;
      this.tickPulse = 0;

      this.init();
    }

    // Update settings dynamically
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
    }

    // Toggle individual circles
    toggleMilliseconds(show) { this.settings.showMilliseconds = show; }
    toggleSeconds(show) { this.settings.showSeconds = show; }
    toggleHours(show) { this.settings.showHours = show; }

    // Set custom colors
    setColors(msColor, secColor, hourColor) {
      this.settings.msColor = msColor;
      this.settings.secColor = secColor;
      this.settings.hourColor = hourColor;
      this.settings.useTimeColors = false;
    }

    // Reset to time-of-day colors
    useTimeOfDayColors() {
      this.settings.useTimeColors = true;
      this.settings.msColor = null;
      this.settings.secColor = null;
      this.settings.hourColor = null;
    }

    // Set shapes for each ring
    setShapes(msShape, secShape, hourShape) {
      this.settings.msShape = msShape || 'circle';
      this.settings.secShape = secShape || 'circle';
      this.settings.hourShape = hourShape || 'circle';
    }

    // Draw a square path with progress
    drawSquareProgress(ctx, size, progress, strokeWidth, color, isBackground = false) {
      const half = size;
      const perimeter = size * 8; // 4 sides * 2 * half
      const progressLength = progress * perimeter;

      ctx.beginPath();
      ctx.strokeStyle = isBackground ? 'rgba(0,0,0,0.1)' : color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'square';

      if (isBackground) {
        // Draw full square
        ctx.moveTo(-half, -half);
        ctx.lineTo(half, -half);
        ctx.lineTo(half, half);
        ctx.lineTo(-half, half);
        ctx.closePath();
        ctx.stroke();
        return;
      }

      // Draw progress along square edges starting from top-center
      const points = [
        { x: 0, y: -half },      // top center (start)
        { x: half, y: -half },   // top right
        { x: half, y: half },    // bottom right
        { x: -half, y: half },   // bottom left
        { x: -half, y: -half },  // top left
        { x: 0, y: -half }       // back to top center
      ];

      // Calculate edge lengths
      const edges = [];
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        edges.push(Math.sqrt(dx * dx + dy * dy));
      }

      let remaining = progressLength;
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < edges.length && remaining > 0; i++) {
        const edgeLen = edges[i];
        const drawLen = Math.min(remaining, edgeLen);
        const ratio = drawLen / edgeLen;

        const endX = points[i].x + (points[i + 1].x - points[i].x) * ratio;
        const endY = points[i].y + (points[i + 1].y - points[i].y) * ratio;

        ctx.lineTo(endX, endY);
        remaining -= drawLen;
      }

      ctx.stroke();
    }

    // Draw a triangle path with progress
    drawTriangleProgress(ctx, size, progress, strokeWidth, color, isBackground = false) {
      const h = size * Math.sqrt(3) / 2; // height of equilateral triangle
      const half = size;

      ctx.beginPath();
      ctx.strokeStyle = isBackground ? 'rgba(0,0,0,0.1)' : color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';

      // Equilateral triangle pointing up, start from top
      const points = [
        { x: 0, y: -h * 2/3 },           // top
        { x: half, y: h / 3 },           // bottom right
        { x: -half, y: h / 3 },          // bottom left
        { x: 0, y: -h * 2/3 }            // back to top
      ];

      if (isBackground) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        return;
      }

      // Calculate perimeter and progress
      let perimeter = 0;
      const edges = [];
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        edges.push(len);
        perimeter += len;
      }

      const progressLength = progress * perimeter;
      let remaining = progressLength;

      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < edges.length && remaining > 0; i++) {
        const edgeLen = edges[i];
        const drawLen = Math.min(remaining, edgeLen);
        const ratio = drawLen / edgeLen;

        const endX = points[i].x + (points[i + 1].x - points[i].x) * ratio;
        const endY = points[i].y + (points[i + 1].y - points[i].y) * ratio;

        ctx.lineTo(endX, endY);
        remaining -= drawLen;
      }

      ctx.stroke();
    }

    // Draw a shape with progress (dispatcher)
    drawShapeProgress(ctx, shape, size, progress, strokeWidth, color, rotation = 0) {
      ctx.save();
      ctx.rotate(rotation);

      if (shape === 'square') {
        this.drawSquareProgress(ctx, size, 1, strokeWidth, null, true); // background
        this.drawSquareProgress(ctx, size, progress, strokeWidth, color, false);
      } else if (shape === 'triangle') {
        this.drawTriangleProgress(ctx, size, 1, strokeWidth, null, true); // background
        this.drawTriangleProgress(ctx, size, progress, strokeWidth, color, false);
      } else {
        // Circle (default)
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = strokeWidth;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, size, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.restore();
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

    drawInterlockingBars(ctx, centerX, centerY, time, tickPulse) {
      // Tick-based rotation: each second snaps to a new position
      // Plus smooth interpolation within the second
      const secondAngle = (time.seconds / 60) * Math.PI * 2;
      const microProgress = time.ms / 1000;
      const tickAngle = (1 / 60) * Math.PI * 2;

      // Eased micro-movement within each second (ease-out for snap feel)
      const easedMicro = 1 - Math.pow(1 - microProgress, 3);
      const baseAngle = secondAngle + (tickAngle * easedMicro);

      // Bar dimensions - scale up with pulse
      const pulseScale = 1 + (tickPulse * 0.15);
      const barWidth = 18 * pulseScale;
      const barLength = 70 * pulseScale;
      const innerRadius = 25;

      ctx.save();
      ctx.translate(centerX, centerY);

      // Pulse ring effect when second ticks
      if (tickPulse > 0) {
        const ringRadius = innerRadius + 50 + (80 * (1 - tickPulse));
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 4 * tickPulse;
        ctx.globalAlpha = tickPulse * 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw three interlocking L-shaped bars rotating at different speeds
      const bars = [
        { color: COLORS.black, angleOffset: 0, speed: 6 },
        { color: COLORS.red, angleOffset: Math.PI * 2 / 3, speed: 9 },
        { color: '#D4C36A', angleOffset: Math.PI * 4 / 3, speed: 4.5 }
      ];

      bars.forEach((bar, i) => {
        ctx.save();
        ctx.rotate(baseAngle * bar.speed + bar.angleOffset);
        ctx.fillStyle = bar.color;

        // Draw L-shape: vertical bar
        ctx.fillRect(-barWidth / 2, -barLength - innerRadius, barWidth, barLength);

        // Draw L-shape: horizontal bar extending right
        ctx.fillRect(-barWidth / 2, -innerRadius - barWidth, barLength, barWidth);

        ctx.restore();
      });

      // Central ring (black outer, white inner - like the abstract)
      const ringPulse = 1 + (tickPulse * 0.1);
      ctx.beginPath();
      ctx.arc(0, 0, (innerRadius + 8) * ringPulse, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.black;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, (innerRadius - 5) * ringPulse, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.white;
      ctx.fill();

      ctx.restore();
    }

    drawBauhausAbstract(ctx, centerX, centerY, time) {
      // Spinning overlapping circles - ms, seconds, hours
      // Each fills to 100% when reaching full unit

      ctx.save();
      ctx.translate(centerX, centerY);

      // Determine colors based on settings
      let color1, color2, color3;

      if (this.settings.useTimeColors) {
        // Time-of-day color palettes
        const hour = time.hours;
        if (hour >= 5 && hour < 8) {
          // Dawn - soft oranges, pinks
          color1 = '#E57373';
          color2 = '#FFB74D';
          color3 = '#2D2D2D';
        } else if (hour >= 8 && hour < 17) {
          // Day - bold primary colors
          color1 = '#C41E3A';
          color2 = '#D4C36A';
          color3 = COLORS.black;
        } else if (hour >= 17 && hour < 20) {
          // Dusk - purples, warm oranges
          color1 = '#E64A19';
          color2 = '#7E57C2';
          color3 = '#1A1A2E';
        } else {
          // Night - deep blues, teals
          color1 = '#1E88E5';
          color2 = '#26A69A';
          color3 = '#0D1B2A';
        }
      }

      // Override with custom colors if set
      color1 = this.settings.msColor || color1 || '#C41E3A';
      color2 = this.settings.secColor || color2 || '#D4C36A';
      color3 = this.settings.hourColor || color3 || COLORS.black;

      // Calculate progress for each layer (0 to 1)
      const msProgress = time.ms / 1000;
      const secProgress = (time.seconds + msProgress) / 60;
      const hourProgress = ((time.hours % 12) + time.minutes / 60) / 12;

      // Rotation based on time for dynamic spinning effect
      const msRotation = msProgress * Math.PI * 2;
      const secRotation = secProgress * Math.PI * 2;
      const hourRotation = hourProgress * Math.PI * 2;

      // Circle sizes
      const hourRadius = 85;
      const secRadius = 55;
      const msRadius = 30;
      const strokeWidth = 18;

      // Draw hour shape (outermost) - completes every 12 hours
      if (this.settings.showHours) {
        this.drawShapeProgress(
          ctx,
          this.settings.hourShape,
          hourRadius,
          hourProgress,
          strokeWidth,
          color3,
          hourRotation - Math.PI / 2
        );
      }

      // Draw seconds shape (middle) - completes every 60 seconds
      if (this.settings.showSeconds) {
        this.drawShapeProgress(
          ctx,
          this.settings.secShape,
          secRadius,
          secProgress,
          strokeWidth,
          color2,
          secRotation - Math.PI / 2
        );
      }

      // Draw milliseconds shape (innermost) - completes every second
      if (this.settings.showMilliseconds) {
        this.drawShapeProgress(
          ctx,
          this.settings.msShape,
          msRadius,
          msProgress,
          strokeWidth,
          color1,
          msRotation - Math.PI / 2
        );
      }

      // Center dot (use first visible color)
      const dotColor = this.settings.showMilliseconds ? color1 :
                       this.settings.showSeconds ? color2 :
                       this.settings.showHours ? color3 : COLORS.black;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();

      ctx.restore();
    }

    drawSecondsIndicator(ctx, centerX, centerY, time) {
      // Small tick marks around the mechanism
      const radius = 100;
      ctx.save();
      ctx.translate(centerX, centerY);

      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const isCurrentSecond = i === time.seconds;
        const isFiveSecond = i % 5 === 0;

        const innerR = isCurrentSecond ? radius - 15 : (isFiveSecond ? radius - 8 : radius - 4);
        const outerR = radius;

        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);

        if (isCurrentSecond) {
          ctx.strokeStyle = COLORS.red;
          ctx.lineWidth = 3;
        } else if (isFiveSecond) {
          ctx.strokeStyle = COLORS.black;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,0.2)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }

      ctx.restore();
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

      // Main time display (current selected city)
      const mainTime = getTimeForTimezone(this.selectedCity.tz);
      const formatted = formatTime(mainTime.hours, mainTime.minutes);

      // Trigger pulse on second change
      if (mainTime.seconds !== this.lastSecond) {
        this.lastSecond = mainTime.seconds;
        this.tickPulse = 1.0;  // Start pulse at full
      }

      // Decay pulse (slower for more visible animation)
      if (this.tickPulse > 0) {
        this.tickPulse = Math.max(0, this.tickPulse - 0.04);
      }

      // Draw Bauhaus abstract animation (left side)
      this.drawBauhausAbstract(ctx, 120, HEIGHT / 2, mainTime);

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

const STORAGE_KEY = "activity-wheel.activities";

const DEFAULT_ACTIVITIES = [
  "Bike ride",
  "Draw together",
  "Dance party",
  "Read a story",
  "Puzzle time",
  "Play outside",
  "Build with blocks",
  "Treasure hunt",
];

const SEGMENT_COLORS = [
  "#ff6b6b",
  "#ffd166",
  "#06d6a0",
  "#4cc9f0",
  "#f72585",
  "#ff9f1c",
  "#9b5de5",
  "#43aa8b",
  "#577590",
  "#ef476f",
];

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const result = document.getElementById("result");
const activityInput = document.getElementById("activityInput");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");
const saveStatus = document.getElementById("saveStatus");

let activities = loadActivities();
let rotation = 0;
let isSpinning = false;

function loadActivities() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_ACTIVITIES];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_ACTIVITIES];
    }

    const cleaned = parsed
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 24);

    return cleaned.length > 1 ? cleaned : [...DEFAULT_ACTIVITIES];
  } catch {
    return [...DEFAULT_ACTIVITIES];
  }
}

function saveActivities(nextActivities) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextActivities));
}

function syncTextarea() {
  activityInput.value = activities.join("\n");
}

function setStatus(message) {
  saveStatus.textContent = message;
}

function fitCanvasForDisplay() {
  const rect = canvas.getBoundingClientRect();
  const size = Math.max(320, Math.floor(Math.min(rect.width, rect.height)));
  const ratio = window.devicePixelRatio || 1;

  canvas.width = size * ratio;
  canvas.height = size * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawWheel(rotation);
}

function drawWheel(angle) {
  const size = canvas.width / (window.devicePixelRatio || 1);
  const center = size / 2;
  const radius = center - 12;
  const sliceAngle = (Math.PI * 2) / activities.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(angle);

  for (let i = 0; i < activities.length; i += 1) {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    ctx.fill();

    ctx.save();
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fffaf0";
    ctx.font = `600 ${Math.max(15, radius * 0.07)}px Fredoka`;
    wrapArcText(activities[i], radius - 22);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(255, 250, 240, 0.92)";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = "#fff7e8";
  ctx.fill();
  ctx.restore();
}

function wrapArcText(label, textRadius) {
  const words = label.split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= 14) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  const lineHeight = 20;
  const offset = ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, textRadius, index * lineHeight - offset + 6);
  });
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function getSelectedIndex(finalRotation) {
  const sliceAngle = (Math.PI * 2) / activities.length;
  const normalized = ((Math.PI * 1.5 - finalRotation) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  return Math.floor(normalized / sliceAngle) % activities.length;
}

function spinWheel() {
  if (isSpinning || activities.length < 2) {
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  result.textContent = "Spinning...";

  const extraSpins = 5 + Math.random() * 3;
  const targetRotation = rotation + extraSpins * Math.PI * 2 + Math.random() * Math.PI * 2;
  const startRotation = rotation;
  const duration = 4400;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    rotation = startRotation + (targetRotation - startRotation) * eased;
    drawWheel(rotation);

    if (progress < 1) {
      window.requestAnimationFrame(animate);
      return;
    }

    rotation = targetRotation % (Math.PI * 2);
    drawWheel(rotation);
    const selectedIndex = getSelectedIndex(rotation);
    result.textContent = activities[selectedIndex];
    spinButton.disabled = false;
    isSpinning = false;
  }

  window.requestAnimationFrame(animate);
}

function parseActivityInput() {
  return activityInput.value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function handleSave() {
  const nextActivities = parseActivityInput();

  if (nextActivities.length < 2) {
    setStatus("Please add at least 2 activities.");
    return;
  }

  activities = nextActivities;
  saveActivities(activities);
  rotation = 0;
  drawWheel(rotation);
  result.textContent = "Tap spin to choose";
  setStatus("Saved on this device.");
}

function handleReset() {
  activities = [...DEFAULT_ACTIVITIES];
  saveActivities(activities);
  syncTextarea();
  rotation = 0;
  drawWheel(rotation);
  result.textContent = "Tap spin to choose";
  setStatus("Default activities restored.");
}

spinButton.addEventListener("click", spinWheel);
saveButton.addEventListener("click", handleSave);
resetButton.addEventListener("click", handleReset);
window.addEventListener("resize", fitCanvasForDisplay);

syncTextarea();
fitCanvasForDisplay();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

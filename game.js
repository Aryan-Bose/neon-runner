const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= RESIZE ================= */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ================= STATE ================= */
let state = "start"; // start | play | pause | gameover
let difficulty = null;
let gravity = 0.9;
let baseSpeed = 5;
let speed = 5;
let score = 0;
let frame = 0;
let gameOver = false;

/* ================= STORAGE ================= */
let highScore = parseInt(localStorage.getItem("nr_high")) || 0;

/* ================= AUDIO ================= */
const sounds = {
  jump: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-soft-jump-arcade-214.mp3"),
  land: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3"),
  hit: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3")
};
let muted = false;
function playSound(n) {
  if (muted) return;
  const s = sounds[n];
  s.currentTime = 0;
  s.play().catch(() => {});
}

/* ================= STARS ================= */
const stars = [];
for (let i = 0; i < 120; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.6,
    r: Math.random() * 1.5 + 0.5,
    s: Math.random() * 0.3 + 0.1
  });
}

/* ================= PLAYER ================= */
const groundY = () => canvas.height - 120;
const player = {
  x: 140,
  y: groundY(),
  vy: 0,
  jumps: 2
};

/* ================= ROAD ================= */
let roadOffset = 0;
function drawRoad() {
  const y = groundY() + 40;
  ctx.fillStyle = "#111";
  ctx.fillRect(0, y, canvas.width, canvas.height - y);

  roadOffset -= speed;
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.moveTo(i + (roadOffset % 40), y + 30);
    ctx.lineTo(i + 20 + (roadOffset % 40), y + 30);
  }
  ctx.stroke();
}

/* ================= OBSTACLES ================= */
const obstacles = [];
function spawnObstacle() {
  if (state !== "play") return;
  const shapes = [
    { w: 30, h: 30 },
    { w: 40, h: 60 },
    { w: 70, h: 40 },
    { w: 20, h: 80 }
  ];
  const t = shapes[Math.floor(Math.random() * shapes.length)];
  obstacles.push({
    x: canvas.width + 40,
    y: groundY() - t.h + 20,
    w: t.w,
    h: t.h,
    passed: false
  });
}
setInterval(spawnObstacle, 1400);

/* ================= BUILDINGS ================= */
const farBuildings = [];
const nearBuildings = [];

function createBuildings(arr, width, minH, maxH) {
  for (let x = 0; x < canvas.width + 400; x += width + 40) {
    arr.push({
      x,
      width,
      h: minH + Math.random() * (maxH - minH),
      billboard: Math.random() < 0.3
    });
  }
}
createBuildings(farBuildings, 80, 180, 260);
createBuildings(nearBuildings, 60, 140, 220);

let cityFarOffset = 0;
let cityNearOffset = 0;

/* ================= INPUT ================= */
function jump() {
  if (state === "play" && player.jumps > 0) {
    player.vy = -20;
    player.jumps--;
    playSound("jump");
  }
}

window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    if (state === "gameover") resetGame();
    else jump();
  }
  if (e.code === "KeyP" && state === "play") state = "pause";
  else if (e.code === "KeyP" && state === "pause") state = "play";
  if (e.code === "KeyM") muted = !muted;
});

canvas.addEventListener("touchstart", () => {
  if (state === "gameover") resetGame();
  else if (state === "play") jump();
});

/* ================= BUTTONS ================= */
const easyBtn = { x: 0, y: 0, w: 160, h: 50 };
const hardBtn = { x: 0, y: 0, w: 160, h: 50 };

canvas.addEventListener("click", e => {
  if (state !== "start") return;
  const mx = e.offsetX, my = e.offsetY;
  if (inside(mx, my, easyBtn)) startGame("easy");
  if (inside(mx, my, hardBtn)) startGame("hard");
});

function inside(x, y, b) {
  return x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
}

/* ================= GAME FLOW ================= */
function startGame(mode) {
  difficulty = mode;
  baseSpeed = mode === "hard" ? 7 : 5;
  speed = baseSpeed;
  score = 0;
  obstacles.length = 0;
  player.y = groundY();
  player.vy = 0;
  player.jumps = 2;
  gameOver = false;
  state = "play";
}

function resetGame() {
  highScore = Math.max(highScore, score);
  localStorage.setItem("nr_high", highScore);
  state = "start";
}

/* ================= DRAW HELPERS ================= */
function drawStars() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    if (state === "play") {
      s.x -= s.s;
      if (s.x < 0) s.x = canvas.width;
    }
  }
}

function drawMoon() {
  ctx.fillStyle = "#ddd";
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(canvas.width - 120, 100, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBuildings(arr, offset, color, speedMul) {
  offset -= speed * speedMul;
  for (const b of arr) {
    const bx = b.x + (offset % (canvas.width + 400));
    ctx.fillStyle = color;
    ctx.fillRect(bx, canvas.height - b.h, b.width, b.h);

    for (let y = canvas.height - b.h + 20; y < canvas.height - 20; y += 18) {
      for (let x = bx + 10; x < bx + b.width - 10; x += 18) {
        ctx.fillStyle = "#ffe066";
        ctx.fillRect(x, y, 6, 8);
      }
    }

    if (b.billboard) {
      ctx.fillStyle = "#0ff";
      ctx.shadowColor = "#0ff";
      ctx.shadowBlur = 15;
      ctx.fillRect(bx + 10, canvas.height - b.h + 30, b.width - 20, 18);
      ctx.shadowBlur = 0;
    }
  }
  return offset;
}

/* ================= RUNNER ================= */
function drawRunner() {
  const c = `hsl(${(score * 20) % 360},100%,60%)`;
  const bodyY = player.y - 26;
  const cycle = Math.sin(frame * 0.25);

  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(player.x, bodyY - 14, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x + 3, bodyY - 18, 2, 2);
  ctx.fillRect(player.x + 7, bodyY - 18, 2, 2);

  ctx.fillStyle = c;
  ctx.fillRect(player.x - 2, bodyY, 4, 26);

  ctx.strokeStyle = c;
  ctx.lineWidth = 3;

  // arms
  ctx.beginPath();
  ctx.moveTo(player.x, bodyY + 6);
  ctx.lineTo(player.x - 12 - cycle * 10, bodyY + 14);
  ctx.moveTo(player.x, bodyY + 6);
  ctx.lineTo(player.x + 12 + cycle * 10, bodyY + 14);
  ctx.stroke();

  // legs
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x - 10 + cycle * 12, player.y + 20);
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + 10 - cycle * 12, player.y + 20);
  ctx.stroke();
}

/* ================= BUTTON DRAW ================= */
function drawButton(b, text, color) {
  const pulse = Math.sin(frame * 0.1) * 6;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 20 + pulse;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#000";
  ctx.font = "20px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(text, b.x + b.w / 2, b.y + 32);
  ctx.textAlign = "left";
}

/* ================= MAIN LOOP ================= */
function update() {
  frame++;
  drawStars();
  drawMoon();

  cityFarOffset = drawBuildings(farBuildings, cityFarOffset, "#0a132a", 0.15);
  cityNearOffset = drawBuildings(nearBuildings, cityNearOffset, "#121f44", 0.35);

  if (state === "start") {
    ctx.fillStyle = "#0ff";
    ctx.font = "42px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("NEON RUNNER", canvas.width / 2, canvas.height / 2 - 100);

    easyBtn.x = canvas.width / 2 - 180;
    easyBtn.y = canvas.height / 2;
    hardBtn.x = canvas.width / 2 + 20;
    hardBtn.y = canvas.height / 2;

    drawButton(easyBtn, "EASY", "#00ff88");
    drawButton(hardBtn, "HARD", "#ff4466");

    ctx.font = "16px Segoe UI";
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 80);
    ctx.textAlign = "left";
  }

  if (state === "play") {
    speed = baseSpeed + score * (difficulty === "hard" ? 0.25 : 0.15);

    player.vy += gravity;
    player.y += player.vy;
    if (player.y >= groundY()) {
      if (player.jumps < 2) playSound("land");
      player.y = groundY();
      player.vy = 0;
      player.jumps = 2;
    }

    drawRunner();

    obstacles.forEach(o => {
      o.x -= speed;
      ctx.fillStyle = "#ff00ff";
      ctx.fillRect(o.x, o.y, o.w, o.h);

      if (
        player.x - 10 < o.x + o.w &&
        player.x + 10 > o.x &&
        player.y + 10 > o.y &&
        player.y - 40 < o.y + o.h
      ) {
        gameOver = true;
        playSound("hit");
        state = "gameover";
      }

      if (!o.passed && o.x + o.w < player.x && player.y < groundY()) {
        score++;
        o.passed = true;
      }
    });

    drawRoad();

    ctx.fillStyle = "#0ff";
    ctx.font = "20px Segoe UI";
    ctx.fillText(`Score: ${score}`, 30, 40);
    ctx.fillText(`Mode: ${difficulty}`, 30, 65);
    ctx.fillText(`High: ${highScore}`, 30, 90);
  }

  if (state === "gameover") {
    highScore = Math.max(highScore, score);
    localStorage.setItem("nr_high", highScore);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f44";
    ctx.font = "40px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.font = "18px Segoe UI";
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText("Tap / Space to Restart", canvas.width / 2, canvas.height / 2 + 70);
    ctx.textAlign = "left";
  }

  requestAnimationFrame(update);
}

update();

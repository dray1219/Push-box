const DIRS = { w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1] };
let map, player, box, goal;
let originalPlayer, originalBox;
let startTime, steps = 0;
let gameEnded = false;
let perfectSteps = 0;  
let currentDifficulty = 'medium';
let levelProgress = { easy: 1, medium: 1, hard: 1 };
let currentLevel = levelProgress[currentDifficulty] || 1;
let lastTouchEnd = 0;
if (localStorage.getItem('levelProgress')) {
  try {
    const stored = JSON.parse(localStorage.getItem('levelProgress'));
    ['easy','medium','hard'].forEach(d => {
      if (stored[d] && Number.isInteger(stored[d]) && stored[d] > 0) {
        levelProgress[d] = stored[d];
      }
    });
  } catch {};
}
if (localStorage.getItem('currentDifficulty') && levelProgress[localStorage.getItem('currentDifficulty')] !== undefined) {
  currentDifficulty = localStorage.getItem('currentDifficulty');
}
function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; 
  }
  return Math.abs(hash);
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getSeed(difficulty, level) {
  return `${difficulty}-${level}`;
}


document.getElementById('backBtn').addEventListener('click', function () {
  localStorage.setItem('currentDifficulty', currentDifficulty);
  document.getElementById('gameUI').style.display = 'none';
  document.getElementById('difficultyUI').style.display = 'block';
});
function adjustButtonPosition() {
  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;

  let easyBtn = document.getElementById('easyBtn');
  let middleBtn = document.getElementById('middleBtn');
  let hardBtn = document.getElementById('hardBtn');

}

function adjustPlayButtonPosition() {
  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;
  let playBtn = document.getElementById('playBtn');

}

function showDifficultyUI() {
  document.getElementById('startUI').style.display = 'none';
  document.getElementById('difficultyUI').style.display = 'block';
}

function selectDifficulty(difficulty) {
  currentDifficulty = difficulty;
  localStorage.setItem('currentDifficulty', currentDifficulty);
  localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
  document.getElementById('difficultyUI').style.display = 'none';
  document.getElementById('gameUI').style.display = 'block';
  currentLevel = levelProgress[difficulty]; 
  startNewLevel(difficulty);
}

window.onload = function () {
  adjustButtonPosition();
  adjustPlayButtonPosition();
};

window.onresize = function () {
  adjustButtonPosition();
  adjustPlayButtonPosition();
};

function getDifficulty(steps) {
  if (steps < 15) return 'tooEasy';
  if (steps < 20) return 'easy';
  if (steps < 25) return 'medium';
  return 'hard';
}

function generateLevel(width = 7, height = 7, desiredDifficulty = currentDifficulty, rng = Math.random) {
  while (true) {
    let board = Array.from({ length: height }, () => Array(width).fill('.'));
    for (let i = 0; i < height; i++) 
      board[i][0] = board[i][width - 1] = '#';
    for (let j = 0; j < width; j++) 
      board[0][j] = board[height - 1][j] = '#';

    let empty = [];
    for (let i = 1; i < height - 1; i++) {
      for (let j = 1; j < width - 1; j++) {
        empty.push([i, j]);
      }
    }

    shuffle(empty, rng);
    player = empty.pop();
    box = empty.pop();
    goal = empty.pop();
    let wallsCount = Math.floor(rng() * 6 + 3);
    for (let i = 0; i < wallsCount; i++) {
      const [x, y] = empty.pop();
      if (!(samePos([x, y], player) || samePos([x, y], box) || samePos([x, y], goal))) {
        board[x][y] = '#';
      }
    }

    if (isSolvable(board, player, box, goal)) {
      const steps = computeMinimumSteps(board, player, box, goal);
      const levelDifficulty = getDifficulty(steps);
      if (levelDifficulty === desiredDifficulty) {
        perfectSteps = steps;
        return board;
      }
    }
  }
}

function shuffle(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function samePos(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function isSolvable(board, player, box, goal) {
  const h = board.length, w = board[0].length;
  const q = [[player, box]];
  const seen = new Set();

  while (q.length) {
    const [[px, py], [bx, by]] = q.shift();
    const key = `${px},${py},${bx},${by}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (bx === goal[0] && by === goal[1]) return true;

    for (const [dx, dy] of Object.values(DIRS)) {
      const nbx = bx + dx, nby = by + dy;
      const ppx = bx - dx, ppy = by - dy;
      if (!inBounds(nbx, nby, w, board.length) || !inBounds(ppx, ppy, w, board.length)) continue;
      if (board[nbx][nby] === '#' || board[ppx][ppy] === '#') continue;
      if (!canReach(board, [px, py], [ppx, ppy], [bx, by])) continue;
      q.push([[bx, by], [nbx, nby]]);
    }
  }
  return false;
}

function canReach(board, start, end, box) {
  const h = board.length, w = board[0].length;
  const q = [start];
  const seen = new Set();

  while (q.length) {
    const [x, y] = q.shift();
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (x === end[0] && y === end[1]) return true;

    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = x + dx, ny = y + dy;
      if (!inBounds(nx, ny, w, h)) continue;
      if (board[nx][ny] === '#' || (nx === box[0] && ny === box[1])) continue;
      q.push([nx, ny]);
    }
  }
  return false;
}

function inBounds(x, y, w, h) {
  return x >= 0 && x < h && y >= 0 && y < w;
}

function computeMinimumSteps(board, player, box, goal) {
  const h = board.length, w = board[0].length;
  const seen = new Set();
  const queue = [];
  queue.push({ px: player[0], py: player[1], bx: box[0], by: box[1], steps: 0 });
  
  while (queue.length) {
    const state = queue.shift();
    const { px, py, bx, by, steps: cost } = state;
    if (bx === goal[0] && by === goal[1]) return cost;
    
    const key = `${px},${py},${bx},${by}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (let d in DIRS) {
      const [dx, dy] = DIRS[d];
      const npx = px + dx, npy = py + dy;
      if (!inBounds(npx, npy, w, h) || board[npx][npy] === '#') continue;
      if (npx === bx && npy === by) {
        const nbx = bx + dx, nby = by + dy;
        if (!inBounds(nbx, nby, w, h) || board[nbx][nby] === '#') continue;
        queue.push({ px: npx, py: npy, bx: nbx, by: nby, steps: cost + 1 });
      } else {
        queue.push({ px: npx, py: npy, bx: bx, by: by, steps: cost + 1 });
      }
    }
  }
  return Infinity;
}

function draw() {
  const game = document.getElementById('game');
  game.innerHTML = '<table>' + map.map((row, i) => '<tr>' + row.map((cell, j) => {
    let cls = 'empty', val = '';
    if (cell === '#') cls = 'wall';
    else if (i === player[0] && j === player[1]) cls = 'player';
    else if (i === box[0] && j === box[1]) cls = 'box';
    else if (i === goal[0] && j === goal[1]) cls = 'goal';
    return `<td class="${cls}">${val}</td>`;
  }).join('') + '</tr>').join('') + '</table>';
  
  const remaining = Math.max(0, perfectSteps - steps);
  if (document.getElementById('stepLimit'))
    document.getElementById('stepLimit').innerText = `剩餘步數：${remaining}`;
}

function move(dir) {
  if (gameEnded) return;

  const [dx, dy] = DIRS[dir];
  const [px, py] = player;
  const nx = px + dx, ny = py + dy;

  if (nx === box[0] && ny === box[1]) {
    const bx = box[0] + dx, by = box[1] + dy;
    if (map[bx][by] !== '#' && !samePos([bx, by], player)) {
      player = [nx, ny];
      box = [bx, by];
      steps++;
    }
  } else if (map[nx][ny] !== '#') {
    player = [nx, ny];
    steps++;
  }

  draw();
  if (samePos(box, goal)) {
    const timeUsed = ((Date.now() - startTime) / 1000).toFixed(2);
    document.getElementById('info').innerText = `過關！用時：${timeUsed} 秒`;
    document.getElementById('nextBtn').style.display = 'inline-block';
    document.getElementById('resetBtn').style.display = 'none';
    gameEnded = true;
    levelProgress[currentDifficulty]=++currentLevel;
    localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
  }

  const remaining = Math.max(0, perfectSteps - steps);

  if (remaining <= 0 && !samePos(box, goal)) {
    document.getElementById('info').innerText = "遊戲失敗，步數用完了！";
    document.getElementById('resetBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'none';
    gameEnded = true;
  }
  
}

function resetLevel() {
  if (gameEnded && samePos(box, goal)) return;

  player = [...originalPlayer];
  box = [...originalBox];
  steps = 0;
  gameEnded = false;
  draw();
  document.getElementById('info').innerText = '';
  document.getElementById('nextBtn').style.display = 'none';
  document.getElementById('resetBtn').style.display = 'inline-block';
}

function startNewLevel() {
  const rawSeed = getSeed(currentDifficulty, currentLevel);
  const numericSeed = stringToSeed(rawSeed);
  const rng = mulberry32(numericSeed);
  map = generateLevel(7, 7, currentDifficulty, rng);
  originalPlayer = [...player];
  originalBox = [...box];
  steps = 0;
  gameEnded = false;
  startTime = Date.now();
  draw();
  document.getElementById('info').innerText = '';
  document.getElementById('nextBtn').style.display = 'none';
  document.getElementById('resetBtn').style.display = 'inline-block';
  document.getElementById('levelIndicator').textContent = `關卡：${currentLevel}`;
}

document.addEventListener('keydown', e => {
  if (DIRS[e.key]) {
    move(e.key);
  } else if (gameEnded && samePos(box, goal)) {
    if (e.key === 'Enter' || e.key === ' '){
      startNewLevel(); 
    }
  } else if (e.key === 'r' || e.key === 'R') {
    if (!gameEnded || !samePos(box, goal)) {
      resetLevel();
    }
  }
});

document.getElementById('resetBtn').onclick = resetLevel;
document.getElementById('nextBtn').onclick = startNewLevel;

startNewLevel();

let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

document.addEventListener('touchend', e => {
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) < 30) return;

  let dir;
  if (absDx > absDy) {
    dir = dx > 0 ? 'd' : 'a';
  } else {
    dir = dy > 0 ? 's' : 'w';
  }

  if (DIRS[dir]) move(dir);
});

document.addEventListener("keydown", function (e) {
  if (e.key === "F12") {
    e.preventDefault();
  }
  if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
    e.preventDefault();
  }
  if (e.ctrlKey && e.key === "u") {
    e.preventDefault();
  }
});
document.addEventListener("contextmenu", e => e.preventDefault());
document.body.addEventListener('touchmove', function (e) {
  e.preventDefault();
}, { passive: false });

document.getElementById('settingBtn').addEventListener('click', () => {
  const devImage = document.getElementById('devImage');
  devImage.style.display = 'block';
  setTimeout(() => {
    devImage.style.display = 'none';
  }, 1500);
});

document.addEventListener('touchend', function (event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

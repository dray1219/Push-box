const DIRS = { w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1] };
let map, player, box, goal;
let originalPlayer, originalBox;
let startTime, steps = 0;
let gameEnded = false;
let perfectSteps = 0;  

function generateLevel(width = 7, height = 7) {
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

    shuffle(empty);
    player = empty.pop();
    box = empty.pop();
    goal = empty.pop();

    for (let i = 0; i < Math.floor(Math.random() * 6 + 3); i++) {
      const [x, y] = empty.pop();
      if (!(samePos([x, y], player) || samePos([x, y], box) || samePos([x, y], goal))) {
        board[x][y] = '#';
      }
    }

    if (isSolvable(board, player, box, goal)) {
      perfectSteps = computeMinimumSteps(board, player, box, goal);
      return board;
    }
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
    document.getElementById('info').innerText = `✅ 過關！用時：${timeUsed} 秒，步數：${steps}`;
    document.getElementById('nextBtn').style.display = 'inline-block';
    document.getElementById('resetBtn').style.display = 'none';
    gameEnded = true;
  }

  const remaining = Math.max(0, perfectSteps - steps);
  
  if (remaining <= 0 && !samePos(box, goal)) {
    document.getElementById('info').innerText = "❌ 遊戲失敗，步數用完了！";
    document.getElementById('resetBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'none';
    gameEnded = true;
  }
  
}

function resetLevel() {
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
  map = generateLevel();
  originalPlayer = [...player];
  originalBox = [...box];
  steps = 0;
  gameEnded = false;
  startTime = Date.now();
  draw();
  document.getElementById('info').innerText = '';
  document.getElementById('nextBtn').style.display = 'none';
  document.getElementById('resetBtn').style.display = 'inline-block';
}

document.addEventListener('keydown', e => {
  if (DIRS[e.key]) move(e.key);
});

// 若有手機操控可啟用以下註解區
// document.getElementById('openControl').onclick = () => {
//   const ctrl = document.getElementById('mobileControl');
//   ctrl.style.display = ctrl.style.display === 'flex' ? 'none' : 'flex';
// };
// document.querySelectorAll('.control button').forEach(btn => {
//   btn.addEventListener('click', () => move(btn.dataset.dir));
// });

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

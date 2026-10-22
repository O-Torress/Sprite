const player = document.getElementById('player');
const gameScreen = document.getElementById('game-screen');

const monX = document.getElementById('mon-x');
const monY = document.getElementById('mon-y');
const monDir = document.getElementById('mon-dir');
const monState = document.getElementById('mon-state');
const monBgPos = document.getElementById('mon-bgpos');

const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

const SPEED       = 3;
const PLAYER_SIZE = 48;

const DIR_CLASS = {
  down:  'look-down',
  left:  'look-left',
  right: 'look-right',
  up:    'look-up',
};

const DIR_LABEL = {
  down:  'abajo',
  left:  'izquierda',
  right: 'derecha',
  up:    'arriba',
};

const DIR_BG_Y = {
  down:  '0px',
  left:  '-48px',
  right: '-96px',
  up:    '-144px',
};

let posX      = 0;
let posY      = 0;
let direction = 'down';
let isMoving  = false;

const keys = { up: false, down: false, left: false, right: false };

function keyToDirection(code) {
  switch (code) {
    case 'ArrowUp':    case 'KeyW': return 'up';
    case 'ArrowDown':  case 'KeyS': return 'down';
    case 'ArrowLeft':  case 'KeyA': return 'left';
    case 'ArrowRight': case 'KeyD': return 'right';
    default: return null;
  }
}

document.addEventListener('keydown', (e) => {
  const dir = keyToDirection(e.code);
  if (dir) {
    e.preventDefault();
    keys[dir] = true;
  }
});

document.addEventListener('keyup', (e) => {
  const dir = keyToDirection(e.code);
  if (dir) {
    keys[dir] = false;
  }
});

function bindDpadButton(btn, dir) {
  const press   = () => { keys[dir] = true;  btn.classList.add('pressed'); };
  const release = () => { keys[dir] = false; btn.classList.remove('pressed'); };

  btn.addEventListener('mousedown',  press);
  btn.addEventListener('mouseup',    release);
  btn.addEventListener('mouseleave', release);

  btn.addEventListener('touchstart',  (e) => { e.preventDefault(); press(); },   { passive: false });
  btn.addEventListener('touchend',    (e) => { e.preventDefault(); release(); }, { passive: false });
  btn.addEventListener('touchcancel', (e) => { e.preventDefault(); release(); }, { passive: false });
}

bindDpadButton(btnUp,    'up');
bindDpadButton(btnDown,  'down');
bindDpadButton(btnLeft,  'left');
bindDpadButton(btnRight, 'right');

function getMapLimits() {
  return {
    maxX: gameScreen.offsetWidth  - PLAYER_SIZE,
    maxY: gameScreen.offsetHeight - PLAYER_SIZE,
  };
}

function getActiveDirection() {
  if (keys.up)    return 'up';
  if (keys.down)  return 'down';
  if (keys.left)  return 'left';
  if (keys.right) return 'right';
  return null;
}

function updatePlayerClasses() {
  player.classList.remove('look-down', 'look-left', 'look-right', 'look-up');
  player.classList.add(DIR_CLASS[direction]);

  if (isMoving) {
    player.classList.remove('idle');
    player.classList.add('walking');
  } else {
    player.classList.remove('walking');
    player.classList.add('idle');
  }
}

function updateMonitor() {
  const computed = window.getComputedStyle(player);
  const bgPosX   = computed.backgroundPositionX || '0px';
  const bgPosY   = DIR_BG_Y[direction];

  monX.textContent     = Math.round(posX) + 'px';
  monY.textContent     = Math.round(posY) + 'px';
  monDir.textContent   = DIR_LABEL[direction];
  monState.textContent = isMoving ? 'walking' : 'idle';
  monBgPos.textContent = `${bgPosX} ${bgPosY}`;
}

function gameLoop() {
  const activeDir = getActiveDirection();
  const { maxX, maxY } = getMapLimits();

  if (activeDir) {
    isMoving  = true;
    direction = activeDir;

    let newX = posX;
    let newY = posY;

    if (activeDir === 'up')    newY -= SPEED;
    if (activeDir === 'down')  newY += SPEED;
    if (activeDir === 'left')  newX -= SPEED;
    if (activeDir === 'right') newX += SPEED;

    posX = Math.max(0, Math.min(newX, maxX));
    posY = Math.max(0, Math.min(newY, maxY));

    player.style.left = posX + 'px';
    player.style.top  = posY + 'px';
  } else {
    isMoving = false;
  }

  updatePlayerClasses();
  updateMonitor();
  requestAnimationFrame(gameLoop);
}

function init() {
  const { maxX, maxY } = getMapLimits();
  posX = Math.floor(maxX / 2);
  posY = Math.floor(maxY / 2);

  player.style.left = posX + 'px';
  player.style.top  = posY + 'px';

  updatePlayerClasses();
  requestAnimationFrame(gameLoop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

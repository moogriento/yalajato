import '../css/main.css';
import '../img/background.jpg';
import '../img/bug.png';
import '../img/dev.png';
import '../img/favicon.ico';
import '../img/player.png';
import '../img/rage.webp';
import '../img/win.png';

const KEY_CODE_LEFT = 37;
const KEY_CODE_RIGHT = 39;
const KEY_CODE_UP = 38;
const KEY_CODE_DOWN = 40;
const KEY_CODE_SPACE = 32;

const GAME_WIDTH = 800; // maybe read from layout
const GAME_HEIGHT = 600; // maybe read from layout

const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 85;
const PLAYER_MAX_SPEED = 300.0;

const BUG_WIDTH = 24;
const BUG_HEIGHT = 24;
const BUG_MAX_SPEED = 400.0;
const BUG_COOLDOWN = 0.2; // seconds

const TOP = 0;
const RIGHT = 1;
const BOTTOM = 2;
const LEFT = 3;

const GAME_LENGTH = 30; // seconds
const GAME_MINUTES = 9 * 60; // 9 hours * 60 minutes

let GAME_STATE = {};

let $container = null;
let $player = null;
let $gameClock = null;
let gameTimer = 0;
let gameSeconds = 0;

// from 8 to 5 survive = 9 hours = 9 * 60 minutes

function resetState() {
  return {
    lastTime: Date.now(),
    leftPressed: false,
    rightPressed: false,
    upPressed: false,
    downPressed: false,
    playerX: 0,
    playerY: 0,
    bugCooldown: 0,
    bugs: [],
    gameOver: false,
  }
}

function clearDOM($container) {
  const bugs = document.querySelectorAll('.bug');

  for(let i = 0; i < bugs.length; i++) {
    $container.removeChild(bugs[i]);
  }

  const player = document.querySelector('.player');

  if (player) {
    $container.removeChild(player);
  }
}

function initGame() {
  window.removeEventListener('keydown', onKeyDownInitGame);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  GAME_STATE = resetState();

  gameTimer = Date.now();
  $container = document.getElementById('game-container');
  $gameClock = document.getElementById('game-clock');

  clearDOM($container);

  $player = createPlayer($container);

  window.requestAnimationFrame(gameLoop);
}

function getPlayer() {
  return $player;
}

function getContainer() {
  return $container;
}

function createPlayer($container) {
  GAME_STATE.playerX = GAME_WIDTH / 2 - PLAYER_WIDTH; // TODO: CENTER THE SHIT MAN
  GAME_STATE.playerY = GAME_HEIGHT / 2 - PLAYER_HEIGHT;

  const $player = document.createElement('img');
  $player.src = 'img/player.png';
  $player.className = 'player';
  $container.appendChild($player);
  setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
  
  return $player;
}

function Bug($element, position, x, y, heading, delta, speed) {
  this.$element = $element;
  this.position = position;
  this.x = x;
  this.y = y;
  this.heading = heading;
  this.delta = delta;
  this.speed = speed;
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function getRnd(min, max) {
  return Math.random() * (max - min + 1) + min;
}

function getStartingBugProps() {
  let x;
  let y;

  const position = getRndInteger(0, 3);
  const delta = getRnd(0, 2);
  const randomX = getRndInteger(0, GAME_WIDTH);
  const randomY = getRndInteger(0, GAME_HEIGHT);
  const speed = getRndInteger(BUG_MAX_SPEED / 2, BUG_MAX_SPEED);
  const heading = getRndInteger(-1, 1);

  switch(position) {
    case TOP:
      x = randomX;
      y = -BUG_HEIGHT;
      break;
    case RIGHT:
      x = GAME_WIDTH + BUG_WIDTH;
      y = randomY;
      break;
    case BOTTOM:
      x = randomX;
      y = GAME_HEIGHT + BUG_HEIGHT;
      break;
    case LEFT:
      x = -BUG_WIDTH;
      y = randomY;
      break;
  }

  return {
    x,
    y,
    position,
    delta,
    speed,
    heading,
  };
}

function createBug($container) {
  const $element = document.createElement('img');
  $element.src = 'img/bug.png';
  $element.className = 'bug';

  const {
    x,
    y,
    position,
    delta,
    speed,
    heading,
  } = getStartingBugProps();

  $container.appendChild($element);

  const bug = new Bug($element, position, x, y, heading, delta, speed);
  GAME_STATE.bugs.push(bug);
  // TODO: audio!
  setPosition($element, x, y);
}

function setPosition(el, x, y) {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function clampPlayer(v, min, max) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

function updatePlayer(dt) {
  if (GAME_STATE.leftPressed) {
    GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
  }
  if (GAME_STATE.rightPressed) {
    GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
  }
  if (GAME_STATE.upPressed) {
    GAME_STATE.playerY -= dt * PLAYER_MAX_SPEED;
  }
  if (GAME_STATE.downPressed) {
    GAME_STATE.playerY += dt * PLAYER_MAX_SPEED;
  }

  GAME_STATE.playerX = clampPlayer(
    GAME_STATE.playerX,
    0,
    GAME_WIDTH - PLAYER_WIDTH
  );

  GAME_STATE.playerY = clampPlayer(
    GAME_STATE.playerY,
    0,
    GAME_HEIGHT - PLAYER_HEIGHT
  );

  $player = getPlayer();
  setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
}

function updateClock() {
  const currentTime = Date.now();
  const clock = getClockHHMM(currentTime - gameTimer);

  $gameClock.innerHTML = clock;

  // TODO: SET WIN FLAG!
  if (currentTime - gameTimer >= GAME_LENGTH * 1000) {
    GAME_STATE.gameOver = true;
    setUpWin();
  }
}

function getClockHHMM(ellapsedTime) {
  const minutesInGame = (ellapsedTime * GAME_MINUTES) / (GAME_LENGTH * 1000);

  // starts at 08:00
  const hours = Math.floor(minutesInGame / 60);
  const minutes = Math.floor(minutesInGame % 60);

  if (hours >= 9) {
    return '17:00';
  }

  return `${(hours + 8).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function getBugCooldown() {
  return BUG_COOLDOWN; // TODO: can set here as random :P
}

function spawnBug(dt) {
  if (GAME_STATE.bugCooldown <= 0) {
    createBug(getContainer());
    GAME_STATE.bugCooldown = getBugCooldown();
  }
  if (GAME_STATE.bugCooldown > 0) {
    GAME_STATE.bugCooldown -= dt;
  }
}

function updateBugs(dt) {
  $container = getContainer();
  const bugs = GAME_STATE.bugs;

  for (let i = 0; i < bugs.length; i++) {
    const bug = bugs[i];

    checkBugIsGone($container, bug);
    setBugPosition(bug, dt);

    const r1 = bug.$element.getBoundingClientRect();
    const player = getPlayer();
    const r2 = player.getBoundingClientRect();

    if (rectsIntersect(r1, r2)) {
      // A bug got you
      destroyPlayer($container, player);
      setUpLose();
      break;
    }
  }

  GAME_STATE.bugs = GAME_STATE.bugs.filter(e => !e.isGone);
}

function setBugPosition(bug, dt) {
  switch (bug.position) {
    case TOP:
      bug.x += ((dt * bug.speed) + bug.delta) * bug.heading;
      bug.y += dt * bug.speed;
      break;
    case RIGHT:
      bug.x -= dt * bug.speed;
      bug.y += ((dt * bug.speed) + bug.delta) * bug.heading;
      break;
    case BOTTOM:
      bug.x += ((dt * bug.speed) + bug.delta) * bug.heading;
      bug.y -= dt * bug.speed;
      break;
    case LEFT:
      bug.x += dt * bug.speed;
      bug.y += ((dt * bug.speed) + bug.delta) * bug.heading;
      break;
  }

  setPosition(bug.$element, bug.x, bug.y);
}

function checkBugIsGone($container, bug) {
  const doubleHeight = BUG_HEIGHT * 2;
  const doubleWidth = BUG_WIDTH * 2;

  const TOP_BOUNDARY = 0 - doubleHeight;
  const RIGHT_BOUNDARY = GAME_WIDTH + doubleWidth;
  const BOTTOM_BOUNDARY = GAME_HEIGHT + doubleHeight;
  const LEFT_BOUNDARY = 0 - doubleWidth;

  // how do I know I am gone?
  if (bug.x > RIGHT_BOUNDARY
    || bug.x < LEFT_BOUNDARY
    || bug.y < TOP_BOUNDARY
    || bug.y > BOTTOM_BOUNDARY) {
    destroyBug($container, bug);
  }
}

function destroyBug($container, bug) {
  $container.removeChild(bug.$element);
  bug.isGone = true;
}

function rectsIntersect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function destroyPlayer($container, player) {
  $container.removeChild(player);
  GAME_STATE.gameOver = true;
  // TODO: audio
}

function gameLoop() {
  const currentTime = Date.now();
  const dt = (currentTime - GAME_STATE.lastTime) / 1000.0;

  if (GAME_STATE.gameOver) {
    return;
  }

  updatePlayer(dt);
  spawnBug(dt);
  updateBugs(dt);
  updateClock(dt);

  GAME_STATE.lastTime = currentTime;
  window.requestAnimationFrame(gameLoop);
}

function onKeyDown(e) {
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = true;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = true;
  } else if (e.keyCode === KEY_CODE_UP) {
    GAME_STATE.upPressed = true;
  } else if (e.keyCode === KEY_CODE_DOWN) {
    GAME_STATE.downPressed = true;
  }
}

function onKeyUp(e) {
  if (e.keyCode === KEY_CODE_LEFT) {
    GAME_STATE.leftPressed = false;
  } else if (e.keyCode === KEY_CODE_RIGHT) {
    GAME_STATE.rightPressed = false;
  } else if (e.keyCode === KEY_CODE_UP) {
    GAME_STATE.upPressed = false;
  } else if (e.keyCode === KEY_CODE_DOWN) {
    GAME_STATE.downPressed = false;
  }
}

function showView(view) {
  const VIEWS = {
    loader: document.getElementById('loader-view'),
    instructions: document.getElementById('instructions-view'),
    game: document.getElementById('game-view'),
    win: document.getElementById('win-view'),
    lose: document.getElementById('lose-view')
  };

  Object.keys(VIEWS).forEach(function(view) {
    VIEWS[view].classList.remove('show');
    VIEWS[view].classList.add('hide');
  });

  VIEWS[view].classList.remove('hide');
  VIEWS[view].classList.add('show');
}

function setUpKeydownGo() {
  window.addEventListener('keydown', onKeyDownInitGame);
}

function initApp() {
  setTimeout(function() {
    showView('instructions');
    setUpKeydownGo();
  }, 1000);
}

function onKeyDownInitGame(e){
  if (e.keyCode === KEY_CODE_SPACE) {
    showView('game');
    initGame();
  }
}

function setUpWin() {
  setTimeout(function() {
    showView('win');
    setUpKeydownGo();
  }, 2500);
}

function setUpLose() {
  setTimeout(function() {
    showView('lose');
    setUpKeydownGo();
  }, 1500);
}

function setupApp() {
  preloadImages([
    '/img/bug.png',
    '/img/dev.png',
    '/img/player.png',
    '/img/rage.webp',
    '/img/win.png',
    '/img/background.jpg'
  ], function() {
    initApp();
  });
}

function preloadImages(urls, callback){
  const toBeLoadedNumber = urls.length;
  let loadedCounter = 0;

  urls.forEach(function(url) {
    preloadImage(url, function() {
      loadedCounter++;

      if(loadedCounter == toBeLoadedNumber){
        callback();
      }
    });
  });
}

function preloadImage(url, callback){
  const img = new Image();
  img.onload = callback;
  img.src = url;
}

// Let's call it:

setupApp();

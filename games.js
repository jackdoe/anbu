// Games Variables
let currentGame = null;
let lastPlayedGame = null;
let gameInterval = null;
let gameAnimationFrame = null;

// Games Functions
function openGames() {
  document.getElementById('gamesModal').style.display = 'flex';
}

function closeGames() {
  document.getElementById('gamesModal').style.display = 'none';
  if (currentGame) {
    stopCurrentGame();
  }
  document.getElementById('gamesMenu').style.display = 'grid';
  document.getElementById('gameArea').style.display = 'none';
}

function backToMenu() {
  stopCurrentGame();
  document.getElementById('gamesMenu').style.display = 'grid';
  document.getElementById('gameArea').style.display = 'none';
  document.getElementById('mobileControls').style.display = 'none';
}

function stopCurrentGame() {
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  if (gameAnimationFrame) {
    cancelAnimationFrame(gameAnimationFrame);
    gameAnimationFrame = null;
  }
  currentGame = null;
  document.removeEventListener('keydown', snakeKeyHandler);
  document.removeEventListener('keydown', tetrisKeyHandler);
  document.removeEventListener('keydown', breakoutKeyHandler);
  document.removeEventListener('mousemove', breakoutMouseHandler);
  document.removeEventListener('click', memoryClickHandler);
  document.removeEventListener('keydown', spaceShooterKeyHandler);
  document.removeEventListener('keyup', spaceShooterKeyUpHandler);
}

function startGame(game) {
  document.getElementById('gamesMenu').style.display = 'none';
  document.getElementById('gameArea').style.display = 'block';
  currentGame = game;
  lastPlayedGame = game;

  // Show mobile controls for games that need them
  if (window.innerWidth <= 768 && (game === 'snake' || game === 'tetris')) {
    document.getElementById('mobileControls').style.display = 'flex';
  } else {
    document.getElementById('mobileControls').style.display = 'none';
  }

  if (game === 'snake') {
    initSnake();
  } else if (game === 'tetris') {
    initTetris();
  } else if (game === 'breakout') {
    initBreakout();
  } else if (game === 'memory') {
    initMemory();
  } else if (game === 'spaceshooter') {
    initSpaceShooter();
  }
}

function handleMobileControl(direction) {
  if (currentGame === 'snake') {
    if (direction === 'up' && snakeDirection !== 'down') snakeDirection = 'up';
    else if (direction === 'down' && snakeDirection !== 'up') snakeDirection = 'down';
    else if (direction === 'left' && snakeDirection !== 'right') snakeDirection = 'left';
    else if (direction === 'right' && snakeDirection !== 'left') snakeDirection = 'right';
  } else if (currentGame === 'tetris') {
    if (direction === 'left') moveTetrisPiece(-1, 0);
    else if (direction === 'right') moveTetrisPiece(1, 0);
    else if (direction === 'down') moveTetrisPiece(0, 1);
    else if (direction === 'up' || direction === 'rotate') rotateTetrisPiece();
  }
}

// Snake Game
let snake, snakeDirection, snakeFood, snakeScore, snakeCanvas, snakeCtx;

function snakeKeyHandler(e) {
  if (!currentGame || currentGame !== 'snake') return;
  const key = e.key;
  if (key === 'ArrowUp' && snakeDirection !== 'down') {
    snakeDirection = 'up';
    e.preventDefault();
  } else if (key === 'ArrowDown' && snakeDirection !== 'up') {
    snakeDirection = 'down';
    e.preventDefault();
  } else if (key === 'ArrowLeft' && snakeDirection !== 'right') {
    snakeDirection = 'left';
    e.preventDefault();
  } else if (key === 'ArrowRight' && snakeDirection !== 'left') {
    snakeDirection = 'right';
    e.preventDefault();
  }
}

function initSnake() {
  snakeCanvas = document.getElementById('gameCanvas');
  snakeCtx = snakeCanvas.getContext('2d');
  snakeCanvas.width = 400;
  snakeCanvas.height = 400;

  snake = [{ x: 10, y: 10 }];
  snakeDirection = 'right';
  snakeScore = 0;
  placeSnakeFood();

  document.getElementById('gameScore').textContent = 'Score: 0';
  document.getElementById('gameInstructions').innerHTML = '<strong>Controls:</strong> Use arrow keys to move the snake. Eat the red food to grow!';

  document.addEventListener('keydown', snakeKeyHandler);
  gameInterval = setInterval(updateSnake, 100);
}

function placeSnakeFood() {
  snakeFood = {
    x: Math.floor(Math.random() * 20),
    y: Math.floor(Math.random() * 20)
  };
}

function updateSnake() {
  const head = { x: snake[0].x, y: snake[0].y };

  if (snakeDirection === 'up') head.y--;
  if (snakeDirection === 'down') head.y++;
  if (snakeDirection === 'left') head.x--;
  if (snakeDirection === 'right') head.x++;

  // Check wall collision
  if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
    gameOver('Snake');
    return;
  }

  // Check self collision
  for (let segment of snake) {
    if (segment.x === head.x && segment.y === head.y) {
      gameOver('Snake');
      return;
    }
  }

  snake.unshift(head);

  // Check food collision
  if (head.x === snakeFood.x && head.y === snakeFood.y) {
    snakeScore += 10;
    document.getElementById('gameScore').textContent = 'Score: ' + snakeScore;
    placeSnakeFood();
  } else {
    snake.pop();
  }

  drawSnake();
}

function drawSnake() {
  snakeCtx.fillStyle = '#fff';
  snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  // Draw snake
  snakeCtx.fillStyle = '#4ecdc4';
  for (let segment of snake) {
    snakeCtx.fillRect(segment.x * 20, segment.y * 20, 19, 19);
  }

  // Draw food
  snakeCtx.fillStyle = '#ff8c42';
  snakeCtx.fillRect(snakeFood.x * 20, snakeFood.y * 20, 19, 19);
}

// Tetris Game
let tetrisBoard, tetrisCurrentPiece, tetrisScore, tetrisCanvas, tetrisCtx;
const TETRIS_COLS = 10;
const TETRIS_ROWS = 20;
const BLOCK_SIZE = 20;

const TETRIS_PIECES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[1, 0, 0], [1, 1, 1]], // L
  [[0, 0, 1], [1, 1, 1]], // J
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]]  // Z
];

const TETRIS_COLORS = ['#ff8c42', '#4ecdc4', '#ffd700', '#4a90e2', '#a9d3ab', '#ff8c42', '#4ecdc4'];

function tetrisKeyHandler(e) {
  if (!currentGame || currentGame !== 'tetris') return;
  const key = e.key;
  if (key === 'ArrowLeft') {
    moveTetrisPiece(-1, 0);
    e.preventDefault();
  } else if (key === 'ArrowRight') {
    moveTetrisPiece(1, 0);
    e.preventDefault();
  } else if (key === 'ArrowDown') {
    moveTetrisPiece(0, 1);
    e.preventDefault();
  } else if (key === 'ArrowUp' || key === ' ') {
    rotateTetrisPiece();
    e.preventDefault();
  }
}

function initTetris() {
  tetrisCanvas = document.getElementById('gameCanvas');
  tetrisCtx = tetrisCanvas.getContext('2d');
  tetrisCanvas.width = TETRIS_COLS * BLOCK_SIZE;
  tetrisCanvas.height = TETRIS_ROWS * BLOCK_SIZE;

  tetrisBoard = Array(TETRIS_ROWS).fill(null).map(() => Array(TETRIS_COLS).fill(0));
  tetrisScore = 0;
  spawnTetrisPiece();

  document.getElementById('gameScore').textContent = 'Score: 0';
  document.getElementById('gameInstructions').innerHTML = '<strong>Controls:</strong> Arrow keys to move, Up/Space to rotate. Complete lines to score!';

  document.addEventListener('keydown', tetrisKeyHandler);
  gameInterval = setInterval(updateTetris, 500);
}

function spawnTetrisPiece() {
  const pieceIndex = Math.floor(Math.random() * TETRIS_PIECES.length);
  tetrisCurrentPiece = {
    shape: TETRIS_PIECES[pieceIndex],
    color: TETRIS_COLORS[pieceIndex],
    x: Math.floor(TETRIS_COLS / 2) - 1,
    y: 0
  };

  if (checkTetrisCollision(tetrisCurrentPiece.x, tetrisCurrentPiece.y, tetrisCurrentPiece.shape)) {
    gameOver('Tetris');
  }
}

function moveTetrisPiece(dx, dy) {
  const newX = tetrisCurrentPiece.x + dx;
  const newY = tetrisCurrentPiece.y + dy;

  if (!checkTetrisCollision(newX, newY, tetrisCurrentPiece.shape)) {
    tetrisCurrentPiece.x = newX;
    tetrisCurrentPiece.y = newY;
    drawTetris();
    return true;
  }
  return false;
}

function rotateTetrisPiece() {
  const rotated = tetrisCurrentPiece.shape[0].map((_, i) =>
    tetrisCurrentPiece.shape.map(row => row[i]).reverse()
  );

  if (!checkTetrisCollision(tetrisCurrentPiece.x, tetrisCurrentPiece.y, rotated)) {
    tetrisCurrentPiece.shape = rotated;
    drawTetris();
  }
}

function checkTetrisCollision(x, y, shape) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;

        if (newX < 0 || newX >= TETRIS_COLS || newY >= TETRIS_ROWS) {
          return true;
        }

        if (newY >= 0 && tetrisBoard[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

function updateTetris() {
  if (!moveTetrisPiece(0, 1)) {
    mergeTetrisPiece();
    clearTetrisLines();
    spawnTetrisPiece();
  }
  drawTetris();
}

function mergeTetrisPiece() {
  for (let row = 0; row < tetrisCurrentPiece.shape.length; row++) {
    for (let col = 0; col < tetrisCurrentPiece.shape[row].length; col++) {
      if (tetrisCurrentPiece.shape[row][col]) {
        const y = tetrisCurrentPiece.y + row;
        const x = tetrisCurrentPiece.x + col;
        if (y >= 0) {
          tetrisBoard[y][x] = tetrisCurrentPiece.color;
        }
      }
    }
  }
}

function clearTetrisLines() {
  let linesCleared = 0;
  for (let row = TETRIS_ROWS - 1; row >= 0; row--) {
    if (tetrisBoard[row].every(cell => cell !== 0)) {
      tetrisBoard.splice(row, 1);
      tetrisBoard.unshift(Array(TETRIS_COLS).fill(0));
      linesCleared++;
      row++;
    }
  }

  if (linesCleared > 0) {
    tetrisScore += linesCleared * 100;
    document.getElementById('gameScore').textContent = 'Score: ' + tetrisScore;
  }
}

function drawTetris() {
  // Clear canvas
  tetrisCtx.fillStyle = '#fff';
  tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

  // Draw board
  for (let row = 0; row < TETRIS_ROWS; row++) {
    for (let col = 0; col < TETRIS_COLS; col++) {
      if (tetrisBoard[row][col]) {
        tetrisCtx.fillStyle = tetrisBoard[row][col];
        tetrisCtx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
      }
    }
  }

  // Draw current piece
  tetrisCtx.fillStyle = tetrisCurrentPiece.color;
  for (let row = 0; row < tetrisCurrentPiece.shape.length; row++) {
    for (let col = 0; col < tetrisCurrentPiece.shape[row].length; col++) {
      if (tetrisCurrentPiece.shape[row][col]) {
        tetrisCtx.fillRect(
          (tetrisCurrentPiece.x + col) * BLOCK_SIZE,
          (tetrisCurrentPiece.y + row) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    }
  }

  // Draw grid
  tetrisCtx.strokeStyle = '#e0e0e0';
  tetrisCtx.lineWidth = 0.5;
  for (let i = 0; i <= TETRIS_COLS; i++) {
    tetrisCtx.beginPath();
    tetrisCtx.moveTo(i * BLOCK_SIZE, 0);
    tetrisCtx.lineTo(i * BLOCK_SIZE, TETRIS_ROWS * BLOCK_SIZE);
    tetrisCtx.stroke();
  }
  for (let i = 0; i <= TETRIS_ROWS; i++) {
    tetrisCtx.beginPath();
    tetrisCtx.moveTo(0, i * BLOCK_SIZE);
    tetrisCtx.lineTo(TETRIS_COLS * BLOCK_SIZE, i * BLOCK_SIZE);
    tetrisCtx.stroke();
  }
}

function showGameOver(title, message) {
  document.getElementById('gameOverTitle').textContent = title;
  document.getElementById('gameOverMessage').textContent = message;
  updateBackToCodeButton();
  document.getElementById('gameOverOverlay').style.display = 'flex';
}

const funkyMessages = [
  "Code > Games 💻",
  "Python Won't Judge You",
  "Algorithms Never Lose",
  "Debug Life Instead",
  "Real Winners Code",
  "Time to Actually Win",
  "Coding = No Game Overs",
  "Be a 10x Coder Instead",
  "Your Code > Your Score",
  "Python Believes in You",
  "Git Gud at Python",
  "Compile Your Feelings",
  "Return to Greatness",
  "Function > Frustration",
  "Loop Back to Learning",
  "Try Code, Catch Skills",
  "if(skills): code()",
  "Level Up IRL",
  "Rage Quit? Nah, Rage Code!"
];

function closeGameOver() {
  document.getElementById('gameOverOverlay').style.display = 'none';
  backToMenu();
}

function backToCoding() {
  document.getElementById('gameOverOverlay').style.display = 'none';
  closeGames();
}

function restartGame() {
  document.getElementById('gameOverOverlay').style.display = 'none';
  stopCurrentGame();
  if (lastPlayedGame) {
    startGame(lastPlayedGame);
  }
}

function updateBackToCodeButton() {
  const randomMessage = funkyMessages[Math.floor(Math.random() * funkyMessages.length)];
  document.getElementById('backToCodeBtn').textContent = randomMessage;
}

function gameOver(gameName) {
  stopCurrentGame();
  let score = 0;
  if (gameName === 'Snake') score = snakeScore;
  else if (gameName === 'Tetris') score = tetrisScore;
  else if (gameName === 'Breakout') score = breakoutScore;
  else if (gameName === 'Memory') score = memoryScore;
  else if (gameName === 'Space Shooter') score = spaceShooterScore;
  showGameOver('Game Over!', gameName + ' - Final Score: ' + score);
}

function gameWin(gameName, score) {
  stopCurrentGame();
  showGameOver('You Win! 🎉', gameName + ' - Final Score: ' + score);
}

// Breakout Game
let breakoutPaddle, breakoutBall, breakoutBricks, breakoutScore, breakoutCanvas, breakoutCtx;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 45;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;

function breakoutMouseHandler(e) {
  if (!currentGame || currentGame !== 'breakout') return;
  const rect = breakoutCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  breakoutPaddle.x = Math.max(0, Math.min(mouseX - PADDLE_WIDTH / 2, breakoutCanvas.width - PADDLE_WIDTH));
}

function breakoutKeyHandler(e) {
  if (!currentGame || currentGame !== 'breakout') return;
  if (e.key === 'ArrowLeft') {
    breakoutPaddle.x = Math.max(0, breakoutPaddle.x - 20);
  } else if (e.key === 'ArrowRight') {
    breakoutPaddle.x = Math.min(breakoutCanvas.width - PADDLE_WIDTH, breakoutPaddle.x + 20);
  }
}

function initBreakout() {
  breakoutCanvas = document.getElementById('gameCanvas');
  breakoutCtx = breakoutCanvas.getContext('2d');
  breakoutCanvas.width = 400;
  breakoutCanvas.height = 500;

  breakoutPaddle = { x: 150, y: 460, width: PADDLE_WIDTH, height: PADDLE_HEIGHT };
  breakoutBall = { x: 200, y: 400, dx: 3, dy: -3, radius: BALL_RADIUS };
  breakoutScore = 0;

  breakoutBricks = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    breakoutBricks[row] = [];
    for (let col = 0; col < BRICK_COLS; col++) {
      breakoutBricks[row][col] = { x: col * (BRICK_WIDTH + BRICK_PADDING) + 10, y: row * (BRICK_HEIGHT + BRICK_PADDING) + 30, status: 1 };
    }
  }

  document.getElementById('gameScore').textContent = 'Score: 0';
  document.getElementById('gameInstructions').innerHTML = '<strong>Controls:</strong> Move mouse or arrow keys to control paddle. Break all bricks!';

  document.addEventListener('mousemove', breakoutMouseHandler);
  document.addEventListener('keydown', breakoutKeyHandler);

  function gameLoop() {
    if (currentGame === 'breakout') {
      updateBreakout();
      gameAnimationFrame = requestAnimationFrame(gameLoop);
    }
  }
  gameLoop();
}

function updateBreakout() {
  breakoutBall.x += breakoutBall.dx;
  breakoutBall.y += breakoutBall.dy;

  // Wall collision
  if (breakoutBall.x + breakoutBall.radius > breakoutCanvas.width || breakoutBall.x - breakoutBall.radius < 0) {
    breakoutBall.dx = -breakoutBall.dx;
  }
  if (breakoutBall.y - breakoutBall.radius < 0) {
    breakoutBall.dy = -breakoutBall.dy;
  }

  // Paddle collision
  if (breakoutBall.y + breakoutBall.radius > breakoutPaddle.y &&
    breakoutBall.x > breakoutPaddle.x &&
    breakoutBall.x < breakoutPaddle.x + breakoutPaddle.width) {
    breakoutBall.dy = -breakoutBall.dy;
    // Add some angle based on where ball hits paddle
    const hitPos = (breakoutBall.x - breakoutPaddle.x) / breakoutPaddle.width;
    breakoutBall.dx = (hitPos - 0.5) * 6;
  }

  // Bottom wall - game over
  if (breakoutBall.y + breakoutBall.radius > breakoutCanvas.height) {
    gameOver('Breakout');
    return;
  }

  // Brick collision
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const brick = breakoutBricks[row][col];
      if (brick.status === 1) {
        if (breakoutBall.x > brick.x && breakoutBall.x < brick.x + BRICK_WIDTH &&
          breakoutBall.y > brick.y && breakoutBall.y < brick.y + BRICK_HEIGHT) {
          breakoutBall.dy = -breakoutBall.dy;
          brick.status = 0;
          breakoutScore += 10;
          document.getElementById('gameScore').textContent = 'Score: ' + breakoutScore;

          // Check win
          if (breakoutScore === BRICK_ROWS * BRICK_COLS * 10) {
            gameWin('Breakout', breakoutScore);
            return;
          }
        }
      }
    }
  }

  drawBreakout();
}

function drawBreakout() {
  breakoutCtx.fillStyle = '#fff';
  breakoutCtx.fillRect(0, 0, breakoutCanvas.width, breakoutCanvas.height);

  // Draw bricks
  const brickColors = ['#ff8c42', '#4ecdc4', '#ffd700', '#4a90e2', '#a9d3ab'];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const brick = breakoutBricks[row][col];
      if (brick.status === 1) {
        breakoutCtx.fillStyle = brickColors[row];
        breakoutCtx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
        breakoutCtx.strokeStyle = '#000';
        breakoutCtx.lineWidth = 2;
        breakoutCtx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
      }
    }
  }

  // Draw paddle
  breakoutCtx.fillStyle = '#4a90e2';
  breakoutCtx.fillRect(breakoutPaddle.x, breakoutPaddle.y, breakoutPaddle.width, breakoutPaddle.height);
  breakoutCtx.strokeStyle = '#000';
  breakoutCtx.lineWidth = 2;
  breakoutCtx.strokeRect(breakoutPaddle.x, breakoutPaddle.y, breakoutPaddle.width, breakoutPaddle.height);

  // Draw ball
  breakoutCtx.fillStyle = '#ff8c42';
  breakoutCtx.beginPath();
  breakoutCtx.arc(breakoutBall.x, breakoutBall.y, breakoutBall.radius, 0, Math.PI * 2);
  breakoutCtx.fill();
  breakoutCtx.strokeStyle = '#000';
  breakoutCtx.lineWidth = 2;
  breakoutCtx.stroke();
}

// Memory Match Game
let memoryCards, memoryFlipped, memoryMatched, memoryScore, memoryCanvas, memoryCtx;
const MEMORY_COLS = 4;
const MEMORY_ROWS = 4;
const CARD_SIZE = 80;
const CARD_MARGIN = 10;

function memoryClickHandler(e) {
  if (!currentGame || currentGame !== 'memory' || memoryFlipped.length >= 2) return;

  const rect = memoryCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  for (let i = 0; i < memoryCards.length; i++) {
    const card = memoryCards[i];
    if (x > card.x && x < card.x + CARD_SIZE && y > card.y && y < card.y + CARD_SIZE) {
      if (!card.flipped && !card.matched) {
        card.flipped = true;
        memoryFlipped.push(i);
        drawMemory();

        if (memoryFlipped.length === 2) {
          setTimeout(checkMemoryMatch, 500);
        }
      }
      break;
    }
  }
}

function initMemory() {
  memoryCanvas = document.getElementById('gameCanvas');
  memoryCtx = memoryCanvas.getContext('2d');
  memoryCanvas.width = 400;
  memoryCanvas.height = 400;

  const symbols = ['🎮', '🎯', '🎨', '🎪', '🎭', '🎰', '🎲', '🎸'];
  const deck = [...symbols, ...symbols];

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  memoryCards = [];
  for (let row = 0; row < MEMORY_ROWS; row++) {
    for (let col = 0; col < MEMORY_COLS; col++) {
      memoryCards.push({
        symbol: deck[row * MEMORY_COLS + col],
        x: col * (CARD_SIZE + CARD_MARGIN) + 20,
        y: row * (CARD_SIZE + CARD_MARGIN) + 20,
        flipped: false,
        matched: false
      });
    }
  }

  memoryFlipped = [];
  memoryMatched = 0;
  memoryScore = 0;

  document.getElementById('gameScore').textContent = 'Matches: 0/8';
  document.getElementById('gameInstructions').innerHTML = '<strong>Controls:</strong> Click cards to flip them. Match all pairs!';

  memoryCanvas.addEventListener('click', memoryClickHandler);
  drawMemory();
}

function checkMemoryMatch() {
  const card1 = memoryCards[memoryFlipped[0]];
  const card2 = memoryCards[memoryFlipped[1]];

  if (card1.symbol === card2.symbol) {
    card1.matched = true;
    card2.matched = true;
    memoryMatched++;
    memoryScore += 10;
    document.getElementById('gameScore').textContent = 'Matches: ' + memoryMatched + '/8';

    if (memoryMatched === 8) {
      setTimeout(function () {
        gameWin('Memory Match', memoryScore);
      }, 300);
    }
  } else {
    card1.flipped = false;
    card2.flipped = false;
  }

  memoryFlipped = [];
  drawMemory();
}

function drawMemory() {
  memoryCtx.fillStyle = '#fff';
  memoryCtx.fillRect(0, 0, memoryCanvas.width, memoryCanvas.height);

  for (const card of memoryCards) {
    if (card.matched) {
      memoryCtx.fillStyle = '#4ecdc4';
    } else if (card.flipped) {
      memoryCtx.fillStyle = '#ffd700';
    } else {
      memoryCtx.fillStyle = '#4a90e2';
    }

    memoryCtx.fillRect(card.x, card.y, CARD_SIZE, CARD_SIZE);
    memoryCtx.strokeStyle = '#000';
    memoryCtx.lineWidth = 3;
    memoryCtx.strokeRect(card.x, card.y, CARD_SIZE, CARD_SIZE);

    if (card.flipped || card.matched) {
      memoryCtx.font = '40px Arial';
      memoryCtx.textAlign = 'center';
      memoryCtx.textBaseline = 'middle';
      memoryCtx.fillStyle = '#000';
      memoryCtx.fillText(card.symbol, card.x + CARD_SIZE / 2, card.y + CARD_SIZE / 2);
    } else {
      memoryCtx.font = 'bold 30px Arial';
      memoryCtx.textAlign = 'center';
      memoryCtx.textBaseline = 'middle';
      memoryCtx.fillStyle = '#fff';
      memoryCtx.fillText('?', card.x + CARD_SIZE / 2, card.y + CARD_SIZE / 2);
    }
  }
}

// Space Shooter Game
let spaceShooterPlayer, spaceShooterEnemies, spaceShooterBullets, spaceShooterScore, spaceShooterCanvas, spaceShooterCtx;
let spaceShooterKeys = {};

function spaceShooterKeyHandler(e) {
  if (!currentGame || currentGame !== 'spaceshooter') return;
  spaceShooterKeys[e.key] = true;
  if (e.key === ' ') {
    shootBullet();
    e.preventDefault();
  }
}

function spaceShooterKeyUpHandler(e) {
  if (!currentGame || currentGame !== 'spaceshooter') return;
  spaceShooterKeys[e.key] = false;
}

function initSpaceShooter() {
  spaceShooterCanvas = document.getElementById('gameCanvas');
  spaceShooterCtx = spaceShooterCanvas.getContext('2d');
  spaceShooterCanvas.width = 400;
  spaceShooterCanvas.height = 500;

  spaceShooterPlayer = { x: 180, y: 450, width: 40, height: 40, speed: 5 };
  spaceShooterEnemies = [];
  spaceShooterBullets = [];
  spaceShooterScore = 0;
  spaceShooterKeys = {};

  document.getElementById('gameScore').textContent = 'Score: 0';
  document.getElementById('gameInstructions').innerHTML = '<strong>Controls:</strong> Arrow keys to move, Space to shoot. Destroy all enemies!';

  document.addEventListener('keydown', spaceShooterKeyHandler);
  document.addEventListener('keyup', spaceShooterKeyUpHandler);

  // Spawn enemies periodically
  gameInterval = setInterval(spawnEnemy, 1500);

  function gameLoop() {
    if (currentGame === 'spaceshooter') {
      updateSpaceShooter();
      gameAnimationFrame = requestAnimationFrame(gameLoop);
    }
  }
  gameLoop();
}

function spawnEnemy() {
  if (currentGame === 'spaceshooter') {
    spaceShooterEnemies.push({
      x: Math.random() * (spaceShooterCanvas.width - 30),
      y: -30,
      width: 30,
      height: 30,
      speed: 2 + Math.random()
    });
  }
}

function shootBullet() {
  spaceShooterBullets.push({
    x: spaceShooterPlayer.x + spaceShooterPlayer.width / 2 - 2,
    y: spaceShooterPlayer.y,
    width: 4,
    height: 10,
    speed: 7
  });
}

function updateSpaceShooter() {
  // Move player
  if (spaceShooterKeys['ArrowLeft']) {
    spaceShooterPlayer.x = Math.max(0, spaceShooterPlayer.x - spaceShooterPlayer.speed);
  }
  if (spaceShooterKeys['ArrowRight']) {
    spaceShooterPlayer.x = Math.min(spaceShooterCanvas.width - spaceShooterPlayer.width, spaceShooterPlayer.x + spaceShooterPlayer.speed);
  }

  // Move bullets
  for (let i = spaceShooterBullets.length - 1; i >= 0; i--) {
    spaceShooterBullets[i].y -= spaceShooterBullets[i].speed;
    if (spaceShooterBullets[i].y < 0) {
      spaceShooterBullets.splice(i, 1);
    }
  }

  // Move enemies
  for (let i = spaceShooterEnemies.length - 1; i >= 0; i--) {
    spaceShooterEnemies[i].y += spaceShooterEnemies[i].speed;

    // Check collision with player
    if (spaceShooterEnemies[i].y + spaceShooterEnemies[i].height > spaceShooterPlayer.y &&
      spaceShooterEnemies[i].x < spaceShooterPlayer.x + spaceShooterPlayer.width &&
      spaceShooterEnemies[i].x + spaceShooterEnemies[i].width > spaceShooterPlayer.x) {
      gameOver('Space Shooter');
      return;
    }

    if (spaceShooterEnemies[i].y > spaceShooterCanvas.height) {
      spaceShooterEnemies.splice(i, 1);
    }
  }

  // Check bullet-enemy collisions
  for (let i = spaceShooterBullets.length - 1; i >= 0; i--) {
    for (let j = spaceShooterEnemies.length - 1; j >= 0; j--) {
      if (spaceShooterBullets[i] && spaceShooterEnemies[j] &&
        spaceShooterBullets[i].x < spaceShooterEnemies[j].x + spaceShooterEnemies[j].width &&
        spaceShooterBullets[i].x + spaceShooterBullets[i].width > spaceShooterEnemies[j].x &&
        spaceShooterBullets[i].y < spaceShooterEnemies[j].y + spaceShooterEnemies[j].height &&
        spaceShooterBullets[i].y + spaceShooterBullets[i].height > spaceShooterEnemies[j].y) {
        spaceShooterEnemies.splice(j, 1);
        spaceShooterBullets.splice(i, 1);
        spaceShooterScore += 10;
        document.getElementById('gameScore').textContent = 'Score: ' + spaceShooterScore;
        break;
      }
    }
  }

  drawSpaceShooter();
}

function drawSpaceShooter() {
  // Background
  spaceShooterCtx.fillStyle = '#000';
  spaceShooterCtx.fillRect(0, 0, spaceShooterCanvas.width, spaceShooterCanvas.height);

  // Player
  spaceShooterCtx.fillStyle = '#4ecdc4';
  spaceShooterCtx.fillRect(spaceShooterPlayer.x, spaceShooterPlayer.y, spaceShooterPlayer.width, spaceShooterPlayer.height);
  spaceShooterCtx.strokeStyle = '#fff';
  spaceShooterCtx.lineWidth = 2;
  spaceShooterCtx.strokeRect(spaceShooterPlayer.x, spaceShooterPlayer.y, spaceShooterPlayer.width, spaceShooterPlayer.height);

  // Bullets
  spaceShooterCtx.fillStyle = '#ffd700';
  for (const bullet of spaceShooterBullets) {
    spaceShooterCtx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }

  // Enemies
  spaceShooterCtx.fillStyle = '#ff8c42';
  for (const enemy of spaceShooterEnemies) {
    spaceShooterCtx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    spaceShooterCtx.strokeStyle = '#fff';
    spaceShooterCtx.lineWidth = 2;
    spaceShooterCtx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

const canvas = document.getElementById('gameArea');
const ctx = canvas.getContext('2d');

const COLS = 5;
const ROWS = 12;
const BLOCK_SIZE = 30;

let board = [];
let currentPiece = null;
let pieceX = 0;
let pieceY = 0;
let dropCounter = 0;
let dropInterval = 1000; // ms

let gameOver = false;

let controllerIndex = null;

let leftPressed = false;
let rightPressed = false;
let upPressed = false;
let downPressed = false;
let reset = false;

let upReleased = true;

let leftCooldown = 0;
let rightCooldown = 0;
let downCooldown = 0;
const cooldownInterval = 100; //ms

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const TETROMINOS = {
    I: { shape: [[1, 1, 1, 1]], color: 'cyan' },
    O: { shape: [[1, 1], [1, 1]], color: 'yellow' },
    T: { shape: [[1, 1, 1], [0, 1, 0]], color: 'purple' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' }
};

function createBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                ctx.fillStyle = board[row][col];
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

function drawPiece() {
    if (currentPiece) {
        ctx.fillStyle = currentPiece.color;
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    ctx.fillRect((pieceX + x) * BLOCK_SIZE, (pieceY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
    }
}

function collision() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (
                currentPiece.shape[y][x] &&
                (board[pieceY + y] && board[pieceY + y][pieceX + x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

function mergePiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[pieceY + y][pieceX + x] = currentPiece.color;
            }
        });
    });
}

function rotatePiece() {
    const rotatedShape = currentPiece.shape[0].map((_, index) => currentPiece.shape.map(row => row[index])).reverse();
    const originalShape = currentPiece.shape;
    currentPiece.shape = rotatedShape;
    if (collision()) {
        currentPiece.shape = originalShape; 
    }
}

function dropPiece() {
    pieceY++;
    if (collision()) {
        pieceY--;
        mergePiece();
        newPiece();
        clearLines();
        if (collision()) {
            endGame(); 
        }
    }
    dropCounter = 0;
}

function clearLines() {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            row++; // Check the same row again after removing it
        }
    }
}

function newPiece() {
    const pieces = 'IOTJLSZ';
    const rand = Math.floor(Math.random() * pieces.length);
    currentPiece = TETROMINOS[pieces[rand]];
    pieceX = Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2);
    pieceY = 0;
}

window.addEventListener('gamepadconnected', (e) => {
    controllerIndex = e.gamepad.index;
    console.log('Gamepad connected:', e.gamepad);
});

window.addEventListener('gamepaddisconnected', (e) => {
    controllerIndex = null;
    console.log('Gamepad disconnected:', e.gamepad);
});

function controllerInput() {
    if (controllerIndex !== null) {
        const gamepad = navigator.getGamepads()[controllerIndex];
        if (!gamepad) return;

        const buttons = gamepad.buttons;

        leftPressed = buttons[0].pressed;
        rightPressed = buttons[2].pressed;
        downPressed = buttons[1].pressed;
        upPressed = buttons[3].pressed;
        reset = buttons[5].pressed;

        if (upPressed) {
            if (upReleased) {
                rotatePiece();
                upReleased = false;
            }
        } else {
            upReleased = true;
        }
    }
}

function movePiece(deltaTime) {
    if (leftPressed && leftCooldown <= 0) {
        pieceX--;
        if (collision()) {
            pieceX++;
        }
        leftCooldown = cooldownInterval;
    }

    if (rightPressed && rightCooldown <= 0) {
        pieceX++;
        if (collision()) {
            pieceX--;
        }
        rightCooldown = cooldownInterval;
    }

    if (downPressed && downCooldown <= 0) {
        dropPiece();
        downCooldown = cooldownInterval;
    }

    leftCooldown -= deltaTime;
    rightCooldown -= deltaTime;
    downCooldown -= deltaTime;
}

function endGame() {
    gameOver = true;
}

function gameLoop(time = 0) {
    if (!gameOver) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;

        if (dropCounter > dropInterval) {
            dropPiece();
        }

        movePiece(deltaTime);
        drawBoard();
        drawPiece();
    }

    controllerInput();

    if (gameOver && reset) {
        window.location.reload();
    }

    requestAnimationFrame(gameLoop);
}

createBoard();
newPiece();

let lastTime = 0;
gameLoop();

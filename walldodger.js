// Maak het canvas aan
let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Plaats de bal in het midden van het scherm, geef een snelheid van 5 en een radius van 15.
let x = 400;
let y = canvas.height / 2; // Start de bal vanuit het midden van het scherm
let speed = 5;
let radius = 15;

let leftPressed = false;
let rightPressed = false;
let mousePressed = false;

// Voor een loop
let tellerCyclus = 0;
let cyclus = 3; 

let gravity = 1; // Zwaartekracht
let initialGravity = 1
let jumpForce = -7; // Constante sprongkracht

// Voeg de balken toe
let barWidth = 10;
let barHeight = 100;

// Waarden voor de rode bars
let topBar = { x: 0, y: 0, width: canvas.width, height: barWidth, speed: 0.1 };
let bottomBar = { x: 0, y: canvas.height - barWidth, width: canvas.width, height: barWidth, speed: 0.1 };
let leftBar = { x: 0, y: 0, width: barWidth, height: canvas.height, speed: 0.1 };
let rightBar = { x: canvas.width - barWidth, y: 0, width: barWidth, height: canvas.height, speed: 0.1 };

// Voeg variabelen toe voor game over status en scherm verduistering
let gameOver = false;
let darknessLevel = 0; // Nul betekent geen verduistering, 1 betekent volledige verduistering

// Voeg variabele toe voor de score
let score = 0;

// Voeg een variabele toe voor het bijhouden van de tijd en de laatste score-update tijd
let lastUpdateTime = 0;

// Frames totdat de bar van richting kan veranderen
let barMoveFrames = 0;

// Voeg een variabele toe om bij te houden of de snelheid al is verhoogd
let speedIncreased = false;

// Voeg een variabele toe voor de spelstatus
let gameStatus = 'startscherm';

// Event listener om de game te starten wanneer het canvas wordt geklikt
canvas.addEventListener('click', function (event) {
    if (gameStatus === 'startscherm') {
        // Klik op het startscherm om de game te starten
        gameStatus = 'playing';
        startGame();
    }
});

// Functie om het startscherm te tekenen
function drawStartScreen() {
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Wall Dodger', canvas.width / 2, canvas.height / 2 - 120);

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Klik om te starten', canvas.width / 2, canvas.height / 2 + 30);
}

// Functie om het canvas, het startscherm, de bal, de score en eventuele game over status te tekenen
function drawCanvasAndBall() {
    // Teken het startscherm als de game status 'startscherm' is
    if (gameStatus === 'startscherm') {
        drawStartScreen();
    } 
    else {
        ctx.fillStyle = "#d9d9d9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Teken de balken
        ctx.fillStyle = 'red';
        ctx.fillRect(topBar.x, topBar.y, topBar.width, topBar.height);
        ctx.fillRect(bottomBar.x, bottomBar.y, bottomBar.width, bottomBar.height);
        ctx.fillRect(leftBar.x, leftBar.y, leftBar.width, leftBar.height);
        ctx.fillRect(rightBar.x, rightBar.y, rightBar.width, rightBar.height);

        // Teken de bal
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();

        // Teken de score
        ctx.fillStyle = 'black';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 20, 30);

        // Teken "Game Over" als het spel voorbij is
        if (gameOver) {
            ctx.fillStyle = `rgba(0, 0, 0, ${darknessLevel})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);

            // Teken de score op het game over scherm
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2);

            // Voeg de tekst "Refresh de pagina om opnieuw te starten" toe
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Refresh de pagina om opnieuw te starten', canvas.width / 2, canvas.height / 2 + 30);
        }
    }
}

// Event listeners voor toetsenbord en muis
document.addEventListener('keydown', function (event) {
    if (event.key === 'a' || event.key === 'A') {
        leftPressed = true;
    } 
    else if (event.key === 'd' || event.key === 'D') {
        rightPressed = true;
    }
});

document.addEventListener('keyup', function (event) {
    if (event.key === 'a' || event.key === 'A') {
        leftPressed = false;
    } 
    else if (event.key === 'd' || event.key === 'D') {
        rightPressed = false;
    }
});

document.addEventListener('mousedown', function (event) {
    if (event.button === 0) {
        mousePressed = true;
        gravity = jumpForce;
    }
});

document.addEventListener('mouseup', function (event) {
    if (event.button === 0) {
        mousePressed = false;
    }
});


// Functie om de interactie met de balken te controleren
function checkBarCollision() {
    if (
        x + radius > leftBar.x &&
        x - radius < leftBar.x + leftBar.width &&
        y > leftBar.y &&
        y < leftBar.y + leftBar.height
    ) {
        x = leftBar.x + radius;
        handleGameOver();
    } else if (
        x - radius < rightBar.x + rightBar.width &&
        x + radius > rightBar.x &&
        y > rightBar.y &&
        y < rightBar.y + rightBar.height
    ) {
        x = rightBar.x - radius;
        handleGameOver();
    } else if (
        y + radius > topBar.y &&
        y - radius < topBar.y + topBar.height &&
        x > topBar.x &&
        x < topBar.x + topBar.width
    ) {
        y = topBar.y + radius;
        handleGameOver();
    } else if (
        y - radius < bottomBar.y + bottomBar.height &&
        y + radius > bottomBar.y &&
        x > bottomBar.x &&
        x < bottomBar.x + bottomBar.width
    ) {
        y = bottomBar.y - radius;
        handleGameOver();
    }
}

// Functie voor de zwaartekracht
function ballGravity() {
    if (!gameOver) {
        y = y + gravity;

        if (y + radius >= canvas.height) {
            y = canvas.height - radius; // Als de bal de bodem raakt, stop de val
            gravity = 1;
        } else if (y - radius <= 0) {
            y = radius; // Als de bal het plafond raakt, stop de opwaartse beweging
            gravity = 1;
        }

        tellerCyclus++;
        if (tellerCyclus > cyclus && gravity < 10) {
            gravity++; // Verhoog de zwaartekracht na een bepaald aantal frames
            tellerCyclus = 0;
        }
    }
}

// Functie om invoer te verwerken
function handleInput() {
    if (!gameOver) {
        if (leftPressed) {
            x -= speed;
            if (x - radius < 0) {
                x = radius;
            }
        } else if (rightPressed) {
            x += speed;
            if (x + radius > canvas.width) {
                x = canvas.width - radius;
            }
        }
    }
}

// Functie voor game over afhandeling
function handleGameOver() {
    gameOver = true;
    darknessLevel = 0.5; // Pas dit aan naar de gewenste donkerte
    speed = 0; // Stop de beweging van de bal
}

// Functie om de beweging van de balken te controleren (zodat ze niet offscreen gaan)
function forceSpeedFlip(bar) {
    barMoveFrames = 0;
    bar.speed = -bar.speed;
}

// Functie om de bars te bewegen op basis van de score
// De barmoveframes gaan pas in werking zodra de score 5 is (voor de horizontale balken) of 10 is (voor de verticale balken)
function moveBars() {
    if (!gameOver) {
        if (score >= 10) {
            barMoveFrames += 1;

            if (barMoveFrames >= 60) {
                // Laat de verticale balken willekeurig omhoog of omlaag bewegen
                if (Math.random() > 0.5) {
                    leftBar.speed = 1; // Beweeg omhoog
                    rightBar.speed = -1; // Beweeg omlaag
                } else {
                    leftBar.speed = -1; // Beweeg omlaag
                    rightBar.speed = 1; // Beweeg omhoog
                }

                barMoveFrames = 0;
            }
        } else if (score >= 5) {
            leftBar.speed = 0;
            rightBar.speed = 0;

            barMoveFrames += 1;

            if (barMoveFrames >= 60) {
                // Laat de horizontale balken willekeurig omhoog of omlaag bewegen
                if (Math.random() < 0.5) {
                    topBar.speed = 1; // Beweeg omhoog
                    bottomBar.speed = -1; // Beweeg omlaag
                } else {
                    topBar.speed = -1; // Beweeg omlaag
                    bottomBar.speed = 1; // Beweeg omhoog
                }

                barMoveFrames = 0;
            }
        } else {
            topBar.speed = 0.45;
            bottomBar.speed = 0.45;
            leftBar.speed = 0.75;
            rightBar.speed = 0.75;
        }


        topBar.y += topBar.speed;
        bottomBar.y -= bottomBar.speed;
        leftBar.x += leftBar.speed;
        rightBar.x -= rightBar.speed;

        // Check of de bars out of bounds gaan
        let topOOB = topBar.speed < 0 && topBar.y < 0;
        let bottomOOB = bottomBar.speed < 0 && bottomBar.y + bottomBar.height > canvas.height;
        let leftOOB = leftBar.speed < 0 && leftBar.x < 0;
        let rightOOB = rightBar.speed < 0 && rightBar.x + rightBar.width > canvas.width;
        if (topOOB || bottomOOB) {
            forceSpeedFlip(topBar);
            forceSpeedFlip(bottomBar);
        }
        if (leftOOB || rightOOB) {
            forceSpeedFlip(leftBar);
            forceSpeedFlip(rightBar);
        }

        // Controleer of de balken de speler naderen
        if (
            topBar.y + topBar.height > y - radius &&
            bottomBar.y < y + radius &&
            leftBar.x + leftBar.width > x - radius &&
            rightBar.x < x + radius
        ) {
            handleGameOver();
        }
    }
}

// Functie om de constante updates elke mogelijke frame
function update(currentTime) {
    // Update de score slechts één keer per seconde
    if (!gameOver && currentTime - lastUpdateTime >= 1000) {
        score += 1;
        lastUpdateTime = currentTime;
    }

    drawCanvasAndBall();
    handleInput();
    ballGravity();
    checkBarCollision();
    moveBars();
    console.log(topBar.speed);

    requestAnimationFrame(function (timestamp) {
        update(timestamp);
    });
}

// Functie om de animatieloop te starten
function startGame() {
    lastUpdateTime = performance.now();
    update(performance.now());
}

// Start de animatieloop
drawStartScreen()
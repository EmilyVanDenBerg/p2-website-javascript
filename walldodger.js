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
let gravity = 1; // Pas de zwaartekrachtwaarde aan om de valssnelheid van de bal te regelen

let leftPressed = false;
let rightPressed = false;
let mousePressed = false;

// Event listeners voor toetsenbord en muis
document.addEventListener('keydown', function(event) {
    if (event.key === 'a' || event.key === 'A') {
        leftPressed = true;
    } else if (event.key === 'd' || event.key === 'D') {
        rightPressed = true;
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'a' || event.key === 'A') {
        leftPressed = false;
    } else if (event.key === 'd' || event.key === 'D') {
        rightPressed = false;
    }
});

document.addEventListener('mousedown', function(event) {
    if (event.button === 0) {
        mousePressed = true;
    }
});

document.addEventListener('mouseup', function(event) {
    if (event.button === 0) {
        mousePressed = false;
    }
});

let tellerCyclus = 0;
let cyclus = 3;

// Functie voor de zwaartekracht
function ballGravity() {
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
    
    document.addEventListener('mousedown', function(event) {
        if (event.button === 0) {
            tellerCyclus++;
            mousePressed = true;
            if (tellerCyclus > cyclus) {
                gravity = gravity - 3;
                tellerCyclus = 0;
                if (gravity < -10) {
                    gravity = gravity + 10;
                }
            }
        }
    });
    
    document.addEventListener('mouseup', function(event) {
        if (event.button === 0) {
            mousePressed = false;
        }
    });
}

// Functie om invoer te verwerken
function handleInput() {
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

// Functie om het canvas en de bal te tekenen
function drawCanvasAndBall() {
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();
}

// Functie voor de constante updates elke mogelijke frame
function update() {
    drawCanvasAndBall();
    handleInput();
    ballGravity();
    requestAnimationFrame(update);
}

// Start de animatieloop
update();

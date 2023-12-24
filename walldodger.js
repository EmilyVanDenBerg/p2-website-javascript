// Maak het canvas aan
let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Plaats de bal in het midden van het scherm, geef een snelheid van 5 en een radius van 15.
let x = canvas.width / 2;
let y = canvas.height / 2;
let speed = 5;
let radius = 15;


// Variabelen die later worden gebruikt om te kijken of links of rechts word ingedrukt.
// In de les een andere manier behandeld, maar hierdoor word de interval weggehaald waardoor er minder hapering in de movement zit.
let leftPressed = false;
let rightPressed = false;

// Process of A of D is ingedrukt/ losgelaten.
document.addEventListener('keydown', function(event) {
    if (event.key === 'a' || event.key === 'A') {
        leftPressed = true;
    } 

    else if (event.key === 'd' || event.key === 'D') {
        rightPressed = true;
    }
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'a' || event.key === 'A') {
        leftPressed = false;
    } 

    else if (event.key === 'd' || event.key === 'D') {
        rightPressed = false;
    }
});

// Als A wordt ingedrukt (wat volgt uit de vorige lijnen code), maak een linkse beweging.
// Als D wordt ingedrukt, maak een rechtse beweging.
function handleInput() {
    if (leftPressed) {
        x -= speed;
        if (x - radius < 0) {
            x = radius;
        }
    } 

    else if (rightPressed) {
        x += speed;
        if (x + radius > canvas.width) {
            x = canvas.width - radius;
        }
    }
}

// Teken het canvas en de bal
function drawCanvasAndBall() {
    // Bepaal de kleur en vorm van het canvas
    ctx.fillStyle = "#d9d9d9"; // Grijs als achtergrondkleur
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Teken een rechthoek om de achtergrond te vullen
    ctx.beginPath();

    // Teken de cirkel zelf
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.strokeStyle = 'black'; // Zwarte kleur voor de rand
    ctx.lineWidth = 3; // Dikte van de rand
    ctx.stroke(); // Teken de rand

    ctx.closePath();
}

// Constant updates aanroepen elke mogelijke frame
function update() {
    drawCanvasAndBall();
    handleInput();
     requestAnimationFrame(update);
}

update();

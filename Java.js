let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

let player = {
    x: 200,
    y: 300,
    speed: 5,
    radius: 15,
    color: 'red'
};

let enemy = {
    x: 500,
    y: 300,
    speed: 3,
    radius: 15,
    color: 'blue'
};

let bullets = [];
let gameRunning = false;

document.getElementById('startButton').addEventListener('click', function () {
    if (!gameRunning) {
        gameRunning = true;
        requestAnimationFrame(update);
    }
});

document.addEventListener('keydown', function (event) {
    keys[event.key] = true;
});

document.addEventListener('keyup', function (event) {
    keys[event.key] = false;
});

let spacebarPressed = false;

function update() {
    handleKeyPress();

    let dxEnemy = player.x - enemy.x;
    let dyEnemy = player.y - enemy.y;
    let angle = Math.atan2(dyEnemy, dxEnemy);
    enemy.x += enemy.speed * Math.cos(angle);
    enemy.y += enemy.speed * Math.sin(angle);

    enemy.x = Math.max(enemy.radius, Math.min(canvas.width - enemy.radius, enemy.x));
    enemy.y = Math.max(enemy.radius, Math.min(canvas.height - enemy.radius, enemy.y));

    drawCircle(player.x, player.y, player.radius, player.color);
    drawCircle(enemy.x, enemy.y, enemy.radius, enemy.color);

    updateBullets();
    enemyShoot();
    enemyHit();

    if (gameRunning) {
        requestAnimationFrame(update);
    }
}

function handleKeyPress() {
    let dx = 0;
    let dy = 0;

    if (keys['a'] || keys['A']) {
        dx -= player.speed;
    }
    if (keys['d'] || keys['D']) {
        dx += player.speed;
    }
    if (keys['w'] || keys['W']) {
        dy -= player.speed;
    }
    if (keys['s'] || keys['S']) {
        dy += player.speed;
    }

    player.x += dx;
    player.y += dy;

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    if ((keys[' '] || keys['Spacebar']) && !spacebarPressed) {
        shootBullet();
        spacebarPressed = true;
    } else if (!(keys[' '] || keys['Spacebar'])) {
        spacebarPressed = false;
    }

    keys[' '] = false;
    keys['Spacebar'] = false;
}

function shootBullet() {
    let bullet = {
        x: player.x,
        y: player.y,
        speed: 10,
        radius: 5,
        color: 'green'
    };
    bullets.push(bullet);
}

function updateBullets() {
    for (let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i];
        drawCircle(bullet.x, bullet.y, bullet.radius, bullet.color);
        bullet.y -= bullet.speed;

        if (bullet.y < 0) {
            bullets.splice(i, 1);
            i--;
        }
    }
}

function enemyShoot() {
    let bullet = {
        x: enemy.x,
        y: enemy.y,
        speed: 5,
        radius: 5,
        color: 'purple'
    };
    bullets.push(bullet);
}

function enemyHit() {
    for (let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i];
        let dx = bullet.x - enemy.x;
        let dy = bullet.y - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bullet.radius + enemy.radius) {
            enemy.x = Math.random() * (canvas.width - enemy.radius * 2) + enemy.radius;
            enemy.y = Math.random() * (canvas.height - enemy.radius * 2) + enemy.radius;
            bullets.splice(i, 1);
            i--;
        }
    }
}

function drawCircle(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

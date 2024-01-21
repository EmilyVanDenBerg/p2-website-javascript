const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");




// Rest of your JavaScript code goes here
// ...

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    width: 40,
    height: 20,
    color: "#00FF00",
    bullets: [],
    shootCooldown: 1000,
    lastShootTime: 0,
    moveDirection: 0,
    lives: 1,
  };

  const enemies = Array.from({ length: 5 }, (_, rowIndex) =>
    Array.from({ length: 10 }, (_, colIndex) => ({
      x: colIndex * 50 + 20,
      y: rowIndex * 40 + 30,
      width: 20,
      height: 20,
      color: "#FF0000",
      moveDirection: 1,
    }))
  ).flat();

  let isGameStarted = false;

  function drawRect(obj) {
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRect(player);
    enemies.forEach((enemy) => drawRect(enemy));
    player.bullets.forEach((bullet) => drawRect(bullet));

    // Draw lives indicator
    ctx.fillStyle = "#FFF";
    ctx.font = "20px Arial";
    ctx.fillText(`Lives: ${player.lives}`, canvas.width - 80, 30);
  }

  function update() {
    if (isGameStarted) {
      // Update player position
      player.x += player.moveDirection * 2;
      if (player.x < 0) {
        player.x = 0;
      } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
      }

      // Update player bullets
      player.bullets.forEach((bullet) => (bullet.y -= 5));

      // Update enemy position
      const moveDown = enemies.some(
        (enemy) => enemy.x < 0 || enemy.x + enemy.width > canvas.width
      );

      if (moveDown) {
        enemies.forEach((enemy) => {
          enemy.y += 20;
          enemy.moveDirection *= -1;
        });
      }

      enemies.forEach((enemy) => {
        enemy.x += enemy.moveDirection * 0.5;

        const currentTime = Date.now();
        if (currentTime - enemy.lastShootTime > 5000 && Math.random() < 0.1) {
          enemy.bullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 8,
            color: "#FF0000",
          });
          enemy.lastShootTime = currentTime;
        }
      });

      // Check for collision with player bullets and enemies
      for (let i = 0; i < player.bullets.length; i++) {
        const bullet = player.bullets[i];
        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          if (
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y
          ) {
            // Collision detected, remove bullet and enemy
            player.bullets.splice(i, 1);
            enemies.splice(j, 1);
            i--; // Decrement i to account for the removed bullet
            break;
          }
        }
      }

      if (enemies.length === 0) {
        // Player wins when all enemies are killed
        alert("Congratulations! You won!");
        resetGame();
        return;
      }

      draw();
    }

    requestAnimationFrame(update);
  }

  let isSpacebarPressed = false;

  document.getElementById("startButton").addEventListener("click", () => {
    if (!isGameStarted) {
      isGameStarted = true;
      resetGame();
      update();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      player.moveDirection = -1;
    } else if (event.key === "ArrowRight") {
      player.moveDirection = 1;
    } else if (event.key === " ") {
      isSpacebarPressed = true;
      if (isGameStarted) {
        // Allow shooting only if the spacebar is pressed
        const currentTime = Date.now();
        if (currentTime - player.lastShootTime > player.shootCooldown) {
          player.lastShootTime = currentTime;
          player.bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y - 8,
            width: 4,
            height: 8,
            color: "#00FF00",
          });
        }
      }
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      player.moveDirection = 0;
    } else if (event.key === " ") {
      isSpacebarPressed = false;
    }
  });

  function resetGame() {
    player.lives = 1;
    player.bullets = [];
    enemies.length = 0;
    enemies.push(
      ...Array.from({ length: 5 }, (_, rowIndex) =>
        Array.from({ length: 10 }, (_, colIndex) => ({
          x: colIndex * 50 + 20,
          y: rowIndex * 40 + 30,
          width: 20,
          height: 20,
          color: "#FF0000",
          moveDirection: 1,
          bullets: [],
          lastShootTime: 0,
        }))
      ).flat()
    );
  }

  function drawLives() {
    ctx.fillStyle = "#FFF";
    ctx.font = "20px Arial";
    ctx.fillText(`Lives: ${player.lives}`, canvas.width - 80, 30);
  }

  update();


// Example code for demonstration purposes


ctx.fillStyle = "red";
ctx.fillRect(50, 50, 50, 50);

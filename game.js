let tempCanvas = document.createElement("canvas")
let screen = tempCanvas.getContext("2d")

let roomCanvas = document.createElement("canvas")
let roomScreen = roomCanvas.getContext("2d")

let canvas = document.getElementById("screen")
let realScreen = canvas.getContext("2d")

tempCanvas.width = canvas.width
tempCanvas.height = canvas.height

roomCanvas.width = canvas.width
roomCanvas.height = canvas.height

//player setup
let player = {
    //main stuff
    x: 0,
    y: 0,
    width: 48,
    height: 84,
    speedX: 10,
    gravity: 20,

    //level info
    stage: "",
    stageData: {},
    room: {
        id: 0,
        name: "the middle of nowhere",
        tiles: [],
        exits: {},
        font: "PetMe64",
        color: {"hue": 0, "saturation": 100, "brightness": 100},
        breakingPlatforms: [],
        movingPlatforms: [],
        verticalPlatforms: [],
        checkpoints: [],
    },

    //checkpoint info
    checkpoint: {
        roomId: 0,
        x: 0,
        y: 0,
        flipped: false,
    },

    //extra information
    onGround: false,
    flipped: false,
    canFlip: true,
    touchedGravityLine: false,
    gravityLineTick: 1,
    gravityLineCooldown: 0,
    gravityLineEasing: 3,
    walking: false,
    facingLeft: false,
    dead: false,
    hidden: false,
    movementBlock: [false, false],
    airborneFrames: 0,

    ingame: false,
    menuTab: -1,

    //animation
    animationTimer: 0,
    animationSpeed: 5,
    deathTimer: 0,

    //values tracked to be shown at the end of a level
    deaths: 0,
    flips: 0,
    timer: {
        min: 0,
        sec: 0,
        frames: 0,
        totalFrames: 0,
    },

    //keys
    flipKeys: ["Space", "ArrowUp", "ArrowDown", "KeyW", "KeyS"],

    //misc
    lastFrame: performance.now(),

    //menu stuff
    menuBackgroundY: 0,
    menuSelectedLevel: 1,

    //space station background
    bgStars: [],
    bgStarTimer: 0,

    //tile animations
    conveyorSpriteTimer: 0,
    conveyorSpriteIndex: 1,

    //shhhh
    debug: true,
}

//spritesheet setup
let spriteSheets = {}

spriteSheets.playerSprite = new Image()
spriteSheets.playerSprite.src = "assets/sprites/playerSheet.png"

spriteSheets.tileSheet = new Image()
spriteSheets.tileSheet.src = "assets/sprites/tileSheet.png"

spriteSheets.subtextureSheet = new Image()
spriteSheets.subtextureSheet.src = "assets/sprites/subtextureSheet.png"

spriteSheets.breakingPlatformSheet = new Image()
spriteSheets.breakingPlatformSheet.src = "assets/sprites/breakingPlatformSheet.png"

spriteSheets.conveyorSheet = new Image()
spriteSheets.conveyorSheet.src = "assets/sprites/conveyorSheet.png"

spriteSheets.checkpointSheet = new Image()
spriteSheets.checkpointSheet.src = "assets/sprites/checkpointSheet.png"

//music
let music = {}

music.menu = new Audio()
music.menu.src = "assets/music/menu.ogg"
music.menu.loop = true

music.spaceStation = new Audio()
music.spaceStation.src = "assets/music/spaceStation.ogg"
music.spaceStation.loop = true

//sounds
let sounds = {}

sounds.death = new Audio()
sounds.death.src = "assets/sounds/die.wav"

sounds.flip = new Audio()
sounds.flip.src = "assets/sounds/flip.wav"

sounds.unflip = new Audio()
sounds.unflip.src = "assets/sounds/unflip.wav"

sounds.menuOption = new Audio()
sounds.menuOption.src = "assets/sounds/menu.wav"

sounds.platformBreak = new Audio()
sounds.platformBreak.src = "assets/sounds/platformBreak.wav"

sounds.gravityLine = new Audio()
sounds.gravityLine.src = "assets/sounds/gravityLine.wav"

sounds.checkpoint = new Audio()
sounds.checkpoint.src = "assets/sounds/checkpoint.wav"

//other images
let logo = new Image()
logo.src = "assets/sprites/logo.png"

let uwu = new Image()
uwu.src = "assets/sprites/cami.png"

let menuBG = new Image()
menuBG.src = "assets/sprites/menuBG.png"

//stage ids and their internal names
let stages = {
    1: "spaceStation",
    2: "test",
    3: "test",
}

//inputs
window.onclick = function() {
    if (player.menuTab == -1) {
        music.menu.play()
        player.menuTab = 0
    }
}

var pressedKeys = []
window.onkeydown = function(e) {
    pressedKeys[e.code] = true

    //console.log(e.code)

    if (player.ingame) {

        if (player.flipKeys.includes(e.code) && player.canFlip && player.airborneFrames <= 4) {
            flip(true)
        } else if (e.code == "KeyR") {
            die()
        } else if (e.code == "Backquote") {
            player.debug = !player.debug
        }

    } else {
        if (player.menuTab == 1) {
            if (e.code == "Space") {
                music.menu.pause()
                loadStage(stages[player.menuSelectedLevel])
                player.ingame = true
            } else if ((e.code == "KeyW" || e.code == "ArrowUp") && player.menuSelectedLevel > 1) {
                player.menuSelectedLevel -= 1
                sounds.menuOption.play()
            } else if ((e.code == "KeyS" || e.code == "ArrowDown") && player.menuSelectedLevel < 3) {
                player.menuSelectedLevel += 1
                sounds.menuOption.play()
            }
        } else if (player.menuTab == 0) {
            if (e.code == "Space") {
                sounds.menuOption.play()
                player.menuTab = 1
            }
        } else if (player.menuTab == -1) {
            music.menu.play()
            player.menuTab = 0
        }
    }
}
window.onkeyup = function(e) {
    pressedKeys[e.code] = false
}

function getPlrSheetPosition(id) {
    return (id - 1) * 48
}

function getTileSheetPosition(id) {
    return (id - 1) * (32 + 1)
}

//list of non-solid objects (used for checking solid ground)
let nonSolids = [
    3, 4, 5, 6, //spikes
    43, //broken breaking platform tile
    45, 46, 47, 48, //moving platform direction changers
    63, 64, //gravity lines
    65, 66, //checkpoints
    67, //start position
]

//background deco tiles always get drawn first (also not collidable btw)
let backgroundTiles = [
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, //space station
]

backgroundTiles.forEach(id => {
    nonSolids.push(id)
})

//list of tiles that kill you
let hazards = [
    3, 4, 5, 6, //spikes
]

let hitboxLeniency = {
    //spikes (no unfair deaths)
    3: [8, 0],
    4: [8, 0],
    5: [8, 0],
    6: [8, 0],

    //gravity lines (better hitboxes)
    63: [0, 12],
    64: [12, 0],
}

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function numPadding(num) {
    if (num < 10) {
        return `0${num}`
    }
    return num
}

let plrGravity = player.gravity //save it for use with gravity lines

//main function (player movement, sprite updates, etc)
function gameplayTick() {
    //clear screen
    screen.reset()

    //reset some variables
    player.onGround = false
    player.walking = false
    player.movementBlock = [false, false]

    //timer
    player.timer.totalFrames += 1
    player.timer.frames += 1
    if (player.timer.frames >= 60) {
        player.timer.frames = 0
        player.timer.sec += 1
        if (player.timer.sec >= 60) {
            player.timer.sec = 0
            player.timer.min += 1
        }
    }

    //if in the space station, render a fancy background
    if (player.stage == "spaceStation") {
        screen.fillStyle = "black"
        screen.fillRect(0, 0, canvas.width, canvas.height)

        player.bgStars.forEach((star, index) => {
            //slower stars are further away and so they move slower and are also darker
            let color = 225 - (star.speed * 15)

            screen.fillStyle = `rgb(${color}, ${color}, ${color})`
            screen.fillRect(star.x, star.y, 5, 5)

            star.x -= star.speed

            //delete it if it's outside the screen (to prevent cluttering and lag)
            if (star.x <= -32) {
                player.bgStars.splice(index, 1)
            }
        })

        //make a new star every two frames
        if (player.bgStarTimer >= 2) {
            player.bgStarTimer = 0

            let star = {
                x: canvas.width,
                y: Math.floor(Math.random() * canvas.height),
                speed: 12 - Math.floor(Math.random() * 6),
            }
            player.bgStars.push(star)
        }

        player.bgStarTimer += 1
    }

    //now the real part

    if (!player.dead) {
        //if you're alive

        //bounds check, either switch room or warp the player back up
        if (player.x < -32 && player.facingLeft) {
            if (player.room.exits && player.room.exits.left) {
                loadRoom(player.room.exits.left)
            }
            player.x = canvas.width - 24
        } else if (player.x > canvas.width - 10 && !player.facingLeft) {
            if (player.room.exits && player.room.exits.right) {
                loadRoom(player.room.exits.right)
            }
            player.x = 0
        } else if (player.y < -player.height && player.flipped) {
            if (player.room.exits && player.room.exits.up) {
                loadRoom(player.room.exits.up)
            }
            player.y = canvas.height - player.height
        } else if (player.y > canvas.height && !player.flipped) {
            if (player.room.exits && player.room.exits.down) {
                loadRoom(player.room.exits.down)
            }
            player.y = -player.height + 32
        }

        if (player.gravityLineCooldown > 0) {
            player.gravityLineCooldown -= 1
        }

        //if the player touched a gravity line, flip their gravity smoothly
        if (player.touchedGravityLine) {
            if (player.gravityLineTick == 1) {
                player.gravity -= player.gravityLineEasing
                if (player.gravity <= 0) {
                    flip(false)
                    player.gravityLineTick = 2
                }
            } else if (player.gravityLineTick == 2) {
                player.gravity += player.gravityLineEasing
                if (player.gravity >= plrGravity) {
                    player.touchedGravityLine = false
                    player.gravity = plrGravity
                    player.gravityLineTick = 1
                    player.gravityLineCooldown = 10
                }
            }
        }

        //get touching tiles, do stuff with it
        let touchingTiles = getTouchingTiles(true)
        
        touchingTiles.forEach(tile => {
            //kill the player if they touch a hazard
            if (hazards.includes(tile.id)) {
                die()
            }

            //if the player interacts with a gravity line flip them
            if ((tile.id == 63 || tile.id == 64) && !player.touchedGravityLine && player.gravityLineCooldown <= 0) {
                player.touchedGravityLine = true
                sounds.gravityLine.play()
            }

            //if it's a checkpoint set it accordingly
            if ((tile.id == 65 || tile.id == 66) && ((tile.x != player.checkpoint.x && tile.y != player.checkpoint.y) || player.checkpoint.roomId != player.room.id)) {
                player.checkpoint = {
                    roomId: player.room.id,
                    x: tile.x,
                    y: tile.y,
                    flipped: tile.id == 66
                }
                sounds.checkpoint.play()
            }
        })

        //break any breaking breaking platforms
        player.room.breakingPlatforms.forEach((pair, index) => {
            if (pair.breaking) {
                pair.spriteTimer += 1
                if (pair.spriteTimer >= 6) {
                    pair.spriteIndex += 1
                    if (pair.spriteIndex > 16) {
                        pair.platforms.forEach(tile => {
                            //change their id so they become a nonsolid object and has no collision
                            tile.id = 43
                        })
                        player.room.breakingPlatforms.splice(index, 1)
                    }
                }
            }
        })

        //move moving platforms
        player.room.movingPlatforms.forEach(pair => {
            pair.platforms.forEach(tile => {
                tile.x += pair.direction == 0 ? -4: 4
            })

            //swap direction if it's touching a direction swap tile
            pair.platforms.forEach(tile => {
                let colliding = getCollidingTiles(tile)
                colliding.forEach(otherTile => {
                    if (otherTile.id == 46 && pair.direction == 0) {
                        pair.direction = 1
                    } else if (otherTile.id == 45 && pair.direction == 1) {
                        pair.direction = 0
                    }
                })
            })
        })

        //move vertical platforms
        player.room.verticalPlatforms.forEach(pair => {
            pair.platforms.forEach(tile => {
                tile.y += pair.direction == 0 ? -4: 4
            })

            //swap direction if it's touching a direction swap tile
            pair.platforms.forEach(tile => {
                let colliding = getCollidingTiles(tile)
                colliding.forEach(otherTile => {
                    if (otherTile.id == 48 && pair.direction == 0) {
                        pair.direction = 1
                    } else if (otherTile.id == 47 && pair.direction == 1) {
                        pair.direction = 0
                    }
                })
            })
        })

        //physics (kill me please this took too god damn long)

        //wall detection
        let nearbyWalls = getWallTiles()

        if (nearbyWalls[0][0] || nearbyWalls[0][1] || nearbyWalls[0][2]) {
            player.movementBlock[0] = true //block moving left

            if (nearbyWalls[0][0]) {
                player.x = nearbyWalls[0][0].x + (32 - player.speedX / 2)
            }
            if (nearbyWalls[0][1]) {
                player.x = nearbyWalls[0][1].x + (32 - player.speedX / 2)
            }
            if (nearbyWalls[0][2]) {
                player.x = nearbyWalls[0][2].x + (32 - player.speedX / 2)
            }
        }

        if (nearbyWalls[1][0] || nearbyWalls[1][1] || nearbyWalls[1][2]) {
            player.movementBlock[1] = true //block moving right

            if (nearbyWalls[1][0]) {
                player.x = nearbyWalls[1][0].x - (32 + player.speedX)
            }
            if (nearbyWalls[1][1]) {
                player.x = nearbyWalls[1][1].x - (32 + player.speedX)
            }
            if (nearbyWalls[1][2]) {
                player.x = nearbyWalls[1][2].x - (32 + player.speedX)
            }
        }
        
        //floor detection
        if (!player.onGround) {
            let floorTiles = getFloorTiles()

            if (floorTiles[0] || floorTiles[1]) {
                player.onGround = true
                player.canFlip = true

                let floorY = 0
                if (floorTiles[0]) {
                    floorY = floorTiles[0].y
                } else {
                    floorY = floorTiles[1].y
                }

                //snap the player onto the floor bc the collisions suck but i can't be bothered to fix them properly
                if (!player.justLanded) {
                    player.justLanded = true

                    //ternary operators too confusing here :sob:
                    if (player.flipped) {
                        player.y = floorY + 32
                    } else {
                        let heightDiff = floorY - (player.y + player.height)
                        player.y += heightDiff
                    }
                }

                //if it's a conveyor, move the player (1: left, 2: right)
                let onConveyor = 0
                floorTiles.forEach(tile => {
                    if (onConveyor > 0 || tile == null) {
                        return
                    }
                    if (tile.id == 41) {
                        onConveyor = 1
                    } else if (tile.id == 42) {
                        onConveyor = 2
                    }
                })

                if (onConveyor > 0) {
                    player.x += onConveyor == 1 ? -5 : 5
                }

                //if its a breaking platform, start breaking that pair
                player.room.breakingPlatforms.forEach(pair => {
                    pair.platforms.forEach(tile => {
                        if ((tile == floorTiles[0] || tile == floorTiles[1]) && !pair.breaking) {
                            pair.breaking = true
                            pair.spriteIndex = 5
                            sounds.platformBreak.play()
                        }
                    })
                })
            }
        
            //if the player is on a moving platform consider them grounded and also move them
            player.room.movingPlatforms.forEach(pair => {
                let plrCheckY = player.flipped ? roundToGrid(player.y - (player.height / 2)) : roundToGrid(player.y + player.height)
                let xRange = {min: canvas.width, max: 0}
                let platformPosY = 0

                //get the x range of the pair first before checking if the player is on it
                pair.platforms.forEach(tile => {
                    platformPosY = tile.y
                    if (tile.x < xRange.min) {
                        xRange.min = tile.x
                    } 
                    if (tile.x > xRange.max) {
                        xRange.max = tile.x
                    } 
                })

                if ((player.x > xRange.min - player.width && player.x < xRange.max + 32) && plrCheckY == platformPosY) {
                    player.onGround = true
                    player.canFlip = true

                    if ((pair.direction == 0 && !player.movementBlock[0]) || (pair.direction == 1 && !player.movementBlock[1])) {
                        player.x += pair.direction == 0 ? -4: 4
                    }
    
                    if (player.flipped) {
                        player.y = platformPosY + 32
                    } else {
                        player.y = platformPosY - player.height
                    }
                }
            })
            
            //same deal but with vertical moving platforms

            player.room.verticalPlatforms.forEach(pair => {
                let plrCheckY = player.flipped ? roundToGrid(player.y - (player.height / 2)) : roundToGrid(player.y + player.height)
                let xRange = {min: canvas.width, max: 0}
                let platformPosY = 0

                //get the x range of the pair first before checking if the player is on it
                pair.platforms.forEach(tile => {
                    platformPosY = tile.y
                    if (tile.x < xRange.min) {
                        xRange.min = tile.x
                    } 
                    if (tile.x > xRange.max) {
                        xRange.max = tile.x
                    } 
                })

                let standingOn = false

                let yDiff = player.flipped ? -(platformPosY - player.y) : platformPosY - player.y
                
                if ((player.x > xRange.min - player.width && player.x < xRange.max + 32) && (yDiff > 0 && yDiff < 100)) {
                    player.onGround = true
                    player.canFlip = true
    
                    if (player.flipped) {
                        player.y = platformPosY + 32
                    } else {
                        player.y = platformPosY - player.height
                    }
                }
            })
        }
        

        //still not on ground?
        if (!player.onGround) {
            player.justLanded = false
            player.airborneFrames += 1

            //fall down (or up ([Extreme Demon] "Falling Up" by KrmaL | Geometry Dash))
            player.y += player.flipped ? -player.gravity : player.gravity
        } else {
            player.airborneFrames = 0
        }

        //movement
        if (((pressedKeys["ArrowLeft"] || pressedKeys["KeyA"]) && (pressedKeys["ArrowRight"] || pressedKeys["KeyD"]))) {
            //if moving both left and right, don't move at all (otherwise, handle movement as normal)
            player.walking = false
        } else if ((pressedKeys["ArrowLeft"] || pressedKeys["KeyA"]) && !player.movementBlock[0]) {
            player.x -= player.speedX
            player.animationTimer += 1
            player.walking = true
            player.facingLeft = true
        } else if ((pressedKeys["ArrowRight"] || pressedKeys["KeyD"]) && !player.movementBlock[1]) {
            player.x += player.speedX
            player.animationTimer += 1
            player.walking = true
            player.facingLeft = false
        }
    
        //stop walking animation if not moving
        if (!player.walking) {
            player.animationTimer = 0
        }
    } else {
        //if you're dead

        //update death timer, and respawn player if they've been dead for long enough
        player.deathTimer += 1
        if (player.deathTimer > 60) {
            if (player.room.id != player.checkpoint.roomId) {
                loadRoom(player.checkpoint.roomId)
            }
            player.x = player.checkpoint.x - 24
            player.y = player.checkpoint.flipped ? player.checkpoint.y : player.checkpoint.y - player.height + 32
            player.flipped = player.checkpoint.flipped

            player.deathTimer = 0
            player.dead = false
            player.canFlip = true
        }
    }

    //render room
    screen.drawImage(roomCanvas, 0, 0)

    //animated tiles (redraw these every frame bc the room is pre-loaded and wont update them)
    player.conveyorSpriteTimer += 1
    if (player.conveyorSpriteTimer >= 12) {
        player.conveyorSpriteTimer = 0
        player.conveyorSpriteIndex += 1
        if (player.conveyorSpriteIndex > 4) {
            player.conveyorSpriteIndex = 1
        }
    }
    
    screen.filter = `hue-rotate(${player.room.color.hue}deg) saturate(${player.room.color.saturation}%) brightness(${player.room.color.brightness}%)`
    player.room.tiles.forEach(tile => {
        if (tile.id == 41) {
            //conveyor going left
            screen.drawImage(spriteSheets.conveyorSheet, (player.conveyorSpriteIndex - 1) * 32, 0, 32, 32, tile.x, tile.y, 32, 32)
        } else if (tile.id == 42) {
            //conveyor going right
            screen.drawImage(spriteSheets.conveyorSheet, (player.conveyorSpriteIndex - 1) * 32, 32, 32, 32, tile.x, tile.y, 32, 32)
        }
    })

    //draw breaking platforms
    player.room.breakingPlatforms.forEach(pair => {
        pair.platforms.forEach(tile => {
            screen.drawImage(spriteSheets.breakingPlatformSheet, (pair.spriteIndex - 1) * 32, 0, 32, 32, tile.x, tile.y, 32, 32)
        })
    })

    //draw moving platforms (49 is the appearance of both moving/vertical platforms)
    player.room.movingPlatforms.forEach(pair => {
        pair.platforms.forEach(tile => {
            screen.drawImage(spriteSheets.tileSheet, getTileSheetPosition(49), 0, 32, 32, tile.x, tile.y, 32, 32)
        })
    })

    //draw vertical platforms
    player.room.verticalPlatforms.forEach(pair => {
        pair.platforms.forEach(tile => {
            screen.drawImage(spriteSheets.tileSheet, getTileSheetPosition(49), 0, 32, 32, tile.x, tile.y, 32, 32)
        })
    })

    //render checkpoints
    player.room.checkpoints.forEach(cp => {
        //no, not that kind of cp (i'm not crazen (or guitar (or jagdp)))

        let active = false
        if (cp.x == player.checkpoint.x && cp.y == player.checkpoint.y) {
            active = true
        }

        if (cp.id == 66) {
            //flipped
            screen.drawImage(spriteSheets.checkpointSheet, active ? 192 : 128, 0, 64, 64, cp.x - 24, cp.y, 48, 48)
        } else {
            //not flipped
            screen.drawImage(spriteSheets.checkpointSheet, active ? 64 : 0, 0, 64, 64, cp.x - 24, cp.y - 16, 48, 48)
        }
    })

    screen.filter = "none"

    //render player
    let sheetPosition = 0
    if (player.dead) {
        sheetPosition = player.flipped ? (player.facingLeft ? getPlrSheetPosition(12) : getPlrSheetPosition(11)) : (player.facingLeft ? getPlrSheetPosition(10) : getPlrSheetPosition(9))
    } else if (player.animationTimer > player.animationSpeed * 2) {
        //reset animation timer (to idle)
        player.animationTimer = 0
        sheetPosition = player.flipped ? (player.facingLeft ? getPlrSheetPosition(4) : getPlrSheetPosition(3)) : (player.facingLeft ? getPlrSheetPosition(2) : getPlrSheetPosition(1))
    } else if (player.animationTimer > player.animationSpeed) {
        //set animation to walking
        sheetPosition = player.flipped ? (player.facingLeft ? getPlrSheetPosition(8) : getPlrSheetPosition(7)) : (player.facingLeft ? getPlrSheetPosition(6) : getPlrSheetPosition(5))
    } else {
        sheetPosition = player.flipped ? (player.facingLeft ? getPlrSheetPosition(4) : getPlrSheetPosition(3)) : (player.facingLeft ? getPlrSheetPosition(2) : getPlrSheetPosition(1))
    }
    
    screen.drawImage(spriteSheets.playerSprite, sheetPosition, 0, 48, 84, player.x, player.y, 48, 84)

    //render room name
    screen.fillStyle = "black"
    screen.fillRect(0, canvas.height - 32, canvas.width, 32)
    
    screen.font = `24px ${player.room.font}`
    screen.fillStyle = "white"
    screen.textAlign = "center"
    screen.fillText(player.room.name, canvas.width / 2, canvas.height - 8)

    //draw fps and time
    screen.font = "16px PetMe64"
    screen.textAlign = "left"

    let currTime = performance.now()
    let fps = Math.round(1000 / (currTime - player.lastFrame))
    player.lastFrame = currTime

    screen.fillText(`FPS: ${fps}`, 0, 16)
    screen.fillText(`time: ${player.timer.min}:${numPadding(player.timer.sec)}.${numPadding(Math.floor(player.timer.frames / 60 * 100))}`, 0, 32)

    //if using debug mode draw some more info
    if (player.debug) {
        screen.fillText(`x: ${player.x}`, 0, 64)
        screen.fillText(`y: ${player.y}`, 0, 80)
        screen.fillText(`room: ${player.room.id}`, 0, 96)
        screen.fillText(`grounded: ${player.onGround}`, 0, 112)
        screen.fillText(`flipped: ${player.flipped}`, 0, 128)
        screen.fillText(`deaths: ${player.deaths}`, 0, 144)
        screen.fillText(`flips: ${player.flips}`, 0, 160)
    }
}

function roundToGrid(num) {
    return Math.round(num / 32) * 32
}

function getWallTiles() {
    //get walls near you
    //the character is nearly 3 blocks tall, so there's 3 checks for each side

    let tileLeftUp = {x: roundToGrid(player.x - 32), y: roundToGrid(player.y)}
    let tileLeftMiddle = {x: roundToGrid(player.x - 32), y: roundToGrid(player.y + 32)}
    let tileLeftDown = {x: roundToGrid(player.x - 32), y: roundToGrid(player.y + 64)}

    let tileRightUp = {x: roundToGrid(player.x + 32), y: roundToGrid(player.y)}
    let tileRightMiddle = {x: roundToGrid(player.x + 32), y: roundToGrid(player.y + 32)}
    let tileRightDown = {x: roundToGrid(player.x + 32), y: roundToGrid(player.y + 64)}

    let walls = [[null, null, null], [null, null, null]]

    player.room.tiles.forEach(tile => {
        if (nonSolids.includes(tile.id)) {
            return
        }

        //collisions left wall
        if (tile.x == tileLeftUp.x && tile.y == tileLeftUp.y) {
           let xDiff = player.x - tile.x
           if (xDiff < 32) {
            walls[0][0] = tile
           }
        }
        if (tile.x == tileLeftMiddle.x && tile.y == tileLeftMiddle.y) {
            let xDiff = player.x - tile.x
            if (xDiff < 32) {
                walls[0][1] = tile
            }
         }
         if (tile.x == tileLeftDown.x && tile.y == tileLeftDown.y) {
            let xDiff = player.x - tile.x
            if (xDiff < 32) {
                walls[0][2] = tile
            }
         }

         //collisions right wall (a lot simpler wow)
         if (tile.x == tileRightUp.x && tile.y == tileRightUp.y) {
            walls[1][0] = tile
         }
         if (tile.x == tileRightMiddle.x && tile.y == tileRightMiddle.y) {
             walls[1][1] = tile
          }
          if (tile.x == tileRightDown.x && tile.y == tileRightDown.y) {
             walls[1][2] = tile
          }
    })

    return walls
}

function getFloorTiles() {
    //get the floor tiles the player is standing on

    let tileLeft = {x: roundToGrid(player.x - 8), y: player.flipped ? roundToGrid(player.y - (player.height / 2)) : roundToGrid(player.y + player.height)}
    let tileRight = {x: roundToGrid(player.x + player.width - 24), y: player.flipped ? roundToGrid(player.y - (player.height / 2)) : roundToGrid(player.y + player.height)}

    let solidGround = [null, null]

    player.room.tiles.forEach(tile => {
        if (nonSolids.includes(tile.id)) {
            return
        }

        if (tile.x == tileLeft.x && tile.y == tileLeft.y) {
           solidGround[0] = tile //standing on a block to your left
        }
        if (tile.x == tileRight.x && tile.y == tileRight.y) {
            solidGround[1] = tile //standing on a block to your right
         }
    })

    return solidGround
}

function getTouchingTiles(noSolids) {
    //whatever tiles the player is interacting with

    let interacting = []
    player.room.tiles.forEach(tile => {
        if (noSolids && !nonSolids.includes(tile.id)) {
            return
        }

        //todo: rewrite this because it sucks ass

        let tileCenterX = tile.x + 16
        let tileCenterY = tile.y + 16

        let leniency = [0, 0]

        if (hitboxLeniency[tile.id]) {
            leniency = hitboxLeniency[tile.id]
        }

        if (player.x < tileCenterX + (16 - leniency[0]) && player.x + player.width > tileCenterX - leniency[0] && player.y < tileCenterY + (16 - leniency[1]) && player.y + player.height > tileCenterY - leniency[1]) {
            interacting.push(tile)
        }
    })

    return interacting
}

function getCollidingTiles(tile) {
    //whatever tiles the specified tile is interacting with
    let interacting = []

    player.room.tiles.forEach(otherTile => {
        if (tile == otherTile) {
            return
        }

        if (tile.x < otherTile.x + 32 && tile.x + 32 > otherTile.x && tile.y < otherTile.y + 32 && tile.y + 32 > otherTile.y) {
            interacting.push(otherTile)
        }
    })

    return interacting
}

function flip(self) {
    if (player.dead) {
        return
    }

    player.flipped = !player.flipped
    
    if (self) {
        player.flips += 1
        player.canFlip = false

        if (player.flipped) {
            sounds.unflip.play()
        } else {
            sounds.flip.play()
        }
    }
}

function die() {
    if (player.dead) {
        return
    }
    
    player.dead = true
    player.deaths += 1
    sounds.death.play()
}

function loadStage(stageName) {
    //loading json files in html is so annoying omfg
    fetch(`stages/${stageName}.json`).then(response => response.json()).then(stageData => {
        player.stage = stageName
        player.stageData = stageData
        player.checkpoint = {
            stage: stageName,
            roomId: 1,
            x: stageData.spawn.x,
            y: stageData.spawn.y,
            flipped: false,
        }

        player.x = stageData.spawn.x
        player.y = stageData.spawn.y

        if (music[stageName]) {
            music[stageName].play()
        }

        //spawn the player at a start position if one exists
        let spawnPosition = false

        Object.keys(stageData.rooms).forEach(id => {
            stageData.rooms[id].roomData.forEach(tile => {
                if (tile.id == 67 && !pressedKeys["KeyQ"]) {
                    spawnPosition = true

                    player.x = tile.x
                    player.y = tile.y - player.height + 32

                    player.checkpoint = {
                        stage: stageName,
                        roomId: id,
                        x: tile.x,
                        y: tile.y,
                        flipped: false,
                    }

                    loadRoom(id)

                    return
                }
            })
        })

        //if no spawn position, spawn at start of stage
        if (!spawnPosition) {
            loadRoom(1)
        }
    });
}


function loadRoom(roomId) {
    let roomData = player.stageData.rooms[roomId]

    player.room.id = roomId
    player.room.name = roomData.name

    if (roomData.color) {
        player.room.color = roomData.color
    }

    player.room.exits = roomData.exits || {}

    player.room.font = roomData.font || "PetMe64"

    player.room.tiles = roomData.roomData
    let tiles = roomData.roomData

    /*
        the room screen only gets drawn once, to a seperate canvas, when the room loads
        then gets copied over to the actual screen
        i do this because redrawing it every frame absolutely destroys the framerate
        it's messy but it works ok i don't want to touch this anymore
    */

    roomScreen.reset()
    roomScreen.filter = `hue-rotate(${player.room.color.hue}deg) saturate(${player.room.color.saturation}%) brightness(${player.room.color.brightness}%)`

    player.room.breakingPlatforms = []
    player.room.movingPlatforms = []
    player.room.verticalPlatforms = []
    player.room.checkpoints = []
    
    let bgDecoTiles = []

    //preprocessing before actually drawing tiles
    tiles.sort((a, b) => b.x - a.x) //fix moving platform detection randomly being wonky asf

    tiles.forEach(tile => {
        if (tile.id == 39 || tile.id == 44) {
            if (tile.originalPosition) {
                tile.x = tile.originalPosition.x
                tile.y = tile.originalPosition.y
            } else {
                tile.originalPosition = {x: tile.x, y: tile.y}
            }
        } else if (backgroundTiles.includes(tile.id)) {
            bgDecoTiles.push(tile)
        }
    })

    //draw background deco first (they dont have subtextures btw)
    bgDecoTiles.forEach(tile => {
        roomScreen.drawImage(spriteSheets.tileSheet, getTileSheetPosition(tile.id), 0, 32, 32, tile.x, tile.y, 32, 32)
    })

    //draw everything else, as well as handling stuff like special platform pairs

    tiles.forEach(tile => {
        if (tile.x > canvas.width || tile.x <= -32) {
            return
        }

        if (backgroundTiles.includes(tile.id)) {
            return
        }

        if (tile.id == 43) {
            tile.id = 40
        }

        //special interactions for tiles, if it's not special then just draw it normally
        if (tile.id == 40) {
            //breaking platform
            //get the pair this tile is in, then store it (there's probably a better way for this but WHATEVER))

            if (tile.breakingPlatformPaired) {
                return
            }

            let pair = {breaking: false, spriteTimer: 0, spriteIndex: 1, platforms: [tile]}
            let tileToLookFrom = tile
            let missing = false

            while(!missing) {
                let found = false
                tiles.forEach(otherTile => {
                    if (otherTile.id == 43) {
                        otherTile.id = 40
                    }
                    if (otherTile == tileToLookFrom || otherTile.id != 40) {
                        return
                    }
                    if (otherTile.x == tileToLookFrom.x - 32 && otherTile.y == tileToLookFrom.y) {
                        found = true
                        pair.platforms.push(otherTile)
                        otherTile.breakingPlatformPaired = true
                        tileToLookFrom = otherTile
                    }
                })
                if (!found) {
                    missing = true
                }
            }

            player.room.breakingPlatforms.push(pair)
        } else if (tile.id == 39) {
            //moving platforms
            //same as breaking platforms (yes it's still stupid)
            
            if (tile.movingPlatformPaired) {
                return
            }

            let pair = {direction: 1, platforms: [tile]}
            let tileToLookFrom = tile
            let missing = false

            while(!missing) {
                let found = false
                tiles.forEach(otherTile => {
                    if (otherTile == tileToLookFrom || otherTile.id != 39) {
                        return
                    }
                    if (otherTile.x == tileToLookFrom.x - 32 && otherTile.y == tileToLookFrom.y) {
                        found = true
                        pair.platforms.push(otherTile)
                        otherTile.movingPlatformPaired = true
                        tileToLookFrom = otherTile
                    }
                })
                if (!found) {
                    missing = true
                }
            }

            player.room.movingPlatforms.push(pair)
        } else if (tile.id == 44) {
            //vertical platforms
            //same deal again (this is so dumb)
            
            if (tile.verticalPlatformPaired) {
                return
            }

            let pair = {direction: 1, platforms: [tile]}
            let tileToLookFrom = tile
            let missing = false

            while(!missing) {
                let found = false
                tiles.forEach(otherTile => {
                    if (otherTile == tileToLookFrom || otherTile.id != 44) {
                        return
                    }
                    if (otherTile.x == tileToLookFrom.x - 32 && otherTile.y == tileToLookFrom.y) {
                        found = true
                        pair.platforms.push(otherTile)
                        otherTile.verticalPlatformPaired = true
                        tileToLookFrom = otherTile
                    }
                })
                if (!found) {
                    missing = true
                }
            }

            player.room.verticalPlatforms.push(pair)
        } else if (tile.id == 45 || tile.id == 46 || tile.id == 47 || tile.id == 48) {
            //special objects only used for moving platforms
        } else if (tile.id == 65 || tile.id == 66) {
            //checkpoints, rendered seperately
            player.room.checkpoints.push(tile)
        } else if (tile.id == 67) {
            //start position
        } else if (tile.id == 68) {
            //simply an invisible tile, nothing else to it
        } else {
            roomScreen.drawImage(spriteSheets.tileSheet, getTileSheetPosition(tile.id), 0, 32, 32, tile.x, tile.y, 32, 32)
            if (tile.subtexture) {
                roomScreen.drawImage(spriteSheets.subtextureSheet, getTileSheetPosition(tile.subtexture), 0, 32, 32, tile.x, tile.y, 32, 32)
            }
        }
    })
    roomScreen.filter = "none"
}

function menuTick() {
    screen.reset()

    if (player.menuTab == -1) {
        //"Uncaught (in promise) DOMException: play() failed because the user didn't interact with the document first."
        //🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓🤓
    
        screen.fillStyle = "black"
        screen.fillRect(0, 0, canvas.width, canvas.height)

        screen.font = "32px PetMe64"
        screen.fillStyle = "white"
        screen.textAlign = "center"

        screen.fillText("press any key to start!", canvas.width / 2, canvas.height / 2)
        return
    }

    //render background
    screen.drawImage(menuBG, 0, -player.menuBackgroundY)
    player.menuBackgroundY += 2
    if (player.menuBackgroundY >= 2880) {
        player.menuBackgroundY = 0
    }

    //render logo
    screen.drawImage(logo, canvas.width / 2 - logo.width / 2, player.menuTab == 1 ? 100 : 250)

    //me!!!
    screen.drawImage(uwu, 0, 0, 48, 48, 8, canvas.height - 64 + 8, 64, 64)

    //draw level select / play thing
    screen.font = "24px PetMe64"
    screen.fillStyle = "white"
    screen.textAlign = "center"

    if (player.menuTab == 1) {
        screen.font = "32px PetMe64"
        screen.fillStyle = "aqua"
        screen.fillText("select level:", canvas.width / 2, 225)

        screen.font = "24px PetMe64"
        screen.fillStyle = "white"

        screen.fillText(player.menuSelectedLevel == 1 ? "[SPACE STATION]" : "space station", canvas.width / 2, 350)
        screen.fillText(player.menuSelectedLevel == 2 ? "[LABORATORY]" : "laboratory", canvas.width / 2, 400)
        screen.fillText(player.menuSelectedLevel == 3 ? "[WARP ZONE]" : "warp zone", canvas.width / 2, 450)
    } else {
        screen.fillStyle = "aqua"
        screen.fillText("press [SPACE] to play", canvas.width / 2, canvas.height - 250)
    }
}

//runs 60 times a second (60FPS)
function main() {
    if (player.ingame) {
        gameplayTick()
    } else {
        menuTick()
    }

    //once whatever we did is done, draw everything we rendered to the screen
    realScreen.reset()
    realScreen.drawImage(tempCanvas, 0, 0)

   requestAnimationFrame(main)
   //setTimeout(main, 100)
}

main()
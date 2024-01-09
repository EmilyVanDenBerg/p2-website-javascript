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
let editor = {
    cursor: {x: 0, y: 0},
    tileId: 1,
    subtexture: 0,
    tiles: [],
    viewControls: false,
    shifting: false,
    shift: {
        start: {x: 0, y: 0},
        end: {x: 0, y: 0},
    },
    color: {"hue": 0, "saturation": 100, "brightness": 100},
    debugInfo: false,
    layer: 0,
}

let cursor = new Image()
cursor.src = "assets/sprites/editorCursor.png"

let grid = new Image()
grid.src = "assets/sprites/editorGrid.png"

//spritesheet setup
let spriteSheets = {}

spriteSheets.playerSprite = new Image()
spriteSheets.playerSprite.src = "assets/sprites/playerSheet.png"

spriteSheets.tileSheet = new Image()
spriteSheets.tileSheet.src = "assets/sprites/tileSheet.png"

spriteSheets.subtextureSheet = new Image()
spriteSheets.subtextureSheet.src = "assets/sprites/subtextureSheet.png"

let objAmount = 68

//inputs
let pressedKeys = []
let arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
window.onkeydown = function(e) {
    pressedKeys[e.code] = true
    
    if (editor.viewControls && e.code != "KeyR") {
        return
    }

    //console.log(e.code)

    if (e.code == "KeyA") {
        editor.cursor.x -= 32
        if (editor.shifting && (editor.shift.end.x - editor.shift.start.x) > 32) {
            editor.shift.end.x -= 32
        }
    } else if (e.code == "KeyD") {
        editor.cursor.x += 32
        editor.shift.end.x += 32
    } else if (e.code == "KeyW") {
        editor.cursor.y -= 32
        if (editor.shifting && (editor.shift.end.y - editor.shift.start.y) > 32) {
            editor.shift.end.y -= 32
        }
    } else if (e.code == "KeyS") {
        editor.cursor.y += 32
        editor.shift.end.y += 32
    } else if (e.code == "ArrowLeft" && editor.tileId > 1 && !editor.shifting) {
        editor.tileId -= 1
    } else if (e.code == "ArrowRight" && editor.tileId < objAmount && !editor.shifting) {
        editor.tileId += 1
    } else if (e.code == "KeyQ" && editor.subtexture > 0) {
        editor.subtexture -= 1
    } else if (e.code == "KeyE" && editor.subtexture < 24) {
        editor.subtexture += 1
    } else if (e.code == "Space") {
        if (editor.shifting) {
            shiftAction("place")
        } else {
            let object = {
                id: editor.tileId,
                x: editor.cursor.x,
                y: editor.cursor.y,
            }

            placeObject(object)
        }
    } else if (e.code == "KeyX") {
        if (editor.shifting) {
            shiftAction("delete")
        } else {
            let object = {
                x: editor.cursor.x,
                y: editor.cursor.y,
            }

            deleteObject(object)
        }
    } else if (arrowKeys.includes(e.code) && editor.shifting) {
        shiftAction("move", {key: e.code})
    } else if (e.code == "KeyR") {
        editor.viewControls = !editor.viewControls
    } else if (e.code == "KeyT") {
        exportRoom()
    } else if (e.code == "KeyY") {
        editor.cursor = {x: 0, y: 0}
    } else if (e.code == "ShiftLeft") {
        editor.shift = {
            start: {x: editor.cursor.x, y: editor.cursor.y},
            end: {x: editor.cursor.x, y: editor.cursor.y},
        }
        editor.shifting = true
    } else if (e.code == "KeyU") {
        if (confirm("you sure?")) {
            editor.tiles = []
            drawRoom()
        }
    } else if (e.code == "KeyI") {
        swapColor()
    } else if (e.code == "KeyO") {
        editor.debugInfo = !editor.debugInfo
    } else if (e.code == "KeyP") {
        let id = prompt("tile id?")
        if (parseInt(id) != NaN && parseInt(id) != null && parseInt(id) != "" && id <= objAmount) {
            editor.tileId = parseInt(id)
        } else {
            editor.tileId = 1
        }
    } else if (e.code == "Minus" && editor.layer > 0) {
        editor.layer -= 1
        drawRoom()
    } else if (e.code == "Equal") {
        editor.layer += 1
        drawRoom()
    } else if (e.code == "BracketLeft") {
        let swap = prompt("swap ids? [old/new]").split("/")
        editor.tiles.forEach(tile => {
            if (tile.id == swap[0]) {
                tile.id = swap[1]
            }
        })
        drawRoom()
    }
}
window.onkeyup = function(e) {
    pressedKeys[e.code] = false

    if (e.code == "ShiftLeft") {
        editor.shifting = false
    }
}

function swapColor() {
    let color = prompt("new color? [h,s,v]")
    if (color == "" || color == null) {
        editor.color = {"hue": 0, "saturation": 100, "brightness": 100}
    } else {
        color = color.split(",")
        editor.color = {"hue": color[0], "saturation": color[1], "brightness": color[2]}
    }
    drawRoom()
}
function shiftAction(type, extra) {
    if (type == "place") {
        for (x = editor.shift.start.x; x <= editor.shift.end.x; x += 32) {
            for (y = editor.shift.start.y; y <= editor.shift.end.y; y += 32) {
                let object = {
                    id: editor.tileId,
                    x: x,
                    y: y,
                }
    
                placeObject(object)
            }
        }
    } else if (type == "delete") {
        for (x = editor.shift.start.x; x <= editor.shift.end.x; x += 32) {
            for (y = editor.shift.start.y; y <= editor.shift.end.y; y += 32) {
                let object = {
                    x: x,
                    y: y,
                }
    
                deleteObject(object)
            }
        }
    } else if (type == "move") {
        let objects = []

        //this is inefficient as balls i think but whatever
        for (x = editor.shift.start.x; x <= editor.shift.end.x; x += 32) {
            for (y = editor.shift.start.y; y <= editor.shift.end.y; y += 32) {
                editor.tiles.forEach(tile => {
                    if (tile.x == x && tile.y == y && tile.layer == editor.layer) {
                        objects.push(tile)
                    }
                })
            }
        }

        switch(extra.key) {
            case "ArrowUp":
                editor.shift.start.y -= 32
                editor.shift.end.y -= 32
                objects.forEach(tile => {
                    tile.y -= 32
                })
                break
            case "ArrowDown":
                editor.shift.start.y += 32
                editor.shift.end.y += 32
                objects.forEach(tile => {
                    tile.y += 32
                })
                break
            case "ArrowLeft":
                editor.shift.start.x -= 32
                editor.shift.end.x -= 32
                objects.forEach(tile => {
                    tile.x -= 32
                })
                break
            case "ArrowRight":
                editor.shift.start.x += 32
                editor.shift.end.x += 32
                objects.forEach(tile => {
                    tile.x += 32
                })
                break
        }
        drawRoom()
    }
}

function getPlrSheetPosition(id) {
    return (id - 1) * 48
}

function getTileSheetPosition(id) {
    return (id - 1) * (32 + 1)
}

function isValidPlacement(location, layer) {
    return !editor.tiles.some(tile => tile.x == location.x && tile.y == location.y && tile.layer == editor.layer)
}

function drawRoom() {
    roomScreen.reset()
    roomScreen.filter = `hue-rotate(${editor.color.hue}deg) saturate(${editor.color.saturation}%) brightness(${editor.color.brightness}%)`

    editor.tiles.forEach(tile => {
        roomScreen.globalAlpha = tile.layer == editor.layer ? 1 : 0.25
        roomScreen.drawImage(spriteSheets.tileSheet, getTileSheetPosition(tile.id), 0, 32, 32, tile.x, tile.y, 32, 32)
        if (tile.subtexture) {
           roomScreen.drawImage(spriteSheets.subtextureSheet, getTileSheetPosition(tile.subtexture), 0, 32, 32, tile.x, tile.y, 32, 32)
        }
    })

    roomScreen.filter = "none"
}

function deleteObject(object) {
    editor.tiles.forEach((tile, index) => {
        if (tile.x == object.x && tile.y == object.y && editor.layer == tile.layer) {
            editor.tiles.splice(index, 1)
        }
    })
    drawRoom()
}

function placeObject(object) {
    if (isValidPlacement(editor.cursor, editor.layer)) {
        if (editor.subtexture > 0) {
            object.subtexture = editor.subtexture
        }

        object.layer = editor.layer

        editor.tiles.push(object)
        drawRoom()
    }
}

function exportRoom() {
    let str = ""

    editor.tiles.forEach(tile => {
        str += `{"id": ${tile.id}, "x": ${tile.x}, "y": ${tile.y}, "layer": ${tile.layer}`
        if (tile.subtexture) {
            str += `, "subtexture": ${tile.subtexture}`
        }
        str += "},\n"
    })

    str = str.slice(0, -2)
    navigator.clipboard.writeText(str)
    alert("saved to clipboard :3")
}

//main function
function tick() {
    //clear screen
    screen.reset()

    //render grid
    for (x = 0; x <= canvas.width; x += 32) {
        for (y = 0; y <= canvas.height; y += 32) {
            screen.drawImage(grid, x, y)
        }
    }

    //render room
    screen.drawImage(roomCanvas, 0, 0)

    //render shift
    if (editor.shifting) {
        screen.globalAlpha = 0.25

        screen.fillStyle = "white"
        screen.fillRect(editor.shift.start.x, editor.shift.start.y, (editor.shift.end.x - editor.shift.start.x) + 32, (editor.shift.end.y - editor.shift.start.y) + 32)
        screen.globalAlpha = 1
    }

    //draw selected icon
    screen.globalAlpha = 0.5
    screen.filter = `hue-rotate(${editor.color.hue}deg) saturate(${editor.color.saturation}%) brightness(${editor.color.brightness}%)`

    screen.drawImage(spriteSheets.tileSheet, getTileSheetPosition(editor.tileId), 0, 32, 32, editor.cursor.x, editor.cursor.y, 32, 32)
    if (editor.subtexture > 0) {
        screen.drawImage(spriteSheets.subtextureSheet, getTileSheetPosition(editor.subtexture), 0, 32, 32, editor.cursor.x, editor.cursor.y, 32, 32)
    }

    screen.globalAlpha = 1
    screen.filter = "none"

    //render cursor
    screen.drawImage(cursor, editor.cursor.x, editor.cursor.y)

    //render room name
    screen.fillStyle = "black"
    screen.fillRect(0, canvas.height - 32, canvas.width, 32)

    screen.font = "24px PetMe64"
    screen.fillStyle = "white"
    screen.textAlign = "center"
    screen.fillText("controls: [R]", canvas.width / 2, canvas.height - 8)

    //render debug crap
    if (editor.debugInfo) {
        screen.font = "16px PetMe64"
        screen.textAlign = "left"

        screen.fillText(`tile id: ${editor.tileId}`, 0, 16)
        screen.fillText(`subtexture id: ${editor.subtexture}`, 0, 32)
        screen.fillText(`color: ${editor.color.hue},${editor.color.saturation},${editor.color.brightness}`, 0, 48)
        screen.fillText(`cursor: ${editor.cursor.x},${editor.cursor.y}`, 0, 64)
        screen.fillText(`layer: ${editor.layer}`, 0, 80)
        screen.fillText(`shift: ${editor.shift.start.x},${editor.shift.start.y} ${editor.shift.end.x},${editor.shift.end.y}`, 0, 96)
    }

    //view controls
    if (editor.viewControls) {
        screen.fillStyle = "black"
        screen.fillRect(0, 0, canvas.width, canvas.height)

        screen.font = "32px PetMe64"
        screen.fillStyle = "white"
        screen.textAlign = "center"
        screen.fillText("- editor controls -", canvas.width / 2, 50)

        screen.font = "24px PetMe64"
        screen.fillText("move cursor: W/A/S/D", canvas.width / 2, 125)
        screen.fillText("select tile: < arrow keys >", canvas.width / 2, 150)
        screen.fillText("select subtexture: Q/E", canvas.width / 2, 175)
        screen.fillText("place object: space", canvas.width / 2, 200)
        screen.fillText("delete object: X", canvas.width / 2, 225)
        screen.fillText("view controls: R", canvas.width / 2, 250)
        screen.fillText("export room: T", canvas.width / 2, 275)
        screen.fillText("return cursor to 0, 0: Y", canvas.width / 2, 300)
        screen.fillText("empty level: U", canvas.width / 2, 325)
        screen.fillText("change color: I", canvas.width / 2, 350)
        screen.fillText("toggle debug info: O", canvas.width / 2, 375)
        screen.fillText("set tile id: P", canvas.width / 2, 400)
        screen.fillText("change layer: -/+", canvas.width / 2, 425)
        screen.fillText("swap tileset: [", canvas.width / 2, 450)
    }

    //draw everything to the actual screen now (everything else is drawn in a temporary canvas first to prevent flickering)
    realScreen.reset()
    realScreen.drawImage(tempCanvas, 0, 0)
}

let objProperties = {
    "1": "id",
    "2": "x",
    "3": "y",
    "4": "subtexture",
    "5": "solid",
}

function loadRoom(roomData) {
    let tiles = []

    roomData.roomData.forEach(tile => {
        if (!tile.layer) {
            tile.layer = 0
        }
    })
    
    editor.tiles = roomData.roomData
    editor.color = roomData.color
    drawRoom()
}

//runs 60 times a second (60FPS)
function main() {
    tick()

   requestAnimationFrame(main)
}

let emptyRoom = false
if (!emptyRoom) {
    fetch("stages/spaceStation.json").then(response => response.json()).then(stageData => {
        loadRoom(stageData.rooms["19"])
    });
}

main()

/* room template

"id": {
    "name": "meow",
    "color": {"hue": 274, "saturation": 70, "brightness": 125},
    "roomData": [

    ]
}

end off space station:
- emergency exit tunnel room, go right
- death moon ending style entrance
- teleporter ending room
*/
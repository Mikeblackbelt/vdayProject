import * as THREE from 'three';
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as COLOR from './colors.js'; 
import {obstacleDict,  spawnDict, checkSpawnCollision, checkAllSpawnCollisions, sphereObstacleDict} from './obstacleDict.js'; 
import { FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import { modelDirection, pass } from 'three/tsl';
import {loadFlower} from '/modelLogic.js'
import { io } from "socket.io-client";
const socket = io("https://vdayproject2.onrender.com");
const otherPlayers = {};
let playerHoldingFlower = null;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffb3d9); // Pink background

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const loader = new GLTFLoader();

let modelDict = []
let flower = null;
let flowerLoaded = false;

loadFlower(scene, (loadedFlower) => {
    flower = loadedFlower;
    flowerLoaded = true;
    modelDict.push(flower);
    console.log('Flower loaded successfully:', flower);
    console.log('Flower position:', flower.position);
    console.log('Flower in modelDict:', modelDict);
});

function detectModelCollision(sphereCenter) {
    let intersections = []
    if (!flowerLoaded || modelDict.length === 0) {
        return false;
    }
    
    for (let model of modelDict) {
        if (!model || !model.position) {
            console.warn('Invalid model in modelDict:', model);
            continue;
        }
        
        // Use a larger collision box for easier pickup
        const collisionSize = new THREE.Vector3(0.3, 0.3, 0.3); // Increased from 0.5 and then decreased from 1... 
        const collision = checkSphereBoxCollision(sphereCenter, 0.5, model.position, collisionSize);
        
        if (collision) {
            intersections.push(model);
            console.log('Collision detected with model at:', model.position);
        }
    }
    
    if (intersections.length == 0) {
        return false;
    }
    else {
        return intersections;
    }
}

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Create a canvas to draw the face
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext('2d');

let placementMode = true; //change in prod
const tempObstacles = [];
//setup for temporary obstacles


// Fill with blue background
ctx.fillStyle = '#4a90e2';
ctx.fillRect(0, 0, 256, 256);

// Draw eyes
ctx.fillStyle = '#ff09daff';
ctx.beginPath();
ctx.arc(80, 80, 15, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.arc(176, 80, 15, 0, Math.PI * 2);
ctx.fill();

// Draw smile (arc)
ctx.strokeStyle = '#000000';
ctx.lineWidth = 8;
ctx.beginPath();
ctx.arc(128, 128, 60, 0.2 * Math.PI, 0.8 * Math.PI);
ctx.stroke();

//  texture from canvas
const texture = new THREE.CanvasTexture(canvas);

// gameing chafacter- reduce segments for better performance
const geometry = new THREE.SphereGeometry( 0.5, 16, 16 ); // Reduced from 32,32 to 16,16
const material = new THREE.MeshBasicMaterial({ map: texture });
const sphere = new THREE.Mesh( geometry, material );
sphere.position.y = 0.5;
scene.add( sphere );


function createOtherPlayer(id) {
    const geo = new THREE.SphereGeometry(0.5, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.5; // FIX: Set initial Y position
    scene.add(mesh);
    otherPlayers[id] = mesh;
    console.log('Created other player:', id, 'at position:', mesh.position);
    return mesh;
}

// Current players
socket.on("currentPlayers", (players) => {
    console.log("currentPlayers event received:", players);
    for (let id in players) {
        if (id !== socket.id) {
            const mesh = createOtherPlayer(id);
            mesh.position.set(players[id].x, players[id].y, players[id].z);
            console.log('Set existing player position:', id, players[id]);
        }
    }
});

// New player joins
socket.on("newPlayer", (data) => {
    console.log("newPlayer event received:", data);
    if (data.id !== socket.id) { // FIX: Don't create self
        const mesh = createOtherPlayer(data.id);
        mesh.position.set(data.x, data.y, data.z);
    }
});

// Player movement
socket.on("playerMoved", (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].position.set(data.x, data.y, data.z);
    }
});

// Player disconnects
socket.on("playerDisconnected", (id) => {
    console.log("Player disconnected:", id);
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id]);
        delete otherPlayers[id];
    }
});


socket.on("flowerPickedUp", (data) => {
    console.log('____PICKUP_____');
    console.log(' ID who picked up:', data.id);
    console.log('socket ID:', socket.id);
    console.log('Is it me?', data.id === socket.id);
    console.log('Other players:', Object.keys(otherPlayers));
    
    playerHoldingFlower = data.id;
    console.log('Set playerHoldingFlower to:', playerHoldingFlower);
});

socket.on("flowerDropped", () => {
    console.log('=== FLOWER DROPPED EVENT ===');
    playerHoldingFlower = null;
    console.log('Flower dropped/reset');
});



function playerCollisionCheck() {
    for (let id in otherPlayers) {
        if (checkSphereBoxCollision(sphere.position, 0.5, otherPlayers[id].position, new THREE.Vector3(0.5,0.5,0.5))) {
            console.log('Collided with player', id);
            return id;
        }
    }
}

//start pos
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

let cameraDistance = 7;
let cameraAngleH = Math.PI / 4; // horizontal angle (around Y axis) in radians
let cameraAngleV = Math.PI / 4; // vertical angle (elevation) in radians

// control
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

let moveSpeed = 0.101;
const keys = {};

var jumpResolved = true;
var VelocityY = 0;
var velocityX = 0;
var velocityZ = 0;
var AccelerationY = 0.0098;  //this represents downward acceleration due to gravity
var AccelerationX = 0.006; //this represents time it takes to accelrate, deaccleration time is greater by a bit so ill multiply by a arbitary constant
var AccelerationZ = 0.006; //see above ^_^
const groundLevel = -999; //this is not an important variable :3
const sphereRadius = 0.5;

function jump(){
    if (jumpResolved) {
        VelocityY = 0.2; // v_y =  v_i - at
        jumpResolved = false;
    }
}

window.addEventListener('keydown', (e) => { 
    keys[e.key] = true;
    if (e.key === ' ') jump();
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// camera drag ~_~
window.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMouseX = e.clientX;
    previousMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMouseX; // change in x/y 
        const deltaY = e.clientY - previousMouseY;
        
        cameraAngleH -= deltaX * 0.005; // Horizontal rotation
        cameraAngleV -= deltaY * 0.005; // Vertical rotation
        
        // max angle is abt 180 degrees (looking straight down), min is 0 (looking straight up)
        cameraAngleV = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleV));
        
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    }
});

// Mouse wheel for zoom
window.addEventListener('wheel', (e) => {
    cameraDistance += e.deltaY * 0.01;
    cameraDistance = Math.max(2, Math.min(20, cameraDistance)); // d in [2,20]
});

//loop thru obstacles and add to scene, refer to line 13
const obstacles = [];
for (let obstacle of obstacleDict) {
    const obstacleGeometry = new THREE.BoxGeometry( obstacle[3], obstacle[4], obstacle[5] );
    const obstacleMaterial = new THREE.MeshLambertMaterial( { emissive: obstacle[6] } );
    const obstacleMesh = new THREE.Mesh( obstacleGeometry, obstacleMaterial );
    obstacleMesh.position.set(obstacle[0], obstacle[1], obstacle[2]);
    scene.add( obstacleMesh );
    obstacles.push({
        mesh: obstacleMesh,
        halfExtents: new THREE.Vector3(obstacle[3]/2, obstacle[4]/2, obstacle[5]/2)
    });
}

for (let obstacle of sphereObstacleDict) {
    const obstacleGeometry = new THREE.SphereGeometry( obstacle[3], 16, 16);
    const obstacleMaterial = new THREE.MeshLambertMaterial({emissive: obstacle[4]});
    const obstacleMesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacleMesh.position.set(obstacle[0],obstacle[1],obstacle[2]);
    scene.add(obstacleMesh);
    obstacles.push({
        mesh: obstacleMesh,
        halfExtents: new THREE.Vector3(obstacle[3]/2, obstacle[3]/2, obstacle[3]/2)
    });
}


// sphere-box collision detection
function checkSphereBoxCollision(spherePos, sphereRadius, boxPos, boxHalfExtents) {
    // Quick distance check before detailed collision
    const roughDistance = Math.abs(spherePos.x - boxPos.x) + Math.abs(spherePos.y - boxPos.y) + Math.abs(spherePos.z - boxPos.z);
    const maxPossibleDistance = sphereRadius + boxHalfExtents.x + boxHalfExtents.y + boxHalfExtents.z;
    if (roughDistance > maxPossibleDistance) return null;
    
    // Find the closest point on the box to the sphere center
    const closestPoint = new THREE.Vector3(
        Math.max(boxPos.x - boxHalfExtents.x, Math.min(spherePos.x, boxPos.x + boxHalfExtents.x)),
        Math.max(boxPos.y - boxHalfExtents.y, Math.min(spherePos.y, boxPos.y + boxHalfExtents.y)),
        Math.max(boxPos.z - boxHalfExtents.z, Math.min(spherePos.z, boxPos.z + boxHalfExtents.z))
    );
    
    // Calculate distance from sphere center to closest point
    const distance = spherePos.distanceTo(closestPoint);
    
    if (distance < sphereRadius) {
        // collision detected - calculate push-out vector
        //the vectors normalize to 0, so it doesnt move `o`
        const pushOut = new THREE.Vector3().subVectors(spherePos, closestPoint);
        if (pushOut.length() > 0) {
            pushOut.normalize().multiplyScalar(sphereRadius - distance);
        } else {
            // Sphere center is inside box - push out along the nearest axis
            const dx = Math.min(Math.abs(spherePos.x - (boxPos.x - boxHalfExtents.x)), 
                               Math.abs(spherePos.x - (boxPos.x + boxHalfExtents.x)));
            const dy = Math.min(Math.abs(spherePos.y - (boxPos.y - boxHalfExtents.y)), 
                               Math.abs(spherePos.y - (boxPos.y + boxHalfExtents.y)));
            const dz = Math.min(Math.abs(spherePos.z - (boxPos.z - boxHalfExtents.z)), 
                               Math.abs(spherePos.z - (boxPos.z + boxHalfExtents.z)));
            
            if (dx < dy && dx < dz) {
                pushOut.set(spherePos.x < boxPos.x ? -dx : dx, 0, 0);
            } else if (dy < dz) {
                pushOut.set(0, spherePos.y < boxPos.y ? -dy : dy, 0);
            } else {
                pushOut.set(0, 0, spherePos.z < boxPos.z ? -dz : dz);
            }
        }
        return pushOut;
    }
    
    return null;
}
    
const dataView = document.createElement('div'); 
dataView.style.position = 'absolute';
dataView.style.top = '10px';
dataView.style.left = '10px';
dataView.style.color = 'black';
dataView.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
dataView.style.padding = '10px';
dataView.style.fontFamily = 'Arial, sans-serif';
dataView.innerHTML = `<p>Use WASD or Arrow keys to move</p>
<p>Space to jump</p>
<p>Drag mouse to rotate camera</p>
<p>Scroll to zoom.</p>
<p>Sphere Position: ${sphere.position.x.toFixed(2)}, ${sphere.position.y > 0.01 || sphere.position.y < -0.01 ? sphere.position.y.toFixed(2) : "0.00"}, ${sphere.position.z.toFixed(2)}</p>`;
document.body.appendChild(dataView);

//this is wordy but wtv. i will probably remove this once finished. 

let lastFrameTime = performance.now();
let frameCount = 0;
let moveSpeedAdjusted = moveSpeed;

// reusable vectors to avoid creating new objects every frame
//game wont lag :3
const tempVec = new THREE.Vector3();
const cameraOffset = new THREE.Vector3();
const desiredCameraPos = new THREE.Vector3();

// cache trigonometric values
let cachedSinH = Math.sin(cameraAngleH);
let cachedCosH = Math.cos(cameraAngleH);
let cachedSinV = Math.sin(cameraAngleV);
let cachedCosV = Math.cos(cameraAngleV);
let lastCameraAngleH = cameraAngleH;
let lastCameraAngleV = cameraAngleV;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

let spawn = new THREE.Vector3(0,0,0); //spawn point,  dynamically change

// Update dataView less frequently (every 10 frames)
function updateDataView() {
    dataView.innerHTML = `<p>Use WASD or Arrow keys to move</p>
<p>Space to jump</p>
<p>Drag mouse to rotate camera</p>
<p>Scroll to zoom.</p>
<p>Sphere Position: ${sphere.position.x.toFixed(2)}, ${sphere.position.y > 0.01 || sphere.position.y < -0.01 ? sphere.position.y.toFixed(2) : "0.00"}, ${sphere.position.z.toFixed(2)}</p>
<p>Connected Players: ${Object.keys(otherPlayers).length + 1}</p>`;
}

const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.9);
scene.add(hemiLight);
//hemiLight.intensity = 0

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0xff4f44 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = -15;
scene.add(ground);

const shadowTex = new THREE.TextureLoader().load('shadow.png');
const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true });
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2), shadowMat);
shadow.rotation.x = -Math.PI/2;
scene.add(shadow);

const uiScene = new THREE.Scene();
const uiCamera = new THREE.OrthographicCamera(
    -window.innerWidth / 2,
     window.innerWidth / 2,
     window.innerHeight / 2,
    -window.innerHeight / 2,
    0,
    10
);
uiCamera.position.z = 5;

const respawnSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.TextureLoader().load('https://github.com/Mikeblackbelt/vdayProject/blob/main/image/logo%20-%20Spawn%20Point%20Set.png?raw=true'),
    transparent: true
}));
respawnSprite.position.set(0, window.innerHeight/2 - 100, 0);
respawnSprite.scale.set(200,100, 1); // pixels now
respawnSprite.material.opacity = 0;
uiScene.add(respawnSprite);

scene.fog = new THREE.FogExp2(0xffb3d9, 0.045);

let lastSpawnSet = 0;
let holdingFlowers = false;

//y has different bc of the constant change due to the force applied by gravity
function animate() {
    const currentTime = performance.now();
    const deltaTime = Math.max(2 , currentTime - lastFrameTime); //max deltatime bc out of focus
    moveSpeedAdjusted = moveSpeed * (deltaTime / 16.67);  //calc for calculating lag
    lastFrameTime = currentTime;
    
    // Update dataView only every 10 frames
    frameCount++;
    if (frameCount % 10 === 0) {
        updateDataView();
    }
    
    if (placementMode) {
        //alow obstacle placement by the user.
        //fix bug where a trillion cubes spawn 
        renderer.render( scene, camera );
        if (tempObstacles.length > 0) {
            for (let tempCube of tempObstacles) {
                scene.remove(tempCube);
            }
        }
        let obstaclePos = new THREE.Vector3();
        obstaclePos.copy(camera.position);
        obstaclePos.addScaledVector(camera.getWorldDirection(tempVec), 5);
        obstaclePos.y = sphere.position.y - 1; //place at player height
        obstaclePos.x = sphere.position.x;
        obstaclePos.z = sphere.position.z;
        let cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 ); 
        //since this doesnt place permatnely and is simply for reference, the actual scale can be adjusted
        let cubeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, opacity: 0.5, transparent: true } );
        let tempCube = new THREE.Mesh( cubeGeometry, cubeMaterial );
        tempCube.position.copy(obstaclePos);
        scene.add( tempCube );
        tempObstacles.push(tempCube);
        if (keys['Enter'] && frameCount % 10 === 0) {
            //create the obstalce in the scene for the session, after page reload will automatically disappear
            const obstacleGeometry = new THREE.BoxGeometry( 1, 1, 1 );
            const obstacleMaterial = new THREE.MeshBasicMaterial( { color: COLOR.purple} );
            const obstacleMesh = new THREE.Mesh( obstacleGeometry, obstacleMaterial );
            obstacleMesh.position.copy(obstaclePos);
            scene.add( obstacleMesh );
            obstacles.push({
                mesh: obstacleMesh,
                halfExtents: new THREE.Vector3(0.5, 0.5, 0.5)
            });
            obstacleDict.push([obstaclePos.x, obstaclePos.y, obstaclePos.z, 1, 1, 1, COLOR.purple]);
            console.log('Obstacle placed at', obstaclePos);
            console.log('Obstacles', obstacleDict);  //this line crashes the game? weird 

    
        }
    }
    
    // Update cached trig values only if angles changed
    if (lastCameraAngleH !== cameraAngleH) {
        cachedSinH = Math.sin(cameraAngleH);
        cachedCosH = Math.cos(cameraAngleH);
        lastCameraAngleH = cameraAngleH;
    }
    if (lastCameraAngleV !== cameraAngleV) {
        cachedSinV = Math.sin(cameraAngleV);
        cachedCosV = Math.cos(cameraAngleV);
        lastCameraAngleV = cameraAngleV;
    }
    
    // backward (s arrowdown)
    if (keys['ArrowDown'] || keys['s']) {
        velocityZ = Math.min(velocityZ + AccelerationZ, moveSpeedAdjusted);
    } else if (velocityZ > 0) {
        velocityZ = Math.max(velocityZ - 0.8*AccelerationZ, 0);
    }

    // forward (arrowup w)
    if (keys['ArrowUp'] || keys['w']) {
        velocityZ = Math.max(velocityZ - AccelerationZ, -moveSpeedAdjusted);
    } else if (velocityZ < 0) {
        velocityZ = Math.min(velocityZ + 0.8*AccelerationZ, 0);
    }

    //these are in reverse order bc the keys were in reverse order and its easier to just swap the conditions 

    // Left movement (A or ArrowLeft)
    if (keys['ArrowLeft'] || keys['a']) {
        velocityX = Math.max(velocityX - AccelerationX, -moveSpeedAdjusted);
    } else if (velocityX < 0) {
        velocityX = Math.min(velocityX + 0.8*AccelerationX, 0);
    }

    // Right movement (D or ArrowRight)
    if (keys['ArrowRight'] || keys['d']) {
        velocityX = Math.min(velocityX + AccelerationX, moveSpeedAdjusted);
    } else if (velocityX > 0) {
        velocityX = Math.max(velocityX - 0.8*AccelerationX, 0);
    }

    if (frameCount % 1 == 0) {
        sphere.rotateOnAxis(tempVec.set(1, 0, 0), -2.5*velocityX);
        sphere.rotateOnAxis(tempVec.set(0, 0, 1), -2.5*velocityZ);
    } //ykw even i dont know... framecount is always an integer `~`
    // move the roll outside the key checks to account for accel and deaccel
    // Apply velocities to position (transform to world space based on camera angle)
    sphere.position.z += velocityZ * cachedCosH - velocityX * cachedSinH;
    sphere.position.x += velocityZ * cachedSinH + velocityX * cachedCosH;

    let yRotation = VelocityY * 0.4;
    sphere.rotateOnAxis(tempVec.set(0, 0, 1), yRotation);

    sphere.position.y += VelocityY ;
    VelocityY -= AccelerationY * deltaTime/16.67; // apply gravity in respect to frame rate
    
    // fix: send position updates more frequently but throttled
    if (frameCount % 2 === 0) {
        socket.emit("updatePosition", {
            x: sphere.position.x,
            y: sphere.position.y,
            z: sphere.position.z
        });
    }

    // Check for flower collision only if flower is loaded, also allow stealing
    if (flowerLoaded && (!playerHoldingFlower || playerHoldingFlower === socket.id)) {
        const collision = detectModelCollision(sphere.position);
        if (collision && collision.length > 0) {
            console.log('Flower picked up!');
            playerHoldingFlower = socket.id; // set it immediately locally
            socket.emit("flowerPickedUp", { id: socket.id });
        }
    }
    
    //  only check obstacles within reasonable distance
    const checkRadius = 8; //8 unit is reasonable just dont make spheres with r > 8 and cubes with length > 16
    for (let obstacle of obstacles) {
        // quick distance check before expensive collision detection
        const dx = sphere.position.x - obstacle.mesh.position.x;
        const dy = sphere.position.y - obstacle.mesh.position.y;
        const dz = sphere.position.z - obstacle.mesh.position.z;
        const distSquared = dx*dx + dy*dy + dz*dz;
        
        // Skip if too far away
        if (distSquared > checkRadius * checkRadius) continue;
        
        const pushOut = checkSphereBoxCollision(
            sphere.position, 
            sphereRadius, 
            obstacle.mesh.position, 
            obstacle.halfExtents
        );
        
        if (pushOut) {
            sphere.position.add(pushOut);
            //console.log('Collision detected, pushing sphere out by', pushOut);
            
            // If collision is mainly vertical (hittin top or bottom), reset velocity
            if (Math.abs(pushOut.y) > Math.abs(pushOut.x) && Math.abs(pushOut.y) > Math.abs(pushOut.z)) {
                VelocityY = 0;
                if (pushOut.y > 0) {
                    jumpResolved = true; // can jump again if landed on top
                }
            }
        }
    }
    
    if (sphere.position.y <= groundLevel) {
        sphere.position.y = groundLevel;
        VelocityY = 0;
        jumpResolved = true;
    }
    
    // trig - use cached values
    cameraOffset.set(
        cameraDistance * cachedSinV * cachedSinH,
        cameraDistance * cachedCosV,
        cameraDistance * cachedSinV * cachedCosH
    );

    if (sphere.position.y < -10) {
        sphere.position.set(spawn.x, spawn.y, spawn.z);
        VelocityY = 0; 
    }
    
    desiredCameraPos.addVectors(sphere.position, cameraOffset);
    camera.position.copy(desiredCameraPos);
    camera.lookAt(sphere.position);

    let spawnIndex = checkAllSpawnCollisions(sphere.position);
    if (spawnIndex !== 0 && lastSpawnSet != spawnIndex) {
        let spawnPoint = new THREE.Vector3(...spawnDict[spawnIndex]).addScaledVector(new THREE.Vector3(0,3,0), sphereRadius + 0.1);
        spawn.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        lastSpawnSet = spawnIndex;
        console.log('Spawn point set to:', spawn);
        respawnSprite.material.opacity = 1; 
        setInterval(() => {
            respawnSprite.material.opacity -= 0.01;
            if (respawnSprite.material.opacity <= 0) {
                //console.log(' i should clear the interval :3');
                clearInterval();
            }
        }, 20);
    }

    // Update flower position - FIXED LOGIC
    if (flowerLoaded && flower) {
        if (playerHoldingFlower === socket.id) {
            // Current player is holding the flower
            flower.position.set(
                sphere.position.x, 
                sphere.position.y + 1.2, 
                sphere.position.z
            );
            flower.visible = true;
        } else if (playerHoldingFlower && otherPlayers[playerHoldingFlower]) {
            // Another player is holding the flower
            const otherPlayer = otherPlayers[playerHoldingFlower];
            flower.position.set(
                otherPlayer.position.x,
                otherPlayer.position.y + 1.2,
                otherPlayer.position.z
            );
            flower.visible = true;
        } else if (!playerHoldingFlower) {
            // No one is holding the flower - keep it at its spawn location
            flower.visible = true;
        }
    }

    renderer.autoClear = false;
    renderer.clear();
    renderer.render(scene, camera);     // 3D world
    renderer.render(uiScene, uiCamera); // UI on top
}

renderer.setAnimationLoop( animate );
//67
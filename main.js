import * as THREE from 'three';
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as COLOR from './colors.js'; 
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffb3d9); // Pink background

const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const loader = new GLTFLoader();

const obstacleDict = [[0,-1,0,10,1,10, 0xf0f00], [1,0.65,4,0.3,1.3,0.3,COLOR.blue], [-2,0.5,-3,1,1,1,COLOR.red], [3,0.5,-2,1,1,1,COLOR.green]];
//in each element should contain a 7d tuple of [x,y,z,sizeX, sizeY, sizeZ, hexColor]
//i gotta mkae this more conveint for myself :/.
// gonna be a pain in the ass to add obstacles this way. 

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Create a canvas to draw the face
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext('2d');

let placementMode = false;
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

// Create texture from canvas
const texture = new THREE.CanvasTexture(canvas);

// Create the sphere with face texture
const geometry = new THREE.SphereGeometry( 0.5, 32, 32 ); // radius 0.5, 32 segments
const material = new THREE.MeshBasicMaterial({ map: texture });
const sphere = new THREE.Mesh( geometry, material );
sphere.position.y = 0.5;
scene.add( sphere );


//start pos
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

let cameraDistance = 7;
let cameraAngleH = Math.PI / 4; // Horizontal angle (around Y axis)
let cameraAngleV = Math.PI / 4; // Vertical angle (elevation)

// Mouse drag variables
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

let moveSpeed = 0.067;
const keys = {};

var jumpResolved = true;
var VelocityY = 0;
var AccelerationY = 0.0098;
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
        cameraAngleV += deltaY * 0.005; // Vertical rotation
        
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
    const obstacleMaterial = new THREE.MeshBasicMaterial( { color: obstacle[6]} );
    const obstacleMesh = new THREE.Mesh( obstacleGeometry, obstacleMaterial );
    obstacleMesh.position.set(obstacle[0], obstacle[1], obstacle[2]);
    scene.add( obstacleMesh );
    obstacles.push({
        mesh: obstacleMesh,
        halfExtents: new THREE.Vector3(obstacle[3]/2, obstacle[4]/2, obstacle[5]/2)
    });
}

// sphere-box collision detection
function checkSphereBoxCollision(spherePos, sphereRadius, boxPos, boxHalfExtents) {
    // Find the closest point on the box to the sphere center
    const closestPoint = new THREE.Vector3(
        Math.max(boxPos.x - boxHalfExtents.x, Math.min(spherePos.x, boxPos.x + boxHalfExtents.x)),
        Math.max(boxPos.y - boxHalfExtents.y, Math.min(spherePos.y, boxPos.y + boxHalfExtents.y)),
        Math.max(boxPos.z - boxHalfExtents.z, Math.min(spherePos.z, boxPos.z + boxHalfExtents.z))
    );
    
    // Calculate distance from sphere center to closest point
    const distance = spherePos.distanceTo(closestPoint);
    
    if (distance < sphereRadius) {
        // Collision detected - calculate push-out vector
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

let lastFrameTime = 0; //adjust for lag
let moveSpeedAdjusted = moveSpeed;
//y has different bc of the constant change due to the force applied by gravity
function animate() {
    moveSpeedAdjusted = moveSpeed * ((performance.now() - lastFrameTime) / 16.67);  //calc for calculating lag
    //calc is slang for calculation
    //if your new to my stream 
    lastFrameTime = performance.now();
    dataView.innerHTML = `<p>Use WASD or Arrow keys to move</p>
<p>Space to jump</p>
<p>Drag mouse to rotate camera</p>
<p>Scroll to zoom.</p>
<p>Sphere Position: ${sphere.position.x.toFixed(2)}, ${sphere.position.y > 0.01 || sphere.position.y < -0.01 ? sphere.position.y.toFixed(2) : "0.00"}, ${sphere.position.z.toFixed(2)}</p>`;
    if (keys['ArrowUp'] || keys['w']) {
        sphere.position.z += -moveSpeed * Math.cos(cameraAngleH);
        sphere.position.x += -moveSpeed * Math.sin(cameraAngleH);
        sphere.rotateOnAxis(new THREE.Vector3(1, 0, 0), -2*moveSpeed);
    }
    if (keys['ArrowDown'] || keys['s']) {
        sphere.position.z -= -moveSpeed * Math.cos(cameraAngleH);
        sphere.position.x -= -moveSpeed * Math.sin(cameraAngleH);
        sphere.rotateOnAxis(new THREE.Vector3(1, 0, 0), 2*moveSpeed);
    }

    if (keys['ArrowLeft'] || keys['a']) {
        sphere.position.x += -moveSpeed * Math.cos(cameraAngleH);
        sphere.position.z -= -moveSpeed * Math.sin(cameraAngleH);    
        sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), 2*moveSpeed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        sphere.position.x -= -moveSpeed * Math.cos(cameraAngleH);
        sphere.position.z += -moveSpeed * Math.sin(cameraAngleH);
        sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), -2*moveSpeed);
    }

    let yRotation = VelocityY * 0.4;
    sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), yRotation);

    VelocityY -= AccelerationY;
    sphere.position.y += VelocityY;
    
    // i really need to improve this, maybe filter to not go through every object and only do near objects
    for (let obstacle of obstacles) {
        const pushOut = checkSphereBoxCollision(
            sphere.position, 
            sphereRadius, 
            obstacle.mesh.position, 
            obstacle.halfExtents
        );
        
        if (pushOut) {
            sphere.position.add(pushOut);
            
            // If collision is mainly vertical (hittin top or bottom), reset velocity
            if (Math.abs(pushOut.y) > Math.abs(pushOut.x) && Math.abs(pushOut.y) > Math.abs(pushOut.z)) {
                VelocityY = 0;
                if (pushOut.y > 0) {
                    jumpResolved = true; // Can jump again if landed on top
                }
            }
        }
    }
    
    if (sphere.position.y <= groundLevel) {
        sphere.position.y = groundLevel;
        VelocityY = 0;
        jumpResolved = true;
    }
    
    // trig 
    const cameraOffset = new THREE.Vector3(
        cameraDistance * Math.sin(cameraAngleV) * Math.sin(cameraAngleH),
        cameraDistance * Math.cos(cameraAngleV),
        cameraDistance * Math.sin(cameraAngleV) * Math.cos(cameraAngleH)
    );

    if (sphere.position.y <-10) {
        sphere.position.set(0, 5, 0);
        VelocityY = 0; 
    }
    
    const desiredCameraPos = new THREE.Vector3().addVectors(sphere.position, cameraOffset);
    camera.position.copy(desiredCameraPos);
    camera.lookAt(sphere.position);
    camera.updateMatrixWorld();

    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
import * as THREE from 'three';
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffb3d9); // Pink background

const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const loader = new GLTFLoader();

const obstacleDict = [[0,-1,0,10,1,10, 0xf0f00], [1,0.65,4,0.3,1.3,0.3,0xff0000]];  //in each element should contain a 7d tuple of [x,y,z,sizeX, sizeY, sizeZ, hexColor]
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Create a canvas to draw the face
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext('2d');

// Fill with blue background
ctx.fillStyle = '#4a90e2';
ctx.fillRect(0, 0, 256, 256);

// Draw eyes
ctx.fillStyle = '#000000';
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


// Position camera to see the plane from above
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Camera control variables
let cameraDistance = 7;
let cameraAngleH = Math.PI / 4; // Horizontal angle (around Y axis)
let cameraAngleV = Math.PI / 4; // Vertical angle (elevation)

// Mouse drag variables
let isDragging = false;
let previousMouseX = 0;
let previousMouseY = 0;

const moveSpeed = 0.05;
const keys = {};

var jumpResolved = true;
var VelocityY = 0;
var AccelerationY = 0.0098;
const groundLevel = -999;
const sphereRadius = 0.5;

function jump(){
    if (jumpResolved) {
        VelocityY = 0.2;
        jumpResolved = false;
    }
}

window.addEventListener('keydown', (e) => { 
    keys[e.key] = true;
    if (e.key === ' ') jump();
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Mouse event listeners for camera dragging
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
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;
        
        // Update camera angles based on mouse movement
        cameraAngleH -= deltaX * 0.005; // Horizontal rotation
        cameraAngleV += deltaY * 0.005; // Vertical rotation
        
        // Clamp vertical angle to prevent flipping
        cameraAngleV = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleV));
        
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    }
});

// Mouse wheel for zoom
window.addEventListener('wheel', (e) => {
    cameraDistance += e.deltaY * 0.01;
    cameraDistance = Math.max(2, Math.min(20, cameraDistance)); // Clamp distance
});

// Store obstacle meshes for reference
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

// Helper function for sphere-box collision detection
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
    
function animate() {

    if (keys['ArrowUp'] || keys['w']) {
        sphere.position.z += -moveSpeed * Math.cos(cameraAngleH);
        sphere.position.x += -moveSpeed * Math.sin(cameraAngleH);
        sphere.rotateOnAxis(new THREE.Vector3(1, 0, 0), -moveSpeed);
    }
    if (keys['ArrowDown'] || keys['s']) {
        sphere.position.z -= -moveSpeed * Math.cos(cameraAngleH);
        sphere.position.x -= -moveSpeed * Math.sin(cameraAngleH);
        sphere.rotateOnAxis(new THREE.Vector3(1, 0, 0), moveSpeed);
    }

    if (keys['ArrowLeft'] || keys['a']) {
        sphere.position.x += -moveSpeed * Math.cos(cameraAngleH);
        sphere.position.z -= -moveSpeed * Math.sin(cameraAngleH);    
        sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), moveSpeed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        sphere.position.x -= -moveSpeed * Math.cos(cameraAngleH);
        sphere.position.z += -moveSpeed * Math.sin(cameraAngleH);
        sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), -moveSpeed);
    }

    let yRotation = VelocityY * 0.4;
    sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), yRotation);

    VelocityY -= AccelerationY;
    sphere.position.y += VelocityY;
    
    // Check collisions with all obstacles
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
    
    // Update camera position based on angles and distance
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
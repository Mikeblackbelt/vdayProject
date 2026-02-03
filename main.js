import * as THREE from 'three';
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffb3d9); // Pink background

const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const controls = new THREE.Controls(); //NEVER USE ORBIT CONTROLS
const loader = new GLTFLoader();

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

// Create plane with grey color
const planeGeometry = new THREE.PlaneGeometry( 10, 10 );
const planeMaterial = new THREE.MeshBasicMaterial( { color: 0x808080, side: THREE.DoubleSide } );
const plane = new THREE.Mesh( planeGeometry, planeMaterial );
plane.rotation.x = -Math.PI / 2;
scene.add( plane );

// Position camera to see the plane from above
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Camera follow offset relative to sphere
const cameraOffset = new THREE.Vector3(0, 5, -5);

const moveSpeed = 0.05;
const keys = {};

var jumpResolved = true;
var VelocityY = 0;
var AccelerationY = 0.0098;
const groundLevel = 0.5;

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

function animate() {
    if (keys['ArrowUp'] || keys['w']) {
        sphere.position.z += moveSpeed;
        sphere.rotateOnAxis(new THREE.Vector3(1, 0, 0), moveSpeed);
    }
    if (keys['ArrowDown'] || keys['s']) {
        sphere.position.z -= moveSpeed;
        sphere.rotateOnAxis(new THREE.Vector3(1, 0, 0), -moveSpeed);
    }

    if (keys['ArrowLeft'] || keys['a']) {
        sphere.position.x += moveSpeed;
        sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), -moveSpeed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        sphere.position.x -= moveSpeed;
        sphere.rotateOnAxis(new THREE.Vector3(0, 0, 1), moveSpeed);
    }
    
    VelocityY -= AccelerationY;
    sphere.position.y += VelocityY;
    
    if (sphere.position.y <= groundLevel) {
        sphere.position.y = groundLevel;
        VelocityY = 0;
        jumpResolved = true;
    }
    
    // Calculate camera position relative to sphere's POSITION, without regard for orientation
    const desiredCameraPos = new THREE.Vector3().addVectors(sphere.position, cameraOffset);
    camera.position.lerp(desiredCameraPos, 0.1);
    camera.lookAt(sphere.position);
    
    controls.update();
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
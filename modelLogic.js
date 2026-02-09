import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as COLOR from '/colors.js'
import { objectViewPosition } from 'three/tsl';
const loader = new GLTFLoader();

export function loadFlower(scene, onLoad) {
  loader.load(
    'https://raw.githubusercontent.com/Mikeblackbelt/vdayProject/main/models/tulip%203.glb',
    (gltf) => {
      const flower = gltf.scene;
      flower.scale.set(1, 1, 1);
      flower.position.set(2, 0, -3);
      flower.traverse(obj => {
        if (obj.isMesh) {
          if (obj.material.color['r'] > 0.5 ) {
            let choice = Math.random();
            if (choice > 0.67) {
              obj.material.color = new THREE.Color(0xd745dfff)
            }
            else if (choice > 0.33) {
              obj.material.color = new THREE.Color(0xff640aff )
            }
            else {
              obj.material.color = new THREE.Color(0x6af8ffff)
            }
            //console.log('yo')
          } //make red more bright
          const oldMap = obj.material.map;
          //console.log(obj.material.color)
          
          obj.material = new THREE.MeshLambertMaterial({
            map: oldMap || null,
            color: oldMap ? 0xffffff : obj.material.color,
            emissiveIntensity: 0.5,
            emissive: obj.material.color
          });
          //obj.material.emissive = 0x00000
        }
        
      });
      
      scene.add(flower);
      if (onLoad) onLoad(flower);
    },
    undefined,
    (error) => {
      console.error('Error loading flower model:', error);
    }
  );
}

export function detectModelCollision(sphereCenter, modelDict, flowerLoaded, scene, playerHoldingFlower) {
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

export function checkSphereBoxCollision(spherePos, sphereRadius, boxPos, boxHalfExtents) {
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
    
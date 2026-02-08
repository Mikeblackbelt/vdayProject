import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as COLOR from '/colors.js'
import { objectViewPosition } from 'three/tsl';
const loader = new GLTFLoader();

export function loadFlower(scene, onLoad) {
  loader.load(
    'https://github.com/Mikeblackbelt/vdayProject/blob/main/models/tulip%203.glb',
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
            console.log('yo')
          } //make red more bright
          const oldMap = obj.material.map;
          console.log(obj.material.color)
          
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
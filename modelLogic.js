import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as COLOR from '/colors.js'
import { objectViewPosition } from 'three/tsl';
const loader = new GLTFLoader();

export function loadFlower(scene, onLoad) {
  loader.load(
    'models/tulip 3.glb',
    (gltf) => {
      const flower = gltf.scene;
      flower.scale.set(1, 1, 1);
      flower.position.set(2, 0, -3);
      flower.traverse(obj => {
        if (obj.isMesh) {
          if (obj.material.color['r'] > 0.5 ) {
            if (Math.random() > 0.5) {
              obj.material.color = new THREE.Color(0xd745dfff)
            }
            else {
              obj.material.color = new THREE.Color(0xff640aff )
            }
            console.log('yo')
          } //make red more bright
          const oldMap = obj.material.map;
          console.log(obj.material.color)
          
          obj.material = new THREE.MeshLambertMaterial({
            map: oldMap || null,
            color: oldMap ? 0xffffff : obj.material.color,
            roughness: 0.1,
            metalness: 0,
          });
          obj.material.emissive = 0x00000
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
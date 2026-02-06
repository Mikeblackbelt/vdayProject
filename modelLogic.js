import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as COLOR from '/colors.js'
const loader = new GLTFLoader();

export function loadFlower(scene, onLoad) {
  loader.load(
    'models/tulip 3.glb',
    (gltf) => {
      const flower = gltf.scene;
      flower.scale.set(1, 1, 1);
      flower.position.set(2, 0, -3);
      let uniqueCheck = {}
      flower.traverse(obj => {
        if (JSON.stringify(obj.toJSON()) in uniqueCheck) {
          console.log('duplicate');
          console.log(uniqueCheck);
          return
        }
        else {
          
        }
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.material.color['r'] > 0.7 ) {
            obj.material.color['b'] = 0.7
            obj.material.color['g'] =0.5
            obj.material.color['r'] = 1
            console.log('yo')
          } //make red more bright
          const oldMap = obj.material.map;
          console.log(obj.material.color)
          
          obj.material = new THREE.MeshStandardMaterial({
            map: oldMap || null,
            color: oldMap ? 0xffffff : obj.material.color,
            roughness: 0.1,
            metalness: 0,
            emissive: new THREE.Color(obj.emissive * 1.2)
          });
          uniqueCheck[JSON.stringify(obj.toJSON())] = '1'
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
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
          obj.castShadow = true;
          obj.receiveShadow = true;
          const oldMap = obj.material.map;
          obj.material = new THREE.MeshStandardMaterial({
            map: oldMap || null,
            color: oldMap ? 0xffffff : obj.material.color,
            roughness: 0.3,
            metalness: 0.1,
            emissive: new THREE.Color(0x222222)
          });
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
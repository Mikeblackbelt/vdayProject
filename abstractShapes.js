import * as THREE from 'three';

const palette = [
    0xffb3d9, // pink
    0xb19cd9, // lavender
    0x9ad0f5, // soft blue
    0xffffff,  // white accents
    0xff6961, // red
    0xffd700, // gold
    0x77dd77, // mint green
];

const decoObjects = [];

export function makeDeco(scene) {
    const types = [
        () => new THREE.TorusGeometry(Math.random() * 6, 1, 16, 50),
        () => new THREE.SphereGeometry(Math.random() * 4.3, 24, 24),
        () => new THREE.OctahedronGeometry(Math.random() * 3),
        () => new THREE.ConeGeometry(Math.random() * 2.7, 6, 6)
    ];

    for (let i = 0; i < 45; i++) {
        const geo = types[Math.floor(Math.random() * types.length)]();
        let color = palette[Math.floor(Math.random() * palette.length)];
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.6,
            metalness: 0.2,
            emissive: color,
            opacity: 0.7,
            transparent: true
        });

        mat.emissiveIntensity = 0.5 + Math.random() * 0.5;

        const mesh = new THREE.Mesh(geo, mat);

        mesh.position.set(
            (Math.random() - 0.5) * 100,
            Math.random() * 40 + 10,
            (Math.random() - 0.5) * 100
        );

        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        scene.add(mesh);
        decoObjects.push(mesh);
    }
}

//makeDeco();
//export default makeDeco();
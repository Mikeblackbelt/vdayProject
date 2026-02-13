import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

let composer;
let dioPass;

let active = false;
let progress = 0;

export function initZaWarudo(renderer, scene, camera) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const DioShader = {
    uniforms: {
      tDiffuse: { value: null },
      progress: { value: 0 },
      center: { value: new THREE.Vector2(0.5, 0.5) }
    },

    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,

    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float progress;
      uniform vec2 center;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;

        float dist = distance(uv, center);

        // Shockwave band
        float wave = smoothstep(progress - 0.02, progress, dist) *
                     smoothstep(progress + 0.06, progress, dist);

        // Radial distortion
        float distortion = wave * 0.15;
        uv += normalize(uv - center) * distortion;

        vec4 color = texture2D(tDiffuse, uv);

        // Desaturate
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 desat = mix(color.rgb, vec3(gray), 0.85);

        // Gold tint
        vec3 gold = vec3(1.0, 0.84, 0.2);
        desat = mix(desat, gold, 0.18);

        // Vignette
        float vignette = smoothstep(0.9, 0.3, dist);
        desat *= vignette;

        gl_FragColor = vec4(desat, 1.0);
      }
    `
  };

  dioPass = new ShaderPass(DioShader);
  composer.addPass(dioPass);
}

export function activateZaWarudo(screenX = 0.5, screenY = 0.5) {
  if (!dioPass) return;

  active = true;
  progress = 0;
  dioPass.uniforms.center.value.set(screenX, screenY);
}

export function updateZaWarudo(delta) {
  if (!active) return;

  progress += delta * 0.8; // speed of expansion
  dioPass.uniforms.progress.value = progress;

  if (progress > 1.6) {
    active = false;
    progress = 0;
    dioPass.uniforms.progress.value = 0;
    window.close();
  }
}

export function renderZaWarudo() {
  if (!composer) return;
  composer.render();
}

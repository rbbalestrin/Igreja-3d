/**
 * =============================================================================
 * SISTEMA: Skybox e Transição Dia/Noite
 * =============================================================================
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { scene, renderer } from "../core/scene.js";
import { ambientLight, hemisphereLight } from "./lighting.js";

// -----------------------------------------------------------------------------
// Configurações do Sistema Dia/Noite
// -----------------------------------------------------------------------------
export const dayNightConfig = {
  mode: "day",
  transitionTime: 3.0,
  autoTransition: false,
  autoTransitionSpeed: 0.1,
};

// Variáveis de estado
export let dayNightBlend = 0.0;
export let dayTexture = null;
export let nightTexture = null;
export let isTransitioning = false;

// Funções para atualizar variáveis de estado (necessário para módulos ES)
export function setDayNightBlend(value) {
  dayNightBlend = value;
}
export function setIsTransitioning(value) {
  isTransitioning = value;
}

// -----------------------------------------------------------------------------
// Skybox Base
// -----------------------------------------------------------------------------
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
let skyMaterial = new THREE.MeshBasicMaterial({
  color: 0x87ceeb,
  side: THREE.BackSide,
  fog: false,
});
export const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skybox);

// -----------------------------------------------------------------------------
// Carregamento da Textura do Dia (EXR)
// -----------------------------------------------------------------------------
const exrLoader = new EXRLoader();
exrLoader.load(
  "/skyboxes/qwantani_sunset_puresky_1k.exr",
  (texture) => {
    console.log("[DIA/NOITE] Skybox dia carregado");
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    dayTexture = texture;
    updateSkybox();
  },
  null,
  (error) => console.error("[DIA/NOITE] Erro ao carregar skybox dia:", error),
);

// -----------------------------------------------------------------------------
// Carregamento da Textura da Noite (GLTF)
// -----------------------------------------------------------------------------
const nightSkyboxLoader = new GLTFLoader();
nightSkyboxLoader.load(
  "/skyboxes/inside_galaxy_skybox_hdri_360_panorama/scene.gltf",
  (gltf) => {
    console.log("[DIA/NOITE] Modelo GLTF da noite carregado");
    let textureFound = false;

    gltf.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        let texture = child.material.map || child.material.emissiveMap;
        if (texture) {
          const clonedTexture = texture.clone();
          clonedTexture.mapping = THREE.EquirectangularReflectionMapping;
          clonedTexture.colorSpace = THREE.LinearSRGBColorSpace;
          clonedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          nightTexture = clonedTexture;
          textureFound = true;
        }
      }
    });

    if (!textureFound) createProceduralNightTexture();
    updateSkybox();
  },
  null,
  (error) => {
    console.error("[DIA/NOITE] Erro ao carregar skybox noite:", error);
    createProceduralNightTexture();
  },
);

// -----------------------------------------------------------------------------
// Textura Procedural da Noite
// -----------------------------------------------------------------------------
function createProceduralNightTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#000011");
  gradient.addColorStop(0.5, "#000033");
  gradient.addColorStop(1, "#000000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  nightTexture = new THREE.CanvasTexture(canvas);
  nightTexture.mapping = THREE.EquirectangularReflectionMapping;
  nightTexture.colorSpace = THREE.LinearSRGBColorSpace;
  updateSkybox();
}

// -----------------------------------------------------------------------------
// Atualização do Skybox
// -----------------------------------------------------------------------------
export function updateSkybox() {
  if (!dayTexture && !nightTexture) return;

  if (dayTexture && nightTexture) {
    const blendMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        blend: { value: dayNightBlend },
      },
      vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform sampler2D dayTexture;
                uniform sampler2D nightTexture;
                uniform float blend;
                varying vec3 vWorldPosition;

                void main() {
                    vec3 dir = normalize(vWorldPosition);
                    float u = atan(dir.z, dir.x) / (2.0 * 3.14159265359) + 0.5;
                    float v = acos(dir.y) / 3.14159265359;
                    vec2 uv = vec2(u, v);

                    vec3 dayColor = texture2D(dayTexture, uv).rgb;
                    vec3 nightColor = texture2D(nightTexture, uv).rgb;
                    gl_FragColor = vec4(mix(dayColor, nightColor, blend), 1.0);
                }
            `,
      side: THREE.BackSide,
      fog: false,
    });
    skybox.material = blendMaterial;
    scene.environment = dayNightBlend < 0.5 ? dayTexture : nightTexture;
    scene.background = scene.environment;
  } else {
    const texture = dayTexture || nightTexture;
    skyMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      fog: false,
    });
    skybox.material = skyMaterial;
    scene.environment = texture;
    scene.background = texture;
  }
}

// -----------------------------------------------------------------------------
// Transição Suave Dia/Noite
// -----------------------------------------------------------------------------
export function transitionDayNight(targetMode, duration = null) {
  if (isTransitioning || (!dayTexture && !nightTexture)) return;

  const targetBlend = targetMode === "night" ? 1.0 : 0.0;
  const transitionDuration = duration || dayNightConfig.transitionTime;
  const startBlend = dayNightBlend;
  const startTime = performance.now() * 0.001;

  isTransitioning = true;

  function animateTransition() {
    const currentTime = performance.now() * 0.001;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / transitionDuration, 1.0);

    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    dayNightBlend = startBlend + (targetBlend - startBlend) * eased;

    if (skybox.material && skybox.material.uniforms) {
      skybox.material.uniforms.blend.value = dayNightBlend;
    } else {
      updateSkybox();
    }

    updateEnvironmentForDayNight();

    if (progress < 1.0) {
      requestAnimationFrame(animateTransition);
    } else {
      isTransitioning = false;
      dayNightConfig.mode = targetMode;
    }
  }

  animateTransition();
}

// -----------------------------------------------------------------------------
// Atualização do Ambiente
// -----------------------------------------------------------------------------
export function updateEnvironmentForDayNight() {
  if (scene.fog && scene.fog.isFogExp2) {
    const dayFogColor = new THREE.Color(0x87ceeb);
    const nightFogColor = new THREE.Color(0x000033);
    scene.fog.color.lerpColors(dayFogColor, nightFogColor, dayNightBlend);
    scene.fog.density = 0.015 + dayNightBlend * 0.01;
  }

  ambientLight.intensity = 0.1 - dayNightBlend * 0.05;

  const daySkyColor = new THREE.Color(0x87ceeb);
  const nightSkyColor = new THREE.Color(0x000033);
  const dayGroundColor = new THREE.Color(0x4a7c59);
  const nightGroundColor = new THREE.Color(0x001122);

  hemisphereLight.color.lerpColors(daySkyColor, nightSkyColor, dayNightBlend);
  hemisphereLight.groundColor.lerpColors(
    dayGroundColor,
    nightGroundColor,
    dayNightBlend,
  );
  hemisphereLight.intensity = 0.3 - dayNightBlend * 0.2;
}

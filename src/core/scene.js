/**
 * =============================================================================
 * CORE: Cena, Câmera, Renderer e Controles
 * =============================================================================
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// -----------------------------------------------------------------------------
// Cena Principal
// -----------------------------------------------------------------------------
export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

// -----------------------------------------------------------------------------
// Câmera
// -----------------------------------------------------------------------------
export const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(1, 1, 1);
camera.lookAt(0, 0, 0);

// -----------------------------------------------------------------------------
// Renderer
// -----------------------------------------------------------------------------
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// -----------------------------------------------------------------------------
// Controles de Órbita
// -----------------------------------------------------------------------------
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 50;

// -----------------------------------------------------------------------------
// Event Listener de Resize
// -----------------------------------------------------------------------------
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


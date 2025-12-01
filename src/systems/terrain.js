/**
 * =============================================================================
 * SISTEMA: Terreno e Plataforma
 * =============================================================================
 */

import * as THREE from 'three';
import { scene } from '../core/scene.js';

// -----------------------------------------------------------------------------
// Constantes da Plataforma
// -----------------------------------------------------------------------------
export const PLATFORM_SIZE = 100;
export const BORDER_HEIGHT = 0.5;
export const BORDER_THICKNESS = 0.3;

// -----------------------------------------------------------------------------
// Terreno Base (invisível)
// -----------------------------------------------------------------------------
const terrainGeometry = new THREE.PlaneGeometry(PLATFORM_SIZE, PLATFORM_SIZE, 1, 1);
const terrainMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a7c59,
    roughness: 0.9,
    metalness: 0.1,
    visible: false
});
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// -----------------------------------------------------------------------------
// Chão Visível (Plataforma)
// -----------------------------------------------------------------------------
const floorGeometry = new THREE.PlaneGeometry(PLATFORM_SIZE, PLATFORM_SIZE, 1, 1);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a6b4a,
    roughness: 0.9,
    metalness: 0.1
});
export const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// -----------------------------------------------------------------------------
// Bordas da Plataforma
// -----------------------------------------------------------------------------
const borderGroup = new THREE.Group();
const borderMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a4a3a,
    roughness: 0.8,
    metalness: 0.2
});

// Norte
const borderNorth = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM_SIZE + BORDER_THICKNESS * 2, BORDER_HEIGHT, BORDER_THICKNESS),
    borderMaterial
);
borderNorth.position.set(0, BORDER_HEIGHT / 2, PLATFORM_SIZE / 2 + BORDER_THICKNESS / 2);
borderNorth.castShadow = true;
borderNorth.receiveShadow = true;
borderGroup.add(borderNorth);

// Sul
const borderSouth = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM_SIZE + BORDER_THICKNESS * 2, BORDER_HEIGHT, BORDER_THICKNESS),
    borderMaterial
);
borderSouth.position.set(0, BORDER_HEIGHT / 2, -PLATFORM_SIZE / 2 - BORDER_THICKNESS / 2);
borderSouth.castShadow = true;
borderSouth.receiveShadow = true;
borderGroup.add(borderSouth);

// Leste
const borderEast = new THREE.Mesh(
    new THREE.BoxGeometry(BORDER_THICKNESS, BORDER_HEIGHT, PLATFORM_SIZE),
    borderMaterial
);
borderEast.position.set(PLATFORM_SIZE / 2 + BORDER_THICKNESS / 2, BORDER_HEIGHT / 2, 0);
borderEast.castShadow = true;
borderEast.receiveShadow = true;
borderGroup.add(borderEast);

// Oeste
const borderWest = new THREE.Mesh(
    new THREE.BoxGeometry(BORDER_THICKNESS, BORDER_HEIGHT, PLATFORM_SIZE),
    borderMaterial
);
borderWest.position.set(-PLATFORM_SIZE / 2 - BORDER_THICKNESS / 2, BORDER_HEIGHT / 2, 0);
borderWest.castShadow = true;
borderWest.receiveShadow = true;
borderGroup.add(borderWest);

scene.add(borderGroup);

// -----------------------------------------------------------------------------
// Função de Altura do Terreno
// -----------------------------------------------------------------------------
export function getTerrainHeight(x, z) {
    return 0;
}


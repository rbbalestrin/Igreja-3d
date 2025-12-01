/**
 * =============================================================================
 * SISTEMA: Iluminação e Show de Luzes
 * =============================================================================
 */

import * as THREE from 'three';
import { scene } from '../core/scene.js';

// -----------------------------------------------------------------------------
// Luz Ambiente
// -----------------------------------------------------------------------------
export const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// -----------------------------------------------------------------------------
// Luz de Hemisfério
// -----------------------------------------------------------------------------
export const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c59, 0.3);
hemisphereLight.position.set(0, 50, 0);
scene.add(hemisphereLight);

// -----------------------------------------------------------------------------
// Configurações do Show de Luzes
// -----------------------------------------------------------------------------
export const lightShowConfig = {
    enabled: true,
    speed: 1.0,
    colorSpeed: 0.5,
    movementEnabled: true,
    colorChangeEnabled: true
};

// Paleta de cores vibrantes
const showColors = [
    new THREE.Color(0xff0066),
    new THREE.Color(0x00ff66),
    new THREE.Color(0x6600ff),
    new THREE.Color(0xff6600),
    new THREE.Color(0x00ffff),
    new THREE.Color(0xffff00),
    new THREE.Color(0xff00ff),
    new THREE.Color(0x0066ff)
];

// Target central para os spotlights
const churchTarget = new THREE.Object3D();
churchTarget.position.set(0, 2, 0);
scene.add(churchTarget);

// Arrays para luzes e helpers
export const lights = [];
export const lightHelpers = [];

// -----------------------------------------------------------------------------
// Função auxiliar para criar spotlight
// -----------------------------------------------------------------------------
function createSpotLight(color, position, baseAngle, colorIndex, isTop = false) {
    const intensity = isTop ? 30 : 50;
    const distance = isTop ? 60 : 50;
    const angle = isTop ? Math.PI / 4 : Math.PI / 6;
    const penumbra = isTop ? 0.3 : 0.5;
    
    const spot = new THREE.SpotLight(color, intensity, distance, angle, penumbra, 1);
    spot.position.set(position.x, position.y, position.z);
    spot.target = churchTarget;
    spot.castShadow = true;
    
    if (!isTop) {
        spot.shadow.mapSize.width = 2048;
        spot.shadow.mapSize.height = 2048;
    }
    
    scene.add(spot);
    
    return { light: spot, color, baseAngle, colorIndex, isTop };
}

// -----------------------------------------------------------------------------
// Criar os 7 spotlights
// -----------------------------------------------------------------------------
lights.push(createSpotLight(0xff0066, { x: -8, y: 10, z: 8 }, 0, 0));
lights.push(createSpotLight(0x00ff66, { x: 8, y: 10, z: 8 }, Math.PI / 2, 2));
lights.push(createSpotLight(0x6600ff, { x: -8, y: 10, z: -8 }, Math.PI, 4));
lights.push(createSpotLight(0xff6600, { x: 8, y: 10, z: -8 }, Math.PI * 1.5, 6));
lights.push(createSpotLight(0xffffff, { x: 0, y: 15, z: 0 }, 0, 0, true));
lights.push(createSpotLight(0x00ffff, { x: -12, y: 8, z: 0 }, Math.PI * 0.75, 1));
lights.push(createSpotLight(0xffff00, { x: 12, y: 8, z: 0 }, Math.PI * 1.25, 3));

// Criar helpers visuais
lights.forEach((lightData) => {
    const helper = new THREE.SpotLightHelper(lightData.light, lightData.color);
    helper.visible = false;
    scene.add(helper);
    lightHelpers.push(helper);
});

// -----------------------------------------------------------------------------
// Função de Atualização do Show de Luzes
// -----------------------------------------------------------------------------
export function updateLightShow(time) {
    if (!lightShowConfig.enabled) return;
    
    const speed = lightShowConfig.speed;
    const colorSpeed = lightShowConfig.colorSpeed;
    
    lights.forEach((lightData, index) => {
        const light = lightData.light;
        
        // Movimento orbital
        if (lightShowConfig.movementEnabled && !lightData.isTop) {
            const radius = 10;
            const height = 8 + Math.sin(time * speed + lightData.baseAngle) * 2;
            const angle = lightData.baseAngle + Math.sin(time * speed * 0.5) * 0.5;
            
            light.position.x = Math.cos(angle + time * speed * 0.3) * radius;
            light.position.z = Math.sin(angle + time * speed * 0.3) * radius;
            light.position.y = height;
        }
        
        // Transição de cores
        if (lightShowConfig.colorChangeEnabled) {
            const colorIndex = (lightData.colorIndex + Math.floor(time * colorSpeed)) % showColors.length;
            const nextColorIndex = (colorIndex + 1) % showColors.length;
            const t = (time * colorSpeed) % 1;
            light.color.lerpColors(showColors[colorIndex], showColors[nextColorIndex], t);
        }
        
        // Pulsação de intensidade
        const baseIntensity = lightData.isTop ? 30 : 50;
        light.intensity = baseIntensity + Math.sin(time * speed * 2 + index) * 15;
    });
    
    lightHelpers.forEach(helper => {
        if (helper.visible) helper.update();
    });
}


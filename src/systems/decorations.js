/**
 * =============================================================================
 * SISTEMA: Decorações Natalinas
 * =============================================================================
 */

import * as THREE from 'three';
import { scene } from '../core/scene.js';

// -----------------------------------------------------------------------------
// Caminho de Pedras
// -----------------------------------------------------------------------------
const pathGroup = new THREE.Group();
const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b6b6b,
    roughness: 0.8,
    metalness: 0.1
});

for (let i = 0; i < 8; i++) {
    const stoneSize = 0.8 + Math.random() * 0.4;
    const stoneGeometry = new THREE.BoxGeometry(
        stoneSize,
        0.1,
        stoneSize * (0.7 + Math.random() * 0.3)
    );
    const stone = new THREE.Mesh(stoneGeometry, pathMaterial);
    stone.position.set(
        (i - 3.5) * 1.2 - 5,
        0.05,
        -2 + Math.random() * 0.3 + 9.5
    );
    stone.rotation.y = Math.random() * Math.PI * 0.2;
    stone.receiveShadow = true;
    pathGroup.add(stone);
}
scene.add(pathGroup);

// -----------------------------------------------------------------------------
// Função: Criar Decoração Natalina
// -----------------------------------------------------------------------------
export function createChristmasDecoration(type, x, z) {
    const decoration = new THREE.Group();
    
    switch(type) {
        case 'present': {
            const boxSize = 0.3 + Math.random() * 0.2;
            const boxColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
            const boxColor = boxColors[Math.floor(Math.random() * boxColors.length)];
            
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(boxSize, boxSize * 0.6, boxSize),
                new THREE.MeshStandardMaterial({ color: boxColor, roughness: 0.6, metalness: 0.2 })
            );
            box.position.y = boxSize * 0.3;
            box.castShadow = true;
            decoration.add(box);
            
            const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.6 });
            const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(boxSize * 1.1, boxSize * 0.1, boxSize * 0.1), ribbonMat);
            ribbonH.position.y = boxSize * 0.3;
            decoration.add(ribbonH);
            
            const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(boxSize * 0.1, boxSize * 0.7, boxSize * 0.1), ribbonMat);
            ribbonV.position.y = boxSize * 0.3;
            decoration.add(ribbonV);
            
            const bow = new THREE.Mesh(new THREE.SphereGeometry(boxSize * 0.15, 8, 8), ribbonMat);
            bow.position.y = boxSize * 0.6;
            decoration.add(bow);
            break;
        }
        case 'star': {
            const starSize = 0.2 + Math.random() * 0.15;
            const star = new THREE.Mesh(
                new THREE.ConeGeometry(starSize, starSize * 0.8, 5),
                new THREE.MeshStandardMaterial({
                    color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.5,
                    roughness: 0.3, metalness: 0.8
                })
            );
            star.position.y = starSize * 0.4;
            star.rotation.z = Math.PI;
            star.castShadow = true;
            decoration.add(star);
            break;
        }
        case 'bell': {
            const bellSize = 0.15 + Math.random() * 0.1;
            const bell = new THREE.Mesh(
                new THREE.ConeGeometry(bellSize, bellSize * 1.2, 8),
                new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.9 })
            );
            bell.position.y = bellSize * 0.6;
            bell.rotation.x = Math.PI;
            bell.castShadow = true;
            decoration.add(bell);
            
            const handle = new THREE.Mesh(
                new THREE.TorusGeometry(bellSize * 0.3, bellSize * 0.05, 8, 16),
                new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8, metalness: 0.2 })
            );
            handle.position.y = bellSize * 1.3;
            handle.rotation.x = Math.PI / 2;
            decoration.add(handle);
            break;
        }
        case 'candle': {
            const candleHeight = 0.2 + Math.random() * 0.15;
            const candleRadius = 0.03;
            
            const candle = new THREE.Mesh(
                new THREE.CylinderGeometry(candleRadius, candleRadius, candleHeight, 8),
                new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
            );
            candle.position.y = candleHeight / 2;
            candle.castShadow = true;
            decoration.add(candle);
            
            const flame = new THREE.Mesh(
                new THREE.SphereGeometry(candleRadius * 1.5, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 })
            );
            flame.position.y = candleHeight + candleRadius * 1.5;
            decoration.add(flame);
            break;
        }
    }
    
    decoration.position.set(x, 0, z);
    return decoration;
}

// -----------------------------------------------------------------------------
// Geração de Decorações Natalinas
// -----------------------------------------------------------------------------
export const christmasDecorations = new THREE.Group();
const decorationTypes = ['present', 'star', 'bell', 'candle'];
const numDecorations = 20 + Math.floor(Math.random() * 11);

for (let i = 0; i < numDecorations; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 29;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const type = decorationTypes[Math.floor(Math.random() * decorationTypes.length)];
    
    christmasDecorations.add(createChristmasDecoration(type, x, z));
}
scene.add(christmasDecorations);

// -----------------------------------------------------------------------------
// Função: Criar Árvore de Natal
// -----------------------------------------------------------------------------
export function createChristmasTree(x, z, scale = 1) {
    const tree = new THREE.Group();
    
    // Tronco
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 1.2 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 })
    );
    trunk.position.y = 0.6 * scale;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Camadas de folhas
    const layerHeights = [0.8, 1.2, 1.6, 2.0];
    const layerRadii = [1.2, 1.0, 0.8, 0.6];
    const layerColors = [0x1a5a1a, 0x1d5f1d, 0x206420, 0x236923];
    
    layerHeights.forEach((height, index) => {
        const layer = new THREE.Mesh(
            new THREE.ConeGeometry(layerRadii[index] * scale, height * scale * 0.5, 8),
            new THREE.MeshStandardMaterial({ color: layerColors[index], roughness: 0.8 })
        );
        layer.position.y = (height * scale * 0.5) + (index * 0.3 * scale);
        layer.castShadow = true;
        tree.add(layer);
    });
    
    // Bolas decorativas
    const ornamentColors = [0xff0000, 0xffd700, 0x0000ff, 0xff00ff, 0x00ffff];
    const numOrnaments = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < numOrnaments; i++) {
        const ornament = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 * scale, 8, 8),
            new THREE.MeshStandardMaterial({
                color: ornamentColors[Math.floor(Math.random() * ornamentColors.length)],
                roughness: 0.3, metalness: 0.7,
                emissive: new THREE.Color(ornamentColors[Math.floor(Math.random() * ornamentColors.length)]),
                emissiveIntensity: 0.3
            })
        );
        
        const layerIndex = Math.floor(Math.random() * layerHeights.length);
        const layerY = (layerHeights[layerIndex] * scale * 0.5) + (layerIndex * 0.3 * scale);
        const angle = Math.random() * Math.PI * 2;
        const radius = (0.3 + Math.random() * 0.4) * layerRadii[layerIndex] * scale;
        
        ornament.position.set(
            Math.cos(angle) * radius,
            layerY + (Math.random() - 0.5) * 0.3 * scale,
            Math.sin(angle) * radius
        );
        tree.add(ornament);
    }
    
    // Estrela no topo
    const star = new THREE.Mesh(
        new THREE.ConeGeometry(0.15 * scale, 0.4 * scale, 5),
        new THREE.MeshStandardMaterial({
            color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.5,
            roughness: 0.3, metalness: 0.8
        })
    );
    const topHeight = layerHeights[layerHeights.length - 1] * scale + (layerHeights.length - 1) * 0.3 * scale;
    star.position.y = topHeight + 0.2 * scale;
    star.rotation.z = Math.PI;
    tree.add(star);
    
    tree.position.set(x, 0, z);
    return tree;
}

// -----------------------------------------------------------------------------
// Geração de Árvores de Natal
// -----------------------------------------------------------------------------
export const christmasTreesGroup = new THREE.Group();
const numTrees = 10 + Math.floor(Math.random() * 6);

for (let i = 0; i < numTrees; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 32;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const scale = 0.8 + Math.random() * 0.4;
    
    christmasTreesGroup.add(createChristmasTree(x, z, scale));
}
scene.add(christmasTreesGroup);


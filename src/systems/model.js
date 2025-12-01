/**
 * =============================================================================
 * SISTEMA: Carregamento do Modelo Principal
 * =============================================================================
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene, camera, renderer, controls } from '../core/scene.js';

// -----------------------------------------------------------------------------
// Variáveis do Modelo
// -----------------------------------------------------------------------------
export let model = null;

// -----------------------------------------------------------------------------
// Textura de Detalhes Procedural (Multi-Textura)
// -----------------------------------------------------------------------------
export function createDetailTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(50, 100, 30, 0)');
    gradient.addColorStop(0.3, 'rgba(60, 120, 40, 0.3)');
    gradient.addColorStop(0.7, 'rgba(40, 80, 25, 0.2)');
    gradient.addColorStop(1, 'rgba(30, 60, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = 20 + Math.random() * 40;
        const alpha = 0.1 + Math.random() * 0.2;
        
        const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grd.addColorStop(0, `rgba(30, 20, 10, ${alpha})`);
        grd.addColorStop(1, 'rgba(30, 20, 10, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = 15 + Math.random() * 25;
        const alpha = 0.15 + Math.random() * 0.25;
        
        const grd = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grd.addColorStop(0, `rgba(50, 100, 30, ${alpha})`);
        grd.addColorStop(0.5, `rgba(40, 80, 25, ${alpha * 0.5})`);
        grd.addColorStop(1, 'rgba(30, 60, 20, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    return texture;
}

export const detailTexture = createDetailTexture(512);

// -----------------------------------------------------------------------------
// Configurações de Textura
// -----------------------------------------------------------------------------
export const textureConfig = {
    multiTextureEnabled: true,
    envMapIntensity: 0.5
};

// -----------------------------------------------------------------------------
// Carregamento do Modelo GLTF
// -----------------------------------------------------------------------------
const gltfLoader = new GLTFLoader();
const loadingElement = document.getElementById('loading');

export function loadModel(onComplete) {
    loadingElement.classList.add('show');
    
    gltfLoader.load(
        '/assets/models/stylized_gothic_church/scene.gltf',
        (gltf) => {
            model = gltf.scene;
            
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    if (child.material) {
                        const processMaterial = (mat) => {
                            if (!mat.isMeshPhysicalMaterial) {
                                const newMat = new THREE.MeshPhysicalMaterial({
                                    color: mat.color,
                                    map: mat.map,
                                    normalMap: mat.normalMap,
                                    roughnessMap: mat.roughnessMap,
                                    metalnessMap: mat.metalnessMap,
                                    aoMap: textureConfig.multiTextureEnabled ? detailTexture : mat.aoMap,
                                    transparent: mat.transparent,
                                    opacity: mat.opacity,
                                    side: mat.side,
                                    roughness: mat.roughness ?? 0.7,
                                    metalness: mat.metalness ?? 0.1
                                });
                                
                                if (scene.environment) {
                                    newMat.envMap = scene.environment;
                                    newMat.envMapIntensity = textureConfig.envMapIntensity;
                                }
                                
                                return newMat;
                            }
                            return mat;
                        };
                        
                        const applyAnisotropy = (mat) => {
                            const maxAniso = renderer.capabilities.getMaxAnisotropy();
                            if (mat.map) mat.map.anisotropy = maxAniso;
                            if (mat.normalMap) mat.normalMap.anisotropy = maxAniso;
                            if (mat.roughnessMap) mat.roughnessMap.anisotropy = maxAniso;
                            if (mat.metalnessMap) mat.metalnessMap.anisotropy = maxAniso;
                            if (mat.aoMap) mat.aoMap.anisotropy = maxAniso;
                        };
                        
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(processMaterial);
                            child.material.forEach(applyAnisotropy);
                        } else {
                            child.material = processMaterial(child.material);
                            applyAnisotropy(child.material);
                        }
                    }
                }
            });
            
            model.position.set(0, 0, 0);
            
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
            
            camera.position.set(cameraZ - 5, cameraZ * 0.5, cameraZ);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
            
            scene.add(model);
            loadingElement.classList.remove('show');
            
            console.log('Modelo carregado com sucesso!');
            
            if (onComplete) onComplete();
        },
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            loadingElement.textContent = `Carregando modelo... ${percent}%`;
        },
        (error) => {
            loadingElement.textContent = 'Erro ao carregar modelo!';
            console.error('Erro ao carregar modelo:', error);
        }
    );
}

// -----------------------------------------------------------------------------
// Helpers (Grid e Eixos)
// -----------------------------------------------------------------------------
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);


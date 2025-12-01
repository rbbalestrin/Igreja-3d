/**
 * =============================================================================
 * INTERFACE: GUI de Controles
 * =============================================================================
 */

import * as THREE from 'three';
import GUI from 'lil-gui';
import { scene, camera, controls } from '../core/scene.js';
import { lightShowConfig } from '../systems/lighting.js';
import { dayNightConfig, transitionDayNight } from '../systems/skybox.js';
import { model, detailTexture, textureConfig } from '../systems/model.js';

// -----------------------------------------------------------------------------
// Configurações da GUI
// -----------------------------------------------------------------------------
const guiConfig = {
    camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        fov: camera.fov
    }
};

// -----------------------------------------------------------------------------
// Inicialização da GUI
// -----------------------------------------------------------------------------
export function initGUI() {
    const gui = new GUI({ title: 'Controles da Cena' });
    
    // Show de Luzes
    const lightsFolder = gui.addFolder('🎆 Show de Luzes');
    lightsFolder.add(lightShowConfig, 'enabled').name('Ativar Show');
    lightsFolder.add(lightShowConfig, 'speed', 0.1, 3, 0.1).name('Velocidade');
    lightsFolder.add(lightShowConfig, 'colorSpeed', 0.1, 2, 0.1).name('Velocidade Cores');
    lightsFolder.add(lightShowConfig, 'movementEnabled').name('Movimento');
    lightsFolder.add(lightShowConfig, 'colorChangeEnabled').name('Mudança de Cor');
    lightsFolder.open();
    
    // Modo Dia/Noite
    const dayNightFolder = gui.addFolder('🌅 Modo Dia/Noite');
    dayNightFolder.add(dayNightConfig, 'mode', ['day', 'night']).name('Modo').onChange(transitionDayNight);
    dayNightFolder.add(dayNightConfig, 'transitionTime', 0.5, 10, 0.5).name('Tempo Transição (s)');
    dayNightFolder.add(dayNightConfig, 'autoTransition').name('Transição Automática');
    dayNightFolder.add(dayNightConfig, 'autoTransitionSpeed', 0.01, 0.5, 0.01).name('Velocidade Auto');
    dayNightFolder.add({ irParaDia: () => transitionDayNight('day') }, 'irParaDia').name('➡️ Ir para Dia');
    dayNightFolder.add({ irParaNoite: () => transitionDayNight('night') }, 'irParaNoite').name('➡️ Ir para Noite');
    dayNightFolder.open();
    
    // Fog
    const fogConfig = { habilitado: true, densidade: 0.015 };
    const fogFolder = gui.addFolder('🌫️ Fog (Neblina)');
    fogFolder.add(fogConfig, 'habilitado').name('Habilitado').onChange((value) => {
        scene.fog = value ? new THREE.FogExp2(0x87ceeb, fogConfig.densidade) : null;
    });
    fogFolder.add(fogConfig, 'densidade', 0, 0.1, 0.001).name('Densidade').onChange((value) => {
        if (scene.fog && scene.fog.isFogExp2) scene.fog.density = value;
    });
    
    // Texturas
    const textureFolder = gui.addFolder('🎨 Texturas Avançadas');
    textureFolder.add(textureConfig, 'multiTextureEnabled').name('Multi-Textura').onChange((value) => {
        if (model) {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        mat.aoMap = value ? detailTexture : null;
                        mat.needsUpdate = true;
                    });
                }
            });
        }
    });
    textureFolder.add(textureConfig, 'envMapIntensity', 0, 2, 0.1).name('Intensidade EnvMap').onChange((value) => {
        if (model) {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (mat.isMeshPhysicalMaterial) mat.envMapIntensity = value;
                    });
                }
            });
        }
    });
    
    // Câmera
    const cameraFolder = gui.addFolder('📷 Câmera');
    cameraFolder.add(guiConfig.camera, 'fov', 10, 120, 1).name('Campo de Visão').onChange((value) => {
        camera.fov = value;
        camera.updateProjectionMatrix();
    });
    cameraFolder.add({
        resetCamera: () => {
            if (model) {
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
                
                camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
                camera.lookAt(0, 0, 0);
                controls.target.set(0, 0, 0);
                controls.update();
            }
        }
    }, 'resetCamera').name('Resetar Câmera');
}


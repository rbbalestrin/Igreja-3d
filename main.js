/**
 * =============================================================================
 * IGREJA GÓTICA - CENA NATALINA 3D
 * =============================================================================
 * Projeto acadêmico de Computação Gráfica usando Three.js
 * 
 * Técnicas implementadas:
 * - SpotLights com show de luzes animado
 * - Skybox com transição dia/noite
 * - Fog (neblina) atmosférica
 * - Multi-textura e Environment Mapping
 * - Filtro anisotrópico
 * - Sistema de grama com shaders customizados
 * - Decorações natalinas procedurais
 * =============================================================================
 */

import * as THREE from 'three';

// Core
import { scene, camera, renderer, controls } from './src/core/scene.js';

// Systems
import { updateLightShow } from './src/systems/lighting.js';
import { 
    dayNightConfig, 
    dayNightBlend, 
    isTransitioning, 
    skybox,
    updateSkybox,
    updateEnvironmentForDayNight,
    setDayNightBlend
} from './src/systems/skybox.js';
import './src/systems/terrain.js';
import { groundData, platformGrass } from './src/systems/grass.js';
import './src/systems/decorations.js';
import { loadModel } from './src/systems/model.js';

// UI
import { initGUI } from './src/ui/gui.js';

// -----------------------------------------------------------------------------
// Variáveis de Rastreamento
// -----------------------------------------------------------------------------
let lastCameraPosition = new THREE.Vector3();

// -----------------------------------------------------------------------------
// Loop de Animação Principal
// -----------------------------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now() * 0.001;
    
    // Atualizar controles
    controls.update();
    
    // Atualizar show de luzes
    updateLightShow(time);
    
    // Sistema de trilhas
    const cameraPos = camera.position.clone();
    cameraPos.y = 0;
    
    if (lastCameraPosition.distanceTo(cameraPos) > 0.5) {
        for (let i = 0; i < 4; i++) {
            const offset = new THREE.Vector3(
                (i % 2 - 0.5) * 0.3,
                0,
                Math.floor(i / 2) * 0.2
            );
            groundData.addTrackPoint(i, cameraPos.clone().add(offset));
        }
        lastCameraPosition.copy(cameraPos);
    }
    
    // Atualizar sistemas
    groundData.update(renderer);
    platformGrass.update(time, camera.position);
    
    // Transição automática dia/noite
    if (dayNightConfig.autoTransition && !isTransitioning) {
        const newBlend = (Math.sin(time * dayNightConfig.autoTransitionSpeed) + 1) / 2;
        if (Math.abs(newBlend - dayNightBlend) > 0.01) {
            setDayNightBlend(newBlend);
            if (skybox.material && skybox.material.uniforms) {
                skybox.material.uniforms.blend.value = newBlend;
            } else {
                updateSkybox();
            }
            updateEnvironmentForDayNight();
        }
    }
    
    // Renderizar
    renderer.render(scene, camera);
}

// -----------------------------------------------------------------------------
// Inicialização
// -----------------------------------------------------------------------------
loadModel(() => {
    initGUI();
});

animate();

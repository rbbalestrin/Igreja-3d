// Arquivo principal refatorado - importa e inicializa todos os módulos
import { SceneManager } from './core/Scene.js';
import { LightingSystem } from './systems/LightingSystem.js';
import { SkyboxSystem } from './systems/SkyboxSystem.js';

// TODO: Importar outros módulos quando criados
// import { TerrainSystem } from './systems/TerrainSystem.js';
// import { TrackSystem } from './systems/TrackSystem.js';
// import { GrassSystem } from './systems/GrassSystem.js';
// import { ModelLoader } from './systems/ModelLoader.js';
// import { TextureUtils } from './utils/TextureUtils.js';
// import { initGUI } from './ui/GUI.js';

// Inicializa sistemas principais
const sceneManager = new SceneManager();
const lightingSystem = new LightingSystem(sceneManager.scene);
const skyboxSystem = new SkyboxSystem(sceneManager.scene, sceneManager.renderer);

// Loop de animação
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now() * 0.001;
    
    sceneManager.update();
    lightingSystem.update(time);
    skyboxSystem.updateAutoTransition(time);
    skyboxSystem.updateFog(skyboxSystem.blend);
    lightingSystem.updateForDayNight(skyboxSystem.blend);
    
    sceneManager.render();
}

animate();

console.log('Sistema modular inicializado!');

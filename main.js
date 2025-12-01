import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'lil-gui';

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Cor do céu azul claro

// Câmera
const camera = new THREE.PerspectiveCamera(
    75, // Campo de visão
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near plane
    1000 // Far plane
);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// OrbitControls - para controlar a câmera com mouse
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Suaviza o movimento
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 50;

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Cria múltiplos pontos de luz
const lights = [];
const lightHelpers = [];

// Luz 1 - Principal
const light1 = new THREE.PointLight(0xffffff, 1, 300);
light1.position.set(-2.5, 2, 4.5);
light1.castShadow = true;
light1.shadow.mapSize.width = 2048;
light1.shadow.mapSize.height = 2048;
scene.add(light1);
lights.push({ name: 'Luz Principal', light: light1, color: 0xffffff });

// Luz 2 - Lateral
const light2 = new THREE.PointLight(0xffaa00, 0.8, 300);
light2.position.set(2.5, 2, 4.5);
light2.castShadow = true;
scene.add(light2);
lights.push({ name: 'Luz Lateral Direita', light: light2, color: 0xffaa00 });

// Luz 3 - Traseira
const light3 = new THREE.PointLight(0x00aaff, 0.6, 300);
light3.position.set(4.5, 2, -2.5);
light3.castShadow = true;
scene.add(light3);
lights.push({ name: 'Luz Traseira', light: light3, color: 0x00aaff });

// Luz 4 - Lateral
const light4 = new THREE.PointLight(0x00aaff, 0.6, 300);
light4.position.set(-4.5, 2, -2.5);
light4.castShadow = true;
scene.add(light4);
lights.push({ name: 'Luz Lateral Esquerda', light: light4, color: 0x00aaff });


// Helpers visuais para as luzes (esferas que mostram a posição)
lights.forEach((lightData, index) => {
    const helper = new THREE.PointLightHelper(lightData.light, 0.5, lightData.color);
    scene.add(helper);
    lightHelpers.push(helper);
});

// Chão
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x000000,
    roughness: 0.8,
    metalness: 0.2
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Variável para armazenar o modelo
let model = null;
let modelPosition = { x: 0, y: 0, z: 0 };
let modelRotation = { x: 0, y: 0, z: 0 };
let modelScale = { x: 1, y: 1, z: 1 };

// Loader para modelos GLTF
const loader = new GLTFLoader();

// Elemento de loading
const loadingElement = document.getElementById('loading');

// Carrega o modelo
loadingElement.classList.add('show');
loader.load(
    '/model/stylized_gothic_church/scene.gltf',
    (gltf) => {
        model = gltf.scene;
        
        // Habilita sombras e ajusta materiais para responder à iluminação
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Garante que os materiais respondam à iluminação
                if (child.material) {
                    // Se for um array de materiais
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat, index) => {
                            // Converte MeshBasicMaterial para MeshStandardMaterial
                            if (mat.type === 'MeshBasicMaterial') {
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    color: mat.color,
                                    map: mat.map,
                                    normalMap: mat.normalMap,
                                    roughnessMap: mat.roughnessMap,
                                    metalnessMap: mat.metalnessMap,
                                    aoMap: mat.aoMap,
                                    emissiveMap: mat.emissiveMap,
                                    transparent: mat.transparent,
                                    opacity: mat.opacity,
                                    side: mat.side
                                });
                                child.material[index] = newMaterial;
                            } else {
                                // Garante que materiais existentes respondam à luz
                                if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
                                    mat.needsUpdate = true;
                                }
                            }
                        });
                    } else {
                        // Material único
                        if (child.material.type === 'MeshBasicMaterial') {
                            const oldMat = child.material;
                            const newMaterial = new THREE.MeshStandardMaterial({
                                color: oldMat.color,
                                map: oldMat.map,
                                normalMap: oldMat.normalMap,
                                roughnessMap: oldMat.roughnessMap,
                                metalnessMap: oldMat.metalnessMap,
                                aoMap: oldMat.aoMap,
                                emissiveMap: oldMat.emissiveMap,
                                transparent: oldMat.transparent,
                                opacity: oldMat.opacity,
                                side: oldMat.side
                            });
                            child.material = newMaterial;
                        } else {
                            // Garante que materiais existentes respondam à luz
                            if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                                child.material.needsUpdate = true;
                            }
                        }
                    }
                }
            }
        });
        
        // Calcula o bounding box para centralizar o modelo
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        
        // Centraliza o modelo
        model.position.x = 0;
        model.position.y = 0;
        model.position.z = 0;
        
        // Atualiza as variáveis de posição
        modelPosition.x = model.position.x;
        modelPosition.y = model.position.y;
        modelPosition.z = model.position.z;
        
        // Ajusta a câmera para focar no modelo
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Adiciona um pouco de espaço
        
        camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
        
        // Adiciona o modelo à cena
        scene.add(model);
        
        // Esconde o loading
        loadingElement.classList.remove('show');
        
        // Inicializa a GUI após o modelo carregar
        initGUI();
        
        console.log('Modelo carregado com sucesso!');
    },
    (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(0);
        loadingElement.textContent = `Carregando modelo... ${percent}%`;
        console.log('Carregando modelo...', percent + '%');
    },
    (error) => {
        loadingElement.textContent = 'Erro ao carregar modelo!';
        console.error('Erro ao carregar modelo:', error);
    }
);

// Grid helper
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
scene.add(gridHelper);

// Axes helper (opcional - mostra os eixos X, Y, Z)
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// Configurações para a GUI
const guiConfig = {
    // Câmera
    camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        fov: camera.fov
    },
    // Ambiente
    ambiente: {
        cor: '#000000',
        intensidade: ambientLight.intensity
    }
};

// Função para inicializar a GUI
function initGUI() {
    const gui = new GUI({ title: 'Controles da Cena' });
    // Controles das Luzes
    const lightsFolder = gui.addFolder('Luzes');
    lightsFolder.add({
        mostrarTodosHelpers: true
    }, 'mostrarTodosHelpers').name('Mostrar Todos Helpers').onChange((value) => {
        lightHelpers.forEach(helper => {
            helper.visible = value;
        });
    });
    
    lights.forEach((lightData, index) => {
        const lightFolder = lightsFolder.addFolder(lightData.name);
        const lightPos = {
            x: lightData.light.position.x,
            y: lightData.light.position.y,
            z: lightData.light.position.z
        };
        
        lightFolder.add(lightPos, 'x', -20, 20, 0.5).name('Posição X').onChange((value) => {
            lightData.light.position.x = value;
        });
        lightFolder.add(lightPos, 'y', 0, 20, 0.5).name('Posição Y').onChange((value) => {
            lightData.light.position.y = value;
        });
        lightFolder.add(lightPos, 'z', -20, 20, 0.5).name('Posição Z').onChange((value) => {
            lightData.light.position.z = value;
        });
        lightFolder.add(lightData.light, 'intensity', 0, 2, 0.1).name('Intensidade');
        lightFolder.addColor(lightData, 'color').name('Cor').onChange((value) => {
            lightData.light.color.setHex(value);
            // Atualiza a cor do helper também
            if (lightHelpers[index]) {
                lightHelpers[index].color.setHex(value);
            }
        });
        lightFolder.add(lightData.light, 'distance', 0, 200, 5).name('Distância');
        lightFolder.add(lightData.light, 'decay', 1, 2, 0.1).name('Decaimento');
        lightFolder.add(lightData.light, 'visible').name('Visível');
        lightFolder.add(lightHelpers[index], 'visible').name('Mostrar Helper');
        
        if (index === 0) lightFolder.open();
    });
    
    // Controles da Câmera
    const cameraFolder = gui.addFolder('Câmera');
    cameraFolder.add(guiConfig.camera, 'x', -50, 50, 0.5).name('Posição X').onChange((value) => {
        camera.position.x = value;
        controls.update();
    });
    cameraFolder.add(guiConfig.camera, 'y', 0, 50, 0.5).name('Posição Y').onChange((value) => {
        camera.position.y = value;
        controls.update();
    });
    cameraFolder.add(guiConfig.camera, 'z', -50, 50, 0.5).name('Posição Z').onChange((value) => {
        camera.position.z = value;
        controls.update();
    });
    cameraFolder.add(guiConfig.camera, 'fov', 10, 120, 1).name('Campo de Visão').onChange((value) => {
        camera.fov = value;
        camera.updateProjectionMatrix();
    });
    
    // Controles do Ambiente
    const ambienteFolder = gui.addFolder('Ambiente');
    ambienteFolder.add(guiConfig.ambiente, 'intensidade', 0, 2, 0.1).name('Intensidade').onChange((value) => {
        ambientLight.intensity = value;
    });
    ambienteFolder.addColor(guiConfig.ambiente, 'cor').name('Cor').onChange((value) => {
        ambientLight.color.setHex(value);
    });
    
    // Controles do Chão
    const floorFolder = gui.addFolder('Chão');
    const floorColor = { cor: 0x90ee90 };
    floorFolder.addColor(floorColor, 'cor').name('Cor').onChange((value) => {
        floorMaterial.color.setHex(value);
    });
    floorFolder.add(floorMaterial, 'roughness', 0, 1, 0.1).name('Rugosidade');
    floorFolder.add(floorMaterial, 'metalness', 0, 1, 0.1).name('Metalicidade');
    floorFolder.add(floor, 'visible').name('Visível');
    
    // Controles da Cena
    const sceneFolder = gui.addFolder('Cena');
    const bgColor = { cor: 0x000000 };
    sceneFolder.addColor(bgColor, 'cor').name('Cor de Fundo').onChange((value) => {
        scene.background = new THREE.Color(value);
    });
    sceneFolder.add(gridHelper, 'visible').name('Mostrar Grid');
    sceneFolder.add(axesHelper, 'visible').name('Mostrar Eixos');
    
    // Função para resetar câmera
    sceneFolder.add({
        resetCamera: () => {
            if (model) {
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraZ *= 1.5;
                camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
                camera.lookAt(0, 0, 0);
                controls.target.set(0, 0, 0);
                controls.update();
                guiConfig.camera.x = camera.position.x;
                guiConfig.camera.y = camera.position.y;
                guiConfig.camera.z = camera.position.z;
                cameraFolder.updateDisplay();
            }
        }
    }, 'resetCamera').name('Resetar Câmera');

    // Função para resetar modelo
    sceneFolder.add({
        resetModel: () => {
            if (model) {
                model.position.x = 0;
                model.position.y = 0;
                model.position.z = 0;
            }
        }
    }, 'resetModel').name('Resetar Modelo');
}

// Animação
function animate() {
    requestAnimationFrame(animate);
    
    // Atualiza os controles
    controls.update();
    
    // Atualiza os helpers das luzes
    lightHelpers.forEach(helper => {
        helper.update();
    });
    
    // Renderiza a cena
    renderer.render(scene, camera);
}

// Ajusta o tamanho quando a janela é redimensionada
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Inicia a animação
animate();


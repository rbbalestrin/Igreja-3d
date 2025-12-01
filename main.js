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
const light1 = new THREE.PointLight(0xffffff, 5, 300);
light1.position.set(-2.5, 2, 4.5);
light1.castShadow = true;
light1.shadow.mapSize.width = 2048;
light1.shadow.mapSize.height = 2048;
scene.add(light1);
lights.push({ name: 'Luz Principal', light: light1, color: 0xffffff });

// Luz 2 - Lateral
const light2 = new THREE.PointLight(0xffaa00, 10, 300);
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

// Terreno - Base de grama
const terrainSize = 50;
const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 32, 32);
const terrainMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a7c59, // Verde grama escuro
    roughness: 0.9,
    metalness: 0.1
});
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// Adiciona variação de altura ao terreno (opcional - terreno levemente ondulado)
const vertices = terrainGeometry.attributes.position;
for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    // Adiciona pequenas variações de altura para dar naturalidade
    const y = Math.random() * 0.1 - 0.05;
    vertices.setY(i, y);
}
terrainGeometry.computeVertexNormals();

// Caminho de pedras em frente à igreja
const pathGroup = new THREE.Group();
const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b6b6b, // Cinza pedra
    roughness: 0.8,
    metalness: 0.1
});

// Cria várias pedras para o caminho
for (let i = 0; i < 8; i++) {
    const stoneSize = 0.8 + Math.random() * 0.4;
    const stoneGeometry = new THREE.BoxGeometry(
        stoneSize,
        0.1,
        stoneSize * (0.7 + Math.random() * 0.3)
    );
    const stone = new THREE.Mesh(stoneGeometry, pathMaterial);
    stone.position.set(
        (i - 3.5) * 1.2,
        0.05,
        -2 + Math.random() * 0.3
    );
    stone.rotation.y = Math.random() * Math.PI * 0.2;
    stone.receiveShadow = true;
    pathGroup.add(stone);
}
scene.add(pathGroup);

// Pedras decorativas ao redor
const decorativeStones = new THREE.Group();
for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 8 + Math.random() * 4;
    const stoneSize = 0.3 + Math.random() * 0.2;
    
    const stoneGeometry = new THREE.DodecahedronGeometry(stoneSize, 0);
    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.1, 0.2, 0.3 + Math.random() * 0.2),
        roughness: 0.9,
        metalness: 0.1
    });
    const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
    
    stone.position.set(
        Math.cos(angle) * radius,
        stoneSize * 0.5,
        Math.sin(angle) * radius
    );
    stone.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    stone.castShadow = true;
    stone.receiveShadow = true;
    decorativeStones.add(stone);
}
scene.add(decorativeStones);

// Árvores simples ao redor da igreja
const treesGroup = new THREE.Group();

// Função para criar uma árvore simples
function createTree(x, z, scale = 1) {
    const tree = new THREE.Group();
    
    // Tronco
    const trunkGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 1.5 * scale, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x5d4037, // Marrom
        roughness: 0.9,
        metalness: 0.1
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.75 * scale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Folhas (copa)
    const leavesGeometry = new THREE.ConeGeometry(1 * scale, 2 * scale, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5016, // Verde escuro
        roughness: 0.8,
        metalness: 0.1
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 2 * scale;
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    tree.add(leaves);
    
    tree.position.set(x, 0, z);
    return tree;
}

// Adiciona árvores em posições estratégicas
const treePositions = [
    { x: -12, z: -8, scale: 1.2 },
    { x: 12, z: -8, scale: 1.0 },
    { x: -10, z: 10, scale: 0.9 },
    { x: 10, z: 10, scale: 1.1 },
    { x: -15, z: 0, scale: 1.0 },
    { x: 15, z: 0, scale: 0.8 }
];

treePositions.forEach(pos => {
    const tree = createTree(pos.x, pos.z, pos.scale);
    treesGroup.add(tree);
});

scene.add(treesGroup);

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
    
    // Controles do Terreno
    const terrainFolder = gui.addFolder('Terreno');
    const terrainColor = { cor: 0x4a7c59 };
    terrainFolder.addColor(terrainColor, 'cor').name('Cor da Grama').onChange((value) => {
        terrainMaterial.color.setHex(value);
    });
    terrainFolder.add(terrainMaterial, 'roughness', 0, 1, 0.1).name('Rugosidade');
    terrainFolder.add(terrainMaterial, 'metalness', 0, 1, 0.1).name('Metalicidade');
    terrainFolder.add(terrain, 'visible').name('Visível');
    
    // Controles do Caminho
    const pathFolder = gui.addFolder('Caminho');
    const pathColor = { cor: 0x6b6b6b };
    pathFolder.addColor(pathColor, 'cor').name('Cor das Pedras').onChange((value) => {
        pathMaterial.color.setHex(value);
    });
    pathFolder.add(pathGroup, 'visible').name('Visível');
    
    // Controles das Pedras Decorativas
    const stonesFolder = gui.addFolder('Pedras Decorativas');
    stonesFolder.add(decorativeStones, 'visible').name('Visível');
    
    // Controles das Árvores
    const treesFolder = gui.addFolder('Árvores');
    treesFolder.add(treesGroup, 'visible').name('Visível');
    
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


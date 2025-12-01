import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import GUI from 'lil-gui';

// Cena
const scene = new THREE.Scene();

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// Luz de Hemisfério (ilumina de cima para baixo com cores diferentes)
const hemisphereLight = new THREE.HemisphereLight(
    0x87ceeb, // Cor do céu (azul claro)
    0x4a7c59, // Cor do solo (verde grama)
    0.3 // Intensidade inicial baixa para destacar as luzes pontuais
);
hemisphereLight.position.set(0, 50, 0);
scene.add(hemisphereLight);

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

// Skybox - Céu (será carregado com textura EXR)
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
let skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide, // Renderiza o interior da esfera
    fog: false
});
const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skybox);

// Carrega o skybox EXR
const exrLoader = new EXRLoader();
exrLoader.load(
    '/assets/skyboxes/qwantani_sunset_puresky_1k.exr',
    (texture) => {
        // Configura a textura
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        
        // Atualiza o material do skybox com a textura
        skyMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            fog: false
        });
        skybox.material = skyMaterial;
        
        // Usa a textura como environment map para iluminação baseada em imagem
        scene.environment = texture;
        scene.background = texture;
        
        console.log('Skybox EXR carregado com sucesso!');
    },
    (progress) => {
        console.log('Carregando skybox...', progress);
    },
    (error) => {
        console.error('Erro ao carregar skybox EXR:', error);
        // Mantém o skybox padrão em caso de erro
    }
);

// Terreno - Base de grama melhorado
const terrainSize = 50;
const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 64, 64);
const terrainMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a7c59, // Verde grama escuro
    roughness: 0.9,
    metalness: 0.1
});
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// Adiciona variação de altura ao terreno (terreno mais interessante)
const vertices = terrainGeometry.attributes.position;
for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    // Cria um padrão de ondas suaves para o terreno
    const distance = Math.sqrt(x * x + z * z);
    const wave1 = Math.sin(distance * 0.2) * 0.3;
    const wave2 = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.2;
    const noise = (Math.random() - 0.5) * 0.1;
    const y = wave1 + wave2 + noise;
    vertices.setY(i, y);
}
terrainGeometry.computeVertexNormals();

// Adiciona patches de grama mais escura/clara para variação
const colors = [];
const color1 = new THREE.Color(0x4a7c59); // Verde escuro
const color2 = new THREE.Color(0x5a8c69); // Verde médio
const color3 = new THREE.Color(0x3a6c49); // Verde muito escuro

for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    // Cria padrões de cor baseados na posição
    const pattern = Math.sin(x * 0.5) * Math.cos(z * 0.5);
    if (pattern > 0.3) {
        colors.push(color2.r, color2.g, color2.b);
    } else if (pattern < -0.3) {
        colors.push(color3.r, color3.g, color3.b);
    } else {
        colors.push(color1.r, color1.g, color1.b);
    }
}
terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
terrainMaterial.vertexColors = true;

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
        (i - 3.5) * 1.2 - 5,
        0.05,
        -2 + Math.random() * 0.3 + 9.5
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
    '/assets/models/stylized_gothic_church/scene.gltf',
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
    ambienteFolder.add(guiConfig.ambiente, 'intensidade', 0, 2, 0.1).name('Luz Ambiente Intensidade').onChange((value) => {
        ambientLight.intensity = value;
    });
    ambienteFolder.addColor(guiConfig.ambiente, 'cor').name('Luz Ambiente Cor').onChange((value) => {
        ambientLight.color.setHex(value);
    });
    
    // Controles da Luz de Hemisfério
    const hemisphereFolder = gui.addFolder('Luz de Hemisfério');
    const hemisphereConfig = {
        intensidade: hemisphereLight.intensity,
        corCeu: '#87ceeb',
        corSolo: '#4a7c59'
    };
    hemisphereFolder.add(hemisphereConfig, 'intensidade', 0, 2, 0.1).name('Intensidade').onChange((value) => {
        hemisphereLight.intensity = value;
    });
    hemisphereFolder.addColor(hemisphereConfig, 'corCeu').name('Cor do Céu').onChange((value) => {
        hemisphereLight.color.setHex(value);
    });
    hemisphereFolder.addColor(hemisphereConfig, 'corSolo').name('Cor do Solo').onChange((value) => {
        hemisphereLight.groundColor.setHex(value);
    });
    hemisphereFolder.add(hemisphereLight, 'visible').name('Visível');
    
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
    
    // Controles do Skybox
    const skyboxConfig = { 
        usarTextura: true,
        cor: 0x87ceeb 
    };
    sceneFolder.add(skyboxConfig, 'usarTextura').name('Usar Skybox EXR').onChange((value) => {
        if (value && scene.environment) {
            // Usa a textura EXR se disponível
            skybox.material = skyMaterial;
            scene.background = scene.environment;
        } else {
            // Usa cor sólida
            const fallbackMaterial = new THREE.MeshBasicMaterial({
                color: skyboxConfig.cor,
                side: THREE.BackSide,
                fog: false
            });
            skybox.material = fallbackMaterial;
            scene.background = new THREE.Color(skyboxConfig.cor);
        }
    });
    sceneFolder.addColor(skyboxConfig, 'cor').name('Cor Fallback').onChange((value) => {
        if (!skyboxConfig.usarTextura) {
            skybox.material.color.setHex(value);
            scene.background = new THREE.Color(value);
        }
    });
    sceneFolder.add(skybox, 'visible').name('Mostrar Skybox');
    
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


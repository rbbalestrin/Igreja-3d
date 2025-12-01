import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import GUI from 'lil-gui';

// Cena
const scene = new THREE.Scene();

// Fog - Neblina para adicionar atmosfera
scene.fog = new THREE.FogExp2(0x87ceeb, 0.015); // Cor azul claro, densidade baixa

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
        
        // Filtro Anisotrópico - melhora qualidade das texturas em ângulos
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        
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

// Terreno - Base (mantido para sombras e física)
const terrainSize = 50;
const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 128, 128); // Mais subdivisões para detalhe
const terrainMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a7c59,
    roughness: 0.9,
    metalness: 0.1,
    visible: false // Invisível, apenas para física
});
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// ============================================
// TÉCNICA: Modo Imediato (glVertex equivalente)
// Criando objetos simples usando BufferGeometry manualmente
// ============================================

// Função para criar uma cruz usando modo imediato (vértices manuais)
function createCross(position, size = 1) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    // Cruz vertical (poste)
    const halfThickness = size * 0.1;
    const verticalHeight = size * 0.8;
    
    // Vértices do poste vertical (cubo simples)
    const vBase = [
        // Face frontal
        -halfThickness, 0, halfThickness,
        halfThickness, 0, halfThickness,
        halfThickness, verticalHeight, halfThickness,
        -halfThickness, verticalHeight, halfThickness,
        // Face traseira
        -halfThickness, 0, -halfThickness,
        halfThickness, 0, -halfThickness,
        halfThickness, verticalHeight, -halfThickness,
        -halfThickness, verticalHeight, -halfThickness
    ];
    
    // Vértices do braço horizontal
    const horizontalWidth = size * 0.6;
    const horizontalY = verticalHeight * 0.7;
    const hBase = [
        // Face frontal
        -horizontalWidth, horizontalY - halfThickness, halfThickness,
        horizontalWidth, horizontalY - halfThickness, halfThickness,
        horizontalWidth, horizontalY + halfThickness, halfThickness,
        -horizontalWidth, horizontalY + halfThickness, halfThickness,
        // Face traseira
        -horizontalWidth, horizontalY - halfThickness, -halfThickness,
        horizontalWidth, horizontalY - halfThickness, -halfThickness,
        horizontalWidth, horizontalY + halfThickness, -halfThickness,
        -horizontalWidth, horizontalY + halfThickness, -halfThickness
    ];
    
    vertices.push(...vBase, ...hBase);
    
    // Índices para o poste vertical (12 triângulos = 2 por face)
    const posteIndices = [
        0, 1, 2, 0, 2, 3, // frente
        4, 7, 6, 4, 6, 5, // trás
        0, 3, 7, 0, 7, 4, // esquerda
        1, 5, 6, 1, 6, 2, // direita
        3, 2, 6, 3, 6, 7, // topo
        0, 4, 5, 0, 5, 1  // base
    ];
    
    // Índices para o braço horizontal
    const bracoIndices = [
        8, 9, 10, 8, 10, 11, // frente
        12, 15, 14, 12, 14, 13, // trás
        8, 11, 15, 8, 15, 12, // esquerda
        9, 13, 14, 9, 14, 10, // direita
        11, 10, 14, 11, 14, 15, // topo
        8, 12, 13, 8, 13, 9  // base
    ].map(i => i + 8); // Offset pelos vértices do poste
    
    indices.push(...posteIndices, ...bracoIndices);
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x8b7355, // Marrom dourado
        roughness: 0.7,
        metalness: 0.3
    });
    
    const cross = new THREE.Mesh(geometry, material);
    cross.position.copy(position);
    cross.castShadow = true;
    cross.receiveShadow = true;
    
    return cross;
}

// Função para criar uma vela usando modo imediato
function createCandle(position) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const height = 0.8;
    const radius = 0.05;
    const segments = 16;
    
    // Cria um cilindro manualmente (vértice por vértice)
    // Base inferior
    vertices.push(0, 0, 0);
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        vertices.push(
            Math.cos(angle) * radius, 0, Math.sin(angle) * radius
        );
    }
    
    // Topo
    const topCenterIndex = vertices.length / 3;
    vertices.push(0, height, 0);
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        vertices.push(
            Math.cos(angle) * radius, height, Math.sin(angle) * radius
        );
    }
    
    // Índices para a base
    for (let i = 1; i <= segments; i++) {
        indices.push(0, i, (i % segments) + 1);
    }
    
    // Índices para o topo
    const topStart = topCenterIndex;
    for (let i = 1; i <= segments; i++) {
        indices.push(
            topStart,
            topStart + (i % segments) + 1,
            topStart + i
        );
    }
    
    // Índices para as laterais
    for (let i = 1; i <= segments; i++) {
        const bottom1 = i;
        const bottom2 = (i % segments) + 1;
        const top1 = topStart + i;
        const top2 = topStart + (i % segments) + 1;
        
        indices.push(bottom1, bottom2, top1);
        indices.push(bottom2, top2, top1);
    }
    
    // Chama da vela (pequena esfera)
    const flameRadius = 0.08;
    const flameHeight = height + 0.15;
    const flameSegments = 8;
    
    const flameCenterIndex = vertices.length / 3;
    vertices.push(0, flameHeight, 0);
    for (let i = 0; i <= flameSegments; i++) {
        const theta = (i / flameSegments) * Math.PI;
        for (let j = 0; j <= flameSegments; j++) {
            const phi = (j / flameSegments) * Math.PI * 2;
            const r = Math.sin(theta) * flameRadius;
            vertices.push(
                r * Math.cos(phi),
                flameHeight + Math.cos(theta) * flameRadius,
                r * Math.sin(phi)
            );
        }
    }
    
    // Índices para a chama (simplificado)
    for (let i = 1; i <= flameSegments; i++) {
        for (let j = 0; j < flameSegments; j++) {
            const a = flameCenterIndex + (i - 1) * (flameSegments + 1) + j + 1;
            const b = flameCenterIndex + i * (flameSegments + 1) + j + 1;
            const c = flameCenterIndex + i * (flameSegments + 1) + (j + 1) % (flameSegments + 1) + 1;
            const d = flameCenterIndex + (i - 1) * (flameSegments + 1) + (j + 1) % (flameSegments + 1) + 1;
            
            indices.push(a, b, c);
            indices.push(a, c, d);
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
        color: 0xf5deb3, // Bege claro (cera)
        roughness: 0.8,
        metalness: 0.1
    });
    
    const candle = new THREE.Mesh(geometry, material);
    candle.position.copy(position);
    candle.castShadow = true;
    candle.receiveShadow = true;
    
    // Chama emissiva
    const flameGeometry = new THREE.SphereGeometry(flameRadius, 8, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        emissive: 0xff3300,
        transparent: true,
        opacity: 0.8
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(0, height + 0.15, 0);
    candle.add(flame);
    
    return candle;
}

// Adiciona objetos criados com modo imediato à cena
const immediateModeObjects = new THREE.Group();

// Cruz no topo da igreja (será posicionada após o modelo carregar)
const cross = createCross(new THREE.Vector3(0, 8, 0), 1.5);
immediateModeObjects.add(cross);

// Velas dentro da igreja
const candlePositions = [
    new THREE.Vector3(-2, 0.5, 2),
    new THREE.Vector3(2, 0.5, 2),
    new THREE.Vector3(-2, 0.5, -2),
    new THREE.Vector3(2, 0.5, -2)
];

candlePositions.forEach(pos => {
    const candle = createCandle(pos);
    immediateModeObjects.add(candle);
});

scene.add(immediateModeObjects);

// Função de ruído simples para variação de terreno
function noise2D(x, z) {
    const X = Math.floor(x) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    z -= Math.floor(z);
    const u = x * x * (3.0 - 2.0 * x);
    const v = z * z * (3.0 - 2.0 * z);
    
    // Hash function simples
    const A = (X + Z * 57) * 0.01;
    const B = ((X + 1) + Z * 57) * 0.01;
    const C = (X + (Z + 1) * 57) * 0.01;
    const D = ((X + 1) + (Z + 1) * 57) * 0.01;
    
    return (1.0 - v) * (1.0 - u) * Math.sin(A) +
           (1.0 - v) * u * Math.sin(B) +
           v * (1.0 - u) * Math.sin(C) +
           v * u * Math.sin(D);
}

// Função de ruído fractal (múltiplas camadas)
function fractalNoise(x, z, octaves = 4) {
    let value = 0;
    let amplitude = 1;
    let frequency = 0.1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
        value += noise2D(x * frequency, z * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }
    
    return value / maxValue;
}

// Adiciona variação de altura ao terreno
const vertices = terrainGeometry.attributes.position;
const flatZoneRadius = 8; // Raio da zona plana ao redor da igreja
const maxHeight = 2.0; // Altura máxima do terreno

for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    
    // Distância do centro (onde a igreja está)
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    
    // Função que reduz a variação próximo ao centro
    // Retorna 0 no centro e 1 nas bordas
    const heightFactor = Math.max(0, Math.min(1, (distanceFromCenter - flatZoneRadius) / (terrainSize / 2 - flatZoneRadius)));
    
    // Gera altura usando ruído fractal
    const noiseValue = fractalNoise(x, z, 4);
    const height = noiseValue * maxHeight * heightFactor;
    
    // Adiciona pequenas variações locais
    const localVariation = (Math.random() - 0.5) * 0.2 * heightFactor;
    
    vertices.setY(i, height + localVariation);
}

terrainGeometry.computeVertexNormals();

// Função para obter altura do terreno em uma posição (x, z)
function getTerrainHeight(x, z) {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    const flatZoneRadius = 8;
    const maxHeight = 2.0;
    
    const heightFactor = Math.max(0, Math.min(1, (distanceFromCenter - flatZoneRadius) / (terrainSize / 2 - flatZoneRadius)));
    const noiseValue = fractalNoise(x, z, 4);
    const height = noiseValue * maxHeight * heightFactor;
    
    return height;
}

// Sistema de Trilhas (GroundData)
class GroundData {
    constructor(size = 100) {
        this.size = size;
        this.trackCount = 4; // 4 trilhas (como 4 rodas, adaptado para pegadas)
        this.trackLength = 128;
        
        // DataTexture para cada trilha (128x1, RGBA)
        this.trackTextures = [];
        for (let i = 0; i < this.trackCount; i++) {
            const data = new Float32Array(this.trackLength * 4);
            const texture = new THREE.DataTexture(data, this.trackLength, 1, THREE.RGBAFormat, THREE.FloatType);
            texture.needsUpdate = true;
            this.trackTextures.push(texture);
        }
        
        // RenderTarget para o mapa de trilhas (aumenta resolução para área maior)
        this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        // Cena separada para renderizar trilhas
        this.trackScene = new THREE.Scene();
        this.trackCamera = new THREE.OrthographicCamera(-size/2, size/2, size/2, -size/2, 0.1, 100);
        this.trackCamera.position.set(0, 10, 0);
        this.trackCamera.lookAt(0, 0, 0);
    }
    
    addTrackPoint(trackIndex, position) {
        if (trackIndex >= this.trackCount) return;
        
        const texture = this.trackTextures[trackIndex];
        const data = texture.image.data;
        
        // Move todos os pontos uma posição à direita
        for (let i = (this.trackLength - 1) * 4; i >= 4; i -= 4) {
            data[i] = data[i - 4];     // R = X
            data[i + 1] = data[i - 3]; // G = Y
            data[i + 2] = data[i - 2]; // Z
            data[i + 3] = data[i - 1]; // A
        }
        
        // Adiciona novo ponto no início
        data[0] = position.x;
        data[1] = position.y;
        data[2] = position.z;
        data[3] = 1.0; // Alpha = 1 quando toca o solo
        
        texture.needsUpdate = true;
    }
    
    update(renderer) {
        // Renderiza as trilhas no RenderTarget
        renderer.setRenderTarget(this.renderTarget);
        renderer.render(this.trackScene, this.trackCamera);
        renderer.setRenderTarget(null);
    }
    
    getTrackTexture() {
        return this.renderTarget.texture;
    }
}

const groundData = new GroundData(100);

// Sistema de Grama Infinita
class InfiniteGrass {
    constructor(count = 50000, size = 50) {
        this.count = count;
        this.size = size;
        this.bladeSize = 0.3;
        this.grassGeometry = null;
        this.grassMaterial = null;
        this.grassMesh = null;
        this.centers = [];
        
        this.init();
    }
    
    init() {
        const positions = [];
        const centers = [];
        const ids = [];
        const heights = [];
        const widths = [];
        const indices = [];
        
        // Gera blades de grama em uma área maior com margem de segurança
        const margin = this.size * 0.2; // 20% de margem extra
        const totalSize = this.size + margin * 2;
        
        for (let i = 0; i < this.count; i++) {
            // Gera em uma área maior para garantir cobertura
            const x = (Math.random() - 0.5) * totalSize;
            const z = (Math.random() - 0.5) * totalSize;
            // Calcula a altura do terreno nesta posição
            const terrainHeight = getTerrainHeight(x, z);
            const center = new THREE.Vector3(x, terrainHeight, z);
            this.centers.push(center);
            
            const height = 0.3 + Math.random() * 0.2;
            const width = 0.02 + Math.random() * 0.01;
            
            // Cada blade é um triângulo simples (3 vértices)
            const baseY = 0;
            const topY = height;
            
            // Vértice 1: base esquerda
            positions.push(-width, baseY, 0);
            centers.push(x, 0, z);
            ids.push(i);
            heights.push(height);
            widths.push(width);
            
            // Vértice 2: topo
            positions.push(0, topY, 0);
            centers.push(x, 0, z);
            ids.push(i);
            heights.push(height);
            widths.push(width);
            
            // Vértice 3: base direita
            positions.push(width, baseY, 0);
            centers.push(x, 0, z);
            ids.push(i);
            heights.push(height);
            widths.push(width);
            
            // Índices do triângulo
            const baseIndex = i * 3;
            indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        }
        
        // Cria geometria
        this.grassGeometry = new THREE.BufferGeometry();
        this.grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.grassGeometry.setAttribute('center', new THREE.Float32BufferAttribute(centers, 3));
        this.grassGeometry.setAttribute('id', new THREE.Float32BufferAttribute(ids, 1));
        this.grassGeometry.setAttribute('height', new THREE.Float32BufferAttribute(heights, 1));
        this.grassGeometry.setAttribute('width', new THREE.Float32BufferAttribute(widths, 1));
        this.grassGeometry.setIndex(indices);
        
        // Carrega shaders inline (mais confiável)
        this.loadDefaultShaders();
    }
    
    loadDefaultShaders() {
        // Shaders inline como fallback
        const vertexShader = `
            uniform float time;
            uniform vec3 uCameraPosition;
            uniform sampler2D trackTexture;
            attribute vec3 center;
            attribute float id;
            attribute float height;
            attribute float width;
            varying vec3 vColor;
            varying float vTipness;
            varying float vTrackInfluence;
            varying vec3 vNormal;
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            vec3 getWind(vec2 pos, float time) {
                float windStrength = 0.15;
                float windFrequency1 = 0.5;
                float windFrequency2 = 1.5;
                vec2 windDirection = vec2(1.0, 0.0);
                vec2 windPos1 = pos * windFrequency1 + windDirection * time * 0.5;
                vec2 windPos2 = pos * windFrequency2 + windDirection * time * 0.3;
                float wind1 = noise(windPos1) * windStrength;
                float wind2 = noise(windPos2) * windStrength * 0.5;
                return vec3(wind1 + wind2, 0.0, 0.0);
            }
            
            void main() {
                vTipness = float(gl_VertexID % 3) / 2.0;
                vec3 localPos = position;
                vec3 wind = getWind(center.xz, time);
                localPos += wind * vTipness;
                vec3 toCamera = normalize(uCameraPosition - center);
                vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
                vec3 up = cross(toCamera, right);
                vec3 billboardPos = localPos.x * right + localPos.y * up;
                vec3 worldPos = center + billboardPos;
                vec2 trackUV = (worldPos.xz + 50.0) / 100.0;
                vec4 trackData = texture2D(trackTexture, trackUV);
                vTrackInfluence = trackData.a;
                float trackBend = vTrackInfluence * 0.3;
                worldPos.y -= trackBend * vTipness;
                float grassGreen = 0.3 + vTipness * 0.2;
                grassGreen -= vTrackInfluence * 0.1;
                vColor = vec3(0.1, grassGreen, 0.05);
                
                // Calcula normal para o fragment shader
                vNormal = normalize(normalMatrix * up);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform sampler2D matcapTexture;
            varying vec3 vColor;
            varying float vTipness;
            varying float vTrackInfluence;
            varying vec3 vNormal;
            
            void main() {
                vec3 grassColor = vColor;
                grassColor = mix(grassColor * 0.7, grassColor * 1.2, vTipness);
                grassColor *= (1.0 - vTrackInfluence * 0.3);
                
                // Usa a normal passada do vertex shader
                vec2 matcapUV = vNormal.xy * 0.5 + 0.5;
                vec3 matcap = texture2D(matcapTexture, matcapUV).rgb;
                vec3 finalColor = grassColor * (0.7 + matcap * 0.3);
                
                float alpha = 1.0;
                alpha *= (1.0 - vTrackInfluence * 0.5);
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
        
        // Cria MatCap texture
        const matcapSize = 256;
        const matcapData = new Uint8Array(matcapSize * matcapSize * 4);
        for (let i = 0; i < matcapSize * matcapSize; i++) {
            const x = (i % matcapSize) / matcapSize;
            const y = Math.floor(i / matcapSize) / matcapSize;
            const r = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2);
            const intensity = Math.max(0, 1 - r * 2);
            matcapData[i * 4] = 128 + intensity * 127;
            matcapData[i * 4 + 1] = 128 + intensity * 127;
            matcapData[i * 4 + 2] = 128 + intensity * 127;
            matcapData[i * 4 + 3] = 255;
        }
        const matcapTexture = new THREE.DataTexture(matcapData, matcapSize, matcapSize, THREE.RGBAFormat);
        matcapTexture.needsUpdate = true;
        
        this.grassMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                time: { value: 0 },
                uCameraPosition: { value: camera.position },
                trackTexture: { value: groundData.getTrackTexture() },
                grassDensity: { value: 1.0 },
                windDirection: { value: new THREE.Vector2(1, 0) },
                matcapTexture: { value: matcapTexture }
            },
            side: THREE.DoubleSide,
            transparent: true,
            alphaTest: 0.1
        });
        
        this.grassMesh = new THREE.Mesh(this.grassGeometry, this.grassMaterial);
        this.grassMesh.frustumCulled = false;
        scene.add(this.grassMesh);
    }
    
    update(time, cameraPos) {
        if (this.grassMaterial) {
            this.grassMaterial.uniforms.time.value = time;
            this.grassMaterial.uniforms.uCameraPosition.value.copy(cameraPos);
            this.grassMaterial.uniforms.trackTexture.value = groundData.getTrackTexture();
            
            // Reposiciona blades que saíram dos limites (infinite tiling)
            // Usa uma área maior para garantir cobertura contínua
            const margin = this.size * 0.2;
            const halfSize = (this.size + margin * 2) / 2;
            const tileSize = this.size + margin * 2;
            
            this.centers.forEach((center, i) => {
                const dx = cameraPos.x - center.x;
                const dz = cameraPos.z - center.z;
                
                // Reposiciona quando sai da área visível
                if (Math.abs(dx) > halfSize) {
                    const offset = Math.sign(dx) * tileSize;
                    center.x += offset;
                    // Atualiza altura do terreno na nova posição
                    center.y = getTerrainHeight(center.x, center.z);
                }
                if (Math.abs(dz) > halfSize) {
                    const offset = Math.sign(dz) * tileSize;
                    center.z += offset;
                    // Atualiza altura do terreno na nova posição
                    center.y = getTerrainHeight(center.x, center.z);
                }
                
                // Atualiza atributos
                const baseIndex = i * 3;
                for (let j = 0; j < 3; j++) {
                    this.grassGeometry.attributes.center.setXYZ(baseIndex + j, center.x, center.y, center.z);
                }
            });
            this.grassGeometry.attributes.center.needsUpdate = true;
        }
    }
}

// Aumenta a área de grama para cobrir mais espaço e adiciona mais blades
const infiniteGrass = new InfiniteGrass(100000, 100);

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
                            
                            // Filtro Anisotrópico - aplica em todas as texturas
                            if (mat.map) {
                                mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                            }
                            if (mat.normalMap) {
                                mat.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                            }
                            if (mat.roughnessMap) {
                                mat.roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                            }
                            if (mat.metalnessMap) {
                                mat.metalnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
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
                        
                        // Filtro Anisotrópico - aplica em todas as texturas
                        const mat = child.material;
                        if (mat.map) {
                            mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        }
                        if (mat.normalMap) {
                            mat.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        }
                        if (mat.roughnessMap) {
                            mat.roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        }
                        if (mat.metalnessMap) {
                            mat.metalnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        }
                    }
                }
            }
        });
        
        // Calcula o bounding box para centralizar o modelo
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Centraliza o modelo
        model.position.x = 0;
        model.position.y = 0;
        model.position.z = 0;
        
        // Ajusta a posição da cruz para ficar no topo da igreja
        cross.position.set(0, size.y / 2 + 1.5, 0);
        
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
    
    // Controles de Fog (Neblina)
    const fogConfig = {
        habilitado: true,
        cor: 0x87ceeb,
        densidade: 0.015
    };
    ambienteFolder.add(fogConfig, 'habilitado').name('Fog Habilitado').onChange((value) => {
        if (value) {
            scene.fog = new THREE.FogExp2(fogConfig.cor, fogConfig.densidade);
        } else {
            scene.fog = null;
        }
    });
    ambienteFolder.addColor(fogConfig, 'cor').name('Cor do Fog').onChange((value) => {
        if (scene.fog && scene.fog.isFogExp2) {
            scene.fog.color.setHex(value);
            fogConfig.cor = value;
        }
    });
    ambienteFolder.add(fogConfig, 'densidade', 0, 0.1, 0.001).name('Densidade do Fog').onChange((value) => {
        if (scene.fog && scene.fog.isFogExp2) {
            scene.fog.density = value;
        }
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
    terrainFolder.add(terrain, 'visible').name('Mostrar Base (Física)');
    
    // Controles da Grama Infinita
    const grassFolder = gui.addFolder('Grama Infinita');
    if (infiniteGrass && infiniteGrass.grassMesh) {
        grassFolder.add(infiniteGrass.grassMesh, 'visible').name('Visível');
        if (infiniteGrass.grassMaterial) {
            grassFolder.add(infiniteGrass.grassMaterial.uniforms.grassDensity, 'value', 0.1, 2.0, 0.1).name('Densidade');
            grassFolder.add(infiniteGrass.grassMaterial.uniforms.windDirection.value, 'x', -2, 2, 0.1).name('Direção Vento X');
            grassFolder.add(infiniteGrass.grassMaterial.uniforms.windDirection.value, 'y', -2, 2, 0.1).name('Direção Vento Z');
        }
    }
    
    // Controles de Trilhas
    const tracksFolder = gui.addFolder('Trilhas');
    tracksFolder.add({
        limparTrilhas: () => {
            for (let i = 0; i < groundData.trackCount; i++) {
                const data = groundData.trackTextures[i].image.data;
                data.fill(0);
                groundData.trackTextures[i].needsUpdate = true;
            }
        }
    }, 'limparTrilhas').name('Limpar Trilhas');
    
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
    
    // Controles de Objetos Modo Imediato
    const immediateFolder = gui.addFolder('Modo Imediato (glVertex)');
    immediateFolder.add(immediateModeObjects, 'visible').name('Visível');
    immediateFolder.add(cross, 'visible').name('Cruz Visível');
    
    // Controles para velas
    const candlesVisible = { value: true };
    immediateFolder.add(candlesVisible, 'value').name('Velas Visíveis').onChange((value) => {
        immediateModeObjects.children.forEach(child => {
            if (child !== cross) {
                child.visible = value;
            }
        });
    });
    
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

// Variável para rastrear posição anterior da câmera (para criar trilhas)
let lastCameraPosition = new THREE.Vector3();
let trackCounter = 0;

// Animação
function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now() * 0.001;
    
    // Atualiza os controles
    controls.update();
    
    // Atualiza os helpers das luzes
    lightHelpers.forEach(helper => {
        helper.update();
    });
    
    // Cria trilhas baseadas no movimento da câmera (simula pegadas)
    const cameraPos = camera.position.clone();
    cameraPos.y = 0; // Projeta no chão
    
    if (lastCameraPosition.distanceTo(cameraPos) > 0.5) {
        // Adiciona ponto de trilha a cada 0.5 unidades de movimento
        for (let i = 0; i < 4; i++) {
            const offset = new THREE.Vector3(
                (i % 2 - 0.5) * 0.3, // Offset lateral
                0,
                Math.floor(i / 2) * 0.2 // Offset frontal
            );
            const trackPos = cameraPos.clone().add(offset);
            groundData.addTrackPoint(i, trackPos);
        }
        lastCameraPosition.copy(cameraPos);
    }
    
    // Atualiza o sistema de trilhas
    groundData.update(renderer);
    
    // Atualiza a grama infinita
    if (infiniteGrass) {
        infiniteGrass.update(time, camera.position);
    }
    
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


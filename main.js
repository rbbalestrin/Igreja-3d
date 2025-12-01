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

// #############################################################################
// # SEÇÃO 1: IMPORTS E CONFIGURAÇÕES INICIAIS
// #############################################################################

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import GUI from 'lil-gui';

// -----------------------------------------------------------------------------
// Cena Principal
// -----------------------------------------------------------------------------
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x87ceeb, 0.015); // Neblina azul clara

// -----------------------------------------------------------------------------
// Câmera
// -----------------------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(
    50,                                          // Campo de visão (FOV)
    window.innerWidth / window.innerHeight,      // Aspect ratio
    0.1,                                         // Near plane
    1000                                         // Far plane
);
camera.position.set(1, 1, 1);
camera.lookAt(0, 0, 0);

// -----------------------------------------------------------------------------
// Renderer
// -----------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// -----------------------------------------------------------------------------
// Controles de Órbita (mouse/touch)
// -----------------------------------------------------------------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2;
controls.maxDistance = 50;


// #############################################################################
// # SEÇÃO 2: SISTEMA DE ILUMINAÇÃO
// #############################################################################

// -----------------------------------------------------------------------------
// Luz Ambiente (iluminação global suave)
// -----------------------------------------------------------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// -----------------------------------------------------------------------------
// Luz de Hemisfério (céu/solo)
// -----------------------------------------------------------------------------
const hemisphereLight = new THREE.HemisphereLight(
    0x87ceeb,   // Cor do céu (azul claro)
    0x4a7c59,   // Cor do solo (verde grama)
    0.3         // Intensidade
);
hemisphereLight.position.set(0, 50, 0);
scene.add(hemisphereLight);

// -----------------------------------------------------------------------------
// SpotLights - Show de Luzes
// -----------------------------------------------------------------------------

// Arrays para armazenar luzes e helpers
const lights = [];
const lightHelpers = [];

// Configurações do show de luzes
const lightShowConfig = {
    enabled: true,
    speed: 1.0,
    colorSpeed: 0.5,
    movementEnabled: true,
    colorChangeEnabled: true
};

// Paleta de cores vibrantes para o show
const showColors = [
    new THREE.Color(0xff0066), // Rosa
    new THREE.Color(0x00ff66), // Verde
    new THREE.Color(0x6600ff), // Roxo
    new THREE.Color(0xff6600), // Laranja
    new THREE.Color(0x00ffff), // Ciano
    new THREE.Color(0xffff00), // Amarelo
    new THREE.Color(0xff00ff), // Magenta
    new THREE.Color(0x0066ff)  // Azul
];

// Target central para os spotlights
const churchTarget = new THREE.Object3D();
churchTarget.position.set(0, 2, 0);
scene.add(churchTarget);

// Função auxiliar para criar spotlight
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
    
    return {
        light: spot,
        color: color,
        baseAngle: baseAngle,
        colorIndex: colorIndex,
        isTop: isTop
    };
}

// Criar os 7 spotlights
lights.push(createSpotLight(0xff0066, { x: -8, y: 10, z: 8 }, 0, 0));              // Frontal Esquerda
lights.push(createSpotLight(0x00ff66, { x: 8, y: 10, z: 8 }, Math.PI / 2, 2));     // Frontal Direita
lights.push(createSpotLight(0x6600ff, { x: -8, y: 10, z: -8 }, Math.PI, 4));       // Traseira Esquerda
lights.push(createSpotLight(0xff6600, { x: 8, y: 10, z: -8 }, Math.PI * 1.5, 6));  // Traseira Direita
lights.push(createSpotLight(0xffffff, { x: 0, y: 15, z: 0 }, 0, 0, true));         // Topo
lights.push(createSpotLight(0x00ffff, { x: -12, y: 8, z: 0 }, Math.PI * 0.75, 1)); // Lateral Esquerda
lights.push(createSpotLight(0xffff00, { x: 12, y: 8, z: 0 }, Math.PI * 1.25, 3));  // Lateral Direita

// Criar helpers visuais (ocultos por padrão)
lights.forEach((lightData) => {
    const helper = new THREE.SpotLightHelper(lightData.light, lightData.color);
    helper.visible = false;
    scene.add(helper);
    lightHelpers.push(helper);
});

// -----------------------------------------------------------------------------
// Função de Atualização do Show de Luzes
// -----------------------------------------------------------------------------
function updateLightShow(time) {
    if (!lightShowConfig.enabled) return;
    
    const speed = lightShowConfig.speed;
    const colorSpeed = lightShowConfig.colorSpeed;
    
    lights.forEach((lightData, index) => {
        const light = lightData.light;
        
        // Movimento orbital (exceto luz do topo)
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
    
    // Atualizar helpers visíveis
    lightHelpers.forEach(helper => {
        if (helper.visible) helper.update();
    });
}


// #############################################################################
// # SEÇÃO 3: SISTEMA DE CÉU (SKYBOX + DIA/NOITE)
// #############################################################################

// -----------------------------------------------------------------------------
// Configurações do Sistema Dia/Noite
// -----------------------------------------------------------------------------
const dayNightConfig = {
    mode: 'day',
    transitionTime: 3.0,
    autoTransition: false,
    autoTransitionSpeed: 0.1
};

// Variáveis de estado
let dayNightBlend = 0.0;  // 0 = dia, 1 = noite
let dayTexture = null;
let nightTexture = null;
let isTransitioning = false;

// -----------------------------------------------------------------------------
// Skybox Base
// -----------------------------------------------------------------------------
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
let skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide,
    fog: false
});
const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skybox);

// -----------------------------------------------------------------------------
// Carregamento da Textura do Dia (EXR)
// -----------------------------------------------------------------------------
const exrLoader = new EXRLoader();
exrLoader.load(
    '/assets/skyboxes/qwantani_sunset_puresky_1k.exr',
    (texture) => {
        console.log('[DIA/NOITE] Skybox dia carregado');
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        dayTexture = texture;
        updateSkybox();
    },
    null,
    (error) => console.error('[DIA/NOITE] Erro ao carregar skybox dia:', error)
);

// -----------------------------------------------------------------------------
// Carregamento da Textura da Noite (GLTF)
// -----------------------------------------------------------------------------
const nightSkyboxLoader = new GLTFLoader();
nightSkyboxLoader.load(
    '/assets/inside_galaxy_skybox_hdri_360_panorama/scene.gltf',
    (gltf) => {
        console.log('[DIA/NOITE] Modelo GLTF da noite carregado');
        let textureFound = false;
        
        gltf.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                let texture = child.material.map || child.material.emissiveMap;
                
                if (texture) {
                    const clonedTexture = texture.clone();
                    clonedTexture.mapping = THREE.EquirectangularReflectionMapping;
                    clonedTexture.colorSpace = THREE.LinearSRGBColorSpace;
                    clonedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    nightTexture = clonedTexture;
                    textureFound = true;
                }
            }
        });
        
        if (!textureFound) {
            createProceduralNightTexture();
        }
        updateSkybox();
    },
    null,
    (error) => {
        console.error('[DIA/NOITE] Erro ao carregar skybox noite:', error);
        createProceduralNightTexture();
    }
);

// -----------------------------------------------------------------------------
// Textura Procedural da Noite (Fallback)
// -----------------------------------------------------------------------------
function createProceduralNightTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Gradiente do céu noturno
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(0.5, '#000033');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrelas
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    nightTexture = new THREE.CanvasTexture(canvas);
    nightTexture.mapping = THREE.EquirectangularReflectionMapping;
    nightTexture.colorSpace = THREE.LinearSRGBColorSpace;
    updateSkybox();
}

// -----------------------------------------------------------------------------
// Atualização do Skybox (Blend Dia/Noite)
// -----------------------------------------------------------------------------
function updateSkybox() {
    if (!dayTexture && !nightTexture) return;
    
    if (dayTexture && nightTexture) {
        // Shader customizado para blend entre texturas
        const blendMaterial = new THREE.ShaderMaterial({
            uniforms: {
                dayTexture: { value: dayTexture },
                nightTexture: { value: nightTexture },
                blend: { value: dayNightBlend }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D dayTexture;
                uniform sampler2D nightTexture;
                uniform float blend;
                varying vec3 vWorldPosition;
                
                void main() {
                    vec3 dir = normalize(vWorldPosition);
                    float u = atan(dir.z, dir.x) / (2.0 * 3.14159265359) + 0.5;
                    float v = acos(dir.y) / 3.14159265359;
                    vec2 uv = vec2(u, v);
                    
                    vec3 dayColor = texture2D(dayTexture, uv).rgb;
                    vec3 nightColor = texture2D(nightTexture, uv).rgb;
                    vec3 finalColor = mix(dayColor, nightColor, blend);
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            side: THREE.BackSide,
            fog: false
        });
        skybox.material = blendMaterial;
        
        // Environment map baseado no blend
        scene.environment = dayNightBlend < 0.5 ? dayTexture : nightTexture;
        scene.background = scene.environment;
    } else {
        const texture = dayTexture || nightTexture;
        skyMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            fog: false
        });
        skybox.material = skyMaterial;
        scene.environment = texture;
        scene.background = texture;
    }
}

// -----------------------------------------------------------------------------
// Transição Suave Dia/Noite
// -----------------------------------------------------------------------------
function transitionDayNight(targetMode, duration = null) {
    if (isTransitioning || (!dayTexture && !nightTexture)) return;
    
    const targetBlend = targetMode === 'night' ? 1.0 : 0.0;
    const transitionDuration = duration || dayNightConfig.transitionTime;
    const startBlend = dayNightBlend;
    const startTime = performance.now() * 0.001;
    
    isTransitioning = true;
    
    function animateTransition() {
        const currentTime = performance.now() * 0.001;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / transitionDuration, 1.0);
        
        // Easing suave (ease in-out)
        const eased = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        dayNightBlend = startBlend + (targetBlend - startBlend) * eased;
        
        // Atualiza skybox
        if (skybox.material && skybox.material.uniforms) {
            skybox.material.uniforms.blend.value = dayNightBlend;
        } else {
            updateSkybox();
        }
        
        updateEnvironmentForDayNight();
        
        if (progress < 1.0) {
            requestAnimationFrame(animateTransition);
        } else {
            isTransitioning = false;
            dayNightConfig.mode = targetMode;
        }
    }
    
    animateTransition();
}

// -----------------------------------------------------------------------------
// Atualização do Ambiente (Fog, Luzes) conforme Dia/Noite
// -----------------------------------------------------------------------------
function updateEnvironmentForDayNight() {
    // Atualiza fog
    if (scene.fog && scene.fog.isFogExp2) {
        const dayFogColor = new THREE.Color(0x87ceeb);
        const nightFogColor = new THREE.Color(0x000033);
        scene.fog.color.lerpColors(dayFogColor, nightFogColor, dayNightBlend);
        scene.fog.density = 0.015 + dayNightBlend * 0.01;
    }
    
    // Atualiza luz ambiente
    ambientLight.intensity = 0.1 - dayNightBlend * 0.05;
    
    // Atualiza luz de hemisfério
    const daySkyColor = new THREE.Color(0x87ceeb);
    const nightSkyColor = new THREE.Color(0x000033);
    const dayGroundColor = new THREE.Color(0x4a7c59);
    const nightGroundColor = new THREE.Color(0x001122);
    
    hemisphereLight.color.lerpColors(daySkyColor, nightSkyColor, dayNightBlend);
    hemisphereLight.groundColor.lerpColors(dayGroundColor, nightGroundColor, dayNightBlend);
    hemisphereLight.intensity = 0.3 - dayNightBlend * 0.2;
}


// #############################################################################
// # SEÇÃO 4: SISTEMA DE TERRENO E PLATAFORMA
// #############################################################################

// -----------------------------------------------------------------------------
// Constantes da Plataforma
// -----------------------------------------------------------------------------
const PLATFORM_SIZE = 100;
const BORDER_HEIGHT = 0.5;
const BORDER_THICKNESS = 0.3;

// -----------------------------------------------------------------------------
// Terreno Base (invisível, para física)
// -----------------------------------------------------------------------------
const terrainGeometry = new THREE.PlaneGeometry(PLATFORM_SIZE, PLATFORM_SIZE, 1, 1);
const terrainMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a7c59,
    roughness: 0.9,
    metalness: 0.1,
    visible: false
});
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// -----------------------------------------------------------------------------
// Chão Visível (Plataforma)
// -----------------------------------------------------------------------------
const floorGeometry = new THREE.PlaneGeometry(PLATFORM_SIZE, PLATFORM_SIZE, 1, 1);
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a6b4a,
    roughness: 0.9,
    metalness: 0.1
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// -----------------------------------------------------------------------------
// Bordas da Plataforma
// -----------------------------------------------------------------------------
const borderGroup = new THREE.Group();
const borderMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a4a3a,
    roughness: 0.8,
    metalness: 0.2
});

// Norte
const borderNorth = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM_SIZE + BORDER_THICKNESS * 2, BORDER_HEIGHT, BORDER_THICKNESS),
    borderMaterial
);
borderNorth.position.set(0, BORDER_HEIGHT / 2, PLATFORM_SIZE / 2 + BORDER_THICKNESS / 2);
borderNorth.castShadow = true;
borderNorth.receiveShadow = true;
borderGroup.add(borderNorth);

// Sul
const borderSouth = new THREE.Mesh(
    new THREE.BoxGeometry(PLATFORM_SIZE + BORDER_THICKNESS * 2, BORDER_HEIGHT, BORDER_THICKNESS),
    borderMaterial
);
borderSouth.position.set(0, BORDER_HEIGHT / 2, -PLATFORM_SIZE / 2 - BORDER_THICKNESS / 2);
borderSouth.castShadow = true;
borderSouth.receiveShadow = true;
borderGroup.add(borderSouth);

// Leste
const borderEast = new THREE.Mesh(
    new THREE.BoxGeometry(BORDER_THICKNESS, BORDER_HEIGHT, PLATFORM_SIZE),
    borderMaterial
);
borderEast.position.set(PLATFORM_SIZE / 2 + BORDER_THICKNESS / 2, BORDER_HEIGHT / 2, 0);
borderEast.castShadow = true;
borderEast.receiveShadow = true;
borderGroup.add(borderEast);

// Oeste
const borderWest = new THREE.Mesh(
    new THREE.BoxGeometry(BORDER_THICKNESS, BORDER_HEIGHT, PLATFORM_SIZE),
    borderMaterial
);
borderWest.position.set(-PLATFORM_SIZE / 2 - BORDER_THICKNESS / 2, BORDER_HEIGHT / 2, 0);
borderWest.castShadow = true;
borderWest.receiveShadow = true;
borderGroup.add(borderWest);

scene.add(borderGroup);

// -----------------------------------------------------------------------------
// Função de Altura do Terreno (plano = 0)
// -----------------------------------------------------------------------------
function getTerrainHeight(x, z) {
    return 0;
}


// #############################################################################
// # SEÇÃO 5: SISTEMA DE GRAMA
// #############################################################################

// -----------------------------------------------------------------------------
// Classe GroundData (Sistema de Trilhas)
// -----------------------------------------------------------------------------
class GroundData {
    constructor(size = 100) {
        this.size = size;
        this.trackCount = 4;
        this.trackLength = 128;
        
        // DataTexture para cada trilha
        this.trackTextures = [];
        for (let i = 0; i < this.trackCount; i++) {
            const data = new Float32Array(this.trackLength * 4);
            const texture = new THREE.DataTexture(data, this.trackLength, 1, THREE.RGBAFormat, THREE.FloatType);
            texture.needsUpdate = true;
            this.trackTextures.push(texture);
        }
        
        // RenderTarget para mapa de trilhas
        this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        // Cena e câmera para renderizar trilhas
        this.trackScene = new THREE.Scene();
        this.trackCamera = new THREE.OrthographicCamera(-size/2, size/2, size/2, -size/2, 0.1, 100);
        this.trackCamera.position.set(0, 2, 0);
        this.trackCamera.lookAt(0, 0, 0);
    }
    
    addTrackPoint(trackIndex, position) {
        if (trackIndex >= this.trackCount) return;
        
        const texture = this.trackTextures[trackIndex];
        const data = texture.image.data;
        
        // Shift dos pontos
        for (let i = (this.trackLength - 1) * 4; i >= 4; i -= 4) {
            data[i] = data[i - 4];
            data[i + 1] = data[i - 3];
            data[i + 2] = data[i - 2];
            data[i + 3] = data[i - 1];
        }
        
        // Novo ponto
        data[0] = position.x;
        data[1] = position.y;
        data[2] = position.z;
        data[3] = 1.0;
        
        texture.needsUpdate = true;
    }
    
    update(renderer) {
        renderer.setRenderTarget(this.renderTarget);
        renderer.render(this.trackScene, this.trackCamera);
        renderer.setRenderTarget(null);
    }
    
    getTrackTexture() {
        return this.renderTarget.texture;
    }
}

const groundData = new GroundData(100);

// -----------------------------------------------------------------------------
// Classe PlatformGrass (Grama Limitada à Plataforma)
// -----------------------------------------------------------------------------
class PlatformGrass {
    constructor(count = 50000, platformSize = 100) {
        this.count = count;
        this.platformSize = platformSize;
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
        
        const margin = 2;
        
        for (let i = 0; i < this.count; i++) {
            const x = (Math.random() - 0.5) * (this.platformSize - margin * 2);
            const z = (Math.random() - 0.5) * (this.platformSize - margin * 2);
            const center = new THREE.Vector3(x, 0, z);
            this.centers.push(center);
            
            const height = 0.3 + Math.random() * 0.2;
            const width = 0.02 + Math.random() * 0.01;
            
            // Triângulo: base esquerda, topo, base direita
            positions.push(-width, 0, 0);
            positions.push(0, height, 0);
            positions.push(width, 0, 0);
            
            for (let j = 0; j < 3; j++) {
                centers.push(x, 0, z);
                ids.push(i);
                heights.push(height);
                widths.push(width);
            }
            
            const baseIndex = i * 3;
            indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        }
        
        this.grassGeometry = new THREE.BufferGeometry();
        this.grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.grassGeometry.setAttribute('center', new THREE.Float32BufferAttribute(centers, 3));
        this.grassGeometry.setAttribute('id', new THREE.Float32BufferAttribute(ids, 1));
        this.grassGeometry.setAttribute('height', new THREE.Float32BufferAttribute(heights, 1));
        this.grassGeometry.setAttribute('width', new THREE.Float32BufferAttribute(widths, 1));
        this.grassGeometry.setIndex(indices);
        
        this.createMaterial();
    }
    
    createMaterial() {
        const vertexShader = `
            uniform float time;
            uniform vec3 uCameraPosition;
            uniform sampler2D trackTexture;
            attribute vec3 center;
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
            
            void main() {
                vTipness = float(gl_VertexID % 3) / 2.0;
                
                // Vento
                float windStrength = 0.15;
                vec2 windPos = center.xz * 0.5 + vec2(1.0, 0.0) * time * 0.5;
                float wind = noise(windPos) * windStrength;
                
                vec3 localPos = position;
                localPos.x += wind * vTipness;
                
                // Billboard
                vec3 toCamera = normalize(uCameraPosition - center);
                vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
                vec3 up = cross(toCamera, right);
                
                vec3 worldPos = center + localPos.x * right + localPos.y * up;
                
                // Trilhas
                vec2 trackUV = (worldPos.xz + 50.0) / 100.0;
                vec4 trackData = texture2D(trackTexture, trackUV);
                vTrackInfluence = trackData.a;
                worldPos.y -= vTrackInfluence * 0.3 * vTipness;
                
                // Cor
                float grassGreen = 0.3 + vTipness * 0.2 - vTrackInfluence * 0.1;
                vColor = vec3(0.1, grassGreen, 0.05);
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
                vec3 grassColor = mix(vColor * 0.7, vColor * 1.2, vTipness);
                grassColor *= (1.0 - vTrackInfluence * 0.3);
                
                vec2 matcapUV = vNormal.xy * 0.5 + 0.5;
                vec3 matcap = texture2D(matcapTexture, matcapUV).rgb;
                vec3 finalColor = grassColor * (0.7 + matcap * 0.3);
                
                float alpha = 1.0 - vTrackInfluence * 0.5;
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;
        
        // MatCap texture procedural
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
        }
    }
}

const platformGrass = new PlatformGrass(50000, PLATFORM_SIZE);


// #############################################################################
// # SEÇÃO 6: ELEMENTOS DECORATIVOS NATALINOS
// #############################################################################

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
function createChristmasDecoration(type, x, z) {
    const decoration = new THREE.Group();
    
    switch(type) {
        case 'present': {
            const boxSize = 0.3 + Math.random() * 0.2;
            const boxColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
            const boxColor = boxColors[Math.floor(Math.random() * boxColors.length)];
            
            // Caixa
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(boxSize, boxSize * 0.6, boxSize),
                new THREE.MeshStandardMaterial({ color: boxColor, roughness: 0.6, metalness: 0.2 })
            );
            box.position.y = boxSize * 0.3;
            box.castShadow = true;
            decoration.add(box);
            
            // Fitas
            const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.6 });
            const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(boxSize * 1.1, boxSize * 0.1, boxSize * 0.1), ribbonMat);
            ribbonH.position.y = boxSize * 0.3;
            decoration.add(ribbonH);
            
            const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(boxSize * 0.1, boxSize * 0.7, boxSize * 0.1), ribbonMat);
            ribbonV.position.y = boxSize * 0.3;
            decoration.add(ribbonV);
            
            // Laço
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
// Geração de Decorações Natalinas Aleatórias
// -----------------------------------------------------------------------------
const christmasDecorations = new THREE.Group();
const decorationTypes = ['present', 'star', 'bell', 'candle'];
const numDecorations = 20 + Math.floor(Math.random() * 11);

for (let i = 0; i < numDecorations; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 29; // 6-35 unidades
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const type = decorationTypes[Math.floor(Math.random() * decorationTypes.length)];
    
    christmasDecorations.add(createChristmasDecoration(type, x, z));
}
scene.add(christmasDecorations);

// -----------------------------------------------------------------------------
// Função: Criar Árvore de Natal
// -----------------------------------------------------------------------------
function createChristmasTree(x, z, scale = 1) {
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
// Geração de Árvores de Natal Aleatórias
// -----------------------------------------------------------------------------
const christmasTreesGroup = new THREE.Group();
const numTrees = 10 + Math.floor(Math.random() * 6);

for (let i = 0; i < numTrees; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 32; // 8-40 unidades
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const scale = 0.8 + Math.random() * 0.4;
    
    christmasTreesGroup.add(createChristmasTree(x, z, scale));
}
scene.add(christmasTreesGroup);


// #############################################################################
// # SEÇÃO 7: CARREGAMENTO DO MODELO PRINCIPAL
// #############################################################################

// -----------------------------------------------------------------------------
// Variáveis do Modelo
// -----------------------------------------------------------------------------
let model = null;
let modelPosition = { x: 0, y: 0, z: 0 };

// -----------------------------------------------------------------------------
// Loaders
// -----------------------------------------------------------------------------
const gltfLoader = new GLTFLoader();
const loadingElement = document.getElementById('loading');

// -----------------------------------------------------------------------------
// Textura de Detalhes Procedural (Multi-Textura)
// -----------------------------------------------------------------------------
function createDetailTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Gradiente base
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(50, 100, 30, 0)');
    gradient.addColorStop(0.3, 'rgba(60, 120, 40, 0.3)');
    gradient.addColorStop(0.7, 'rgba(40, 80, 25, 0.2)');
    gradient.addColorStop(1, 'rgba(30, 60, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Manchas de sujeira
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
    
    // Manchas de musgo
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

const detailTexture = createDetailTexture(512);

// -----------------------------------------------------------------------------
// Configurações de Textura
// -----------------------------------------------------------------------------
const textureConfig = {
    multiTextureEnabled: true,
    envMapIntensity: 0.5
};

// -----------------------------------------------------------------------------
// Carregamento do Modelo GLTF
// -----------------------------------------------------------------------------
loadingElement.classList.add('show');

gltfLoader.load(
    '/assets/models/stylized_gothic_church/scene.gltf',
    (gltf) => {
        model = gltf.scene;
        
        // Processar materiais
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                if (child.material) {
                    const processMaterial = (mat) => {
                        // Converter para MeshPhysicalMaterial
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
                    
                    // Aplicar filtro anisotrópico
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
        
        // Posicionar modelo
        model.position.set(0, 0, 0);
        modelPosition = { x: 0, y: 0, z: 0 };
        
        // Ajustar câmera
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
        initGUI();
        
        console.log('Modelo carregado com sucesso!');
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

// -----------------------------------------------------------------------------
// Helpers (Grid e Eixos)
// -----------------------------------------------------------------------------
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);


// #############################################################################
// # SEÇÃO 8: INTERFACE DO USUÁRIO (GUI)
// #############################################################################

// -----------------------------------------------------------------------------
// Configurações da GUI
// -----------------------------------------------------------------------------
const guiConfig = {
    camera: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        fov: camera.fov
    },
    ambiente: {
        cor: '#000000',
        intensidade: ambientLight.intensity
    }
};

// -----------------------------------------------------------------------------
// Inicialização da GUI
// -----------------------------------------------------------------------------
function initGUI() {
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


// #############################################################################
// # SEÇÃO 9: LOOP DE ANIMAÇÃO E EVENTOS
// #############################################################################

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
    
    // Sistema de trilhas (baseado no movimento da câmera)
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
            dayNightBlend = newBlend;
            if (skybox.material && skybox.material.uniforms) {
                skybox.material.uniforms.blend.value = dayNightBlend;
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
// Event Listeners
// -----------------------------------------------------------------------------
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// -----------------------------------------------------------------------------
// Iniciar Animação
// -----------------------------------------------------------------------------
animate();

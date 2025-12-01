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

// ============================================
// TÉCNICA: SpotLights - Show de Luzes
// Holofotes coloridos que iluminam a igreja
// ============================================

const lights = [];
const lightHelpers = [];
const spotTargets = []; // Alvos para os spotlights

// Configurações do show de luzes
const lightShowConfig = {
    enabled: true,
    speed: 1.0,
    colorSpeed: 0.5,
    movementEnabled: true,
    colorChangeEnabled: true
};

// Cores do show de luzes (RGB vibrantes)
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

// Cria target para os spotlights (ponto que a luz aponta)
const churchTarget = new THREE.Object3D();
churchTarget.position.set(0, 2, 0); // Centro da igreja
scene.add(churchTarget);

// Spotlight 1 - Frontal Esquerda (Rosa/Magenta)
const spot1 = new THREE.SpotLight(0xff0066, 50, 50, Math.PI / 6, 0.5, 1);
spot1.position.set(-8, 10, 8);
spot1.target = churchTarget;
spot1.castShadow = true;
spot1.shadow.mapSize.width = 2048;
spot1.shadow.mapSize.height = 2048;
scene.add(spot1);
lights.push({ 
    name: 'Holofote 1 (Frontal Esq)', 
    light: spot1, 
    color: 0xff0066,
    baseAngle: 0,
    colorIndex: 0
});

// Spotlight 2 - Frontal Direita (Verde/Ciano)
const spot2 = new THREE.SpotLight(0x00ff66, 50, 50, Math.PI / 6, 0.5, 1);
spot2.position.set(8, 10, 8);
spot2.target = churchTarget;
spot2.castShadow = true;
scene.add(spot2);
lights.push({ 
    name: 'Holofote 2 (Frontal Dir)', 
    light: spot2, 
    color: 0x00ff66,
    baseAngle: Math.PI / 2,
    colorIndex: 2
});

// Spotlight 3 - Traseira Esquerda (Roxo/Azul)
const spot3 = new THREE.SpotLight(0x6600ff, 50, 50, Math.PI / 6, 0.5, 1);
spot3.position.set(-8, 10, -8);
spot3.target = churchTarget;
spot3.castShadow = true;
scene.add(spot3);
lights.push({ 
    name: 'Holofote 3 (Traseira Esq)', 
    light: spot3, 
    color: 0x6600ff,
    baseAngle: Math.PI,
    colorIndex: 4
});

// Spotlight 4 - Traseira Direita (Laranja/Amarelo)
const spot4 = new THREE.SpotLight(0xff6600, 50, 50, Math.PI / 6, 0.5, 1);
spot4.position.set(8, 10, -8);
spot4.target = churchTarget;
spot4.castShadow = true;
scene.add(spot4);
lights.push({ 
    name: 'Holofote 4 (Traseira Dir)', 
    light: spot4, 
    color: 0xff6600,
    baseAngle: Math.PI * 1.5,
    colorIndex: 6
});

// Spotlight 5 - Topo (Branco/Multi)
const spot5 = new THREE.SpotLight(0xffffff, 30, 60, Math.PI / 4, 0.3, 1);
spot5.position.set(0, 15, 0);
spot5.target = churchTarget;
spot5.castShadow = true;
scene.add(spot5);
lights.push({ 
    name: 'Holofote 5 (Topo)', 
    light: spot5, 
    color: 0xffffff,
    baseAngle: 0,
    colorIndex: 0,
    isTop: true
});

// Spotlight 6 - Lateral Esquerda (Ciano)
const spot6 = new THREE.SpotLight(0x00ffff, 40, 50, Math.PI / 5, 0.4, 1);
spot6.position.set(-12, 8, 0);
spot6.target = churchTarget;
spot6.castShadow = true;
scene.add(spot6);
lights.push({ 
    name: 'Holofote 6 (Lateral Esq)', 
    light: spot6, 
    color: 0x00ffff,
    baseAngle: Math.PI * 0.75,
    colorIndex: 1
});

// Spotlight 7 - Lateral Direita (Amarelo)
const spot7 = new THREE.SpotLight(0xffff00, 40, 50, Math.PI / 5, 0.4, 1);
spot7.position.set(12, 8, 0);
spot7.target = churchTarget;
spot7.castShadow = true;
scene.add(spot7);
lights.push({ 
    name: 'Holofote 7 (Lateral Dir)', 
    light: spot7, 
    color: 0xffff00,
    baseAngle: Math.PI * 1.25,
    colorIndex: 3
});

// Helpers visuais para os spotlights
lights.forEach((lightData, index) => {
    const helper = new THREE.SpotLightHelper(lightData.light, lightData.color);
    helper.visible = false; // Esconde por padrão para não poluir a visualização
    scene.add(helper);
    lightHelpers.push(helper);
});

// Função para atualizar o show de luzes
function updateLightShow(time) {
    if (!lightShowConfig.enabled) return;
    
    const speed = lightShowConfig.speed;
    const colorSpeed = lightShowConfig.colorSpeed;
    
    lights.forEach((lightData, index) => {
        const light = lightData.light;
        
        // Animação de movimento (posição orbital)
        if (lightShowConfig.movementEnabled && !lightData.isTop) {
            const radius = 10;
            const height = 8 + Math.sin(time * speed + lightData.baseAngle) * 2;
            const angle = lightData.baseAngle + Math.sin(time * speed * 0.5) * 0.5;
            
            // Movimento suave orbital
            light.position.x = Math.cos(angle + time * speed * 0.3) * radius;
            light.position.z = Math.sin(angle + time * speed * 0.3) * radius;
            light.position.y = height;
        }
        
        // Animação de cor
        if (lightShowConfig.colorChangeEnabled) {
            const colorIndex = (lightData.colorIndex + Math.floor(time * colorSpeed)) % showColors.length;
            const nextColorIndex = (colorIndex + 1) % showColors.length;
            const t = (time * colorSpeed) % 1;
            
            // Interpolação suave entre cores
            const currentColor = showColors[colorIndex];
            const nextColor = showColors[nextColorIndex];
            light.color.lerpColors(currentColor, nextColor, t);
        }
        
        // Pulsação de intensidade
        const baseIntensity = lightData.isTop ? 30 : 50;
        light.intensity = baseIntensity + Math.sin(time * speed * 2 + index) * 15;
    });
    
    // Atualiza helpers
    lightHelpers.forEach(helper => {
        if (helper.visible) helper.update();
    });
}

// ============================================
// TÉCNICA: Modo Dia/Noite
// Sistema de transição entre skyboxes diurno e noturno
// ============================================

const dayNightConfig = {
    mode: 'day', // 'day' ou 'night'
    transitionTime: 3.0, // Tempo de transição em segundos
    autoTransition: false, // Transição automática
    autoTransitionSpeed: 0.1 // Velocidade da transição automática
};

let dayNightBlend = 0.0; // 0 = dia, 1 = noite
let dayTexture = null;
let nightTexture = null;
let isTransitioning = false;

// Skybox - Céu (será carregado com texturas)
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
let skyMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide,
    fog: false
});
const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skybox);

// Carrega o skybox do dia (EXR)
const exrLoader = new EXRLoader();
exrLoader.load(
    '/assets/skyboxes/qwantani_sunset_puresky_1k.exr',
    (texture) => {
        console.log('[DIA/NOITE] Skybox dia carregado com sucesso');
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        dayTexture = texture;
        
        console.log('[DIA/NOITE] dayTexture definida:', !!dayTexture);
        console.log('[DIA/NOITE] nightTexture atual:', !!nightTexture);
        
        // Se ainda não temos a textura da noite, usa a do dia
        if (!nightTexture) {
            console.log('[DIA/NOITE] Atualizando skybox apenas com textura do dia');
            updateSkybox();
        } else {
            console.log('[DIA/NOITE] Ambas texturas carregadas, atualizando skybox');
            updateSkybox();
        }
    },
    (progress) => {
        console.log('[DIA/NOITE] Carregando skybox dia...', progress);
    },
    (error) => {
        console.error('[DIA/NOITE] Erro ao carregar skybox dia:', error);
    }
);

// Carrega o skybox da noite (Galáxia) - usa o loader existente
const nightSkyboxLoader = new GLTFLoader();
nightSkyboxLoader.load(
    '/assets/inside_galaxy_skybox_hdri_360_panorama/scene.gltf',
    (gltf) => {
        console.log('[DIA/NOITE] Modelo GLTF da noite carregado');
        let textureFound = false;
        
        // Extrai a textura do modelo
        gltf.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                console.log('[DIA/NOITE] Mesh encontrado, material:', child.material.type);
                
                // Tenta encontrar textura em diferentes propriedades
                let texture = null;
                if (child.material.map) {
                    texture = child.material.map;
                    console.log('[DIA/NOITE] Textura encontrada em .map');
                } else if (child.material.emissiveMap) {
                    texture = child.material.emissiveMap;
                    console.log('[DIA/NOITE] Textura encontrada em .emissiveMap');
                } else if (Array.isArray(child.material)) {
                    child.material.forEach((mat, idx) => {
                        if (mat.map) {
                            texture = mat.map;
                            console.log(`[DIA/NOITE] Textura encontrada em material[${idx}].map`);
                        }
                    });
                }
                
                if (texture) {
                    const clonedTexture = texture.clone();
                    clonedTexture.mapping = THREE.EquirectangularReflectionMapping;
                    clonedTexture.colorSpace = THREE.LinearSRGBColorSpace;
                    clonedTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    nightTexture = clonedTexture;
                    textureFound = true;
                    console.log('[DIA/NOITE] Skybox noite configurado com textura do modelo');
                }
            }
        });
        
        if (!textureFound) {
            console.warn('[DIA/NOITE] Nenhuma textura encontrada no modelo, criando textura procedural');
            createProceduralNightTexture();
        }
        
        console.log('[DIA/NOITE] dayTexture:', !!dayTexture, 'nightTexture:', !!nightTexture);
        updateSkybox();
    },
    (progress) => {
        console.log('[DIA/NOITE] Carregando skybox noite...', progress);
    },
    (error) => {
        console.error('[DIA/NOITE] Erro ao carregar skybox noite:', error);
        console.log('[DIA/NOITE] Criando textura procedural como fallback');
        createProceduralNightTexture();
    }
);

// Função auxiliar para criar textura procedural da noite
function createProceduralNightTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000011');
    gradient.addColorStop(0.5, '#000033');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Adiciona estrelas
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
    console.log('[DIA/NOITE] Textura procedural da noite criada');
    updateSkybox();
}

// Função para atualizar o skybox com blend entre dia e noite
function updateSkybox() {
    console.log('[DIA/NOITE] updateSkybox() chamado');
    console.log('[DIA/NOITE] dayTexture:', !!dayTexture, 'nightTexture:', !!nightTexture, 'blend:', dayNightBlend);
    
    if (!dayTexture && !nightTexture) {
        console.warn('[DIA/NOITE] Nenhuma textura disponível!');
        return;
    }
    
    if (dayTexture && nightTexture) {
        console.log('[DIA/NOITE] Criando material com blend entre dia e noite');
        // Usa shader customizado para blend entre as duas texturas
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
                
                vec3 equirectangularUV(vec3 dir) {
                    float u = atan(dir.z, dir.x) / (2.0 * 3.14159265359) + 0.5;
                    float v = acos(dir.y) / 3.14159265359;
                    return vec3(u, v, 0.0);
                }
                
                void main() {
                    vec3 dir = normalize(vWorldPosition);
                    vec2 uv = equirectangularUV(dir).xy;
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
        console.log('[DIA/NOITE] Material de blend aplicado ao skybox');
        
        // Atualiza environment map (interpola entre os dois)
        if (dayNightBlend < 0.5) {
            scene.environment = dayTexture;
            scene.background = dayTexture;
            console.log('[DIA/NOITE] Usando environment map do dia');
        } else {
            scene.environment = nightTexture;
            scene.background = nightTexture;
            console.log('[DIA/NOITE] Usando environment map da noite');
        }
    } else if (dayTexture) {
        console.log('[DIA/NOITE] Usando apenas textura do dia');
        skyMaterial = new THREE.MeshBasicMaterial({
            map: dayTexture,
            side: THREE.BackSide,
            fog: false
        });
        skybox.material = skyMaterial;
        scene.environment = dayTexture;
        scene.background = dayTexture;
    } else if (nightTexture) {
        console.log('[DIA/NOITE] Usando apenas textura da noite');
        skyMaterial = new THREE.MeshBasicMaterial({
            map: nightTexture,
            side: THREE.BackSide,
            fog: false
        });
        skybox.material = skyMaterial;
        scene.environment = nightTexture;
        scene.background = nightTexture;
    }
}

// Função para transicionar entre dia e noite
function transitionDayNight(targetMode, duration = null) {
    console.log('[DIA/NOITE] transitionDayNight() chamado:', targetMode);
    console.log('[DIA/NOITE] isTransitioning:', isTransitioning);
    console.log('[DIA/NOITE] dayTexture:', !!dayTexture, 'nightTexture:', !!nightTexture);
    
    if (isTransitioning) {
        console.warn('[DIA/NOITE] Transição já em andamento, ignorando');
        return;
    }
    
    if (!dayTexture && !nightTexture) {
        console.error('[DIA/NOITE] Nenhuma textura disponível para transição!');
        return;
    }
    
    const targetBlend = targetMode === 'night' ? 1.0 : 0.0;
    const transitionDuration = duration || dayNightConfig.transitionTime;
    const startBlend = dayNightBlend;
    const startTime = performance.now() * 0.001;
    
    console.log('[DIA/NOITE] Iniciando transição:', {
        targetMode,
        targetBlend,
        startBlend,
        transitionDuration
    });
    
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
        
        // Atualiza o skybox
        if (skybox.material && skybox.material.uniforms) {
            skybox.material.uniforms.blend.value = dayNightBlend;
        } else {
            // Se não tem uniforms, precisa recriar o material
            console.log('[DIA/NOITE] Material não tem uniforms, recriando skybox');
            updateSkybox();
        }
        
        // Atualiza fog e ambiente
        updateEnvironmentForDayNight();
        
        if (progress < 1.0) {
            requestAnimationFrame(animateTransition);
        } else {
            console.log('[DIA/NOITE] Transição concluída para', targetMode);
            isTransitioning = false;
            dayNightConfig.mode = targetMode;
        }
    }
    
    animateTransition();
}

// Função para atualizar ambiente (fog, luzes) conforme dia/noite
function updateEnvironmentForDayNight() {
    // Atualiza fog
    if (scene.fog && scene.fog.isFogExp2) {
        const dayFogColor = new THREE.Color(0x87ceeb); // Azul claro
        const nightFogColor = new THREE.Color(0x000033); // Azul escuro
        scene.fog.color.lerpColors(dayFogColor, nightFogColor, dayNightBlend);
        scene.fog.density = 0.015 + dayNightBlend * 0.01; // Mais denso à noite
    }
    
    // Atualiza luz ambiente
    const dayAmbient = 0.1;
    const nightAmbient = 0.05;
    ambientLight.intensity = dayAmbient + (nightAmbient - dayAmbient) * dayNightBlend;
    
    // Atualiza luz de hemisfério
    const daySkyColor = new THREE.Color(0x87ceeb);
    const nightSkyColor = new THREE.Color(0x000033);
    const dayGroundColor = new THREE.Color(0x4a7c59);
    const nightGroundColor = new THREE.Color(0x001122);
    
    hemisphereLight.color.lerpColors(daySkyColor, nightSkyColor, dayNightBlend);
    hemisphereLight.groundColor.lerpColors(dayGroundColor, nightGroundColor, dayNightBlend);
    hemisphereLight.intensity = 0.3 - dayNightBlend * 0.2; // Menos intenso à noite
}

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

// Chão fixo removido - substituído por InfiniteTerrain

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

// Função para obter altura do terreno em uma posição (x, z) - INFINITA
function getTerrainHeight(x, z) {
    const distanceFromCenter = Math.sqrt(x * x + z * z);
    const flatZoneRadius = 8;
    const maxHeight = 2.0;
    
    // Remove dependência de terrainSize - funciona para qualquer coordenada
    // Zona plana no centro, transição suave para terreno variado
    const transitionStart = flatZoneRadius;
    const transitionEnd = flatZoneRadius + 20; // Zona de transição de 20 unidades
    
    let heightFactor = 0;
    if (distanceFromCenter < transitionStart) {
        heightFactor = 0; // Zona plana no centro
    } else if (distanceFromCenter < transitionEnd) {
        // Transição suave
        heightFactor = (distanceFromCenter - transitionStart) / (transitionEnd - transitionStart);
    } else {
        heightFactor = 1.0; // Terreno variado completo
    }
    
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

// ============================================
// TÉCNICA: Terreno Infinito Procedural
// Sistema de tiles que se reposicionam conforme a câmera se move
// ============================================

class InfiniteTerrain {
    constructor(tileSize = 100, gridSize = 3) {
        this.tileSize = tileSize;
        this.gridSize = gridSize; // Grid 3x3 = 9 tiles visíveis
        this.tiles = [];
        this.tileGroup = new THREE.Group();
        this.currentTileX = 0;
        this.currentTileZ = 0;
        
        scene.add(this.tileGroup);
        this.init();
    }
    
    init() {
        // Cria grid inicial de tiles ao redor da origem
        const halfGrid = Math.floor(this.gridSize / 2);
        for (let x = -halfGrid; x <= halfGrid; x++) {
            for (let z = -halfGrid; z <= halfGrid; z++) {
                this.createTile(x * this.tileSize, z * this.tileSize);
            }
        }
    }
    
    createTile(centerX, centerZ) {
        const segments = 32; // Subdivisões para detalhe
        const geometry = new THREE.PlaneGeometry(
            this.tileSize,
            this.tileSize,
            segments,
            segments
        );
        
        // Deforma os vértices usando getTerrainHeight
        const vertices = geometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
            const x = vertices.getX(i) + centerX;
            const z = vertices.getZ(i) + centerZ;
            const height = getTerrainHeight(x, z);
            vertices.setY(i, height);
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x3a6b4a, // Verde escuro (chão)
            roughness: 0.9,
            metalness: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(centerX, 0, centerZ);
        mesh.receiveShadow = true;
        
        this.tileGroup.add(mesh);
        this.tiles.push({
            mesh: mesh,
            centerX: centerX,
            centerZ: centerZ,
            tileX: Math.floor(centerX / this.tileSize),
            tileZ: Math.floor(centerZ / this.tileSize)
        });
    }
    
    update(cameraPos) {
        // Calcula qual tile a câmera está
        const cameraTileX = Math.floor(cameraPos.x / this.tileSize);
        const cameraTileZ = Math.floor(cameraPos.z / this.tileSize);
        
        // Se a câmera mudou de tile, reposiciona os tiles
        if (cameraTileX !== this.currentTileX || cameraTileZ !== this.currentTileZ) {
            this.currentTileX = cameraTileX;
            this.currentTileZ = cameraTileZ;
            
            // Remove tiles que estão muito longe
            const halfGrid = Math.floor(this.gridSize / 2);
            const minTileX = cameraTileX - halfGrid;
            const maxTileX = cameraTileX + halfGrid;
            const minTileZ = cameraTileZ - halfGrid;
            const maxTileZ = cameraTileZ + halfGrid;
            
            // Filtra tiles que ainda estão no range
            const tilesToKeep = [];
            const tilesToRemove = [];
            
            this.tiles.forEach(tile => {
                if (tile.tileX >= minTileX && tile.tileX <= maxTileX &&
                    tile.tileZ >= minTileZ && tile.tileZ <= maxTileZ) {
                    tilesToKeep.push(tile);
                } else {
                    tilesToRemove.push(tile);
                }
            });
            
            // Remove tiles antigos
            tilesToRemove.forEach(tile => {
                this.tileGroup.remove(tile.mesh);
                tile.mesh.geometry.dispose();
                tile.mesh.material.dispose();
            });
            
            this.tiles = tilesToKeep;
            
            // Cria novos tiles que estão faltando
            const existingTiles = new Set();
            this.tiles.forEach(tile => {
                existingTiles.add(`${tile.tileX},${tile.tileZ}`);
            });
            
            for (let x = minTileX; x <= maxTileX; x++) {
                for (let z = minTileZ; z <= maxTileZ; z++) {
                    const key = `${x},${z}`;
                    if (!existingTiles.has(key)) {
                        this.createTile(x * this.tileSize, z * this.tileSize);
                    }
                }
            }
        }
    }
}

// Cria o terreno infinito
const infiniteTerrain = new InfiniteTerrain(100, 3);

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

// ============================================
// TÉCNICA: Multi-Textura
// Cria texturas procedurais de detalhes (sujeira, musgo) para combinar com texturas base
// ============================================

// Função para criar textura de detalhes procedurais (sujeira/musgo)
function createDetailTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Base verde musgo
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(50, 100, 30, 0)');
    gradient.addColorStop(0.3, 'rgba(60, 120, 40, 0.3)');
    gradient.addColorStop(0.7, 'rgba(40, 80, 25, 0.2)');
    gradient.addColorStop(1, 'rgba(30, 60, 20, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Adiciona manchas de sujeira
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
    
    // Adiciona padrões de musgo (manchas verdes)
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
    texture.repeat.set(2, 2); // Repete a textura
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    return texture;
}

// Cria textura de detalhes
const detailTexture = createDetailTexture(512);

// ============================================
// TÉCNICA: Environment Mapping (CubeMap)
// Cria um cubemap para reflexões realistas
// ============================================

// Variável para armazenar configurações de multi-textura e environment mapping
const textureConfig = {
    multiTextureEnabled: true,
    envMapIntensity: 0.5
};

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
                    // Função auxiliar para aplicar multi-textura e environment mapping
                    const applyAdvancedTexturing = (mat) => {
                        // Converte para MeshPhysicalMaterial para suportar environment mapping
                        if (!mat.isMeshPhysicalMaterial) {
                            const oldMat = mat;
                            const newMat = new THREE.MeshPhysicalMaterial({
                                color: oldMat.color,
                                map: oldMat.map,
                                normalMap: oldMat.normalMap,
                                roughnessMap: oldMat.roughnessMap,
                                metalnessMap: oldMat.metalnessMap,
                                aoMap: oldMat.aoMap,
                                emissiveMap: oldMat.emissiveMap,
                                transparent: oldMat.transparent,
                                opacity: oldMat.opacity,
                                side: oldMat.side,
                                roughness: oldMat.roughness !== undefined ? oldMat.roughness : 0.7,
                                metalness: oldMat.metalness !== undefined ? oldMat.metalness : 0.1
                            });
                            
                            // Multi-Textura: adiciona textura de detalhes
                            if (textureConfig.multiTextureEnabled) {
                                newMat.aoMap = detailTexture; // Usa como AO map para detalhes
                            }
                            
                            // Environment Mapping: usa o environment map da cena
                            if (scene.environment) {
                                newMat.envMap = scene.environment;
                                newMat.envMapIntensity = textureConfig.envMapIntensity;
                            }
                            
                            return newMat;
                        } else {
                            // Já é MeshPhysicalMaterial, apenas adiciona as texturas
                            if (textureConfig.multiTextureEnabled) {
                                mat.aoMap = detailTexture;
                            }
                            if (scene.environment) {
                                mat.envMap = scene.environment;
                                mat.envMapIntensity = textureConfig.envMapIntensity;
                            }
                            return mat;
                        }
                    };
                    
                    // Se for um array de materiais
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map((mat, index) => {
                            // Converte MeshBasicMaterial para MeshStandardMaterial primeiro
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
                                return applyAdvancedTexturing(newMaterial);
                            } else {
                                return applyAdvancedTexturing(mat);
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
                            child.material = applyAdvancedTexturing(newMaterial);
                        } else {
                            child.material = applyAdvancedTexturing(child.material);
                        }
                    }
                    
                    // Aplica filtro anisotrópico em todas as texturas
                    const applyAnisotropy = (mat) => {
                        if (mat.map) mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        if (mat.normalMap) mat.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        if (mat.roughnessMap) mat.roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        if (mat.metalnessMap) mat.metalnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                        if (mat.aoMap) mat.aoMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    };
                    
                    if (Array.isArray(child.material)) {
                        child.material.forEach(applyAnisotropy);
                    } else {
                        applyAnisotropy(child.material);
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

// Função para inicializar a GUI (refatorada - apenas controles essenciais)
function initGUI() {
    const gui = new GUI({ title: 'Controles da Cena' });
    
    // ========== CONTROLES ESSENCIAIS ==========
    
    // 1. Show de Luzes (Técnica: SpotLights)
    const lightsFolder = gui.addFolder('🎆 Show de Luzes');
    lightsFolder.add(lightShowConfig, 'enabled').name('Ativar Show');
    lightsFolder.add(lightShowConfig, 'speed', 0.1, 3, 0.1).name('Velocidade');
    lightsFolder.add(lightShowConfig, 'colorSpeed', 0.1, 2, 0.1).name('Velocidade Cores');
    lightsFolder.add(lightShowConfig, 'movementEnabled').name('Movimento');
    lightsFolder.add(lightShowConfig, 'colorChangeEnabled').name('Mudança de Cor');
    lightsFolder.open();
    
    // 2. Modo Dia/Noite (Técnica: Skybox + Transição)
    const dayNightFolder = gui.addFolder('🌅 Modo Dia/Noite');
    dayNightFolder.add(dayNightConfig, 'mode', ['day', 'night']).name('Modo').onChange((value) => {
        transitionDayNight(value);
    });
    dayNightFolder.add(dayNightConfig, 'transitionTime', 0.5, 10, 0.5).name('Tempo Transição (s)');
    dayNightFolder.add(dayNightConfig, 'autoTransition').name('Transição Automática');
    dayNightFolder.add(dayNightConfig, 'autoTransitionSpeed', 0.01, 0.5, 0.01).name('Velocidade Auto');
    dayNightFolder.add({
        irParaDia: () => transitionDayNight('day')
    }, 'irParaDia').name('➡️ Ir para Dia');
    dayNightFolder.add({
        irParaNoite: () => transitionDayNight('night')
    }, 'irParaNoite').name('➡️ Ir para Noite');
    dayNightFolder.open();
    
    // 3. Fog (Técnica: Neblina)
    const fogConfig = {
        habilitado: true,
        densidade: 0.015
    };
    const fogFolder = gui.addFolder('🌫️ Fog (Neblina)');
    fogFolder.add(fogConfig, 'habilitado').name('Habilitado').onChange((value) => {
        if (value) {
            scene.fog = new THREE.FogExp2(0x87ceeb, fogConfig.densidade);
        } else {
            scene.fog = null;
        }
    });
    fogFolder.add(fogConfig, 'densidade', 0, 0.1, 0.001).name('Densidade').onChange((value) => {
        if (scene.fog && scene.fog.isFogExp2) {
            scene.fog.density = value;
        }
    });
    
    // 4. Texturas Avançadas (Técnicas: Multi-Textura + Environment Mapping)
    const textureFolder = gui.addFolder('🎨 Texturas Avançadas');
    textureFolder.add(textureConfig, 'multiTextureEnabled').name('Multi-Textura').onChange((value) => {
        if (model) {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (value) {
                            mat.aoMap = detailTexture;
                        } else {
                            mat.aoMap = null;
                        }
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
                        if (mat.isMeshPhysicalMaterial) {
                            mat.envMapIntensity = value;
                        }
                    });
                }
            });
        }
    });
    
    // 5. Câmera (Navegação)
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
                let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                cameraZ *= 1.5;
                camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
                camera.lookAt(0, 0, 0);
                controls.target.set(0, 0, 0);
                controls.update();
                guiConfig.camera.x = camera.position.x;
                guiConfig.camera.y = camera.position.y;
                guiConfig.camera.z = camera.position.z;
            }
        }
    }, 'resetCamera').name('Resetar Câmera');
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
    
    // Atualiza o show de luzes
    updateLightShow(time);
    
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
    
    // Atualiza o terreno infinito
    if (infiniteTerrain) {
        infiniteTerrain.update(camera.position);
    }
    
    // Atualiza transição automática dia/noite
    if (dayNightConfig.autoTransition && !isTransitioning) {
        const newBlend = (Math.sin(time * dayNightConfig.autoTransitionSpeed) + 1) / 2;
        if (Math.abs(newBlend - dayNightBlend) > 0.01) { // Só atualiza se mudou significativamente
            dayNightBlend = newBlend;
            if (skybox.material && skybox.material.uniforms) {
                skybox.material.uniforms.blend.value = dayNightBlend;
            } else {
                // Se não tem uniforms, recria o material
                updateSkybox();
            }
            updateEnvironmentForDayNight();
        }
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


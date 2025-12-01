import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SkyboxSystem {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.config = {
            mode: 'day',
            transitionTime: 3.0,
            autoTransition: false,
            autoTransitionSpeed: 0.1
        };
        
        this.blend = 0.0;
        this.dayTexture = null;
        this.nightTexture = null;
        this.isTransitioning = false;
        this.skybox = null;
        
        this.init();
    }
    
    init() {
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide,
            fog: false
        });
        this.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skybox);
        
        this.loadDaySkybox();
        this.loadNightSkybox();
    }
    
    loadDaySkybox() {
        const exrLoader = new EXRLoader();
        exrLoader.load(
            '/assets/skyboxes/qwantani_sunset_puresky_1k.exr',
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                texture.colorSpace = THREE.LinearSRGBColorSpace;
                texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                this.dayTexture = texture;
                this.updateSkybox();
                console.log('Skybox Dia carregado!');
            },
            undefined,
            (error) => console.error('Erro ao carregar skybox dia:', error)
        );
    }
    
    loadNightSkybox() {
        const loader = new GLTFLoader();
        loader.load(
            '/assets/inside_galaxy_skybox_hdri_360_panorama/scene.gltf',
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child.isMesh && child.material && child.material.map) {
                        const texture = child.material.map.clone();
                        texture.mapping = THREE.EquirectangularReflectionMapping;
                        texture.colorSpace = THREE.LinearSRGBColorSpace;
                        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                        this.nightTexture = texture;
                        this.updateSkybox();
                        console.log('Skybox Noite carregado!');
                    }
                });
            },
            undefined,
            () => this.createProceduralNightSkybox()
        );
    }
    
    createProceduralNightSkybox() {
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
        
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        this.nightTexture = new THREE.CanvasTexture(canvas);
        this.nightTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.nightTexture.colorSpace = THREE.LinearSRGBColorSpace;
        this.updateSkybox();
    }
    
    updateSkybox() {
        if (!this.dayTexture && !this.nightTexture) return;
        
        if (this.dayTexture && this.nightTexture) {
            const blendMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    dayTexture: { value: this.dayTexture },
                    nightTexture: { value: this.nightTexture },
                    blend: { value: this.blend }
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
            this.skybox.material = blendMaterial;
            
            if (this.blend < 0.5) {
                this.scene.environment = this.dayTexture;
                this.scene.background = this.dayTexture;
            } else {
                this.scene.environment = this.nightTexture;
                this.scene.background = this.nightTexture;
            }
        } else if (this.dayTexture) {
            this.skybox.material = new THREE.MeshBasicMaterial({
                map: this.dayTexture,
                side: THREE.BackSide,
                fog: false
            });
            this.scene.environment = this.dayTexture;
            this.scene.background = this.dayTexture;
        } else if (this.nightTexture) {
            this.skybox.material = new THREE.MeshBasicMaterial({
                map: this.nightTexture,
                side: THREE.BackSide,
                fog: false
            });
            this.scene.environment = this.nightTexture;
            this.scene.background = this.nightTexture;
        }
    }
    
    transition(targetMode, duration = null) {
        if (this.isTransitioning) return;
        
        const targetBlend = targetMode === 'night' ? 1.0 : 0.0;
        const transitionDuration = duration || this.config.transitionTime;
        const startBlend = this.blend;
        const startTime = performance.now() * 0.001;
        
        this.isTransitioning = true;
        
        const animateTransition = () => {
            const currentTime = performance.now() * 0.001;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / transitionDuration, 1.0);
            
            const eased = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            this.blend = startBlend + (targetBlend - startBlend) * eased;
            
            if (this.skybox.material.uniforms) {
                this.skybox.material.uniforms.blend.value = this.blend;
            }
            
            if (progress < 1.0) {
                requestAnimationFrame(animateTransition);
            } else {
                this.isTransitioning = false;
                this.config.mode = targetMode;
            }
        };
        
        animateTransition();
    }
    
    updateFog(blend) {
        if (this.scene.fog && this.scene.fog.isFogExp2) {
            const dayFogColor = new THREE.Color(0x87ceeb);
            const nightFogColor = new THREE.Color(0x000033);
            this.scene.fog.color.lerpColors(dayFogColor, nightFogColor, blend);
            this.scene.fog.density = 0.015 + blend * 0.01;
        }
    }
    
    updateAutoTransition(time) {
        if (this.config.autoTransition && !this.isTransitioning) {
            this.blend = (Math.sin(time * this.config.autoTransitionSpeed) + 1) / 2;
            if (this.skybox.material.uniforms) {
                this.skybox.material.uniforms.blend.value = this.blend;
            }
        }
    }
}


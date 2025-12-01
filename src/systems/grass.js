/**
 * =============================================================================
 * SISTEMA: Grama com Shaders Customizados
 * =============================================================================
 */

import * as THREE from 'three';
import { scene, camera, renderer } from '../core/scene.js';
import { PLATFORM_SIZE } from './terrain.js';

// -----------------------------------------------------------------------------
// Classe GroundData (Sistema de Trilhas)
// -----------------------------------------------------------------------------
export class GroundData {
    constructor(size = 100) {
        this.size = size;
        this.trackCount = 4;
        this.trackLength = 128;
        
        this.trackTextures = [];
        for (let i = 0; i < this.trackCount; i++) {
            const data = new Float32Array(this.trackLength * 4);
            const texture = new THREE.DataTexture(data, this.trackLength, 1, THREE.RGBAFormat, THREE.FloatType);
            texture.needsUpdate = true;
            this.trackTextures.push(texture);
        }
        
        this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
            format: THREE.RGBAFormat,
            type: THREE.FloatType
        });
        
        this.trackScene = new THREE.Scene();
        this.trackCamera = new THREE.OrthographicCamera(-size/2, size/2, size/2, -size/2, 0.1, 100);
        this.trackCamera.position.set(0, 2, 0);
        this.trackCamera.lookAt(0, 0, 0);
    }
    
    addTrackPoint(trackIndex, position) {
        if (trackIndex >= this.trackCount) return;
        
        const texture = this.trackTextures[trackIndex];
        const data = texture.image.data;
        
        for (let i = (this.trackLength - 1) * 4; i >= 4; i -= 4) {
            data[i] = data[i - 4];
            data[i + 1] = data[i - 3];
            data[i + 2] = data[i - 2];
            data[i + 3] = data[i - 1];
        }
        
        data[0] = position.x;
        data[1] = position.y;
        data[2] = position.z;
        data[3] = 1.0;
        
        texture.needsUpdate = true;
    }
    
    update(rendererRef) {
        rendererRef.setRenderTarget(this.renderTarget);
        rendererRef.render(this.trackScene, this.trackCamera);
        rendererRef.setRenderTarget(null);
    }
    
    getTrackTexture() {
        return this.renderTarget.texture;
    }
}

export const groundData = new GroundData(100);

// -----------------------------------------------------------------------------
// Classe PlatformGrass
// -----------------------------------------------------------------------------
export class PlatformGrass {
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
                
                float windStrength = 0.15;
                vec2 windPos = center.xz * 0.5 + vec2(1.0, 0.0) * time * 0.5;
                float wind = noise(windPos) * windStrength;
                
                vec3 localPos = position;
                localPos.x += wind * vTipness;
                
                vec3 toCamera = normalize(uCameraPosition - center);
                vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
                vec3 up = cross(toCamera, right);
                
                vec3 worldPos = center + localPos.x * right + localPos.y * up;
                
                vec2 trackUV = (worldPos.xz + 50.0) / 100.0;
                vec4 trackData = texture2D(trackTexture, trackUV);
                vTrackInfluence = trackData.a;
                worldPos.y -= vTrackInfluence * 0.3 * vTipness;
                
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

export const platformGrass = new PlatformGrass(50000, PLATFORM_SIZE);


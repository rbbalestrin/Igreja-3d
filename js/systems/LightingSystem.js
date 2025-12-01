import * as THREE from 'three';

export class LightingSystem {
    constructor(scene) {
        this.scene = scene;
        this.ambientLight = null;
        this.hemisphereLight = null;
        this.lights = [];
        this.lightHelpers = [];
        this.churchTarget = null;
        this.config = {
            enabled: true,
            speed: 1.0,
            colorSpeed: 0.5,
            movementEnabled: true,
            colorChangeEnabled: true
        };
        
        this.showColors = [
            new THREE.Color(0xff0066), // Rosa
            new THREE.Color(0x00ff66), // Verde
            new THREE.Color(0x6600ff), // Roxo
            new THREE.Color(0xff6600), // Laranja
            new THREE.Color(0x00ffff), // Ciano
            new THREE.Color(0xffff00), // Amarelo
            new THREE.Color(0xff00ff), // Magenta
            new THREE.Color(0x0066ff)  // Azul
        ];
        
        this.init();
    }
    
    init() {
        // Luz ambiente
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(this.ambientLight);
        
        // Luz de Hemisfério
        this.hemisphereLight = new THREE.HemisphereLight(
            0x87ceeb, // Cor do céu
            0x4a7c59, // Cor do solo
            0.3
        );
        this.hemisphereLight.position.set(0, 50, 0);
        this.scene.add(this.hemisphereLight);
        
        // Cria target para os spotlights
        this.churchTarget = new THREE.Object3D();
        this.churchTarget.position.set(0, 2, 0);
        this.scene.add(this.churchTarget);
        
        // Cria os holofotes
        this.createSpotlights();
    }
    
    createSpotlights() {
        const spotlights = [
            { pos: [-8, 10, 8], color: 0xff0066, name: 'Holofote 1 (Frontal Esq)', baseAngle: 0, colorIndex: 0 },
            { pos: [8, 10, 8], color: 0x00ff66, name: 'Holofote 2 (Frontal Dir)', baseAngle: Math.PI / 2, colorIndex: 2 },
            { pos: [-8, 10, -8], color: 0x6600ff, name: 'Holofote 3 (Traseira Esq)', baseAngle: Math.PI, colorIndex: 4 },
            { pos: [8, 10, -8], color: 0xff6600, name: 'Holofote 4 (Traseira Dir)', baseAngle: Math.PI * 1.5, colorIndex: 6 },
            { pos: [0, 15, 0], color: 0xffffff, name: 'Holofote 5 (Topo)', baseAngle: 0, colorIndex: 0, isTop: true, intensity: 30, angle: Math.PI / 4, distance: 60 },
            { pos: [-12, 8, 0], color: 0x00ffff, name: 'Holofote 6 (Lateral Esq)', baseAngle: Math.PI * 0.75, colorIndex: 1, intensity: 40, angle: Math.PI / 5 },
            { pos: [12, 8, 0], color: 0xffff00, name: 'Holofote 7 (Lateral Dir)', baseAngle: Math.PI * 1.25, colorIndex: 3, intensity: 40, angle: Math.PI / 5 }
        ];
        
        spotlights.forEach((spotData, index) => {
            const spot = new THREE.SpotLight(
                spotData.color,
                spotData.intensity || 50,
                spotData.distance || 50,
                spotData.angle || Math.PI / 6,
                0.5,
                1
            );
            spot.position.set(...spotData.pos);
            spot.target = this.churchTarget;
            spot.castShadow = true;
            spot.shadow.mapSize.width = 2048;
            spot.shadow.mapSize.height = 2048;
            this.scene.add(spot);
            
            this.lights.push({
                name: spotData.name,
                light: spot,
                color: spotData.color,
                baseAngle: spotData.baseAngle,
                colorIndex: spotData.colorIndex,
                isTop: spotData.isTop || false
            });
            
            // Helper
            const helper = new THREE.SpotLightHelper(spot, spotData.color);
            helper.visible = false;
            this.scene.add(helper);
            this.lightHelpers.push(helper);
        });
    }
    
    update(time) {
        if (!this.config.enabled) return;
        
        const speed = this.config.speed;
        const colorSpeed = this.config.colorSpeed;
        
        this.lights.forEach((lightData, index) => {
            const light = lightData.light;
            
            // Animação de movimento
            if (this.config.movementEnabled && !lightData.isTop) {
                const radius = 10;
                const height = 8 + Math.sin(time * speed + lightData.baseAngle) * 2;
                const angle = lightData.baseAngle + Math.sin(time * speed * 0.5) * 0.5;
                
                light.position.x = Math.cos(angle + time * speed * 0.3) * radius;
                light.position.z = Math.sin(angle + time * speed * 0.3) * radius;
                light.position.y = height;
            }
            
            // Animação de cor
            if (this.config.colorChangeEnabled) {
                const colorIndex = (lightData.colorIndex + Math.floor(time * colorSpeed)) % this.showColors.length;
                const nextColorIndex = (colorIndex + 1) % this.showColors.length;
                const t = (time * colorSpeed) % 1;
                
                const currentColor = this.showColors[colorIndex];
                const nextColor = this.showColors[nextColorIndex];
                light.color.lerpColors(currentColor, nextColor, t);
            }
            
            // Pulsação de intensidade
            const baseIntensity = lightData.isTop ? 30 : 50;
            light.intensity = baseIntensity + Math.sin(time * speed * 2 + index) * 15;
        });
        
        // Atualiza helpers
        this.lightHelpers.forEach(helper => {
            if (helper.visible) helper.update();
        });
    }
    
    updateForDayNight(blend) {
        // Atualiza luz ambiente
        const dayAmbient = 0.1;
        const nightAmbient = 0.05;
        this.ambientLight.intensity = dayAmbient + (nightAmbient - dayAmbient) * blend;
        
        // Atualiza luz de hemisfério
        const daySkyColor = new THREE.Color(0x87ceeb);
        const nightSkyColor = new THREE.Color(0x000033);
        const dayGroundColor = new THREE.Color(0x4a7c59);
        const nightGroundColor = new THREE.Color(0x001122);
        
        this.hemisphereLight.color.lerpColors(daySkyColor, nightSkyColor, blend);
        this.hemisphereLight.groundColor.lerpColors(dayGroundColor, nightGroundColor, blend);
        this.hemisphereLight.intensity = 0.3 - blend * 0.2;
    }
}


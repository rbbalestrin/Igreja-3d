uniform float time;
uniform vec3 cameraPosition;
uniform sampler2D trackTexture;
uniform float grassDensity;
uniform vec2 windDirection;

// Função de ruído Perlin simplificado
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

// Função de vento
vec3 getWind(vec2 pos, float time) {
    float windStrength = 0.15;
    float windFrequency1 = 0.5;
    float windFrequency2 = 1.5;
    
    vec2 windPos1 = pos * windFrequency1 + windDirection * time * 0.5;
    vec2 windPos2 = pos * windFrequency2 + windDirection * time * 0.3;
    
    float wind1 = noise(windPos1) * windStrength;
    float wind2 = noise(windPos2) * windStrength * 0.5;
    
    return vec3(wind1 + wind2, 0.0, 0.0);
}

attribute vec3 center;
attribute float id;
attribute float height;
attribute float width;

varying vec3 vColor;
varying float vTipness;
varying float vTrackInfluence;

void main() {
    // Calcula o tipness (0 na base, 1 no topo)
    vTipness = float(gl_VertexID % 3) / 2.0;
    
    // Posição do blade em relação ao centro
    vec3 localPos = position;
    
    // Aplica o vento
    vec3 wind = getWind(center.xz, time);
    localPos += wind * vTipness;
    
    // Billboarding - rotaciona o blade em direção à câmera
    vec3 toCamera = normalize(cameraPosition - center);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCamera));
    vec3 up = cross(toCamera, right);
    
    // Aplica rotação baseada no billboard
    vec3 billboardPos = localPos.x * right + localPos.y * up;
    
    // Posição final
    vec3 worldPos = center + billboardPos;
    
    // Verifica trilhas (track texture)
    vec2 trackUV = (worldPos.xz + 25.0) / 50.0; // Normaliza para 0-1
    vec4 trackData = texture2D(trackTexture, trackUV);
    vTrackInfluence = trackData.a;
    
    // Abaixa a grama onde há trilha
    float trackBend = vTrackInfluence * 0.3;
    worldPos.y -= trackBend * vTipness;
    
    // Cor varia com altura e trilha
    float grassGreen = 0.3 + vTipness * 0.2;
    grassGreen -= vTrackInfluence * 0.1; // Mais escuro onde há trilha
    vColor = vec3(0.1, grassGreen, 0.05);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}


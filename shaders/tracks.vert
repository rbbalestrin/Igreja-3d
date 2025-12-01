uniform sampler2D trackDataTexture;
uniform float trackWidth;

attribute float trackIndex;

varying vec2 vUV;

void main() {
    // Lê a posição da trilha da textura
    float u = trackIndex / 128.0;
    vec4 trackPoint = texture2D(trackDataTexture, vec2(u, 0.5));
    
    // Posição do vértice ao longo da trilha
    vec3 trackPos = trackPoint.xyz;
    
    // Cria um pequeno plano perpendicular à direção da trilha
    vec3 offset = vec3(position.x * trackWidth, position.y * 0.1, position.z * trackWidth);
    
    vec3 worldPos = trackPos + offset;
    
    vUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}


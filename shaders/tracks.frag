uniform sampler2D trackDataTexture;
uniform float trackIndex;

varying vec2 vUV;

void main() {
    // Cor da trilha (terra pisada)
    vec3 trackColor = vec3(0.4, 0.3, 0.2);
    
    // Alpha baseada na idade da trilha (mais antiga = mais transparente)
    float age = trackIndex / 128.0;
    float alpha = (1.0 - age) * 0.8;
    
    // Suaviza as bordas
    float edge = min(vUV.x, 1.0 - vUV.x);
    alpha *= smoothstep(0.0, 0.3, edge);
    
    gl_FragColor = vec4(trackColor, alpha);
}


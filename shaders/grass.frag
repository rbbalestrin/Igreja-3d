uniform sampler2D matcapTexture;

varying vec3 vColor;
varying float vTipness;
varying float vTrackInfluence;

void main() {
    // Cor base da grama
    vec3 grassColor = vColor;
    
    // Adiciona variação de cor baseada no tipness
    grassColor = mix(grassColor * 0.7, grassColor * 1.2, vTipness);
    
    // Efeito de trilha - mais escuro e achatado
    grassColor *= (1.0 - vTrackInfluence * 0.3);
    
    // MatCap para iluminação (simplificado)
    vec3 viewNormal = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
    vec2 matcapUV = viewNormal.xy * 0.5 + 0.5;
    vec3 matcap = texture2D(matcapTexture, matcapUV).rgb;
    
    // Combina cor da grama com matcap
    vec3 finalColor = grassColor * (0.7 + matcap * 0.3);
    
    // Transparência nas bordas para suavizar
    float alpha = 1.0;
    alpha *= (1.0 - vTrackInfluence * 0.5); // Mais transparente onde há trilha
    
    gl_FragColor = vec4(finalColor, alpha);
}


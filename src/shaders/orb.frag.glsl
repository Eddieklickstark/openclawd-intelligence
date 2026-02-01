uniform float uTime;
uniform float uActivity;
uniform vec3 uLightPos1;
uniform vec3 uLightPos2;
uniform vec3 uLightPos3;
uniform float uIridescenceIntensity;
uniform float uEnvMapIntensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vDisplacement;
varying float vFresnel;

#define PI 3.14159265359

// ============== 3D SIMPLEX NOISE ==============

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;

    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// ============== THIN-FILM INTERFERENCE ==============

vec3 thinFilmInterference(float cosTheta, float thickness) {
    float n1 = 1.0;   // Air
    float n2 = 1.38;  // Thin film (oil/soap)
    float n3 = 1.52;  // Substrate

    float theta2 = asin(n1 / n2 * sqrt(1.0 - cosTheta * cosTheta));
    float pathDiff = 2.0 * n2 * thickness * cos(theta2);

    vec3 wavelengths = vec3(650.0, 510.0, 475.0); // RGB wavelengths in nm
    vec3 phases = 2.0 * PI * pathDiff / wavelengths;

    // Fresnel reflectances
    float r12 = (n1 - n2) / (n1 + n2);
    float r23 = (n2 - n3) / (n2 + n3);

    // Interference pattern
    vec3 interference = vec3(
        r12 * r12 + r23 * r23 + 2.0 * r12 * r23 * cos(phases.x),
        r12 * r12 + r23 * r23 + 2.0 * r12 * r23 * cos(phases.y),
        r12 * r12 + r23 * r23 + 2.0 * r12 * r23 * cos(phases.z)
    );

    return sqrt(max(interference, vec3(0.0)));
}

// ============== ENVIRONMENT MAP SIMULATION ==============

vec3 sampleEnvMap(vec3 dir) {
    float y = dir.y * 0.5 + 0.5;

    // Dark studio environment
    vec3 skyTop = vec3(0.08, 0.08, 0.12);
    vec3 skyBot = vec3(0.04, 0.04, 0.07);
    vec3 sky = mix(skyBot, skyTop, y);

    // Red accent light
    float keyLight = pow(max(0.0, dot(dir, normalize(vec3(1.0, 0.8, 0.5)))), 32.0);
    sky += vec3(1.0, 0.3, 0.3) * keyLight * 0.4;

    // Cool fill light
    float fillLight = pow(max(0.0, dot(dir, normalize(vec3(-0.8, 0.3, -0.5)))), 16.0);
    sky += vec3(0.3, 0.35, 0.5) * fillLight * 0.2;

    // Red rim accent
    float rimLight = pow(max(0.0, dot(dir, normalize(vec3(0.0, -0.5, -1.0)))), 8.0);
    sky += vec3(1.0, 0.4, 0.4) * rimLight * 0.3;

    return sky;
}

// ============== INTERNAL SPARKLES ==============

float sparkles(vec3 pos, float time) {
    float sparkle = 0.0;

    for(int i = 0; i < 16; i++) {
        float fi = float(i);
        vec3 offset = vec3(
            sin(fi * 1.23 + time * 0.3) * 0.45,
            cos(fi * 2.34 + time * 0.25) * 0.45,
            sin(fi * 3.45 + time * 0.35) * 0.45
        );
        float dist = length(pos - offset);
        float s = smoothstep(0.12, 0.0, dist);
        s *= sin(time * (2.0 + fi * 0.2) + fi * 0.7) * 0.5 + 0.5;
        sparkle += s * 0.06;
    }

    return sparkle;
}

// ============== INTERNAL LIGHT RAYS ==============

float lightRays(vec3 pos, float time) {
    float rays = 0.0;

    for(int i = 0; i < 20; i++) {
        float fi = float(i);
        float angle = fi * PI * 2.0 / 20.0 + time * 0.08;
        vec3 rayDir = vec3(cos(angle), sin(fi * 0.5) * 0.3, sin(angle));
        float rayDist = abs(dot(pos, normalize(rayDir)));
        float ray = smoothstep(0.12, 0.0, rayDist);
        ray *= sin(time * 0.5 + fi) * 0.3 + 0.7;
        rays += ray * 0.025;
    }

    return rays;
}

// ============== MAIN ==============

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 reflectDir = reflect(-viewDir, normal);

    // Base color (Klickstark red #ff5353)
    vec3 klickstarkRed = vec3(1.0, 0.325, 0.325);
    vec3 baseColor = klickstarkRed * 0.8;

    // === IRIDESCENCE ===
    float thickness = 380.0 + vDisplacement * 200.0 + snoise(vPosition * 3.0 + uTime * 0.1) * 80.0;
    float cosTheta = max(0.0, dot(normal, viewDir));
    vec3 iridescence = thinFilmInterference(cosTheta, thickness);

    vec3 iriColors = vec3(
        0.5 + 0.5 * sin(thickness * 0.02),
        0.5 + 0.5 * sin(thickness * 0.02 + 2.094),
        0.5 + 0.5 * sin(thickness * 0.02 + 4.189)
    );
    iridescence *= iriColors * uIridescenceIntensity;

    // === ENVIRONMENT REFLECTION ===
    vec3 envColor = sampleEnvMap(reflectDir);
    float envFresnel = pow(1.0 - cosTheta, 4.0);
    vec3 reflection = envColor * envFresnel * uEnvMapIntensity;

    // === THREE-POINT LIGHTING ===
    vec3 lightDir1 = normalize(uLightPos1 - vWorldPosition);
    vec3 lightDir2 = normalize(uLightPos2 - vWorldPosition);
    vec3 lightDir3 = normalize(uLightPos3 - vWorldPosition);

    // Key light (warm)
    float diff1 = max(0.0, dot(normal, lightDir1));
    float wrap1 = max(0.0, (dot(normal, lightDir1) + 0.5) / 1.5);
    vec3 light1 = vec3(1.0, 0.98, 0.95) * diff1 * 0.6;
    vec3 sss1 = vec3(1.0, 0.9, 0.85) * wrap1 * 0.3;

    // Fill light (cool)
    float diff2 = max(0.0, dot(normal, lightDir2));
    vec3 light2 = vec3(0.9, 0.95, 1.0) * diff2 * 0.35;

    // Rim light
    float diff3 = max(0.0, dot(normal, lightDir3));
    float rimIntensity = pow(1.0 - max(0.0, dot(viewDir, normal)), 3.0);
    vec3 light3 = vec3(1.0, 0.98, 1.0) * diff3 * rimIntensity * 0.5;

    // === SPECULAR HIGHLIGHTS ===
    vec3 halfDir1 = normalize(lightDir1 + viewDir);
    float spec1 = pow(max(0.0, dot(normal, halfDir1)), 128.0);
    vec3 specular = vec3(1.0) * spec1 * 0.7;

    vec3 halfDir2 = normalize(lightDir2 + viewDir);
    float spec2 = pow(max(0.0, dot(normal, halfDir2)), 64.0);
    specular += vec3(0.95, 0.98, 1.0) * spec2 * 0.35;

    // === INTERNAL EFFECTS ===
    float sparkle = sparkles(vPosition, uTime);
    float rays = lightRays(vPosition, uTime);
    vec3 internalGlow = klickstarkRed * 1.2 * (sparkle + rays);

    // === SUBSURFACE SCATTERING ===
    float sssDepth = 1.0 - abs(dot(viewDir, normal));
    vec3 sssColor = klickstarkRed * sssDepth * 0.4;

    // === COMBINE ALL ===
    vec3 finalColor = baseColor * 0.4;
    finalColor += light1 + light2 + light3;
    finalColor += sss1 + sssColor;
    finalColor += specular;
    finalColor += iridescence;
    finalColor += reflection;
    finalColor += internalGlow * (0.5 + uActivity * 0.5);

    // Fresnel rim
    vec3 fresnelColor = klickstarkRed * 1.5 * vFresnel * 0.35;
    finalColor += fresnelColor;

    // Activity glow (red pulsing)
    float activityGlow = uActivity * 0.25;
    finalColor += klickstarkRed * activityGlow;

    // Output with slight transparency for bloom pickup
    gl_FragColor = vec4(finalColor, 0.95);
}

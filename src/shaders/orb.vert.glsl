uniform float uTime;
uniform float uActivity;
uniform float uMorphSpeed;
uniform float uMorphIntensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vDisplacement;
varying float vFresnel;

// ============== 4D SIMPLEX NOISE ==============

vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float permute(float x) {
    return floor(mod(((x * 34.0) + 1.0) * x, 289.0));
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p, s;
    p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
    return p;
}

float snoise4D(vec4 v) {
    const vec4 C = vec4(
        0.138196601125011,
        0.276393202250021,
        0.414589803375032,
        -0.447213595499958
    );

    vec4 i = floor(v + dot(v, vec4(0.309016994374947451)));
    vec4 x0 = v - i + dot(i, C.xxxx);

    vec4 i0;
    vec3 isX = step(x0.yzw, x0.xxx);
    vec3 isYZ = step(x0.zww, x0.yyz);
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;
    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    vec4 i3 = clamp(i0, 0.0, 1.0);
    vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
    vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

    vec4 x1 = x0 - i1 + C.xxxx;
    vec4 x2 = x0 - i2 + C.yyyy;
    vec4 x3 = x0 - i3 + C.zzzz;
    vec4 x4 = x0 + C.wwww;

    i = mod(i, 289.0);
    float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute(permute(permute(permute(
        i.w + vec4(i1.w, i2.w, i3.w, 1.0))
        + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
        + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
        + i.x + vec4(i1.x, i2.x, i3.x, 1.0));

    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0);

    vec4 p0 = grad4(j0, ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4, p4));

    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;

    return 49.0 * (
        dot(m0*m0, vec3(dot(p0,x0), dot(p1,x1), dot(p2,x2))) +
        dot(m1*m1, vec2(dot(p3,x3), dot(p4,x4)))
    );
}

// ============== FRACTAL BROWNIAN MOTION ==============

float fbm6(vec4 p) {
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;

    for(int i = 0; i < 6; i++) {
        sum += amp * snoise4D(p * freq);
        amp *= 0.5;
        freq *= 2.0;
    }

    return sum;
}

// ============== MAIN ==============

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    float timeScale = uTime * uMorphSpeed;

    // Multi-layer displacement for organic deformation
    vec4 noiseCoord = vec4(position * 0.8, timeScale * 0.15);
    float displacement = fbm6(noiseCoord) * uMorphIntensity;

    // Secondary detail layer
    vec4 detailCoord = vec4(position * 2.5, timeScale * 0.25);
    displacement += snoise4D(detailCoord) * uMorphIntensity * 0.15;

    // Tertiary micro detail
    vec4 microCoord = vec4(position * 5.0, timeScale * 0.35);
    displacement += snoise4D(microCoord) * uMorphIntensity * 0.05;

    vDisplacement = displacement;

    // Apply displacement
    vec3 newPosition = position + normal * displacement;
    vPosition = newPosition;

    // World position for lighting
    vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    // Fresnel calculation
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vFresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 3.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}

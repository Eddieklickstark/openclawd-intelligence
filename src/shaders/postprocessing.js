/**
 * Custom Post-Processing Shaders
 * ACES Tonemapping + Film Effects
 */

export const ACESShader = {
    uniforms: {
        tDiffuse: { value: null },
        exposure: { value: 1.2 },
        saturation: { value: 1.1 },
        contrast: { value: 1.05 }
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float exposure;
        uniform float saturation;
        uniform float contrast;

        varying vec2 vUv;

        // ACES Filmic Tone Mapping
        vec3 ACESFilm(vec3 x) {
            float a = 2.51;
            float b = 0.03;
            float c = 2.43;
            float d = 0.59;
            float e = 0.14;
            return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }

        vec3 adjustSaturation(vec3 color, float sat) {
            float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
            return mix(vec3(grey), color, sat);
        }

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            vec3 color = texel.rgb * exposure;

            // Apply ACES tonemapping
            color = ACESFilm(color);

            // Saturation adjustment
            color = adjustSaturation(color, saturation);

            // Contrast adjustment
            color = mix(vec3(0.5), color, contrast);

            gl_FragColor = vec4(color, texel.a);
        }
    `
};

export const FilmShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        grainIntensity: { value: 0.02 },
        chromaticAberration: { value: 0.0015 }
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float grainIntensity;
        uniform float chromaticAberration;

        varying vec2 vUv;

        float random(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;
            vec2 center = uv - 0.5;
            float dist = length(center);

            // Chromatic aberration
            vec2 caOffset = center * chromaticAberration * dist;
            float r = texture2D(tDiffuse, uv + caOffset).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - caOffset).b;
            vec3 color = vec3(r, g, b);

            // Film grain
            float grain = random(uv + time) * grainIntensity;
            color += grain - grainIntensity * 0.5;

            // Subtle vignette
            float vignette = 1.0 - dist * 0.25;
            color *= vignette;

            gl_FragColor = vec4(color, 1.0);
        }
    `
};

export const ParticleVertexShader = /* glsl */`
    attribute float size;
    attribute float offset;

    uniform float uTime;
    uniform float uActivity;
    uniform float uPixelRatio;

    varying float vAlpha;

    void main() {
        vec3 pos = position;

        // Gentle orbital motion
        float angle = uTime * 0.15 + offset;
        float orbitRadius = 0.08 + uActivity * 0.08;
        pos.x += sin(angle) * orbitRadius;
        pos.y += cos(angle * 1.3) * orbitRadius * 0.5;
        pos.z += sin(angle * 0.7) * orbitRadius;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float baseSize = size * (2.5 + uActivity * 1.5);
        gl_PointSize = baseSize * uPixelRatio * (300.0 / -mvPosition.z);

        vAlpha = (0.25 + uActivity * 0.35) * (sin(uTime * 2.0 + offset * 3.0) * 0.3 + 0.7);
    }
`;

export const ParticleFragmentShader = /* glsl */`
    varying float vAlpha;

    void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        float alpha = smoothstep(0.5, 0.0, dist);
        alpha *= vAlpha;

        // Elegant warm white particles - very subtle
        vec3 color = vec3(1.0, 0.97, 0.94);
        gl_FragColor = vec4(color, alpha * 0.2);
    }
`;

export const ShadowVertexShader = /* glsl */`
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const ShadowFragmentShader = /* glsl */`
    uniform float uActivity;

    varying vec2 vUv;

    void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center) * 2.0;
        float shadow = smoothstep(1.0, 0.0, dist);
        shadow = pow(shadow, 2.5);
        float alpha = shadow * (0.12 + uActivity * 0.03);
        // Soft dark shadow with subtle warm tint
        vec3 shadowColor = vec3(0.02, 0.015, 0.01);
        gl_FragColor = vec4(shadowColor, alpha);
    }
`;

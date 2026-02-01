import * as THREE from 'three';
import orbVertexShader from '../shaders/orb.vert.glsl';
import orbFragmentShader from '../shaders/orb.frag.glsl';

/**
 * Orb Component
 * The main opalescent sphere with organic deformation
 */
export class Orb {
    constructor() {
        this.mesh = null;
        this.material = null;
        this.uniforms = null;

        this._createMesh();
    }

    _createMesh() {
        // High-subdivision icosahedron for smooth deformation
        const geometry = new THREE.IcosahedronGeometry(1, 128);

        // Shader material with all uniforms
        this.uniforms = {
            uTime: { value: 0 },
            uActivity: { value: 0 },
            uMorphSpeed: { value: 1.0 },
            uMorphIntensity: { value: 0.15 },
            uLightPos1: { value: new THREE.Vector3(3, 2, 4) },
            uLightPos2: { value: new THREE.Vector3(-3, 1, 2) },
            uLightPos3: { value: new THREE.Vector3(0, -2, -3) },
            uIridescenceIntensity: { value: 0.4 },
            uEnvMapIntensity: { value: 0.5 }
        };

        this.material = new THREE.ShaderMaterial({
            vertexShader: orbVertexShader,
            fragmentShader: orbFragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            depthWrite: true,
            depthTest: true,
            side: THREE.FrontSide
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
    }

    /**
     * Update orb uniforms
     * @param {number} time - Elapsed time
     * @param {number} activity - Activity level (0-1)
     */
    update(time, activity) {
        this.uniforms.uTime.value = time;
        this.uniforms.uActivity.value = activity;

        // Gentle rotation
        this.mesh.rotation.y = time * 0.04;
        this.mesh.rotation.x = Math.sin(time * 0.08) * 0.04;
    }

    /**
     * Set morph parameters
     * @param {number} speed - Morph speed multiplier
     * @param {number} intensity - Deformation intensity
     */
    setMorphParams(speed, intensity) {
        this.uniforms.uMorphSpeed.value = speed;
        this.uniforms.uMorphIntensity.value = intensity;
    }

    /**
     * Add to scene
     * @param {THREE.Scene} scene
     */
    addTo(scene) {
        scene.add(this.mesh);
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.mesh.geometry.dispose();
        this.material.dispose();
    }
}

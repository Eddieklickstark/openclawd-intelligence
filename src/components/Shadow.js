import * as THREE from 'three';
import { ShadowVertexShader, ShadowFragmentShader } from '../shaders/postprocessing.js';

/**
 * Shadow Component
 * Ground shadow beneath the orb
 */
export class Shadow {
    constructor() {
        this.mesh = null;
        this.material = null;
        this.uniforms = null;

        this._createShadow();
    }

    _createShadow() {
        const geometry = new THREE.PlaneGeometry(4, 4);

        this.uniforms = {
            uActivity: { value: 0 }
        };

        this.material = new THREE.ShaderMaterial({
            vertexShader: ShadowVertexShader,
            fragmentShader: ShadowFragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = -1.4;
    }

    /**
     * Update shadow uniform
     * @param {number} activity - Activity level (0-1)
     */
    update(activity) {
        this.uniforms.uActivity.value = activity;
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

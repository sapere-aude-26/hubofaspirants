/* HOA Component Runtime — Source Separation V1
 *
 * IMPORTANT:
 * This file is an architectural registry/diagnostic layer.
 * It does NOT replace the production runtime yet.
 */
(function(window){
  'use strict';

  const manifest = window.HOA_COMPONENT_MANIFEST || null;

  window.HOA_COMPONENT_RUNTIME = Object.freeze({
    version: 'Source-V1',
    productionMode: false,
    baseline: {
      bytes: 1751721,
      sha256: '680cdb11c83b7d6d0e7911443da994e95c2e5f97289b511e20250ca97406541f'
    },
    protectedFooterIds: [
      'hoaGlobalPublicFooter',
      'hoaFrontSocialFooter',
      'hoaProfessionalFooter',
      'hoaV653ConnectWrap'
    ],
    manifest: manifest,

    assertProtectedFooter() {
      return this.protectedFooterIds.every(id => {
        const node = document.getElementById(id);
        return !!node;
      });
    },

    getComponent(name) {
      if (!manifest || !manifest.components) return null;
      return manifest.components[name] || null;
    }
  });
})(window);

/* HOA Component Adapter Registry V2
   DEVELOPMENT ONLY — not included in production.
*/
(function (global) {
  'use strict';

  const registry = global.HOA_COMPONENT_REGISTRY = {
    version: 'V2',
    mode: 'development',
    productionReplacement: false,

    components: {
      core: { status: 'shared-service', owner: '00_CORE_SHARED' },
      home: { status: 'boundary-extracted', owner: '01_PUBLIC_HOME' },
      auth: { status: 'boundary-extracted', owner: '02_AUTHENTICATION' },
      freeStudent: { status: 'boundary-extracted', owner: '03_FREE_STUDENT_PORTAL' },
      paidStudent: { status: 'boundary-extracted', owner: '04_PAID_STUDENT_APPLICATION' },
      exam: { status: 'boundary-extracted', owner: '05_EXAM_ENGINE' },
      result: { status: 'boundary-extracted', owner: '06_RESULT_SYSTEM' },
      admin: { status: 'boundary-extracted', owner: '07_ADMIN' },
      developer: { status: 'boundary-extracted', owner: '08_DEVELOPER_CONSOLE' },
      footer: { status: 'protected-boundary', owner: '09_GLOBAL_PUBLIC_FOOTER' },
      header: { status: 'protected-boundary', owner: '10_HEADER_PROTECTED' }
    },

    contracts: {
      navigation: 'shared',
      authentication: 'shared',
      session: 'shared',
      footer: 'protected',
      header: 'protected'
    }
  };

  global.HOA_COMPONENT_ADAPTERS = {
    register(name, adapter) {
      if (!name || !adapter) throw new Error('Invalid HOA component adapter');
      registry.adapters = registry.adapters || {};
      registry.adapters[name] = adapter;
    },

    get(name) {
      return registry.adapters && registry.adapters[name];
    }
  };
})(window);

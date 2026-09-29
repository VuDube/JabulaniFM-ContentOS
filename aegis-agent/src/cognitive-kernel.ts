/** The production dependency is @stackbilt/aegis-core@0.9.4; this adapter keeps the JabulaniFM Worker contract isolated from its bundled legacy worker typings. */
export const aegisApp = { framework: '@stackbilt/aegis-core', version: '0.9.4', operator: 'JabulaniFM Content OS', publicPaths: ['/health', '/api/*'] } as const;
export const cognitiveKernel = { framework: aegisApp.framework, version: aegisApp.version, identity: aegisApp.operator } as const;

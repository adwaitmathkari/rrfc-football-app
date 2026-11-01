type BackendId = 'node' | 'java';

const BACKENDS: Record<BackendId, { label: string; url: string }> = {
  node: { label: 'Node.js', url: import.meta.env.VITE_NODE_API_URL ?? 'http://localhost:4000' },
  java: { label: 'Spring Boot', url: import.meta.env.VITE_JAVA_API_URL ?? 'http://localhost:8080' },
};

const selected = import.meta.env.VITE_BACKEND ?? 'node';
if (!(selected in BACKENDS)) {
  throw new Error(`VITE_BACKEND must be "node" or "java" (got "${selected}")`);
}

/** Set VITE_BACKEND in FE/.env.local and restart Vite to switch. */
export const BACKEND = BACKENDS[selected as BackendId];

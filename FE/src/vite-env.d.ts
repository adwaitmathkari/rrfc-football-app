interface ImportMetaEnv {
  readonly VITE_BACKEND?: 'node' | 'java';
  readonly VITE_NODE_API_URL?: string;
  readonly VITE_JAVA_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

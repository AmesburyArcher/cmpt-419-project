/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />

interface ImportMetaEnv {
    readonly VITE_SPORTS_ODDS_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
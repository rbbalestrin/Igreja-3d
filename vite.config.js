import { defineConfig } from 'vite';

export default defineConfig({
  // Configuração da pasta pública
  publicDir: 'public',
  
  // Configurações de build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Manter nomes de assets para debug
    rollupOptions: {
      output: {
        // Garantir que assets grandes não sejam inline
        assetFileNames: (assetInfo) => {
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Aumentar limite para assets grandes (modelos 3D)
    assetsInlineLimit: 0
  },
  
  // Servidor de desenvolvimento
  server: {
    port: 3000,
    open: true
  }
});


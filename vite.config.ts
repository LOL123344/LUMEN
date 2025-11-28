import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Plugin to copy samples folder to dist during build
function copySamplesPlugin() {
  return {
    name: 'copy-samples',
    closeBundle() {
      const copyRecursive = (src: string, dest: string) => {
        try {
          mkdirSync(dest, { recursive: true });
          const entries = readdirSync(src);
          for (const entry of entries) {
            const srcPath = join(src, entry);
            const destPath = join(dest, entry);
            if (statSync(srcPath).isDirectory()) {
              copyRecursive(srcPath, destPath);
            } else {
              copyFileSync(srcPath, destPath);
              console.log(`Copied: ${srcPath} -> ${destPath}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to copy samples: ${error}`);
        }
      };
      copyRecursive('samples', 'dist/samples');
    }
  }
}

export default defineConfig({
  plugins: [react(), copySamplesPlugin()],

  // Enable WASM support
  assetsInclude: ['**/*.wasm'],

  optimizeDeps: {
    exclude: ['evtx_wasm.js']
  },

  // Build configuration
  build: {
    rollupOptions: {
      output: {
        // Code splitting - separate chunks for LLM providers and heavy UI libraries
        // Only load when user actually uses that feature
        manualChunks: {
          'vendor-llm-openai': ['openai', 'jspdf'],
          'vendor-llm-anthropic': ['@anthropic-ai/sdk'],
          'vendor-llm-google': ['@google/genai'],
          'vendor-ui': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-markdown': ['react-markdown'],
        }
      }
    }
  },

  server: {
    fs: {
      // Allow serving files from samples and public
      allow: ['..']
    }
  }
})

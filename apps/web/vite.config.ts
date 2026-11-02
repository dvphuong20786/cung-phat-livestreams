import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const webRoot = fileURLToPath(new URL('.', import.meta.url));

function audioFilesPlugin(): Plugin {
  return {
    name: 'audio-files-plugin',
    configureServer(server) {
      server.middlewares.use('/api/audio-files', (_req, res) => {
        try {
          const audioDir = path.resolve(webRoot, 'public/audio');
          if (!fs.existsSync(audioDir)) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, files: [] }));
            return;
          }
          const allowedExts = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']);
          const entries = fs.readdirSync(audioDir, { withFileTypes: true });
          const files = entries
            .filter((entry) => entry.isFile() && allowedExts.has(path.extname(entry.name).toLowerCase()))
            .map((entry) => {
              const stats = fs.statSync(path.join(audioDir, entry.name));
              return {
                name: entry.name,
                url: `/audio/${encodeURIComponent(entry.name)}`,
                size: stats.size,
              };
            });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, files }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  root: webRoot,
  plugins: [react(), audioFilesPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});

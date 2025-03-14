import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import 'dotenv/config'; // Load .env

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    'process.env': process.env // Expose env vars to client (optional for now)
  }
});
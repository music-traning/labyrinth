// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
    base: '/labyrinth-dissonance/',

    build: {
        assetsDir: 'assets', // Phaserのアセット整理用（任意）
    }
})
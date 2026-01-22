import { defineConfig } from 'vite'

export default defineConfig({
    base: './',
    build: {
        assetsDir: 'assets',
        // ★変更点: 圧縮方式を 'terser' に変更（少し遅いが、より小さくなる）
        minify: 'terser',
        terserOptions: {
            compress: {
                // 本番環境では console.log を消してさらに軽くする
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
        target: 'esnext',
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1000,
    }
})
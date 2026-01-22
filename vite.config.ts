import { defineConfig } from 'vite'

export default defineConfig({
    base: './', // 相対パス設定
    build: {
        assetsDir: 'assets',
        // ■ パフォーマンス最適化設定
        rollupOptions: {
            output: {
                manualChunks: {
                    // Phaserを別のJSファイルとして切り出す（メインの読み込みを軽くする）
                    phaser: ['phaser'],
                },
            },
        },
        // コード圧縮率を高める設定
        minify: 'esbuild',
        target: 'esnext', // 最新ブラウザ向けに最適化してサイズダウン
        cssCodeSplit: true, // CSSも分割して読み込む
        chunkSizeWarningLimit: 1000, // 警告の閾値を上げる
    }
})
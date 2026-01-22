import Phaser from 'phaser';
import { synth } from '../logic/SoundSynth';
import { InitialState } from '../logic/GameLogic';

export default class TitleScene extends Phaser.Scene {
    private hasSaveData: boolean = false;

    constructor() {
        super('TitleScene');
    }

    create() {
        const { width, height } = this.scale;

        // Check for save data
        const saveRaw = localStorage.getItem('labyrinth_save');
        this.hasSaveData = !!saveRaw;
        console.log("Checking save data:", this.hasSaveData, saveRaw);

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        // Cyberpunk grid effect
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xff00ff, 0.1);
        for (let i = 0; i < width; i += 20) {
            graphics.lineBetween(i, 0, i, height);
        }
        for (let i = 0; i < height; i += 20) {
            graphics.lineBetween(0, i, width, i);
        }

        // Glowing title
        const titleY = 120;

        // Main title with glow effect
        const titleBg = this.add.rectangle(width / 2, titleY, width - 20, 100, 0x1a0a2a, 0.8);
        titleBg.setStrokeStyle(3, 0xff00ff, 0.8);

        const title1 = this.add.text(width / 2, titleY - 20, "LABYRINTH", {
            fontSize: '32px',
            color: '#ff00ff',
            fontFamily: 'Orbitron, monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const title2 = this.add.text(width / 2, titleY + 15, "DISSONANCE", {
            fontSize: '28px',
            color: '#00ffff',
            fontFamily: 'Orbitron, monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Pulsing glow animation
        this.tweens.add({
            targets: [title1, title2],
            alpha: { from: 1, to: 0.7 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle
        this.add.text(width / 2, titleY + 50, "- 迷宮の不協和音 -", {
            fontSize: '12px',
            color: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Menu buttons
        const menuY = 280;

        // Start / Continue button
        const startBtn = this.add.rectangle(width / 2, menuY, 240, 50, this.hasSaveData ? 0x224488 : 0x228822);
        startBtn.setStrokeStyle(3, this.hasSaveData ? 0x00ffff : 0x00ff00, 0.8);
        startBtn.setInteractive();

        const startText = this.add.text(width / 2, menuY, this.hasSaveData ? "CONTINUE" : "NEW GAME", {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Orbitron, monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => {
            startBtn.setStrokeStyle(4, this.hasSaveData ? 0x00ffff : 0x00ff00, 1);
            this.tweens.add({
                targets: [startBtn, startText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100,
                ease: 'Power1'
            });
        });

        startBtn.on('pointerout', () => {
            startBtn.setStrokeStyle(3, this.hasSaveData ? 0x00ffff : 0x00ff00, 0.8);
            this.tweens.add({
                targets: [startBtn, startText],
                scaleX: 1,
                scaleY: 1,
                duration: 100,
                ease: 'Power1'
            });
        });

        startBtn.on('pointerdown', () => {
            synth.playSelect();
            this.tweens.add({
                targets: [startBtn, startText],
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                ease: 'Power2',
                onComplete: () => {
                    if (this.hasSaveData) {
                        this.loadGame();
                    } else {
                        this.startNewGame();
                    }
                }
            });
        });

        // New Game button (if save data exists)
        if (this.hasSaveData) {
            const newGameBtn = this.add.rectangle(width / 2, menuY + 70, 240, 45, 0x228822);
            newGameBtn.setStrokeStyle(2, 0x00ff00, 0.6);
            newGameBtn.setInteractive();

            const newGameText = this.add.text(width / 2, menuY + 70, "NEW GAME", {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Orbitron, monospace'
            }).setOrigin(0.5);

            newGameBtn.on('pointerover', () => {
                newGameBtn.setStrokeStyle(3, 0x00ff00, 1);
                this.tweens.add({
                    targets: [newGameBtn, newGameText],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    ease: 'Power1'
                });
            });

            newGameBtn.on('pointerout', () => {
                newGameBtn.setStrokeStyle(2, 0x00ff00, 0.6);
                this.tweens.add({
                    targets: [newGameBtn, newGameText],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100,
                    ease: 'Power1'
                });
            });

            newGameBtn.on('pointerdown', () => {
                synth.playSelect();
                this.tweens.add({
                    targets: [newGameBtn, newGameText],
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 50,
                    yoyo: true,
                    ease: 'Power2',
                    onComplete: () => {
                        this.startNewGame();
                    }
                });
            });
        }

        // Delete Save button (if save data exists)
        if (this.hasSaveData) {
            const deleteBtn = this.add.rectangle(width / 2, height - 100, 200, 40, 0x882222);
            deleteBtn.setStrokeStyle(2, 0xff0000, 0.6);
            deleteBtn.setInteractive();

            const deleteText = this.add.text(width / 2, height - 100, "DELETE SAVE", {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Orbitron, monospace'
            }).setOrigin(0.5);

            deleteBtn.on('pointerover', () => {
                deleteBtn.setStrokeStyle(3, 0xff0000, 1);
                this.tweens.add({
                    targets: [deleteBtn, deleteText],
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    ease: 'Power1'
                });
            });

            deleteBtn.on('pointerout', () => {
                deleteBtn.setStrokeStyle(2, 0xff0000, 0.6);
                this.tweens.add({
                    targets: [deleteBtn, deleteText],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100,
                    ease: 'Power1'
                });
            });

            deleteBtn.on('pointerdown', () => {
                synth.playCancel();
                this.tweens.add({
                    targets: [deleteBtn, deleteText],
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 50,
                    yoyo: true,
                    ease: 'Power2',
                    onComplete: () => {
                        this.showDeleteConfirmation();
                    }
                });
            });
        }

        // Version Info
        this.add.text(width / 2, height - 50, "v1.0.0 | A Cyberpunk Roguelike RPG", {
            fontSize: '9px',
            color: '#444444',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // --- Copyright & Link ---
        const copyright = this.add.text(width / 2, height - 30, "©2026 buro", {
            fontSize: '11px',
            color: '#666666',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Hover effect for link
        copyright.on('pointerover', () => copyright.setColor('#00ffff'));
        copyright.on('pointerout', () => copyright.setColor('#666666'));
        copyright.on('pointerdown', () => {
            window.open('https://note.com/jazzy_begin', '_blank');
        });
        // ------------------------

        // Scanline effect
        const scanline = this.add.rectangle(0, 0, width, 2, 0xffffff, 0.1).setOrigin(0);
        this.tweens.add({
            targets: scanline,
            y: height,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });

        // Manual Button (Top Right)
        const manualBtn = this.add.rectangle(width - 50, 30, 80, 30, 0x222244).setInteractive();
        manualBtn.setStrokeStyle(1, 0x00ffff, 0.5);
        this.add.text(width - 50, 30, "MANUAL", {
            fontSize: '12px',
            color: '#00ffff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        manualBtn.on('pointerover', () => manualBtn.setStrokeStyle(2, 0x00ffff, 1));
        manualBtn.on('pointerout', () => manualBtn.setStrokeStyle(1, 0x00ffff, 0.5));
        manualBtn.on('pointerdown', () => {
            synth.playSelect();
            this.showManual();
        });

        this.createOverlayForTapToStart();

        // ★★★重要追加：ここでHTMLのロード画面を消す★★★
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }

    // ... (以下、既存のメソッド群) ...
    showManual() {
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.95).setOrigin(0).setInteractive();
        overlay.setDepth(2000);

        const container = this.add.container(0, 0);
        container.setDepth(2001);

        const title = this.add.text(width / 2, 40, "LABYRINTH DISSONANCE\nOFFICIAL MANUAL", {
            fontSize: '18px',
            color: '#00ffff',
            fontFamily: 'Orbitron, monospace',
            align: 'center'
        }).setOrigin(0.5);

        // Scrollable content container
        const contentContainer = this.add.container(0, 80);
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, 80, width, height - 160);
        const mask = maskShape.createGeometryMask();
        contentContainer.setMask(mask);

        const manualText = `
1. ゲームの目的
あなたは売れないミュージシャンです。 目的はただ一つ。「借金（家賃）」を払い続けながら、地下迷宮の最深部（B99F）にある伝説のギター『Deep Blue』を手に入れること。
この街では「金」だけでは生き残れません。 「HP」「人間性」「プライド」……この3つのパラメータのどれか一つでも尽きれば、あなたの音楽人生は終わります。

2. 3つの「死」と対策（ゲームオーバー条件）
常に画面下部のステータスバーを監視してください。

💀 1. 肉体の死 (HP 0)
原因: ダンジョンでの戦闘に敗北する。
ペナルティ: 「最大HPの減少」「階層の巻き戻り」「プライドの大幅減少」。
対策: 早めに「自宅（Rest）」で休むか、スキルで回復してください。

💀 2. 魂の死 (Humanity 0)
原因: 「怪しいセミナー」を受講する、質屋で「思い出」を売る。
結果: 【BAD END: 虚無の音楽家】
対策: お寺（Temple）で高額なお布施を払い、人間性を買い戻してください。

💀 3. 尊厳の死 (Pride 0)
原因: 大家に土下座をする、ダンジョンで敗北する、質屋で「思い出」を売る。
結果: 【BAD END: 敗北者】
対策: BARで高い酒を飲み、自分を肯定してください。

3. 街の歩き方（施設ガイド）
🏠 自宅 (Rest) & 家賃 (Rent)
Rest: 1日経過、HP/MP全回復。
Rent: 30日ごとに徴収。「ハッタリ（Bluff）」か「土下座」で切り抜ける。

🗡️ 地下迷宮 (Dungeon)
探索: 3回進むと1階層降下。
戦闘: ターン制。敵は深くなるほど指数関数的に強くなります。
ボス: 10階層ごとに強力なボスが存在。

🔍 鑑定屋 & 🛒 ジャンク屋
拾ったアイテムは「未鑑定」。鑑定屋で正体を暴くか、未鑑定のままジャンク屋に売るか（安値）。

🏫 スクール & 🗣️ セミナー
スクール: お金でステータス・スキル習得。
セミナー: 強力なスキル習得の代償に人間性とプライドを失う。

🤝 質屋 (Pawn Shop)
金がない時の最終手段。「思い出」を売って現金化。
警告: 最大MPや人間性が永続的に下がります。

4. スキル・テクニック指南
⚔️ 戦闘スキル
skl_monitor_check (中音確認): HP回復。探索中も使用可。
skl_deconstruction (脱構築): 大ダメージ。ボス戦用。

🗣️ 交渉スキル
skl_underground (潜伏期間): 家賃踏み倒し成功率UP。

5. 攻略のヒント
💡 Hint 1: 「ハッタリ」を育てろ
最大の敵は「家賃」。払わずに武器を買え。

💡 Hint 2: プライドは「通貨」だ
土下座で時間を稼ぎ、酒でプライドを回復しろ。

💡 Hint 3: 未鑑定品のリスク管理
浅い階層のゴミは鑑定せずに売れ。

💡 Hint 4: エンディングの分岐条件
Humanity 71以上: TRUE END
Humanity 31～70: NORMAL END
Humanity 30以下: BAD END
`;

        const textObj = this.add.text(20, 0, manualText.trim(), {
            fontSize: '12px',
            color: '#cccccc',
            fontFamily: 'Rajdhani, sans-serif',
            wordWrap: { width: width - 40 },
            lineSpacing: 6
        });

        contentContainer.add(textObj);
        container.add([title, contentContainer]);

        // Close Button
        const closeBtn = this.add.rectangle(width / 2, height - 40, 160, 40, 0x444444).setInteractive();
        closeBtn.setStrokeStyle(2, 0x888888);
        const closeText = this.add.text(width / 2, height - 40, "CLOSE", {
            fontSize: '14px',
            color: '#fff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => {
            synth.playCancel();
            overlay.destroy();
            container.destroy();
            maskShape.destroy();
        });

        // Scroll Logic
        let scrollY = 0;
        const maxScroll = Math.max(0, textObj.height - (height - 180));

        // Touch Scroll Logic for Manual
        let startY = 0;
        let isDragging = false;
        const inputZone = this.add.zone(0, 80, width, height - 160).setOrigin(0).setInteractive();

        inputZone.on('pointerdown', (pointer: any) => {
            startY = pointer.y;
            isDragging = true;
        });

        inputZone.on('pointermove', (pointer: any) => {
            if (isDragging) {
                const deltaY = pointer.y - startY;
                startY = pointer.y;
                scrollY -= deltaY; // Invert delta for natural scroll
                scrollY = Phaser.Math.Clamp(scrollY, -0, maxScroll); // Clamp 0 to maxScroll

                // Update container position (negate scrollY)
                contentContainer.y = 80 - scrollY;
            }
        });

        inputZone.on('pointerup', () => {
            isDragging = false;
        });

        // Keep wheel for desktop
        this.input.on('wheel', (_pointer: any, _gameobjects: any, _deltaX: number, deltaY: number) => {
            scrollY += deltaY * 0.5;
            scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);

            this.tweens.add({
                targets: contentContainer,
                y: 80 - scrollY,
                duration: 100,
                ease: 'Power1'
            });
        });

        container.add([closeBtn, closeText]);
    }

    createOverlayForTapToStart() {
        const { width, height } = this.scale;

        // Tap To Start Overlay (Audio Context Resume)
        const overlay = this.add.container(0, 0);
        overlay.setDepth(1000); // Topmost

        const overlayBg = this.add.rectangle(0, 0, width, height, 0x000000, 0.4).setOrigin(0).setInteractive();
        const overlayText = this.add.text(width / 2, height / 2, "TAP TO START", {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Orbitron, monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Blink animation
        this.tweens.add({
            targets: overlayText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        overlay.add([overlayBg, overlayText]);

        const startInteraction = () => {
            // Resume Audio Context
            if (synth.ctx.state === 'suspended') {
                synth.ctx.resume().then(() => {
                    console.log("Audio Context Resumed");
                });
            }
            synth.playSelect();

            overlay.destroy();
        };

        overlayBg.on('pointerdown', startInteraction);
    }

    startNewGame() {
        // Clear any existing save
        localStorage.removeItem('labyrinth_save');

        // Force Reset State
        const resetState = JSON.parse(JSON.stringify(InitialState));
        this.registry.set('gameState', resetState);

        // Start from opening
        this.scene.start('StoryScene', {
            scenarioData: [
                { text: "――雨の降る、裏路地。" },
                { text: "お前は、4.5畳のアパートに住んでいる。\n家賃は5万円。" },
                { text: "今月の家賃が、払えない。" },
                { text: "大家は、容赦しない。" },
                { text: "お前には、音楽しかない。" },
                { text: "地下迷宮で、ジャンクを拾い、\n売って、金を稼ぐ。" },
                { text: "それが、お前の生き方だ。" },
                { event: () => this.scene.start('RentCheckScene') }
            ]
        });
    }

    loadGame() {
        const saveData = localStorage.getItem('labyrinth_save');
        if (saveData) {
            try {
                const state = JSON.parse(saveData);
                this.registry.set('gameState', state);
                this.scene.start('TownScene');
            } catch (e) {
                console.error('Failed to load save data:', e);
                this.startNewGame();
            }
        } else {
            this.startNewGame();
        }
    }

    showDeleteConfirmation() {
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setInteractive();
        overlay.setDepth(1000);

        const container = this.add.container(width / 2, height / 2);
        container.setDepth(1001);

        const bg = this.add.rectangle(0, 0, width - 40, 200, 0x1a1a2e);
        bg.setStrokeStyle(3, 0xff0000, 0.8);

        const title = this.add.text(0, -70, "DELETE SAVE DATA?", {
            fontSize: '16px',
            color: '#ff0000',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        const warning = this.add.text(0, -20, "This action cannot be undone.\nAll progress will be lost.", {
            fontSize: '11px',
            color: '#ffffff',
            align: 'center',
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 4
        }).setOrigin(0.5);

        const yesBtn = this.add.rectangle(-70, 50, 100, 40, 0x882222).setInteractive();
        yesBtn.setStrokeStyle(2, 0xff0000, 0.6);
        const yesText = this.add.text(-70, 50, "DELETE", {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        const noBtn = this.add.rectangle(70, 50, 100, 40, 0x444444).setInteractive();
        noBtn.setStrokeStyle(2, 0x888888, 0.6);
        const noText = this.add.text(70, 50, "CANCEL", {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        container.add([bg, title, warning, yesBtn, yesText, noBtn, noText]);

        yesBtn.on('pointerdown', () => {
            localStorage.removeItem('labyrinth_save');
            synth.playBadEnd();
            overlay.destroy();
            container.destroy();
            this.scene.restart();
        });

        noBtn.on('pointerdown', () => {
            synth.playCancel();
            overlay.destroy();
            container.destroy();
        });

        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }
}
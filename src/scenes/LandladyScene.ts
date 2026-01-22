import Phaser from 'phaser';
import { type GameState } from '../types';
import { synth } from '../logic/SoundSynth';

export default class LandladyScene extends Phaser.Scene {
    private footerContainer: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('LandladyScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;

        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // ドア
        const doorX = width / 2;
        const doorY = height / 2 - 50;
        this.add.rectangle(doorX, doorY, 120, 200, 0x4a3520).setStrokeStyle(3, 0x2a1a10);
        this.add.circle(doorX + 40, doorY, 8, 0xccaa66); // ドアノブ

        // タイトル
        this.add.text(width / 2, 50, "大家の部屋", {
            fontSize: '18px',
            color: '#ff8888',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        // 状況説明
        this.add.rectangle(width / 2, 140, width - 30, 60, 0x000000, 0.8).setStrokeStyle(1, 0xff8888, 0.5);
        this.add.text(width / 2, 140, `家賃: ¥${state.rentAmount}\n所持金: ¥${state.money}\n不足: ¥${state.rentAmount - state.money}`, {
            fontSize: '11px',
            color: '#ffcccc',
            align: 'center',
            fontFamily: 'monospace',
            lineSpacing: 3
        }).setOrigin(0.5);

        // 思い出売却時の反応
        if (state.soldMemories.length > 0) {
            this.add.text(width / 2, 185, "大家「あら、なんか顔つきが変わったねえ。\n　　　『何か』を諦めた顔だ……ひひ。」", {
                fontSize: '9px',
                color: '#ff88ff',
                fontStyle: 'italic',
                align: 'center',
                fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);
        }

        // 選択肢エリア
        const choicesY = 250;
        const choices = [
            {
                text: "A: 「来月、メジャーデビューが\n決まってるんです！（嘘）」",
                prideCost: 20,
                successRate: 0.6,
                result: "大家は鼻で笑った。\n「そんな話、何度聞いたと思ってんだい」\n期限を『3日』延ばしてくれた。"
            },
            {
                text: "B: 「出世払いで……お願いします！\n（靴を舐める）」",
                prideCost: 40,
                successRate: 0.9,
                result: "お前は額をコンクリートに擦り付けた。\n冷たい感触。大家は舌打ちをして、\n期限を『7日』延ばしてくれた。\n……何か大切なものが、\n音を立てて砕け散った気がした。"
            },
            {
                text: "C: 「……」\n（無言で潤んだ瞳で見つめる）",
                prideCost: 15,
                successRate: 0.4,
                result: "大家は呆れた顔をした。\n「演技は下手くそだねえ」\nしかし、期限を『2日』延ばしてくれた。"
            }
        ];

        choices.forEach((choice, index) => {
            const y = choicesY + index * 90;
            if (y > height - 100) return;

            const container = this.add.container(width / 2, y);
            const bg = this.add.rectangle(0, 0, width - 40, 75, 0x2a2244).setInteractive();
            bg.setStrokeStyle(2, 0x8888ff, 0.6);

            const choiceText = this.add.text(0, -15, choice.text, {
                fontSize: '10px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: width - 60 },
                fontFamily: 'Rajdhani, sans-serif',
                lineSpacing: 3
            }).setOrigin(0.5);

            const costText = this.add.text(0, 25, `プライド -${choice.prideCost}  成功率: ${Math.floor(choice.successRate * 100)}%`, {
                fontSize: '9px',
                color: state.pride >= choice.prideCost ? '#ffaa00' : '#ff0000',
                fontFamily: 'monospace'
            }).setOrigin(0.5);

            container.add([bg, choiceText, costText]);

            if (state.pride >= choice.prideCost) {
                bg.on('pointerover', () => {
                    bg.setStrokeStyle(3, 0x8888ff, 1);
                    this.tweens.add({
                        targets: container,
                        scaleX: 1.02,
                        scaleY: 1.02,
                        duration: 100,
                        ease: 'Power1'
                    });
                });

                bg.on('pointerout', () => {
                    bg.setStrokeStyle(2, 0x8888ff, 0.6);
                    this.tweens.add({
                        targets: container,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 100,
                        ease: 'Power1'
                    });
                });

                bg.on('pointerdown', () => {
                    this.tweens.add({
                        targets: container,
                        scaleX: 0.95,
                        scaleY: 0.95,
                        duration: 50,
                        yoyo: true,
                        onComplete: () => {
                            this.negotiate(choice, state);
                        }
                    });
                });
            } else {
                bg.setAlpha(0.5);
                choiceText.setColor('#666666');
            }
        });

        // 戻るボタン
        const backBtn = this.add.rectangle(width / 2, height - 60, 160, 30, 0x444444).setInteractive();

        backBtn.setStrokeStyle(2, 0x666666);
        this.add.text(width / 2, height - 60, "諦めて戻る", {

            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
            this.scene.start('TownScene');
        });

        this.createFooter(width, height, state);
    }

    createFooter(width: number, height: number, state: GameState) {
        if (this.footerContainer) {
            this.footerContainer.destroy();
        }
        this.footerContainer = this.add.container(0, 0);
        this.footerContainer.setDepth(200);

        const bg = this.add.rectangle(0, height - 30, width, 30, 0x000000, 1).setOrigin(0);
        const moneyText = this.add.text(15, height - 15, `¥${state.money}`, {
            fontSize: '15px', color: '#ffff00', fontFamily: 'Orbitron, monospace'
        }).setOrigin(0, 0.5);
        const daysColor = state.daysLeft <= 7 ? '#ff0000' : '#ff8888';
        const daysText = this.add.text(width - 15, height - 15, `残り${state.daysLeft}日`, {
            fontSize: '12px', color: daysColor, fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        this.footerContainer.add([bg, moneyText, daysText]);
    }

    negotiate(choice: any, state: GameState) {
        const success = Math.random() < choice.successRate;

        state.pride -= choice.prideCost;
        state.dogezaCount++;

        if (success) {
            // 成功：日数延長
            const daysExtended = choice.prideCost === 40 ? 7 : choice.prideCost === 20 ? 3 : 2;
            state.daysLeft += daysExtended;
            synth.playPowerUp();
        } else {
            // 失敗
            synth.playCancel();
        }

        this.registry.set('gameState', state);
        this.createFooter(this.scale.width, this.scale.height, state);


        // 結果表示
        this.showResult(choice.result, success, state);
    }

    showResult(resultText: string, success: boolean, state: GameState) {
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setInteractive();
        overlay.setDepth(1000);

        const container = this.add.container(width / 2, height / 2);
        container.setDepth(1001);

        const bg = this.add.rectangle(0, 0, width - 30, 300, 0x1a1a2e, 1);
        bg.setStrokeStyle(3, success ? 0x00ff00 : 0xff8888, 0.8);

        const title = this.add.text(0, -120, success ? "交渉成功..." : "交渉失敗...", {
            fontSize: '16px',
            color: success ? '#00ff00' : '#ff8888',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        const result = this.add.text(0, -20, resultText, {
            fontSize: '10px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 60 },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 4
        }).setOrigin(0.5);

        const prideText = this.add.text(0, 80, `現在のプライド: ${state.pride}/100`, {
            fontSize: '11px',
            color: state.pride <= 20 ? '#ff0000' : state.pride <= 50 ? '#ffaa00' : '#00ff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const warningText = state.pride <= 20
            ? this.add.text(0, 100, "警告: プライドが低すぎる！\nボス戦で名言に耐えられない！", {
                fontSize: '9px',
                color: '#ff0000',
                align: 'center',
                fontFamily: 'monospace'
            }).setOrigin(0.5)
            : null;

        const closeBtn = this.add.text(0, 130, "【了解】", {
            fontSize: '14px',
            color: '#00ffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        container.add([bg, title, result, prideText, closeBtn]);
        if (warningText) container.add(warningText);

        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            container.destroy();
            this.scene.start('TownScene');
        });

        // フェードイン
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }
}

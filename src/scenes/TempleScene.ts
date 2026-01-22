import Phaser from 'phaser';
import { type GameState } from '../types';
import { synth } from '../logic/SoundSynth';

export default class TempleScene extends Phaser.Scene {
    private footerContainer: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('TempleScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;

        // Background (dark temple)
        this.add.rectangle(0, 0, width, height, 0x1a0a0a).setOrigin(0);

        // Title
        this.add.text(width / 2, 35, "怪しいお寺", {
            fontSize: '18px',
            color: '#ff8800',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        // Temple icon (simple representation)
        const templeX = width / 2;
        const templeY = 100;

        // Roof
        const roof = this.add.triangle(templeX, templeY - 20, 0, 40, -60, 0, 60, 0, 0x8b4513);
        roof.setStrokeStyle(2, 0xff8800, 0.8);

        // Building
        this.add.rectangle(templeX, templeY + 30, 80, 60, 0x4a2511).setStrokeStyle(2, 0xff8800, 0.6);

        // Monk's message
        const msgBg = this.add.rectangle(width / 2, 180, width - 30, 80, 0x000000, 0.8);
        msgBg.setStrokeStyle(2, 0xff8800, 0.5);

        this.add.text(width / 2, 180, "坊主「地獄の沙汰も金次第……。\n　　　お布施をいただければ、\n　　　魂を清めて差し上げましょう」", {
            fontSize: '10px',
            color: '#ffcc88',
            align: 'center',
            wordWrap: { width: width - 50, useAdvancedWrap: true },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 4
        }).setOrigin(0.5);

        // Current status
        // Current status removed (moved to footer)


        // Donation options
        const donations = [
            {
                name: "小額のお布施",
                cost: 300000,
                humanityGain: 30,
                description: "少しだけ心が軽くなる"
            },
            {
                name: "中額のお布施",
                cost: 800000,
                humanityGain: 60,
                description: "罪の意識が薄れていく"
            },
            {
                name: "高額のお布施",
                cost: 2000000,
                humanityGain: 100,
                description: "魂が浄化される感覚"
            }
        ];

        let currentY = 320;

        donations.forEach((donation) => {
            const canAfford = state.money >= donation.cost;
            const container = this.add.container(width / 2, currentY);

            const bg = this.add.rectangle(0, 0, width - 40, 70, canAfford ? 0x3a2a1a : 0x2a2a2a);
            if (canAfford) {
                bg.setInteractive();
            }
            bg.setStrokeStyle(2, canAfford ? 0xff8800 : 0x666666, 0.6);

            const nameText = this.add.text(0, -20, donation.name, {
                fontSize: '12px',
                color: canAfford ? '#ffff00' : '#666666',
                fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);

            const descText = this.add.text(0, 0, donation.description, {
                fontSize: '9px',
                color: canAfford ? '#ccccaa' : '#555555',
                fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);

            const costText = this.add.text(0, 22, `¥${donation.cost}  (人間性 +${donation.humanityGain})`, {
                fontSize: '10px',
                color: canAfford ? '#00ff00' : '#666666',
                fontFamily: 'monospace'
            }).setOrigin(0.5);

            container.add([bg, nameText, descText, costText]);

            if (canAfford) {
                bg.on('pointerover', () => {
                    bg.setStrokeStyle(3, 0xff8800, 1);
                    this.tweens.add({
                        targets: container,
                        scaleX: 1.02,
                        scaleY: 1.02,
                        duration: 100,
                        ease: 'Power1'
                    });
                });

                bg.on('pointerout', () => {
                    bg.setStrokeStyle(2, 0xff8800, 0.6);
                    this.tweens.add({
                        targets: container,
                        scaleX: 1,
                        scaleY: 1,
                        duration: 100,
                        ease: 'Power1'
                    });
                });

                bg.on('pointerdown', () => {
                    synth.playSelect();
                    this.tweens.add({
                        targets: container,
                        scaleX: 0.95,
                        scaleY: 0.95,
                        duration: 50,
                        yoyo: true,
                        ease: 'Power2',
                        onComplete: () => {
                            this.makeDonation(donation, state);
                        }
                    });
                });
            }

            currentY += 80;
        });

        // Return button
        const backBtn = this.add.rectangle(width / 2, height - 100, 160, 30, 0x444444).setInteractive();

        backBtn.setStrokeStyle(2, 0x666666);
        this.add.text(width / 2, height - 100, "寺を出る", {

            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        backBtn.on('pointerover', () => {
            backBtn.setStrokeStyle(3, 0x888888);
        });

        backBtn.on('pointerout', () => {
            backBtn.setStrokeStyle(2, 0x666666);
        });

        backBtn.on('pointerdown', () => {
            synth.playCancel();
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

        const bg = this.add.rectangle(0, height - 70, width, 70, 0x000000, 1).setOrigin(0);
        const moneyText = this.add.text(15, height - 50, `¥${state.money}`, {
            fontSize: '15px', color: '#ffff00', fontFamily: 'Orbitron, monospace'
        }).setOrigin(0, 0.5);
        const daysColor = state.daysLeft <= 7 ? '#ff0000' : '#ff8888';
        const daysText = this.add.text(width - 15, height - 50, `残り${state.daysLeft}日`, {
            fontSize: '12px', color: daysColor, fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        this.footerContainer.add([bg, moneyText, daysText]);
    }

    makeDonation(donation: any, state: GameState) {
        const { width, height } = this.scale;

        // Payment
        state.money -= donation.cost;
        state.humanity = Math.min(100, state.humanity + donation.humanityGain);
        this.registry.set('gameState', state);

        synth.playPowerUp();
        this.createFooter(this.scale.width, this.scale.height, state);


        // Result overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.95).setOrigin(0).setInteractive();
        overlay.setDepth(1000);

        const container = this.add.container(width / 2, height / 2);
        container.setDepth(1001);

        const bg = this.add.rectangle(0, 0, width - 30, 250, 0x1a0a0a, 1);
        bg.setStrokeStyle(3, 0xff8800, 0.8);

        const title = this.add.text(0, -100, "お布施を納めた", {
            fontSize: '16px',
            color: '#ff8800',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        const message = this.add.text(0, -30, `坊主「南無阿弥陀仏……」\n\n鐘の音が響く。\n\nお前の心が、少しだけ軽くなった。\n\n……本当に、これでいいのだろうか？`, {
            fontSize: '10px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 60, useAdvancedWrap: true },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 5
        }).setOrigin(0.5);

        const stats = this.add.text(0, 80, `人間性: ${state.humanity}/100\n所持金: ¥${state.money}`, {
            fontSize: '11px',
            color: state.humanity <= 30 ? '#ff0000' : state.humanity <= 60 ? '#ffaa00' : '#00ff00',
            align: 'center',
            fontFamily: 'monospace',
            lineSpacing: 3
        }).setOrigin(0.5);

        const closeBtn = this.add.text(0, 110, "【合掌】", {
            fontSize: '14px',
            color: '#ff8800',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        container.add([bg, title, message, stats, closeBtn]);

        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            container.destroy();
            this.scene.restart();
        });

        // Fade in
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 800,
            ease: 'Power2'
        });
    }
}

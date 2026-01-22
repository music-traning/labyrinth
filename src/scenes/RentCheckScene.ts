import Phaser from 'phaser';
import { type GameState } from '../types';
import { DataManager } from '../logic/DataManager';
import { synth } from '../logic/SoundSynth';
import { resetGame } from '../logic/GameLogic';

export default class RentCheckScene extends Phaser.Scene {
    constructor() {
        super('RentCheckScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;

        // Background (cyberpunk style)
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // Title
        this.add.text(width / 2, 35, "4.5畳の部屋 - 家賃の日", {
            fontSize: '16px',
            color: '#ff00ff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        // Landlady (neon box)
        const landladyBox = this.add.rectangle(width / 2, 110, 140, 140, 0x2a1a3a);
        landladyBox.setStrokeStyle(3, 0xff00ff, 0.8);

        this.add.text(width / 2, 110, "大家\nLandlady", {
            fontSize: '14px',
            color: '#ff88ff',
            align: 'center',
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 3
        }).setOrigin(0.5);

        // Message box
        const msgBg = this.add.rectangle(width / 2, 230, width - 30, 90, 0x000000, 0.8);
        msgBg.setStrokeStyle(2, 0xff00ff, 0.6);

        const flavor = DataManager.getRandomFlavor('rent_fail');
        const msgText = this.add.text(width / 2, 230, flavor, {
            fontSize: '10px',
            color: '#ffccff',
            align: 'center',
            wordWrap: { width: width - 50, useAdvancedWrap: true },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 4
        }).setOrigin(0.5);

        // Status
        const canPay = state.money >= state.rentAmount;
        this.add.text(width / 2, 315, `所持金: ¥${state.money} / 家賃: ¥${state.rentAmount}`, {
            fontSize: '12px',
            color: canPay ? '#00ff00' : '#ff0000',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Pay Button
        const payBtn = this.add.rectangle(width / 2, 370, 180, 40, canPay ? 0x228822 : 0x444444);
        payBtn.setStrokeStyle(2, canPay ? 0x00ff00 : 0x666666, 0.6);
        if (canPay) {
            payBtn.setInteractive();
        }

        this.add.text(width / 2, 370, "家賃を払う (Pay Rent)", {
            fontSize: '12px',
            color: canPay ? '#ffffff' : '#666666',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        if (canPay) {
            payBtn.on('pointerover', () => {
                payBtn.setStrokeStyle(3, 0x00ff00, 1);
            });

            payBtn.on('pointerout', () => {
                payBtn.setStrokeStyle(2, 0x00ff00, 0.6);
            });

            let isPayClicked = false;
            payBtn.on('pointerdown', () => {
                if (isPayClicked) return;
                isPayClicked = true;
                payBtn.disableInteractive();
                this.payRent(state, msgText);
            });
        }

        // Bluff Button
        const bluffBtn = this.add.rectangle(width / 2, 430, 180, 40, 0x882222);
        bluffBtn.setStrokeStyle(2, 0xff8888, 0.6);
        bluffBtn.setInteractive();

        this.add.text(width / 2, 430, `ハッタリをかます (Lv.${state.bluffLevel})`, {
            fontSize: '11px',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        bluffBtn.on('pointerover', () => {
            bluffBtn.setStrokeStyle(3, 0xff8888, 1);
        });

        bluffBtn.on('pointerout', () => {
            bluffBtn.setStrokeStyle(2, 0xff8888, 0.6);
        });

        bluffBtn.on('pointerdown', () => {
            this.handleBluffClick(state, msgText);
        });

        // Return Button (hidden on first visit)
        if (state.isTutorialDone) {
            const backBtn = this.add.rectangle(width / 2, height - 40, 160, 35, 0x444444);
            backBtn.setStrokeStyle(2, 0x666666);
            backBtn.setInteractive();

            this.add.text(width / 2, height - 40, "寝る (Sleep)", {
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
                this.scene.start('TownScene');
            });
        }
    }

    payRent(state: GameState, msgText: Phaser.GameObjects.Text) {
        synth.playPowerUp();
        state.money -= state.rentAmount;
        state.daysLeft += 30; // Paid for next month

        // 初回フラグを立てる
        if (!state.isTutorialDone) {
            state.isTutorialDone = true;
        }

        this.registry.set('gameState', state);

        const successFlavor = DataManager.getRandomFlavor('rent_success');
        msgText.setText(successFlavor);
        msgText.setColor('#00ff00');

        this.time.delayedCall(2000, () => {
            this.scene.start('TownScene');
        });
    }

    handleBluffClick(state: GameState, msgText: Phaser.GameObjects.Text) {
        const hasUnderground = (state.seminarSkills || []).includes('underground');

        if (hasUnderground) {
            const { width, height } = this.scale;
            const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setInteractive();
            overlay.setDepth(100);

            const modalContainer = this.add.container(width / 2, height / 2);
            modalContainer.setDepth(101);

            const modalBg = this.add.rectangle(0, 0, width - 40, 200, 0x1a1a2e);
            modalBg.setStrokeStyle(3, 0xff00ff, 0.8);

            const title = this.add.text(0, -70, "戦略を選択", {
                fontSize: '16px',
                color: '#ff00ff',
                fontFamily: 'Orbitron, monospace'
            }).setOrigin(0.5);

            // Normal Bluff
            const btnA = this.add.rectangle(0, -20, width - 80, 35, 0x882222).setInteractive();
            btnA.setStrokeStyle(2, 0xff8888, 0.6);
            const textA = this.add.text(0, -20, `通常のハッタリ (リスク: 高)`, {
                fontSize: '11px',
                color: '#ffffff',
                fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);

            btnA.on('pointerover', () => btnA.setStrokeStyle(3, 0xff8888, 1));
            btnA.on('pointerout', () => btnA.setStrokeStyle(2, 0xff8888, 0.6));
            btnA.on('pointerdown', () => {
                overlay.destroy();
                modalContainer.destroy();
                this.executeBluff(state, msgText, false);
            });

            // Skill Bluff
            const btnB = this.add.rectangle(0, 35, width - 80, 35, 0x444488).setInteractive();
            btnB.setStrokeStyle(2, 0x8888ff, 0.6);
            const textB = this.add.text(0, 35, `Skill: 潜伏期間 (安全)`, {
                fontSize: '11px',
                color: '#ffffff',
                fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);

            btnB.on('pointerover', () => btnB.setStrokeStyle(3, 0x8888ff, 1));
            btnB.on('pointerout', () => btnB.setStrokeStyle(2, 0x8888ff, 0.6));
            btnB.on('pointerdown', () => {
                overlay.destroy();
                modalContainer.destroy();
                this.executeBluff(state, msgText, true);
            });

            modalContainer.add([modalBg, title, btnA, textA, btnB, textB]);

            modalContainer.setAlpha(0);
            this.tweens.add({
                targets: modalContainer,
                alpha: 1,
                duration: 300,
                ease: 'Power2'
            });
        } else {
            this.executeBluff(state, msgText, false);
        }
    }

    executeBluff(state: GameState, msgText: Phaser.GameObjects.Text, useSkill: boolean) {
        // 初回は確実に成功
        const isFirstTime = !state.isTutorialDone;

        if (useSkill || isFirstTime) {
            synth.playSelect();

            if (isFirstTime) {
                msgText.setText("主人公「来月には絶対払います！\n今、大きな仕事が動いてて……」\n\n大家「……フン。\n来月が最後だよ！」\n\n(初回は見逃してくれた！)");
                // 初回フラグを立てる
                state.isTutorialDone = true;
                this.registry.set('gameState', state);
            } else {
                msgText.setText("主人公「今は水面下で動いている\nプロジェクトがあるんです。\nまだ公表できませんがね……」\n\n大家「……フン。重要そうだね。\n待ってやるよ」\n\n(怒りゲージ停止！)");
            }

            msgText.setColor('#00ffff');
            this.time.delayedCall(3000, () => {
                this.scene.start('TownScene');
            });
            return;
        }

        const successChance = Math.min(0.9, state.bluffLevel * 0.1);

        if (Math.random() < successChance) {
            synth.playSelect();
            msgText.setText("大家「……いいだろう。\nだが来月が最後の警告だよ！」\n\n(時間を稼いだ！)");
            msgText.setColor('#ffff00');
            this.time.delayedCall(2500, () => {
                this.scene.start('TownScene');
            });
        } else {
            synth.playBadEnd();
            msgText.setText("影の女「あら、可哀想に。\n行く場所がないの？\n……私の部屋においで。\n温かいスープがあるわ」");
            msgText.setColor('#ff0000');

            this.time.delayedCall(4000, () => {
                this.scene.start('StoryScene', {
                    scenarioData: [
                        { text: "【BAD END: 影の女】" },
                        { text: "お前は、彼女についていった。" },
                        { text: "二度と、戻ってこなかった。" },
                        { event: () => resetGame(this) }
                    ]
                });
            });
        }
    }
}

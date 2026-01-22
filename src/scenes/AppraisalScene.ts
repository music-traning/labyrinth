import Phaser from 'phaser';
import { type GameState, type InventoryItem } from '../types';
import { DataManager } from '../logic/DataManager';
import { synth } from '../logic/SoundSynth';
import { Calculator } from '../logic/GameLogic';

export default class AppraisalScene extends Phaser.Scene {
    private listContainer: Phaser.GameObjects.Container | null = null;

    // Scroll Variables
    private isScrolling: boolean = false;
    private startY: number = 0;
    private listStartY: number = 260; // リストの開始Y座標
    private maxScroll: number = 0;

    constructor() {
        super('AppraisalScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;

        this.add.rectangle(0, 0, width, height, 0x221100).setOrigin(0);

        // Danpei - 固定位置
        const danpeiContainer = this.add.container(width / 2 - 50, 100);
        const face = this.add.circle(0, 0, 35, 0xaa5500);
        const eyePatch = this.add.rectangle(10, -8, 16, 16, 0x000000);
        const nameText = this.add.text(50, 0, "隻眼のオヤジ\nダン (Dan)", {
            fontSize: '13px',
            color: '#fff',
            align: 'center',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0, 0.5);
        danpeiContainer.add([face, eyePatch, nameText]);
        danpeiContainer.setDepth(100); // 最前面に固定

        // Message Area - 固定位置
        const msgBg = this.add.rectangle(width / 2, 170, width - 25, 100, 0x000000, 0.9);
        msgBg.setStrokeStyle(2, 0xffaa00);
        msgBg.setDepth(100);

        const initialMsg = "ダン「おい！あんちゃん！\n持ってきな！ そのガラクタに\n魂（ソウル）はあんのか！？」";
        const msgText = this.add.text(width / 2, 170, initialMsg, {
            fontSize: '10px',
            color: '#fff',
            align: 'center',
            wordWrap: { width: width - 35, useAdvancedWrap: true },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 2
        }).setOrigin(0.5);
        msgText.setDepth(100);

        // Footer
        this.createFooter(width, height, state);

        // List Title
        const listTitle = this.add.text(20, this.listStartY - 20, "【鑑定する】", {
            fontSize: '13px',
            color: '#aaaaff',
            fontFamily: 'Rajdhani, sans-serif'
        });
        listTitle.setDepth(100);

        // Setup Scroll Input (Touch & Mouse)
        this.setupScrollInput();

        const unidentifiedItems = state.inventory.filter(i => !i.isIdentified);

        if (unidentifiedItems.length === 0) {
            this.add.text(width / 2, this.listStartY + 50, "鑑定するものがないぜ。\n迷宮で掘ってきな！", {
                fontSize: '12px',
                color: '#888',
                align: 'center',
                fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);
        } else {
            // スクロール可能なリストコンテナ
            this.listContainer = this.add.container(0, this.listStartY);

            let currentY = 0;
            const categories = ['weapon', 'accessory', 'book', 'memory', 'trash'];
            const catNames: { [key: string]: string } = {
                'weapon': '武器', 'accessory': 'アクセサリー', 'book': '本', 'memory': '思い出', 'trash': 'ガラクタ'
            };

            categories.forEach(cat => {
                const itemsInCat = unidentifiedItems.filter(i => i.type === cat);
                if (itemsInCat.length === 0) return;

                // Category Header
                const header = this.add.text(width / 2, currentY + 15, `【${catNames[cat]}】`, {
                    fontSize: '12px', color: '#00ffff', fontFamily: 'Rajdhani, sans-serif'
                }).setOrigin(0.5);
                this.listContainer?.add(header);
                currentY += 45;

                itemsInCat.forEach((item) => {
                    const btn = this.add.container(width / 2, currentY);
                    const bg = this.add.rectangle(0, 0, width - 35, 42, 0x332211).setInteractive();
                    bg.setStrokeStyle(1, 0x664422);

                    // 鑑定費用計算
                    const appraisalCost = Calculator.calculateAppraisalCost(item);

                    const displayName = `？？？`;
                    const text = this.add.text(-130, 0, displayName, {
                        fontSize: '12px',
                        color: '#ffffaa',
                        fontFamily: 'Rajdhani, sans-serif'
                    }).setOrigin(0, 0.5);

                    // 価格表示（右側）
                    const costText = this.add.text(120, 0, `¥${appraisalCost} `, {
                        fontSize: '11px',
                        color: '#00ff00',
                        fontFamily: 'monospace'
                    }).setOrigin(1, 0.5);

                    btn.add([bg, text, costText]);

                    bg.on('pointerover', () => {
                        bg.setStrokeStyle(2, 0xffaa00);
                        this.tweens.add({ targets: btn, scaleX: 1.02, scaleY: 1.02, duration: 100, ease: 'Power1' });
                    });

                    bg.on('pointerout', () => {
                        bg.setStrokeStyle(1, 0x664422);
                        this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100, ease: 'Power1' });
                    });

                    // Change to pointerup + scroll guard
                    bg.on('pointerup', () => {
                        if (this.isScrolling) return;

                        this.tweens.add({
                            targets: btn,
                            scaleX: 0.95,
                            scaleY: 0.95,
                            duration: 50,
                            yoyo: true,
                            onComplete: () => {
                                this.identifyItem(item, state, msgText, text, costText, appraisalCost);
                            }
                        });
                    });

                    if (this.listContainer) {
                        this.listContainer.add(btn);
                    }
                    currentY += 48;
                });

                currentY += 10; // Spacing between categories
            });

            // Calculate Max Scroll
            this.maxScroll = Math.max(0, currentY - (height - 300));
        }

        // Return
        const backBtn = this.add.rectangle(width / 2, height - 100, 160, 30, 0x444444).setInteractive();
        backBtn.setStrokeStyle(2, 0x666666);
        const backText = this.add.text(width / 2, height - 100, "街へ戻る", {
            fontSize: '13px',
            color: '#fff',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        backBtn.on('pointerover', () => {
            backBtn.setStrokeStyle(3, 0x888888);
            this.tweens.add({ targets: [backBtn, backText], scaleX: 1.05, scaleY: 1.05, duration: 100, ease: 'Power1' });
        });

        backBtn.on('pointerout', () => {
            backBtn.setStrokeStyle(2, 0x666666);
            this.tweens.add({ targets: [backBtn, backText], scaleX: 1, scaleY: 1, duration: 100, ease: 'Power1' });
        });

        backBtn.on('pointerup', () => {
            if (!this.isScrolling) this.scene.start('TownScene');
        });
    }

    setupScrollInput() {
        // Desktop Wheel
        this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
            if (!this.listContainer) return;
            const newY = Phaser.Math.Clamp(this.listContainer.y - deltaY * 0.5, this.listStartY - this.maxScroll, this.listStartY);
            this.listContainer.y = newY;
        });

        // Touch/Drag Scroll
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.startY = pointer.y;
            this.isScrolling = false;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown && this.listContainer) {
                const deltaY = pointer.y - pointer.prevPosition.y;
                if (!this.isScrolling && Math.abs(pointer.y - this.startY) > 10) {
                    this.isScrolling = true;
                }
                if (this.isScrolling) {
                    const newY = this.listContainer.y + deltaY;
                    this.listContainer.y = Phaser.Math.Clamp(newY, this.listStartY - this.maxScroll, this.listStartY);
                }
            }
        });

        this.input.on('pointerup', () => {
            this.time.delayedCall(50, () => {
                this.isScrolling = false;
            });
        });
    }

    identifyItem(
        item: InventoryItem,
        state: GameState,
        msgText: Phaser.GameObjects.Text,
        listText: Phaser.GameObjects.Text,
        costText: Phaser.GameObjects.Text,
        appraisalCost: number
    ) {
        if (item.isIdentified) return;

        if (state.money < appraisalCost) {
            msgText.setText(`ダン「金がねえのか！\n鑑定料は¥${appraisalCost} だ！」`);
            msgText.setColor('#ff0000');
            this.tweens.add({
                targets: msgText,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 100,
                yoyo: true,
                onComplete: () => { msgText.setColor('#ffffff'); }
            });
            synth.playCancel();
            return;
        }

        state.money -= appraisalCost;
        synth.playPowerUp();

        item.isIdentified = true;
        this.registry.set('gameState', state);

        const flavor = DataManager.getRandomFlavor('appraisal');
        let itemName = item.fullName.split('\n')[0];

        if (itemName.length > 25) {
            const words = itemName.split(' ');
            let currentLine = '';
            let result = '';
            words.forEach(word => {
                if ((currentLine + word).length > 25) {
                    result += currentLine.trim() + '\n';
                    currentLine = word + ' ';
                } else {
                    currentLine += word + ' ';
                }
            });
            result += currentLine.trim();
            itemName = result;
        }

        msgText.setText(`${flavor} \n\n『${itemName}』だ！！\n(¥${appraisalCost} 支払った)`);
        msgText.setColor('#00ff00');

        this.tweens.add({ targets: msgText, scaleX: 1.05, scaleY: 1.05, duration: 200, yoyo: true });

        const shortName = item.fullName.split('\n')[0].substring(0, 18) + (item.fullName.split('\n')[0].length > 18 ? '...' : '');
        listText.setText(shortName);
        listText.setColor('#00ff00');
        listText.setFontSize('10px');

        costText.setText('鑑定済');
        costText.setColor('#888888');

        this.createFooter(this.scale.width, this.scale.height, state);
    }

    private footerContainer: Phaser.GameObjects.Container | null = null;

    createFooter(width: number, height: number, state: GameState) {
        if (this.footerContainer) {
            this.footerContainer.destroy();
        }
        this.footerContainer = this.add.container(0, 0);
        this.footerContainer.setDepth(200);

        const bg = this.add.rectangle(0, height - 70, width, 70, 0x000000, 1).setOrigin(0);
        const moneyText = this.add.text(15, height - 50, `¥${state.money} `, {
            fontSize: '15px', color: '#ffff00', fontFamily: 'Orbitron, monospace'
        }).setOrigin(0, 0.5);
        const daysColor = state.daysLeft <= 7 ? '#ff0000' : '#ff8888';
        const daysText = this.add.text(width - 15, height - 50, `残り${state.daysLeft} 日`, {
            fontSize: '12px', color: daysColor, fontFamily: 'monospace'
        }).setOrigin(1, 0.5);

        this.footerContainer.add([bg, moneyText, daysText]);
    }
}
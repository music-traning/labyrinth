import Phaser from 'phaser';
import { type GameState } from '../types';
import { synth } from '../logic/SoundSynth';
import { Calculator } from '../logic/GameLogic';

export default class PawnShopScene extends Phaser.Scene {
    private listContainer: Phaser.GameObjects.Container | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private fixedMemories: any[] = [];


    constructor() {
        super('PawnShopScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;

        // Initialize fixed memories (Prices x10 as requested)
        this.fixedMemories = [
            {
                id: 'letter',
                name: "故郷の母からの手紙",
                description: "「元気にしてるかい？\n体に気をつけて頑張りなさい」\n\n……もう、何年も返事を書いていない。",
                price: 15000,
                mpLoss: 5,
                prideLoss: 10,
                humanityLoss: 15
            },
            {
                id: 'tuner',
                name: "初めて買ったチューナー",
                description: "高校の時、バイト代で買った。\nこれで何百回も音を合わせた。\n\n……今は、もっといいのを持っている。",
                price: 12000,
                mpLoss: 3,
                prideLoss: 5,
                humanityLoss: 10
            },
            {
                id: 'ring',
                name: "別れた彼女とのペアリング",
                description: "「ずっと一緒にいようね」\n\n……彼女は今、どこで何をしているのだろう。",
                price: 20000,
                mpLoss: 8,
                prideLoss: 20,
                humanityLoss: 25
            }
        ];

        this.add.rectangle(0, 0, width, height, 0x1a1a0e).setOrigin(0);

        // Footer
        this.createFooter(width, height, state);

        // Title
        this.add.text(width / 2, 30, "薄暗い質屋", {
            fontSize: '18px',
            color: '#ffaa00',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        // Shopkeeper
        this.add.rectangle(width / 2, 80, width - 30, 60, 0x000000, 0.8).setStrokeStyle(1, 0xffaa00, 0.5);
        this.add.text(width / 2, 80, "店主「思い出に値段はつけられねえが、\n　　　現金には換えられるぜ」", {
            fontSize: '10px',
            color: '#ccccaa',
            align: 'center',
            wordWrap: { width: width - 50 },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 3
        }).setOrigin(0.5);

        // Mode Switch Button (Removed as Buy Back is disabled)


        // Initial Render
        this.renderList(state);

        // Back Button
        const backBtn = this.add.rectangle(width / 2, height - 60, 160, 30, 0x444444).setInteractive();
        backBtn.setStrokeStyle(2, 0x666666);
        this.add.text(width / 2, height - 60, "店を出る", {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
            this.scene.start('TownScene');
        });
    }

    private footerContainer: Phaser.GameObjects.Container | null = null;

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

    renderList(state: GameState) {
        if (this.listContainer) {
            this.listContainer.destroy();
        }

        const { width, height } = this.scale;
        const listY = 160; // Pushed down further
        const listHeight = height - 210; // Considering footer and back button
        this.listContainer = this.add.container(0, listY);

        // Only Sell Items
        const items = this.getSellItems(state);

        let currentY = 0;

        if (items.length === 0) {
            const emptyText = this.add.text(width / 2, 50, "売れる思い出はねえなあ。", {
                fontSize: '12px',
                color: '#666',
                fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);
            this.listContainer.add(emptyText);
            return;
        }

        items.forEach((item) => {
            const container = this.add.container(width / 2, currentY);
            // Height increased to 200 for better clearance
            const bg = this.add.rectangle(0, 0, width - 20, 200, 0x3a2a1a).setInteractive();
            bg.setStrokeStyle(2, 0xffaa00, 0.6);

            const nameText = this.add.text(0, -60, item.name, {
                fontSize: '16px', // Increased size
                color: '#ffff00',
                fontFamily: 'Rajdhani, sans-serif',
                align: 'center',
                wordWrap: { width: width - 40 }
            }).setOrigin(0.5);

            const descText = this.add.text(0, -10, item.description, {
                fontSize: '12px', // Increased size
                color: '#ccccaa',
                align: 'center',
                wordWrap: { width: width - 40 },
                fontFamily: 'Rajdhani, sans-serif',
                lineSpacing: 5
            }).setOrigin(0.5);

            const priceLabel = `Sell: ¥${item.price}`;
            const statsLabel = `(MP-${item.mpLoss} Pride-${item.prideLoss})`;

            const priceText = this.add.text(0, 70, `${priceLabel}\n${statsLabel}`, { // Moved down and split lines if needed
                fontSize: '14px', // Increased size
                color: '#00ff00',
                align: 'center',
                fontFamily: 'monospace'
            }).setOrigin(0.5);

            container.add([bg, nameText, descText, priceText]);

            bg.on('pointerover', () => {
                bg.setStrokeStyle(3, 0xffaa00, 1);
                this.tweens.add({ targets: container, scaleX: 1.02, scaleY: 1.02, duration: 100 });
            });

            bg.on('pointerout', () => {
                bg.setStrokeStyle(2, 0xffaa00, 0.6);
                this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
            });

            bg.on('pointerdown', () => {
                this.sellMemory(item, state);
            });


            this.listContainer?.add(container);
            currentY += 220; // Increased spacing for larger items
        });


        // Scroll (Simplified)
        const maxScroll = Math.max(0, currentY - listHeight);
        if (maxScroll > 0) {
            this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
                if (this.listContainer) {
                    this.listContainer.y -= deltaY * 0.5;
                    this.listContainer.y = Phaser.Math.Clamp(this.listContainer.y, listY - maxScroll, listY);
                }
            });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSellItems(state: GameState): any[] {
        // Defines the structure of items we can display
        const inventoryMemories = state.inventory
            .filter(item => item.type === 'memory' && item.memoryData)
            .map(item => ({
                id: item.id, // Inventory ID (Unique)
                memoryId: item.memoryType, // Type ID
                name: item.name,
                description: item.memoryData.description,
                price: Calculator.calculateMemorySellPrice(item.memoryData),
                mpLoss: item.memoryData.mpLoss,
                prideLoss: item.memoryData.prideLoss,
                humanityLoss: item.memoryData.humanityLoss,
                isFixed: false,
                originalItem: item
            }));

        const availableFixed = this.fixedMemories
            .filter(m => !state.soldMemories.includes(m.id))
            .map(m => ({
                ...m,
                id: m.id, // Fixed ID (e.g. 'letter')
                memoryId: m.id,
                isFixed: true,
                originalItem: null
            }));

        return [...availableFixed, ...inventoryMemories];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getBuyBackItems(state: GameState): any[] {
        // Sold fixed memories
        const soldFixed = this.fixedMemories
            .filter(m => state.soldMemories.includes(m.id))
            .map(m => ({
                ...m,
                isFixed: true,
                originalItem: null
            }));

        // Sold inventory memories
        const soldDungeon = (state.soldInventory || [])
            .filter(item => item.type === 'memory' && item.memoryData)
            .map(item => ({
                id: item.id,
                memoryId: item.memoryType,
                name: item.name,
                description: item.memoryData.description,
                price: Calculator.calculateMemorySellPrice(item.memoryData),
                mpLoss: item.memoryData.mpLoss,
                prideLoss: item.memoryData.prideLoss,
                humanityLoss: item.memoryData.humanityLoss,
                isFixed: false,
                originalItem: item
            }));

        return [...soldFixed, ...soldDungeon];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sellMemory(memory: any, state: GameState) {
        // Confirmation Logic
        const { width, height } = this.scale;

        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setInteractive();
        const container = this.add.container(width / 2, height / 2);
        const bg = this.add.rectangle(0, 0, width - 30, 250, 0x1a1a0e, 1).setStrokeStyle(3, 0xff8888, 0.8);

        const title = this.add.text(0, -90, "売却確認", { fontSize: '16px', color: '#ff8888' }).setOrigin(0.5);
        const warning = this.add.text(0, -30, `${memory.name}を売却して\n¥${memory.price}を得ますか？\n\n副作用:\n最大MP -${memory.mpLoss}\nプライド -${memory.prideLoss}\n人間性 -${memory.humanityLoss}`, {
            fontSize: '11px', align: 'center', lineSpacing: 4
        }).setOrigin(0.5);

        const yesBtn = this.add.rectangle(-60, 60, 100, 35, 0x882222).setInteractive();
        const yesTxt = this.add.text(-60, 60, "売る", { fontSize: '12px' }).setOrigin(0.5);
        const noBtn = this.add.rectangle(60, 60, 100, 35, 0x444444).setInteractive();
        const noTxt = this.add.text(60, 60, "やめる", { fontSize: '12px' }).setOrigin(0.5);

        container.add([bg, title, warning, yesBtn, yesTxt, noBtn, noTxt]);

        noBtn.on('pointerdown', () => { overlay.destroy(); container.destroy(); });

        yesBtn.on('pointerdown', () => {
            // Execute Sell
            state.money += memory.price;
            state.maxMp -= memory.mpLoss;
            state.mp = Math.min(state.mp, state.maxMp);
            state.pride -= memory.prideLoss;
            state.humanity -= memory.humanityLoss;

            if (memory.isFixed) {
                state.soldMemories.push(memory.id);
            } else {
                if (!state.soldInventory) state.soldInventory = [];
                state.soldInventory.push(memory.originalItem);
                state.inventory = state.inventory.filter(i => i.id !== memory.id);
            }

            this.registry.set('gameState', state);
            synth.playCancel();
            overlay.destroy();
            container.destroy();

            this.createFooter(width, height, state);

            // Show Result (Simplified: Log to top or just Toast, but for now just refresh list for smoothness)
            // The user requested NO transition (i.e., stay on list), so we just refresh.
            this.renderList(state);

            // Optional: Show a small toast indicator if possible, but immediate refresh is what was asked.
            const toast = this.add.text(width / 2, 70, `売却しました (+¥${memory.price})`, {
                fontSize: '12px', color: '#ffff00', stroke: '#000', strokeThickness: 2
            }).setOrigin(0.5);
            this.tweens.add({
                targets: toast,
                y: 50,
                alpha: 0,
                duration: 1500,
                onComplete: () => toast.destroy()
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buyBackMemory(memory: any, state: GameState) {
        if (state.money < memory.price) {
            this.showResult("資金不足", "店主「金がねえなら帰んな。」", state, false);
            return;
        }

        const { width, height } = this.scale;
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setInteractive();
        const container = this.add.container(width / 2, height / 2);
        const bg = this.add.rectangle(0, 0, width - 30, 200, 0x1a1a0e, 1).setStrokeStyle(3, 0x00ff00, 0.8);

        const title = this.add.text(0, -70, "買い戻し", { fontSize: '16px', color: '#00ff00' }).setOrigin(0.5);
        const warning = this.add.text(0, -20, `${memory.name}を\n¥${memory.price}で買い戻しますか？\n(ステータスが戻るかも...)`, {
            fontSize: '11px', align: 'center', lineSpacing: 4
        }).setOrigin(0.5);

        const yesBtn = this.add.rectangle(-60, 50, 100, 35, 0x228822).setInteractive();
        const yesTxt = this.add.text(-60, 50, "買い戻す", { fontSize: '12px' }).setOrigin(0.5);
        const noBtn = this.add.rectangle(60, 50, 100, 35, 0x444444).setInteractive();
        const noTxt = this.add.text(60, 50, "やめる", { fontSize: '12px' }).setOrigin(0.5);

        container.add([bg, title, warning, yesBtn, yesTxt, noBtn, noTxt]);

        noBtn.on('pointerdown', () => { overlay.destroy(); container.destroy(); });

        yesBtn.on('pointerdown', () => {
            state.money -= memory.price;
            // Restore stats?
            state.maxMp += memory.mpLoss;
            state.pride += memory.prideLoss;
            state.humanity += memory.humanityLoss;

            if (memory.isFixed) {
                state.soldMemories = state.soldMemories.filter(id => id !== memory.id);
            } else {
                state.soldInventory = state.soldInventory.filter(i => i.id !== memory.id);
                state.inventory.push(memory.originalItem);
            }

            this.registry.set('gameState', state);
            synth.playPowerUp();
            overlay.destroy();
            container.destroy();

            // Update Footer
            this.createFooter(width, height, state);

            this.showResult("買い戻し完了", `${memory.name}を取り戻した！\n失った心が少し埋まった。`, state);
        });
    }

    showResult(title: string, msg: string, state: GameState, reload: boolean = true) {
        const { width, height } = this.scale;
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0).setInteractive();
        const container = this.add.container(width / 2, height / 2);

        const bg = this.add.rectangle(0, 0, width - 40, 150, 0x222222).setStrokeStyle(1, 0xaaaaaa);
        const t = this.add.text(0, -40, title, { fontSize: '14px', color: '#fff' }).setOrigin(0.5);
        const m = this.add.text(0, 0, msg, { fontSize: '11px', align: 'center' }).setOrigin(0.5);

        const close = this.add.text(0, 50, "閉じる", { fontSize: '12px', color: '#00ffff' }).setOrigin(0.5).setInteractive();

        container.add([bg, t, m, close]);

        close.on('pointerdown', () => {
            overlay.destroy();
            container.destroy();
            if (reload) this.renderList(state);
        });
    }
}

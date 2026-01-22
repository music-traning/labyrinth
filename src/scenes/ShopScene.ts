import Phaser from 'phaser';
import { type GameState, type InventoryItem } from '../types';
import { DataManager } from '../logic/DataManager';
import { synth } from '../logic/SoundSynth';
import { Calculator } from '../logic/GameLogic';

export default class ShopScene extends Phaser.Scene {
    private listContainer: Phaser.GameObjects.Container | null = null;
    private isBuyMode: boolean = false; // false = Sell, true = Buy
    private selectionContainer: Phaser.GameObjects.Container | null = null;

    // Scroll Logic Variables
    private isScrolling: boolean = false;
    private startY: number = 0;
    private listStartY: number = 150;
    private maxScroll: number = 0;

    constructor() {
        super('ShopScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;

        this.add.rectangle(0, 0, width, height, 0x1a1a1a).setOrigin(0);

        // Title
        this.add.text(width / 2, 35, "Junk & Instruments", {
            fontSize: '18px',
            color: '#00ffff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        // Footer
        this.createFooter(width, height, state);

        // Setup Scene-level Scroll Input
        this.setupScrollInput();

        // Initial Selection Mode
        this.showSelectionMode(width, height, state);
    }

    setupScrollInput() {
        // Desktop Wheel Scroll
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

                // Only consider it a scroll if moved significantly
                if (!this.isScrolling && Math.abs(pointer.y - this.startY) > 10) {
                    this.isScrolling = true;
                }

                if (this.isScrolling) {
                    // Update Container Y
                    const newY = this.listContainer.y + deltaY;
                    const minY = this.listStartY - this.maxScroll;
                    const maxY = this.listStartY;

                    // Allow rubber-banding or strict clamp? Strict clamp for now
                    this.listContainer.y = Phaser.Math.Clamp(newY, minY, maxY);
                }
            }
        });

        this.input.on('pointerup', () => {
            // Reset scrolling flag after a short delay to prevent accidental clicks
            this.time.delayedCall(50, () => {
                this.isScrolling = false;
            });
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

    showSelectionMode(width: number, _height: number, state: GameState) {
        if (this.listContainer) {
            this.listContainer.destroy();
            this.listContainer = null;
        }

        this.selectionContainer = this.add.container(0, 0);

        // Msg
        const msgText = this.add.text(width / 2, 100, "ファンク「いらっしゃい……。\n　買うのか、売るのか？」", {
            fontSize: '12px', color: '#cccccc', align: 'center', fontFamily: 'Rajdhani, sans-serif', lineSpacing: 4
        }).setOrigin(0.5);

        // Buy Button
        const buyBtn = this.createBigButton(width / 2, 180, "買いに来た (Buy)", 0x222244, () => {
            this.isBuyMode = true;
            this.startShopMode(state);
        });

        // Sell Button
        const sellBtn = this.createBigButton(width / 2, 250, "売りに来た (Sell)", 0x333333, () => {
            this.isBuyMode = false;
            this.startShopMode(state);
        });

        const backBtn = this.createBigButton(width / 2, 350, "街へ戻る", 0x444444, () => {
            synth.playCancel();
            this.scene.start('TownScene');
        });

        this.selectionContainer.add([msgText, ...buyBtn, ...sellBtn, ...backBtn]);
    }

    createBigButton(x: number, y: number, text: string, color: number, onClick: () => void) {
        const bg = this.add.rectangle(x, y, 200, 50, color).setInteractive();
        bg.setStrokeStyle(2, 0x00ffff, 0.6);
        const txt = this.add.text(x, y, text, { fontSize: '14px', fontFamily: 'Rajdhani, sans-serif', color: '#fff' }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setStrokeStyle(3, 0x00ffff, 1));
        bg.on('pointerout', () => bg.setStrokeStyle(2, 0x00ffff, 0.6));

        // Change to pointerup for consistency, though big menu buttons usually fine on pointerdown
        bg.on('pointerup', () => {
            if (!this.isScrolling) onClick();
        });

        return [bg, txt];
    }

    startShopMode(state: GameState) {
        if (this.selectionContainer) {
            this.selectionContainer.destroy();
            this.selectionContainer = null;
        }

        const { width, height } = this.scale;

        // Msg Area
        const msgText = this.add.text(width / 2, 85, this.isBuyMode ? "ファンク「掘り出し物があるかもな」" : "ファンク「ガラクタなら引き取るぜ」", {
            fontSize: '10px', color: '#cccccc', align: 'center', fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        // Switch Button (Small)
        const switchBtn = this.add.rectangle(width / 2, 120, 160, 25, this.isBuyMode ? 0x222244 : 0x333333).setInteractive();
        switchBtn.setStrokeStyle(1, 0x888888);
        const switchText = this.add.text(width / 2, 120, this.isBuyMode ? "モード切替 -> 売る" : "モード切替 -> 買う", {
            fontSize: '11px', color: '#aaa', fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        switchBtn.on('pointerup', () => {
            if (this.isScrolling) return;
            this.isBuyMode = !this.isBuyMode;
            switchBtn.setFillStyle(this.isBuyMode ? 0x222244 : 0x333333);
            switchText.setText(this.isBuyMode ? "モード切替 -> 売る" : "モード切替 -> 買う");
            msgText.setText(this.isBuyMode ? "ファンク「掘り出し物があるかもな」" : "ファンク「ガラクタなら引き取るぜ」");
            this.renderList(state, msgText);
        });

        // initial render
        this.renderList(state, msgText);

        // Back Btn (Set depth to ensure visibility over list)
        const backBtn = this.add.rectangle(width / 2, height - 60, 160, 30, 0x444444).setInteractive();
        backBtn.setStrokeStyle(2, 0x666666);
        backBtn.setDepth(100);
        const backBtnText = this.add.text(width / 2, height - 60, "選択に戻る", { fontSize: '12px', fontFamily: 'Rajdhani, sans-serif' }).setOrigin(0.5);
        backBtnText.setDepth(101);

        backBtn.on('pointerup', () => {
            if (!this.isScrolling) this.scene.restart();
        });
    }

    renderList(state: GameState, msgText: Phaser.GameObjects.Text) {
        const { width, height } = this.scale;

        // Reset scroll position
        if (this.listContainer) {
            this.listContainer.destroy();
        }

        this.listContainer = this.add.container(0, this.listStartY);

        const listHeight = height - 200; // Visible area height

        let items: InventoryItem[] = [];
        if (this.isBuyMode) {
            items = state.soldInventory || [];
        } else {
            // Filter out memory items AND equipped items
            items = state.inventory.filter(i => i.type !== 'memory' && !i.isEquipped);
        }

        if (items.length === 0) {
            const t = this.add.text(width / 2, 50, this.isBuyMode ? "在庫切れだ。" : "売れるもんがねえな。", {
                fontSize: '12px', color: '#666', fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);
            this.listContainer.add(t);
            this.maxScroll = 0; // No scroll needed
            return;
        }

        // --- Group Items ---
        const groupedItems: { [key: string]: { item: InventoryItem, count: number, originalItems: InventoryItem[] } } = {};

        items.forEach(item => {
            // Group key: based on full name + isIdentified status + price
            // This ensures unidentified items are grouped together, and different identified items are separate
            const key = `${item.fullName}_${item.isIdentified}_${item.price}`;
            if (!groupedItems[key]) {
                groupedItems[key] = {
                    item: item,
                    count: 0,
                    originalItems: []
                };
            }
            groupedItems[key].count++;
            groupedItems[key].originalItems.push(item);
        });
        // -------------------

        let currentY = 0;
        const categories = ['trash', 'weapon', 'accessory', 'book'];
        const catNames: { [key: string]: string } = {
            'weapon': '武器', 'accessory': 'アクセサリー', 'book': '本', 'trash': 'ガラクタ'
        };

        categories.forEach(cat => {
            // Filter grouped items by category of their representative item
            const keysInCat = Object.keys(groupedItems).filter(k => groupedItems[k].item.type === cat);
            if (keysInCat.length === 0) return;

            // Category Header with margin
            const header = this.add.text(width / 2, currentY + 15, `【${catNames[cat]}】`, {
                fontSize: '12px', color: '#00ffff', fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);
            this.listContainer?.add(header);
            currentY += 50;

            keysInCat.forEach(key => {
                const group = groupedItems[key];
                const item = group.item;
                const count = group.count;

                const container = this.add.container(width / 2, currentY);
                const bg = this.add.rectangle(0, 0, width - 35, 55, 0x2a2a2a).setInteractive();
                bg.setStrokeStyle(2, 0x00ffff, 0.6);

                let price = this.isBuyMode ? item.price : Calculator.calculateSellPrice(item);
                let name = this.isBuyMode ? item.fullName : (item.isIdentified ? item.fullName : "？？？ (Garakuta)");
                if (name.length > 20) name = name.substring(0, 20) + '...';

                // Display Name + Quantity if > 1
                const nameDisplay = count > 1 ? `${name} x${count}` : name;

                const nReq = this.add.text(-width / 2 + 25, 0, nameDisplay, {
                    fontSize: '10px', color: '#fff', fontFamily: 'Rajdhani, sans-serif', wordWrap: { width: width - 120 }
                }).setOrigin(0, 0.5);

                const pReq = this.add.text(width / 2 - 25, 0, `¥${price}`, {
                    fontSize: '11px', color: '#ffff00', fontFamily: 'monospace'
                }).setOrigin(1, 0.5);

                container.add([bg, nReq, pReq]);

                // IMPORTANT: Changed to pointerup and check isScrolling
                bg.on('pointerup', () => {
                    if (this.isScrolling) return; // Don't trigger if dragging

                    // Pass one item from the group to process
                    // Logic: Process one item, then re-render list
                    const targetItem = group.originalItems[0];
                    if (this.isBuyMode) this.buyItem(targetItem, state, msgText);
                    else this.requestSellInteraction(targetItem, state, msgText, price);
                });

                this.listContainer?.add(container);
                currentY += 60;
            });
            currentY += 10;
        });

        // Calculate Max Scroll
        this.maxScroll = Math.max(0, currentY - listHeight);
    }

    buyItem(item: InventoryItem, state: GameState, msgText: Phaser.GameObjects.Text) {
        if (state.money < item.price) {
            msgText.setText("ファンク「金が足りねえようだな」");
            synth.playCancel();
            return;
        }
        state.money -= item.price;
        state.inventory.push(item);
        if (state.soldInventory) state.soldInventory = state.soldInventory.filter(i => i.id !== item.id);
        this.registry.set('gameState', state);
        synth.playCoin();
        msgText.setText("ファンク「まいどあり」");
        this.createFooter(this.scale.width, this.scale.height, state); // Update Footer
        this.renderList(state, msgText); // Re-render list
    }

    requestSellInteraction(item: InventoryItem, state: GameState, msgText: Phaser.GameObjects.Text, basePrice: number) {
        // Simplified logic for brevity, assuming standard sell for now to keep file clean
        // In real implementation, bring back Bluff logic if needed.
        this.sellItem(item, state, msgText, basePrice);
    }

    sellItem(item: InventoryItem, state: GameState, msgText: Phaser.GameObjects.Text, price: number) {
        synth.playCoin();
        state.money += price;
        state.inventory = state.inventory.filter(i => i.id !== item.id);
        if (!state.soldInventory) state.soldInventory = [];
        state.soldInventory.push(item);
        this.registry.set('gameState', state);
        msgText.setText(DataManager.getRandomFlavor('shop_buy'));
        this.createFooter(this.scale.width, this.scale.height, state); // Update Footer
        this.renderList(state, msgText); // Re-render list
    }
}
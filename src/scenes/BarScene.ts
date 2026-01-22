import Phaser from 'phaser';
import { type GameState } from '../types';
import { synth } from '../logic/SoundSynth';
import { DataManager } from '../logic/DataManager';

export default class BarScene extends Phaser.Scene {
    private footerContainer: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('BarScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;

        this.add.rectangle(0, 0, width, height, 0x110011).setOrigin(0);

        // Neon visuals
        this.add.text(width / 2, 35, "BAR - Neo Tokyo", {
            fontSize: '18px',
            color: '#ff00ff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5).setShadow(0, 0, '#ff00ff', 5);

        // Bartender
        const masterBox = this.add.rectangle(width / 2, 90, width - 30, 80, 0x000000, 0.7);
        masterBox.setStrokeStyle(1, 0xff00ff, 0.5);

        const masterText = this.add.text(width / 2, 90, "マスター「...いらっしゃい。\n飲むか、話すか選んでくれ。」", {
            fontSize: '11px',
            color: '#ee88ee',
            align: 'center',
            lineSpacing: 4,
            wordWrap: { width: width - 40 },
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        // Menu
        this.createMenu(width, height, state, masterText);

        // Footer
        this.createFooter(width, height, state);

        // Back Button
        const backBtn = this.add.rectangle(width / 2, height - 60, 160, 30, 0x442244).setInteractive();
        backBtn.setStrokeStyle(2, 0x884488);
        this.add.text(width / 2, height - 60, "店を出る", {
            fontSize: '12px', color: '#fff', fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
            this.scene.start('TownScene');
        });
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

    createMenu(width: number, _height: number, state: GameState, masterText: Phaser.GameObjects.Text) {
        const drinks = [
            { name: "合成ビール", price: 50000, pride: 5, desc: "安い味。少しだけ気が紛れる。" },
            { name: "ネオンカクテル", price: 120000, pride: 15, desc: "鮮やかな色。自分を少し肯定できる。" },
            { name: "年代物ウィスキー", price: 300000, pride: 40, desc: "本物の味。俺はまだ終わっていない。" }
        ];

        let currentY = 160;

        drinks.forEach(drink => {
            const btn = this.add.container(width / 2, currentY);
            const canAfford = state.money >= drink.price;

            const bg = this.add.rectangle(0, 0, width - 40, 50, canAfford ? 0x220022 : 0x222222).setInteractive();
            bg.setStrokeStyle(1, canAfford ? 0xff00ff : 0x666666);

            const name = this.add.text(-80, -10, drink.name, {
                fontSize: '12px', color: canAfford ? '#fff' : '#666', fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0, 0.5);

            const price = this.add.text(80, -10, `¥${drink.price}`, {
                fontSize: '12px', color: canAfford ? '#ffff00' : '#666', fontFamily: 'monospace'
            }).setOrigin(1, 0.5);

            const effect = this.add.text(0, 12, `${drink.desc} (Pride +${drink.pride})`, {
                fontSize: '9px', color: '#aaa', fontFamily: 'Rajdhani, sans-serif', align: 'center'
            }).setOrigin(0.5);

            btn.add([bg, name, price, effect]);

            if (canAfford) {
                bg.on('pointerdown', () => {
                    this.orderDrink(drink, state, masterText);
                });
                bg.on('pointerover', () => bg.setStrokeStyle(2, 0xff00ff));
                bg.on('pointerout', () => bg.setStrokeStyle(1, 0xff00ff));
            }

            currentY += 60;
        });

        // Chat Button (Free hints)
        const chatBtn = this.add.container(width / 2, currentY + 10);
        const chatBg = this.add.rectangle(0, 0, width - 40, 40, 0x111133).setInteractive();
        chatBg.setStrokeStyle(1, 0x00ffff);
        const chatText = this.add.text(0, 0, "マスターと話す (Free)", {
            fontSize: '11px', color: '#00ffff'
        }).setOrigin(0.5);
        chatBtn.add([chatBg, chatText]);

        chatBg.on('pointerdown', () => {
            const hints: string[] = DataManager.getUI('town', 'bar_hints') as unknown as string[];
            const hint = Phaser.Utils.Array.GetRandom(hints || ["「...」"]);
            masterText.setText(`マスター「${hint}」`);
            synth.playSelect();
        });
    }

    orderDrink(drink: any, state: GameState, masterHtml: Phaser.GameObjects.Text) {
        state.money -= drink.price;
        state.pride = Math.min(100, state.pride + drink.pride);
        this.registry.set('gameState', state);

        synth.playPowerUp();
        masterHtml.setText(`マスター「${drink.name}だ。ゆっくりやりな。」\n\n(プライドが ${drink.pride} 回復した)`);

        this.createFooter(this.scale.width, this.scale.height, state); // Update UI

        // Re-render menu to update affordability? 
        // For simplicity, we assume player won't spam click too fast to break logic, but ideally we refresh.
        // But since we just want visual feedback mainly:
        this.scene.restart(); // Easiest way to refresh state/colors
    }
}

import Phaser from 'phaser';
import { type GameState, type InventoryItem } from '../types';
import { DataManager } from '../logic/DataManager';
import { resetGame } from '../logic/GameLogic';
import { synth } from '../logic/SoundSynth';

export default class TownScene extends Phaser.Scene {
    // メニューボタン管理用コンテナ
    private menuContainer: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('TownScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;

        // Auto-save on entering town
        localStorage.setItem('labyrinth_save', JSON.stringify(state));

        // --- ゲームオーバー判定 (最優先) ---

        // 1. 人間性チェック
        if (state.humanity <= 0) {
            this.triggerBadEnd('humanity');
            return;
        }

        // 2. プライドチェック
        if (state.pride <= 0) {
            this.triggerBadEnd('pride');
            return;
        }

        // 3. 日数0以下（大家出現イベント）
        if (state.daysLeft <= 0) {
            this.showDeadlineEncounter(width, height);
            return;
        }

        // 4. 初回チュートリアル
        if (!state.isTutorialDone) {
            this.scene.start('RentCheckScene');
            return;
        }

        // --- ここから通常の街描画（メニュー生成） ---

        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        const glow = this.add.circle(width / 2, height / 3, 150, 0xff00ff, 0.1);
        this.tweens.add({
            targets: glow,
            alpha: 0.2,
            scale: 1.2,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });

        // タイトル
        const title = this.add.text(width / 2, 30, DataManager.getUI('town', 'title'), {
            fontSize: '22px',
            color: '#00ffff',
            fontFamily: 'Orbitron, monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        title.setStroke('#ff00ff', 2);
        title.setShadow(0, 0, '#00ffff', 10, true, true);

        // モノローグ
        this.add.rectangle(width / 2, 80, width - 30, 55, 0x000000, 0.7).setStrokeStyle(1, 0x00ffff, 0.5);
        const quote = DataManager.getRandomFlavor('town_quotes') || "...";
        this.add.text(width / 2, 80, quote, {
            fontSize: '10px',
            color: '#cccccc',
            fontStyle: 'italic',
            align: 'center',
            wordWrap: { width: width - 45 },
            lineSpacing: 2
        }).setOrigin(0.5);

        // ステータス表示
        this.createStatusDisplay(width, state);

        // メニュー生成（コンテナに入れて管理）
        this.createMenu(width, state);

        // フッター
        this.createFooter(width, height, state);
    }

    triggerBadEnd(type: 'humanity' | 'pride') {
        const scenarios = type === 'humanity' ? [
            { text: "――人間性が失われた。" },
            { text: "お前は、もはや人間ではない。\n\n感情も、良心も、すべて失った。" },
            { text: "音楽は、ただの「計算」になった。\nリズムは、ただの「数式」になった。" },
            { text: "お前は完璧な演奏をする。\nしかし、誰も感動しない。" },
            { text: "なぜなら、そこに「魂」がないから。" },
            { text: "【BAD END: 虚無の音楽家】" },
            { event: () => resetGame(this) }
        ] : [
            { text: "――プライドが失われた。" },
            { text: "お前は、もはや自分を信じられない。\n\n「俺なんて、どうせ……」" },
            { text: "ボスの名言に、耐えられない。\n批評に、立ち向かえない。" },
            { text: "お前は、ステージに立つ前に\n逃げ出した。" },
            { text: "【BAD END: 敗北者】" },
            { event: () => resetGame(this) }
        ];

        this.scene.start('StoryScene', { scenarioData: scenarios });
    }

    // 大家出現演出（全画面ブラックアウト）
    showDeadlineEncounter(width: number, height: number) {
        if (this.menuContainer) {
            this.menuContainer.destroy();
            this.menuContainer = null;
        }

        this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0)
            .setInteractive()
            .setDepth(9000);

        const title = this.add.text(width / 2, height / 2 - 20, "約束の日が、来た……", {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5).setDepth(9001);
        title.setAlpha(0);

        const subtitle = this.add.text(width / 2, height / 2 + 20, "大家が現れた！", {
            fontSize: '24px',
            color: '#ff0000',
            fontFamily: 'Orbitron, monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(9001);
        subtitle.setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                synth.playBadEnd();
                this.cameras.main.shake(200, 0.01);
                this.tweens.add({
                    targets: subtitle,
                    alpha: 1,
                    duration: 500,
                    ease: 'Bounce.easeOut'
                });
            }
        });

        this.time.delayedCall(3000, () => {
            this.scene.start('RentCheckScene');
        });
    }

    createStatusDisplay(width: number, state: GameState) {
        const statusBg = this.add.rectangle(width / 2, 125, width - 30, 50, 0x000000, 0.8);
        statusBg.setStrokeStyle(1, 0xff00ff, 0.5);

        this.add.text(15, 112, `Lv.${state.level} HP:${state.hp}/${state.maxHp} MP:${state.mp}/${state.maxMp}`, {
            fontSize: '10px', color: '#00ff00', fontFamily: 'monospace'
        });
        this.add.text(15, 125, `EXP:${state.exp}/${state.nextLevelExp} 最深:B${state.maxReachedDepth}F`, {
            fontSize: '9px', color: '#88ff88', fontFamily: 'monospace'
        });
        this.add.text(15, 138, `Humanity:${state.humanity} Pride:${state.pride}`, {
            fontSize: '9px', color: '#ff88ff', fontFamily: 'monospace'
        });
    }

    createMenu(width: number, state: GameState) {
        this.menuContainer = this.add.container(0, 0);
        this.menuContainer.setDepth(200);

        const menuItems = [
            { text: "自宅で休む\n(Rest)", key: 'rest', color: 0x224422, glow: 0x00ff00 },
            { text: "地下迷宮\n(Dungeon)", key: 'DungeonScene', color: 0x882222, glow: 0xff0000 },
            { text: "装備変更\n(Equip)", key: 'equip', color: 0x444488, glow: 0x8888ff },
            { text: "ジャンク屋\n(Shop)", key: 'ShopScene', color: 0x333344, glow: 0x0000ff },
            { text: "鑑定屋\n(Appraisal)", key: 'AppraisalScene', color: 0x444433, glow: 0xffff00 },
            { text: "スクール\n(School)", key: 'SchoolScene', color: 0x224422, glow: 0x00ff00 },
            { text: "セミナー\n(Seminar)", key: 'SeminarScene', color: 0x443311, glow: 0xffaa00 },
            { text: "質屋\n(Pawn)", key: 'PawnShopScene', color: 0x443322, glow: 0xffaa00 },
            { text: "お寺\n(Temple)", key: 'TempleScene', color: 0x442211, glow: 0xff8800 },
            { text: "大家\n(Landlady)", key: 'LandladyScene', color: 0x442222, glow: 0xff8888 },
            { text: "BAR\n(Info)", key: 'BarScene', color: 0x222244, glow: 0x00ffff },
            { text: "家賃\n(Rent)", key: 'RentCheckScene', color: 0x442244, glow: 0xff00ff }
        ];

        menuItems.forEach((item, index) => {
            const y = 190 + Math.floor(index / 2) * 48;
            const x = (index % 2 === 0) ? width / 4 : (width * 3 / 4);

            const btn = this.add.container(x, y);
            const bg = this.add.rectangle(0, 0, 135, 38, item.color).setInteractive();
            bg.setStrokeStyle(2, item.glow, 0.6);

            const text = this.add.text(0, 0, item.text, {
                fontSize: '11px', color: '#ffffff', align: 'center', lineSpacing: 1, fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);

            btn.add([bg, text]);

            this.menuContainer?.add(btn);

            bg.on('pointerover', () => {
                bg.setStrokeStyle(3, item.glow, 1);
                this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 100, ease: 'Power1' });
            });
            bg.on('pointerout', () => {
                bg.setStrokeStyle(2, item.glow, 0.6);
                this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 100, ease: 'Power1' });
            });

            bg.on('pointerdown', () => {
                synth.playSelect();
                this.tweens.add({
                    targets: btn, scaleX: 0.95, scaleY: 0.95, duration: 50, yoyo: true, ease: 'Power2',
                    onComplete: () => {
                        if (item.key === 'rest') {
                            this.rest(state);
                        } else if (item.key === 'equip') {
                            this.showEquipMenu(width, this.scale.height, state);
                        } else if (item.key === 'DungeonScene') {
                            this.showDepthSelector(width, this.scale.height, state);
                        } else {
                            this.scene.start(item.key);
                        }
                    }
                });
            });
        });
    }

    createFooter(width: number, height: number, state: GameState) {
        this.add.rectangle(0, height - 70, width, 70, 0x000000, 1).setOrigin(0).setDepth(150);
        this.add.text(15, height - 50, `¥${state.money}`, {
            fontSize: '15px', color: '#ffff00', fontFamily: 'Orbitron, monospace'
        }).setOrigin(0, 0.5).setDepth(151);

        const daysColor = state.daysLeft <= 7 ? '#ff0000' : '#ff8888';
        this.add.text(width - 15, height - 50, `残り${state.daysLeft}日`, {
            fontSize: '12px', color: daysColor, fontFamily: 'monospace'
        }).setOrigin(1, 0.5).setDepth(151);
    }

    rest(state: GameState) {
        if (state.daysLeft <= 0) {
            this.showDeadlineEncounter(this.scale.width, this.scale.height);
            return;
        }

        state.hp = state.maxHp;
        state.mp = state.maxMp;
        state.daysLeft -= 1;
        this.registry.set('gameState', state);

        synth.playPowerUp();

        const msg = this.add.text(this.scale.width / 2, this.scale.height / 2,
            `自宅で休息した\nHP/MP全回復！\n\n残り${state.daysLeft}日`, {
            fontSize: '15px',
            color: '#00ff00',
            align: 'center',
            backgroundColor: '#000000',
            padding: { x: 20, y: 15 }
        }).setOrigin(0.5).setDepth(500);

        this.time.delayedCall(2000, () => {
            msg.destroy();
            this.scene.restart();
        });
    }

    showDepthSelector(width: number, height: number, state: GameState) {
        const container = this.add.container(width / 2, height / 2);
        container.setDepth(1000);

        const bg = this.add.rectangle(0, 0, width - 30, 300, 0x000000, 0.95);
        bg.setStrokeStyle(2, 0x00ffff, 0.8);

        const title = this.add.text(0, -130, "開始階層を選択", {
            fontSize: '16px', color: '#00ffff', fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        container.add([bg, title]);

        const checkpoints = [];
        for (let i = 1; i <= state.maxReachedDepth; i += 10) {
            checkpoints.push(i);
        }
        if (state.maxReachedDepth % 10 !== 1 && !checkpoints.includes(state.maxReachedDepth)) {
            checkpoints.push(state.maxReachedDepth);
        }

        checkpoints.forEach((depth, idx) => {
            const y = -90 + idx * 42;
            if (y > 110) return;

            const btnBg = this.add.rectangle(0, y, 200, 32, 0x222244).setInteractive();
            btnBg.setStrokeStyle(1, 0x00ffff, 0.5);
            const btnText = this.add.text(0, y, `B${depth}F から開始`, {
                fontSize: '13px', color: '#ffffff', fontFamily: 'Rajdhani, sans-serif'
            }).setOrigin(0.5);

            container.add([btnBg, btnText]);

            btnBg.on('pointerdown', () => {
                state.currentDepth = depth;
                this.registry.set('gameState', state);
                container.destroy();
                this.scene.start('DungeonScene');
            });
        });

        const closeBtn = this.add.text(0, 120, "【キャンセル】", {
            fontSize: '13px', color: '#ff8888', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();
        container.add(closeBtn);
        closeBtn.on('pointerdown', () => container.destroy());
    }

    showEquipMenu(width: number, height: number, state: GameState) {
        const container = this.add.container(0, 0);
        container.setDepth(1000);

        // ★★★修正ポイント：ここで変数を宣言して、以下の全ての関数から見えるようにする
        let isScrolling = false;
        let startY = 0;
        // ★★★★★★★★★★★★★★★★★★★★★

        const bg = this.add.rectangle(width / 2, height / 2, width - 20, height - 40, 0x000000, 0.95).setInteractive(); // 背景もInteractiveにして裏側クリック防止
        bg.setStrokeStyle(2, 0xff00ff, 0.8);

        const title = this.add.text(width / 2, 30, "装備変更", {
            fontSize: '16px', color: '#ff00ff', fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        container.add([bg, title]);

        const currentY = 60;
        const currentTitle = this.add.text(20, currentY, "【現在の装備】", { fontSize: '12px', color: '#ffff00' });
        const weaponText = this.add.text(20, currentY + 18, `武器: ${state.equippedWeapon ? `${state.equippedWeapon.name} (+${state.equippedWeapon.power})` : 'なし'}`, {
            fontSize: '10px', color: '#ffffff', wordWrap: { width: width - 45 }
        });
        const armorText = this.add.text(20, currentY + 32, `防具: ${state.equippedAccessory ? `${state.equippedAccessory.name} (+${state.equippedAccessory.power})` : 'なし'}`, {
            fontSize: '10px', color: '#ffffff', wordWrap: { width: width - 45 }
        });

        container.add([currentTitle, weaponText, armorText]);

        const listY = 120;
        const listContainer = this.add.container(0, listY);
        let currentListY = 0;

        const equippableItems = state.inventory.filter(i => i.isEquippable && i.isIdentified);

        if (equippableItems.length === 0) {
            const noItemText = this.add.text(width / 2, listY + 40, "装備可能なアイテムがありません", {
                fontSize: '11px', color: '#888888'
            }).setOrigin(0.5);
            container.add(noItemText);
        } else {
            const groupItems = (items: InventoryItem[]) => {
                const grouped: { [key: string]: { count: number, item: InventoryItem } } = {};
                items.forEach(i => {
                    const key = i.name + i.power;
                    if (!grouped[key]) {
                        grouped[key] = { count: 0, item: i };
                    }
                    grouped[key].count++;
                });
                return Object.values(grouped);
            };

            const weapons = groupItems(equippableItems.filter(i => i.type === 'weapon'));
            const armors = groupItems(equippableItems.filter(i => i.type === 'accessory'));

            const createCategorySection = (catTitle: string, items: { count: number, item: InventoryItem }[]) => {
                const catHeader = this.add.text(20, currentListY, catTitle, { fontSize: '12px', color: '#00ff00' });
                listContainer.add(catHeader);
                currentListY += 25;

                if (items.length === 0) {
                    const empty = this.add.text(40, currentListY, "(なし)", { fontSize: '10px', color: '#666' });
                    listContainer.add(empty);
                    currentListY += 20;
                }

                items.forEach(group => {
                    const item = group.item;
                    const count = group.count;
                    const isEquipped = item.isEquipped;

                    const itemBg = this.add.rectangle(width / 2, currentListY + 16, width - 50, 30, 0x222244).setInteractive();
                    itemBg.setStrokeStyle(1, 0x8888ff, 0.5);

                    const nameDisplay = count > 1 ? `${item.name} x${count}` : item.name;
                    const statusVal = item.type === 'weapon' ? `ATK+${item.power}` : `DEF+${item.power}`;

                    const itemText = this.add.text(30, currentListY + 16, `${nameDisplay}\n${statusVal}`, {
                        fontSize: '10px', color: isEquipped ? '#ffff00' : '#ffffff', lineSpacing: 1, wordWrap: { width: width - 110 }
                    }).setOrigin(0, 0.5);

                    listContainer.add([itemBg, itemText]);

                    itemBg.on('pointerup', () => {
                        // 上で宣言した変数をここで使う
                        if (!isScrolling) {
                            this.equipItem(item, state);
                            // スクロールイベントを解除してから再描画
                            this.input.off('pointermove');
                            this.input.off('pointerdown');
                            this.input.off('pointerup');
                            this.input.off('wheel');
                            container.destroy();
                            this.showEquipMenu(width, height, state);
                        }
                    });

                    currentListY += 38;
                });
                currentListY += 15;
            };

            createCategorySection("【武器】", weapons);
            createCategorySection("【防具】", armors);

            container.add(listContainer);

            // --- Scroll Logic (Mouse Wheel & Touch) ---
            const maxScroll = Math.max(0, currentListY - (height - 200));
            let scrollY = 0;

            // Mouse Wheel
            if (maxScroll > 0) {
                this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
                    scrollY += deltaY * 0.5;
                    scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
                    listContainer.y = listY - scrollY;
                });

                // Touch Scroll

                // 画面全体でタッチイベントを拾う
                this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    startY = pointer.y;
                    isScrolling = false;
                });

                this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                    if (pointer.isDown) {
                        const deltaY = startY - pointer.y;

                        // 少しでも動いたらスクロールとみなす（誤タップ防止）
                        if (Math.abs(deltaY) > 5) {
                            isScrolling = true;
                        }

                        if (isScrolling) {
                            scrollY += deltaY;
                            scrollY = Phaser.Math.Clamp(scrollY, 0, maxScroll);
                            listContainer.y = listY - scrollY;
                            startY = pointer.y;
                        }
                    }
                });

                this.input.on('pointerup', () => {
                    // 遅延させてフラグを戻す
                    setTimeout(() => { isScrolling = false; }, 50);
                });
            }
        }

        const closeBtn = this.add.text(width / 2, height - 45, "【閉じる】", {
            fontSize: '13px', color: '#00ffff', fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        container.add(closeBtn);
        closeBtn.on('pointerdown', () => {
            // イベントリスナーの解除
            this.input.off('pointermove');
            this.input.off('pointerdown');
            this.input.off('pointerup');
            this.input.off('wheel');
            container.destroy();
        });
    }

    equipItem(item: InventoryItem, state: GameState) {
        if (item.type === 'weapon') {
            if (state.equippedWeapon) state.equippedWeapon.isEquipped = false;
            state.inventory.forEach(i => {
                if (i.type === 'weapon' && i.isEquipped) i.isEquipped = false;
            });
            state.equippedWeapon = item;
            item.isEquipped = true;
        } else if (item.type === 'accessory') {
            if (state.equippedAccessory) state.equippedAccessory.isEquipped = false;
            state.inventory.forEach(i => {
                if (i.type === 'accessory' && i.isEquipped) i.isEquipped = false;
            });
            state.equippedAccessory = item;
            item.isEquipped = true;
        }
        this.registry.set('gameState', state);
        synth.playPowerUp();
    }
}
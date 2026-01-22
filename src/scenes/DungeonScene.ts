import Phaser from 'phaser';
import { type GameState, type InventoryItem } from '../types';
import { ItemGenerator, Calculator, resetGame } from '../logic/GameLogic';
import { DataManager } from '../logic/DataManager';
import { synth } from '../logic/SoundSynth';

export default class DungeonScene extends Phaser.Scene {
    private logText: Phaser.GameObjects.Text | null = null;
    private statusText: Phaser.GameObjects.Text | null = null;
    private depthText: Phaser.GameObjects.Text | null = null;
    private moneyText: Phaser.GameObjects.Text | null = null;
    private daysText: Phaser.GameObjects.Text | null = null;
    private clickArea: Phaser.GameObjects.Rectangle | null = null;
    private enemyContainer: Phaser.GameObjects.Container | null = null;
    private isBattling: boolean = false;
    private battleTimer: Phaser.Time.TimerEvent | null = null;
    private skillBtn: Phaser.GameObjects.Container | null = null;
    private isEnemyStunned: boolean = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private currentEnemy: any = null;
    private explorationCount: number = 0;

    constructor() {
        super('DungeonScene');
    }

    preload() {
        const enemyIds = [
            'enm_metronome', 'enm_vocal_lat', 'enm_drunk', 'enm_bassist', 'enm_student',
            'enm_deadline', 'enm_feedback', 'enm_gear_nerd', 'enm_neighbor', 'enm_pa',
            'enm_jasrac', 'enm_jazz_police', 'enm_rival', 'enm_pitch_perfect', 'enm_job',
            'enm_vintage_police', 'enm_reseller', 'enm_ex', 'enm_quota', 'enm_manager_drunk',
            'enm_boss_silence', 'enm_boss_breakup'
        ];

        enemyIds.forEach(id => {
            this.load.image(id, `assets/${id}.png`);
        });
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;
        this.explorationCount = 0;

        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        const glow = this.add.circle(width / 2, height / 2, 100, 0xff0000, 0.1);
        this.tweens.add({
            targets: glow,
            alpha: 0.15,
            scale: 1.3,
            duration: 3000,
            yoyo: true,
            repeat: -1
        });

        // ヘッダー（動的更新用にプロパティに保存）
        this.depthText = this.add.text(20, 15, `B${state.currentDepth}F`, {
            font: '16px Orbitron',
            color: '#ff00ff'
        });
        this.depthText.setStroke('#ff00ff', 1);
        this.depthText.setShadow(0, 0, '#ff00ff', 5);

        this.statusText = this.add.text(width - 15, 15, "", {
            font: '11px monospace',
            color: '#00ff00',
            align: 'right'
        }).setOrigin(1, 0);
        this.updateStatusDisplay(state);

        const logBg = this.add.rectangle(width / 2, 95, width - 20, 110, 0x000033, 0.7);
        logBg.setStrokeStyle(1, 0x00ffff, 0.5);

        this.logText = this.add.text(15, 50, "ダンジョンに潜入した...", {
            fontSize: '11px',
            color: '#ccccff',
            wordWrap: { width: width - 30 },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 3
        });

        this.clickArea = this.add.rectangle(width / 2, height / 2 + 50, 160, 160, 0x222222).setInteractive();
        this.clickArea.setStrokeStyle(3, 0x00ffff, 0.6);

        this.add.text(width / 2, height / 2 + 50, "進む\n(TAP)", {
            fontSize: '18px',
            align: 'center',
            color: '#00ffff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        this.clickArea.on('pointerdown', () => {
            if (this.isBattling) {
                this.attack();
            } else {
                this.explore(state);
            }
            this.tweens.add({ targets: this.clickArea, alpha: 0.5, duration: 50, yoyo: true });
        });

        this.skillBtn = this.add.container(width - 60, height / 2 + 50);
        const sBg = this.add.circle(0, 0, 30, 0x880088).setInteractive();
        sBg.setStrokeStyle(2, 0xff00ff, 0.6);
        const sTxt = this.add.text(0, 0, "スキル", { fontSize: '10px', fontFamily: 'monospace' }).setOrigin(0.5);
        this.skillBtn.add([sBg, sTxt]);
        this.skillBtn.setVisible(false);

        sBg.on('pointerdown', () => this.openSkillMenu(state));

        const backBtn = this.add.rectangle(width / 2, height - 60, 160, 30, 0x440000).setInteractive();
        backBtn.setStrokeStyle(2, 0xff0000, 0.6);
        this.add.text(width / 2, height - 60, "街へ戻る", {
            fontSize: '14px',
            color: '#ff8888',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        backBtn.on('pointerdown', () => {
            if (this.isBattling) {
                this.log("戦闘中は逃げられない！");
                synth.playCancel();
            } else {
                this.scene.start('TownScene');
            }
        });

        // 常にスキルボタンを表示（スキル習得時）
        if (state.skills && state.skills.length > 0) {
            this.skillBtn.setVisible(true);
        }

        this.enemyContainer = this.add.container(width / 2, height / 2 - 70);
        this.enemyContainer.setVisible(false);

        // ダンジョン内フッター
        this.add.rectangle(0, height - 70, width, 70, 0x000000, 0.9).setOrigin(0);
        this.moneyText = this.add.text(15, height - 50, `¥${state.money}`, {
            fontSize: '15px',
            color: '#ffff00',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0, 0.5);

        const daysColor = state.daysLeft <= 7 ? '#ff0000' : '#ff8888';
        this.daysText = this.add.text(width - 15, height - 50, `残り${state.daysLeft}日`, {
            fontSize: '12px',
            color: daysColor,
            fontFamily: 'monospace'
        }).setOrigin(1, 0.5);
    }



    updateStatusDisplay(state: GameState) {
        if (!this.scene.isActive()) return;

        if (this.statusText && this.statusText.active) {
            this.statusText.setText(`Lv.${state.level}\nHP:${state.hp}/${state.maxHp}  MP:${state.mp}/${state.maxMp}`);
        }
        if (this.depthText && this.depthText.active) {
            this.depthText.setText(`B${state.currentDepth}F (${(state.explorationProgress || 0)}/3)`);
        }
        if (this.moneyText && this.moneyText.active) {
            this.moneyText.setText(`¥${state.money}`);
        }
        if (this.daysText && this.daysText.active) {
            this.daysText.setText(`残り${state.daysLeft}日`);
            this.daysText.setColor(state.daysLeft <= 7 ? '#ff0000' : '#ff8888');
        }
    }

    log(msg: string) {
        if (this.logText) {
            let currentLog = this.logText.text.split('\n');
            currentLog.push(msg);
            if (currentLog.length > 4) currentLog.shift();
            this.logText.setText(currentLog.join('\n'));
        }
    }

    explore(state: GameState) {
        const isBossFloor = (state.currentDepth % 10 === 0) && !state.defeatedBosses.includes(state.currentDepth);

        if (isBossFloor) {
            this.log(`--- ボスフロア B${state.currentDepth}F ---`);
            this.log("強大な気配が道を塞いでいる...");
            this.encounter(true);
            return;
        }

        // 3回タップで1階層進む
        state.explorationProgress = (state.explorationProgress || 0) + 1;
        this.explorationCount++;

        // 時間経過
        if (this.explorationCount % 10 === 0) {
            state.daysLeft -= 1;
            this.log(`1日が経過... (残り${state.daysLeft}日)`);
        }

        if (state.explorationProgress >= 3) {
            // 次の階層へ
            state.explorationProgress = 0;
            state.currentDepth++;
            this.log(`階段を降りた... (B${state.currentDepth}F)`);
            synth.playSelect();

            if (state.currentDepth > state.maxReachedDepth) {
                state.maxReachedDepth = state.currentDepth;
            }

            if (state.currentDepth >= 99) {
                this.triggerEndGame();
                return;
            }

            // 新しい階層がボスフロアかチェック
            const nextIsBoss = (state.currentDepth % 10 === 0) && !state.defeatedBosses.includes(state.currentDepth);
            if (nextIsBoss) {
                this.log(`殺気を感じる... (Boss Floor)`);
            }
        } else {
            this.log(`迷宮を進む... (${state.explorationProgress}/3)`);
        }

        this.updateStatusDisplay(state);
        this.registry.set('gameState', state);

        // ランダムイベント
        if (state.explorationProgress === 0) {
            return;
        }

        const rand = Math.random();
        if (rand < 0.35) { // 35% Item Drop
            const item = ItemGenerator.generate();
            state.inventory.push(item);

            const categoryNames: { [key: string]: string } = {
                'weapon': '武器',
                'accessory': 'アクセサリー',
                'trash': 'ガラクタ',
                'book': '本',
                'memory': '思い出'
            };
            const catName = categoryNames[item.type] || '何か';

            this.log(`${catName}を拾った...`);
            synth.playCoin();
        } else if (rand < 0.6) { // 25% Flavor
            const texts = ["足音が響く...", "遠くで音が聞こえる...", "湿気が酷い...", "壁に落書きがある..."];
            this.log(Phaser.Utils.Array.GetRandom(texts));
        } else { // 40% Battle
            this.encounter(false);
        }
    }

    // ... 

    encounter(isBoss: boolean = false) {
        this.isBattling = true;
        this.isEnemyStunned = false;
        const state = this.registry.get('gameState') as GameState;

        if (state.skills && state.skills.length > 0) {
            this.skillBtn?.setVisible(true);
        }

        const baseEnemy = DataManager.getRandomEnemy(state.currentDepth, isBoss);
        this.currentEnemy = { ...baseEnemy };

        const stats = Calculator.calculateEnemyStats(baseEnemy, state, isBoss);
        this.currentEnemy.atk = stats.atk;
        this.currentEnemy.hp = stats.hp;
        // logic for flavor/name remains


        this.log(`『${this.currentEnemy.name}』が現れた！`);
        this.log(this.currentEnemy.flavor || "不吉な気配...");
        synth.playBadEnd();

        this.enemyContainer?.removeAll(true);

        // Try to create image if texture exists, otherwise fallback to rect
        let enemyVisual;
        if (this.textures.exists(this.currentEnemy.id)) {
            enemyVisual = this.add.image(0, 0, this.currentEnemy.id);
            // Limit size to box
            const maxDim = 160;
            if (enemyVisual.width > maxDim || enemyVisual.height > maxDim) {
                const scale = maxDim / Math.max(enemyVisual.width, enemyVisual.height);
                enemyVisual.setScale(scale);
            }
        } else {
            // Fallback placeholder
            enemyVisual = this.add.rectangle(0, 0, 80, 80, isBoss ? 0xff0000 : 0xff4444);
            (enemyVisual as Phaser.GameObjects.Rectangle).setStrokeStyle(2, isBoss ? 0xffff00 : 0xff00ff, 0.8);
        }

        const enemyName = this.add.text(0, -90, this.currentEnemy.name, { // Moved text up
            fontSize: isBoss ? '14px' : '13px',
            color: isBoss ? '#ffff00' : '#fff',
            backgroundColor: '#000',
            fontFamily: 'Rajdhani, sans-serif',
            padding: { x: 4, y: 2 },
            wordWrap: { width: 150 }
        }).setOrigin(0.5);

        const enemyHp = this.add.text(0, 90, `HP:${this.currentEnemy.hp}`, { // Moved text down
            fontSize: '11px',
            color: '#ff8888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.enemyContainer?.add([enemyVisual, enemyName, enemyHp]);
        this.enemyContainer?.setVisible(true);

        this.battleTimer = this.time.addEvent({
            delay: 600, // Faster attacks
            callback: () => {
                this.enemyTurn(state);
            },
            loop: true,
            startAt: 500 // Start attacking sooner
        });
    }

    enemyTurn(state: GameState) {
        if (this.isEnemyStunned) {
            this.log("敵は混乱している！");
            this.isEnemyStunned = false;
            return;
        }

        synth.playType();
        if (Math.random() < 0.7) {
            const def = state.baseDef + (state.equippedAccessory ? state.equippedAccessory.power : 0);
            const rawDmg = this.currentEnemy.atk - def;
            // Minimum damage guarantee: 10% of enemy ATK or 1
            const minDmg = Math.max(1, Math.floor(this.currentEnemy.atk * 0.1));
            const dmg = Math.max(minDmg, rawDmg);
            state.hp -= dmg;
            this.log(`${this.currentEnemy.name}の攻撃! ${dmg}dmg!`);
            this.updateStatusDisplay(state);
            this.cameras.main.shake(100, 0.01);

            if (state.hp <= 0) {
                this.battleDefeat();
            }
        }
    }

    openSkillMenu(state: GameState) {
        if (this.battleTimer) this.battleTimer.paused = true;

        const modal = this.add.container(0, 0);
        const bg = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 280, 340, 0x000000, 0.95).setInteractive();
        bg.setStrokeStyle(2, 0xff00ff, 0.8);

        const title = this.add.text(this.scale.width / 2, 60, "スキル選択", {
            fontSize: '16px',
            color: '#ff00ff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        modal.add([bg, title]);

        const skills = state.skills || [];

        if (skills.length === 0) {
            const txt = this.add.text(this.scale.width / 2, 160, "習得スキルなし", {
                color: '#888',
                fontFamily: 'monospace'
            }).setOrigin(0.5);
            modal.add(txt);
        }

        skills.forEach((sId, idx) => {
            const skillData = DataManager.skills.find(sk => sk.id === sId);
            const skillName = skillData ? skillData.name : sId;
            const mpCost = skillData ? (skillData.mp_cost || 0) : 0;
            const canAfford = state.mp >= mpCost;

            const y = 100 + idx * 40;

            if (y > 300) return;

            const btnColor = canAfford ? 0x442288 : 0x333333;
            const btn = this.add.rectangle(this.scale.width / 2, y, 240, 35, btnColor).setInteractive();
            btn.setStrokeStyle(1, canAfford ? 0xff00ff : 0x666666, 0.5);

            const txt = this.add.text(this.scale.width / 2, y, `${skillName} (MP:${mpCost})`, {
                fontSize: '11px',
                color: canAfford ? '#fff' : '#666',
                fontFamily: 'Rajdhani, sans-serif',
                wordWrap: { width: 220 }
            }).setOrigin(0.5);

            modal.add([btn, txt]);

            if (canAfford) {
                let isSkillClicked = false;
                btn.on('pointerdown', () => {
                    if (isSkillClicked) return;
                    isSkillClicked = true;
                    btn.disableInteractive();
                    this.useSkill(sId, mpCost, state);
                    modal.destroy();
                    if (this.battleTimer) this.battleTimer.paused = false;
                });
            }
        });

        const closeBtn = this.add.rectangle(this.scale.width / 2, 320, 90, 25, 0x444444).setInteractive();
        closeBtn.setStrokeStyle(1, 0x00ffff, 0.5);
        const closeTxt = this.add.text(this.scale.width / 2, 320, "閉じる", {
            fontSize: '12px',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
        modal.add([closeBtn, closeTxt]);

        closeBtn.on('pointerdown', () => {
            modal.destroy();
            if (this.battleTimer) this.battleTimer.paused = false;
        });
    }

    useSkill(skillId: string, cost: number, state: GameState) {
        state.mp -= cost;
        this.updateStatusDisplay(state);
        synth.playPowerUp();

        const skillData = DataManager.skills.find(sk => sk.id === skillId);

        // 回復スキルなど（移動中も使用可）
        if (skillId === 'skl_monitor_check') {
            const heal = Math.floor(state.maxHp * 0.3);
            state.hp = Math.min(state.maxHp, state.hp + heal);
            this.log(`中音確認! HP ${heal} 回復!`);
            this.updateStatusDisplay(state);
            return;
        }

        // 戦闘中でなくても使用可能にする
        if (!this.isBattling) {
            // 非戦闘時のスキル使用
            // 非戦闘時のスキル使用
            // バフや回復、その他のスキルも使用可能にする
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (skillData?.effect_type === 'buff' || skillData?.effect_type === 'heal' || (skillData as any)?.effect_type === 'special' || skillId === 'skl_monitor_check') {
                if (skillId === 'skl_monitor_check') {
                    // already handled above
                } else {
                    const sName = skillData ? skillData.name : skillId;
                    this.log(`${sName} を唱えた！`);
                    // Actually apply effect if it's simple
                    if (skillData?.effect_type === 'heal') {
                        // Generic heal logic if we add more heal skills
                        const heal = Math.floor(state.maxHp * 0.3);
                        state.hp = Math.min(state.maxHp, state.hp + heal);
                        this.log(`HPが回復した！`);
                        this.updateStatusDisplay(state);
                    }
                }
            } else {
                this.log("今は使う必要がない");
                state.mp += cost; // MP返還
                this.updateStatusDisplay(state);
                return;
            }
        }

        // 戦闘・攻撃スキル
        if (skillId === 'skl_counter_q') {
            this.log("「その質問の定義は？」");
            this.isEnemyStunned = true;
        } else if (skillId === 'skl_deconstruction') {
            this.log("「俺たちは宇宙だ」");
            this.attack(2.5);
        } else if (skillData?.effect_type === 'damage') {
            const mult = 1 + ((skillData.effect_value || 50) / 100);
            this.attack(mult);
        } else {
            this.log(`${skillId} 使用!`);
            this.attack(1.5);
        }
    }

    attack(multiplier: number = 1.0) {
        synth.playHit();

        const state = this.registry.get('gameState') as GameState;

        let totalAtk = state.baseAtk;
        if (state.equippedWeapon) totalAtk += state.equippedWeapon.power;

        let dmg = Math.floor(totalAtk * multiplier * (Math.random() * 0.4 + 0.8));
        dmg = Math.max(1, dmg);

        this.log(`攻撃! ${dmg}ダメージ!`);
        this.currentEnemy.hp -= dmg;

        if (this.enemyContainer) {
            const hpText = this.enemyContainer.list[2] as Phaser.GameObjects.Text;
            if (hpText) {
                hpText.setText(`HP:${Math.max(0, this.currentEnemy.hp)}`);
            }
        }

        if (this.currentEnemy.hp <= 0) {
            this.winBattle();
        }
    }

    winBattle() {
        if (this.battleTimer) {
            this.battleTimer.remove();
            this.battleTimer = null;
        }
        this.isBattling = false;
        this.enemyContainer?.setVisible(false);

        // Keep skill button visible if skills exist
        const state = this.registry.get('gameState') as GameState;
        if (state.skills && state.skills.length > 0) {
            this.skillBtn?.setVisible(true);
        } else {
            this.skillBtn?.setVisible(false);
        }

        if (this.currentEnemy.isBoss || (state.currentDepth % 10 === 0)) {
            if (!state.defeatedBosses.includes(state.currentDepth)) {
                state.defeatedBosses.push(state.currentDepth);
                this.log("ボス撃破！");
            }
        }

        const money = Math.floor(Math.random() * 500) + 100;
        state.money += money;

        const baseExp = this.currentEnemy.exp || 10;
        // 深層階ボーナス
        const depthExpBonus = 1 + (state.currentDepth * 0.05); // 1階につき5%アップ
        const expGain = Math.floor(baseExp * depthExpBonus * 5); // EXP 5倍

        state.exp += expGain;
        this.log(`¥${money} と ${expGain}EXP獲得!`);

        // 思い出の獲得（15%の確率）
        if (Math.random() < 0.15) {
            const memoriesData = DataManager.memories?.memories || [];
            if (memoriesData.length > 0) {
                const randomMemory = memoriesData[Math.floor(Math.random() * memoriesData.length)];

                // すでに持っていない思い出のみ獲得
                const alreadyHas = state.inventory.some(item =>
                    item.type === 'memory' && item.memoryType === randomMemory.id
                );

                if (!alreadyHas) {
                    const memoryItem: InventoryItem = {
                        id: `memory_${randomMemory.id}_${Date.now()}`,
                        type: 'memory',
                        name: randomMemory.name,
                        fullName: randomMemory.name,
                        price: randomMemory.price,
                        power: 0,
                        isIdentified: true,
                        memoryType: randomMemory.id as any,
                        memoryData: randomMemory
                    };

                    state.inventory.push(memoryItem);
                    this.log(`思い出『${randomMemory.name}』を思い出した...`);
                    this.log(randomMemory.flavorText);
                }
            }
        }

        if (state.exp >= state.nextLevelExp) {
            state.level++;
            state.exp -= state.nextLevelExp;
            // Leveling eased significantly: Linear growth for rapid leveling
            state.nextLevelExp = state.nextLevelExp + 50;
            state.maxHp += 15; // HP boost increased
            state.maxMp += 8; // MP boost increased
            state.hp = state.maxHp;
            state.mp = state.maxMp;
            state.baseAtk += 3; // ATK boost increased
            state.baseDef += 2; // DEF boost increased
            this.log(`LEVEL UP! Lv.${state.level}`);
            synth.playPowerUp();
        }

        this.updateStatusDisplay(state);
        this.registry.set('gameState', state);
        synth.playPowerUp();
    }

    battleDefeat() {
        // タイマー停止
        if (this.battleTimer) {
            this.battleTimer.remove();
            this.battleTimer = null;
        }
        this.isBattling = false;
        this.enemyContainer?.setVisible(false);
        this.skillBtn?.setVisible(false);

        // サウンド
        synth.playBadEnd();

        // ログは残す
        this.log("倒れた...");

        // ペナルティ計算
        const state = this.registry.get('gameState') as GameState;
        state.hp = Math.floor(state.maxHp * 0.3); // 復活時のHP
        state.currentDepth = Math.max(1, state.currentDepth - 5); // 階層巻き戻り

        const prideLoss = Math.floor(Math.random() * 3) + 1;
        state.pride = Math.max(0, state.pride - prideLoss);
        this.log(`プライドが ${prideLoss} 傷ついた...`);

        this.registry.set('gameState', state);

        // --- 敗北モーダルを表示 ---
        const { width, height } = this.scale;

        // 1. 暗転用オーバーレイ (操作ブロック)
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0)
            .setInteractive(); // クリックを吸い取る
        overlay.setDepth(3000);

        // 2. モーダルコンテナ
        const container = this.add.container(width / 2, height / 2);
        container.setDepth(3001);

        // ボックス背景
        const bg = this.add.rectangle(0, 0, 240, 160, 0x1a0000);
        bg.setStrokeStyle(2, 0xff0000);

        // メインテキスト
        const title = this.add.text(0, -30, "負けた、、、", {
            fontSize: '24px',
            color: '#ff0000',
            fontFamily: 'Orbitron, monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // サブテキスト
        const sub = this.add.text(0, 10, "階層が戻されました。", {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        // OKボタン
        const okBtn = this.add.rectangle(0, 50, 120, 40, 0x440000).setInteractive();
        okBtn.setStrokeStyle(1, 0xff4444);

        const okText = this.add.text(0, 50, "OK", {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        container.add([bg, title, sub, okBtn, okText]);

        // ボタンの挙動
        okBtn.on('pointerover', () => okBtn.setStrokeStyle(2, 0xff0000));
        okBtn.on('pointerout', () => okBtn.setStrokeStyle(1, 0xff4444));

        okBtn.on('pointerdown', () => {
            synth.playCancel(); // キャンセル音でリセット感を演出
            this.scene.start('TownScene'); // 街へ戻る
        });
    }

    triggerEndGame() {
        const state = this.registry.get('gameState') as GameState;
        let scenarioData;

        if (state.humanity > 70) {
            // Good End (High Humanity)
            scenarioData = [
                { text: "地下99階。最深部。" },
                { text: "そこに待っていたのは、伝説のギター『Deep Blue』。" },
                { text: "お前はそれを手に取った。" },
                { text: "爪弾くと、澄んだ音が響く。" },
                { text: "お前は思い出す。音楽を始めた頃の純粋な喜びを。" },
                { text: "借金を返し、お前は街を出た。" },
                { text: "【TRUE END: 魂の共鳴】" },
                { event: () => resetGame(this) }
            ];
        } else if (state.humanity > 30) {
            // Normal End (Mid Humanity)
            scenarioData = [
                { text: "地下99階。最深部。" },
                { text: "そこに、伝説のギター『Deep Blue』はあった。" },
                { text: "しかし、今の汚れたお前の手では、\n期待した音は鳴らなかった。" },
                { text: "お前はそれを売り払い、借金を返した。" },
                { text: "平凡な日常が、また始まる。" },
                { text: "【NORMAL END: 退屈な日々】" },
                { event: () => resetGame(this) }
            ];
        } else {
            // Bad End (Low Humanity)
            scenarioData = [
                { text: "地下99階。最深部。" },
                { text: "『Deep Blue』を手に入れた。" },
                { text: "お前は笑う。これで一生遊んで暮らせる。" },
                { text: "音楽？ どうでもいい。" },
                { text: "金こそが、真実だ。" },
                { text: "お前は富豪になったが、\n二度と楽器に触れることはなかった。" },
                { text: "【BAD END: 黄金の豚】" },
                { event: () => resetGame(this) }
            ];
        }

        this.scene.start('StoryScene', {
            scenarioData: scenarioData
        });
    }
}
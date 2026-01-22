import Phaser from 'phaser';
import { type GameState } from '../types';
import { DataManager } from '../logic/DataManager';
import { synth } from '../logic/SoundSynth';

export default class SchoolScene extends Phaser.Scene {
    private footerContainer: Phaser.GameObjects.Container | null = null;
    private listContainer: Phaser.GameObjects.Container | null = null;

    // Scroll Variables
    private isScrolling: boolean = false;
    private startY: number = 0;
    private listStartY: number = 150;
    private maxScroll: number = 0;

    constructor() {
        super('SchoolScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;
        const schoolData = DataManager.school;

        this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

        this.add.text(width / 2, 30, schoolData.title || "公共職業訓練センター", {
            fontSize: '16px',
            color: '#00ffff',
            fontFamily: 'Orbitron, monospace',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(width / 2, 60, schoolData.subtitle || "どのコースを受講する？", {
            fontSize: '12px',
            color: '#aaaaaa',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        const teacherDialogueRaw = Phaser.Utils.Array.GetRandom(schoolData.teacher_dialogues || ["..."]);
        const teacherDialogue = String(teacherDialogueRaw || "...");
        const dialogueBg = this.add.rectangle(width / 2, 100, width - 30, 50, 0x000000, 0.7);
        dialogueBg.setStrokeStyle(1, 0x00ffff, 0.5);
        this.add.text(width / 2, 100, teacherDialogue, {
            fontSize: '10px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: width - 45 },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 2
        }).setOrigin(0.5);

        // Scroll Input
        this.setupScrollInput();

        // Create List Container
        this.listContainer = this.add.container(0, this.listStartY);

        const courses = schoolData.courses || [];
        let currentY = 0;

        courses.forEach((course: any) => {
            const meetsRequirements = this.checkRequirements(course.requirements, state);
            const canAfford = state.money >= course.cost;
            const alreadyLearned = course.rewards && course.rewards.skill && state.skills.includes(course.rewards.skill);
            const isAvailable = meetsRequirements && canAfford && !alreadyLearned;

            const container = this.add.container(width / 2, currentY);
            const bg = this.add.rectangle(0, 0, width - 30, 65, isAvailable ? 0x222244 : 0x333333);
            if (isAvailable) {
                bg.setInteractive();
            }
            bg.setStrokeStyle(2, isAvailable ? 0x8888ff : 0x666666, 0.6);

            const nameText = this.add.text(0, -20, course.name, {
                fontSize: '12px',
                color: isAvailable ? '#ffff00' : '#888888',
                fontFamily: 'Rajdhani, sans-serif',
                align: 'center'
            }).setOrigin(0.5);

            let descTextContent = course.description;
            if (alreadyLearned) {
                descTextContent = "（受講済み）";
            } else if (!meetsRequirements) {
                descTextContent = "（条件不足）";
            }

            const descText = this.add.text(0, 5, descTextContent, {
                fontSize: '8px',
                color: isAvailable ? '#ffffff' : '#666666',
                fontFamily: 'Rajdhani, sans-serif',
                align: 'center',
                wordWrap: { width: width - 50 },
                lineSpacing: 2
            }).setOrigin(0.5);

            const costText = this.add.text(0, 25, `費用: ¥${course.cost}`, {
                fontSize: '9px',
                color: canAfford ? '#00ff00' : '#ff0000',
                fontFamily: 'monospace'
            }).setOrigin(0.5);

            container.add([bg, nameText, descText, costText]);

            if (isAvailable) {
                bg.on('pointerover', () => bg.setStrokeStyle(3, 0x8888ff, 1));
                bg.on('pointerout', () => bg.setStrokeStyle(2, 0x8888ff, 0.6));

                // Click (pointerup with scroll guard)
                bg.on('pointerup', () => {
                    if (!this.isScrolling) this.takeCourse(course, state);
                });
            }

            this.listContainer?.add(container);
            currentY += 75;
        });

        // Max Scroll
        this.maxScroll = Math.max(0, currentY - (height - 250));

        // Return Button
        const backBtn = this.add.rectangle(width / 2, height - 60, 160, 30, 0x444444).setInteractive();
        backBtn.setStrokeStyle(2, 0x666666);
        this.add.text(width / 2, height - 60, "街へ戻る", {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        backBtn.on('pointerup', () => {
            if (!this.isScrolling) this.scene.start('TownScene');
        });

        this.createFooter(width, height, state);
    }

    setupScrollInput() {
        this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
            if (!this.listContainer) return;
            const newY = Phaser.Math.Clamp(this.listContainer.y - deltaY * 0.5, this.listStartY - this.maxScroll, this.listStartY);
            this.listContainer.y = newY;
        });

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

    checkRequirements(requirements: any, state: GameState): boolean {
        if (!requirements) return true;
        if (requirements.level && state.level < requirements.level) return false;
        if (requirements.bluffLevel && state.bluffLevel < requirements.bluffLevel) return false;
        return true;
    }

    takeCourse(course: any, state: GameState) {
        state.money -= course.cost;
        if (course.rewards) {
            if (course.rewards.baseAtk) state.baseAtk += course.rewards.baseAtk;
            if (course.rewards.baseDef) state.baseDef += course.rewards.baseDef;
            if (course.rewards.bluffLevel) state.bluffLevel += course.rewards.bluffLevel;
            if (course.rewards.humanity) state.humanity += course.rewards.humanity;
            if (course.rewards.skill && !state.skills.includes(course.rewards.skill)) {
                state.skills.push(course.rewards.skill);
            }
        }
        this.registry.set('gameState', state);
        synth.playPowerUp();
        this.createFooter(this.scale.width, this.scale.height, state);

        const completionMsgRaw = Phaser.Utils.Array.GetRandom(DataManager.school.completion_messages || ["講座を修了した！"]);
        const completionMsg = String(completionMsgRaw || "講座を修了した！");

        const msgBox = this.add.container(this.scale.width / 2, this.scale.height / 2);
        const msgBg = this.add.rectangle(0, 0, this.scale.width - 40, 150, 0x000000, 0.95);
        msgBg.setStrokeStyle(2, 0x00ff00, 0.8);

        const msgText = this.add.text(0, -20, completionMsg, {
            fontSize: '13px',
            color: '#00ff00',
            align: 'center',
            wordWrap: { width: this.scale.width - 60 },
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        const detailText = this.add.text(0, 20, `『${course.name}』を修了！`, {
            fontSize: '11px',
            color: '#ffffff',
            align: 'center',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        const closeBtn = this.add.text(0, 55, "【閉じる】", {
            fontSize: '12px',
            color: '#00ffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        msgBox.add([msgBg, msgText, detailText, closeBtn]);

        closeBtn.on('pointerdown', () => {
            msgBox.destroy();
            this.scene.restart();
        });
    }
}
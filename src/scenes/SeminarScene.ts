import Phaser from 'phaser';
import { type GameState } from '../types';
import { synth } from '../logic/SoundSynth';
import { DataManager } from '../logic/DataManager';

export default class SeminarScene extends Phaser.Scene {
    private footerContainer: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('SeminarScene');
    }

    create() {
        const { width, height } = this.scale;
        const state = this.registry.get('gameState') as GameState;
        const seminarData = DataManager.seminar;

        // セミナー閉鎖チェック
        if (state.daysLeft <= seminarData.escape_event?.triggerDay || state.isSeminarClosed) {
            this.showEscapeEvent(width, height, state, seminarData);
            return;
        }

        // 背景（公民館の地下会議室）
        this.add.rectangle(0, 0, width, height, 0x2a2a1a).setOrigin(0);

        // チカチカする蛍光灯エフェクト
        const flicker = this.add.rectangle(0, 0, width, height, 0xffffff, 0.05).setOrigin(0);
        this.tweens.add({
            targets: flicker,
            alpha: { from: 0.05, to: 0.15 },
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: 'Linear'
        });

        // タイトル
        this.add.text(width / 2, 35, "実戦！ギョーカイ話法セミナー", {
            fontSize: '14px',
            color: '#ffaa00',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        // 講師紹介
        const instructor = seminarData.instructor;
        this.add.rectangle(width / 2, 90, width - 30, 80, 0x000000, 0.7).setStrokeStyle(1, 0xffaa00, 0.5);

        this.add.text(width / 2, 70, `講師：${instructor.name}`, {
            fontSize: '11px',
            color: '#ffff00',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        this.add.text(width / 2, 100, instructor.description, {
            fontSize: '8px',
            color: '#ccccaa',
            align: 'center',
            wordWrap: { width: width - 50 },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 2
        }).setOrigin(0.5);

        // 閉鎖警告
        const daysUntilClosure = state.daysLeft - seminarData.escape_event.triggerDay;
        if (daysUntilClosure <= 5 && daysUntilClosure > 0) {
            const warningBg = this.add.rectangle(width / 2, 130, width - 30, 25, 0xff0000, 0.3);
            warningBg.setStrokeStyle(1, 0xff0000, 0.8);
            this.add.text(width / 2, 130, `警告: あと${daysUntilClosure}日でセミナー閉鎖！`, {
                fontSize: '10px',
                color: '#ff0000',
                fontFamily: 'monospace'
            }).setOrigin(0.5);
        }

        const listY = 150;
        const listHeight = height - 250; // Adjusted for footer

        const listContainer = this.add.container(0, listY);
        let currentY = 0;

        seminarData.courses.forEach((course: any) => {
            const alreadyLearned = state.seminarSkills.includes(course.id);
            const canAfford = state.money >= course.cost;
            const levelOk = state.level >= course.requiredLevel;

            const container = this.add.container(width / 2, currentY);
            const bg = this.add.rectangle(0, 0, width - 35, 120, alreadyLearned ? 0x333333 : 0x3a2a2a);

            if (!alreadyLearned && canAfford && levelOk) {
                bg.setInteractive();
            } else {
                bg.disableInteractive();
            }
            bg.setStrokeStyle(2, alreadyLearned ? 0x666666 : 0xffaa00, 0.6);

            const levelTag = this.add.text(-width / 2 + 25, -50, `[${course.level}]`, {
                fontSize: '9px',
                color: alreadyLearned ? '#666666' : '#00ffff',
                fontFamily: 'monospace'
            }).setOrigin(0);

            const nameText = this.add.text(0, -40, alreadyLearned ? `${course.name}（習得済）` : course.name, {
                fontSize: '11px',
                color: alreadyLearned ? '#666666' : '#ffff00',
                fontFamily: 'Rajdhani, sans-serif',
                align: 'center'
            }).setOrigin(0.5);

            const descText = this.add.text(0, -15, course.description, {
                fontSize: '8px',
                color: alreadyLearned ? '#444444' : '#ccccaa',
                align: 'center',
                wordWrap: { width: width - 60 },
                fontFamily: 'Rajdhani, sans-serif',
                lineSpacing: 2
            }).setOrigin(0.5);

            const effectText = this.add.text(0, 10, `効果: ${course.effect}`, {
                fontSize: '7px',
                color: alreadyLearned ? '#444444' : '#88ff88',
                align: 'center',
                wordWrap: { width: width - 60 },
                fontFamily: 'monospace',
                lineSpacing: 2
            }).setOrigin(0.5);

            let statusColor = '#00ff00';
            let statusText = `¥${course.cost}  (人間性 -${course.humanityLoss})`;

            if (alreadyLearned) {
                statusColor = '#666666';
                statusText = '習得済';
            } else if (!levelOk) {
                statusColor = '#ff0000';
                statusText = `Lv.${course.requiredLevel}以上が必要`;
            } else if (!canAfford) {
                statusColor = '#ff8888';
                statusText = `¥${course.cost} (所持金不足)`;
            }

            const priceText = this.add.text(0, 48, statusText, {
                fontSize: '9px',
                color: statusColor,
                fontFamily: 'monospace'
            }).setOrigin(0.5);

            container.add([bg, levelTag, nameText, descText, effectText, priceText]);
            listContainer.add(container);

            if (!alreadyLearned && canAfford && levelOk) {
                bg.on('pointerover', () => {
                    bg.setStrokeStyle(3, 0xffaa00, 1);
                    this.tweens.add({
                        targets: container,
                        scaleX: 1.02,
                        scaleY: 1.02,
                        duration: 100,
                        ease: 'Power1'
                    });
                });

                bg.on('pointerout', () => {
                    bg.setStrokeStyle(2, 0xffaa00, 0.6);
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
                            this.learnSkill(course, state, seminarData);
                        }
                    });
                });
            }

            currentY += 130;
        });

        // スクロール機能
        const maxScroll = Math.max(0, currentY - listHeight);

        if (maxScroll > 0) {
            this.input.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
                const newY = Phaser.Math.Clamp(listContainer.y - deltaY * 0.5, listY - maxScroll, listY);
                this.tweens.add({
                    targets: listContainer,
                    y: newY,
                    duration: 150,
                    ease: 'Power2'
                });
            });
        }

        // 戻るボタン
        const backBtn = this.add.rectangle(width / 2, height - 60, 160, 30, 0x444444).setInteractive();

        backBtn.setStrokeStyle(2, 0x666666);
        this.add.text(width / 2, height - 60, "退室する", {

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

    learnSkill(course: any, state: GameState, seminarData: any) {
        const { width, height } = this.scale;

        // 支払い
        state.money -= course.cost;
        state.humanity -= course.humanityLoss;
        const prideLoss = 5; // セミナー受講でのプライド消費
        state.pride -= prideLoss;

        state.seminarSkills.push(course.id);
        state.skills.push(course.skillId);

        this.registry.set('gameState', state);
        synth.playPowerUp();
        this.createFooter(width, height, state);


        // 受講シーン
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.95).setOrigin(0).setInteractive();
        overlay.setDepth(1000);

        const container = this.add.container(width / 2, height / 2);
        container.setDepth(1001);

        const bg = this.add.rectangle(0, 0, width - 30, 350, 0x1a1a0e, 1);
        bg.setStrokeStyle(3, 0xffaa00, 0.8);

        const title = this.add.text(0, -160, "受講中...", {
            fontSize: '16px',
            color: '#ffaa00',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        let introText = seminarData.instructor.intro;
        if (state.soldMemories.length > 0) {
            introText = "講師「おや、君……いい目をしているね。\n　『過去』を捨てた者の目だ。\n　これから伸びるよ、君は。」\n\n" + introText;
        }

        const instructorSpeech = this.add.text(0, -90, introText, {
            fontSize: '9px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 60, useAdvancedWrap: true },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 4
        }).setOrigin(0.5);

        const skillName = this.add.text(0, 0, `スキル『${course.name}』を習得！`, {
            fontSize: '12px',
            color: '#00ff00',
            fontFamily: 'Rajdhani, sans-serif'
        }).setOrigin(0.5);

        const phrase = this.add.text(0, 40, `フレーズ:\n「${course.phrase}」`, {
            fontSize: '8px',
            color: '#ffff00',
            align: 'center',
            wordWrap: { width: width - 60, useAdvancedWrap: true },
            fontFamily: 'monospace',
            lineSpacing: 3
        }).setOrigin(0.5);

        const reaction = this.add.text(0, 100, seminarData.reactions.success[Math.floor(Math.random() * seminarData.reactions.success.length)], {
            fontSize: '9px',
            color: '#888888',
            align: 'center',
            wordWrap: { width: width - 60 },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 3
        }).setOrigin(0.5);

        const stats = this.add.text(0, 140, `人間性: ${state.humanity}/100\n所持金: ¥${state.money}`, {
            fontSize: '10px',
            color: state.humanity <= 30 ? '#ff0000' : '#cccccc',
            align: 'center',
            fontFamily: 'monospace',
            lineSpacing: 3
        }).setOrigin(0.5);

        const closeBtn = this.add.text(0, 160, "【了解】", {
            fontSize: '14px',
            color: '#00ffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        container.add([bg, title, instructorSpeech, skillName, phrase, reaction, stats, closeBtn]);

        closeBtn.on('pointerdown', () => {
            overlay.destroy();
            container.destroy();
            this.scene.restart();
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

    showEscapeEvent(width: number, height: number, state: GameState, seminarData: any) {
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);

        const container = this.add.container(width / 2, height / 2);

        const bg = this.add.rectangle(0, 0, width - 30, 300, 0x1a1a1a, 1);
        bg.setStrokeStyle(3, 0xff0000, 0.8);

        const title = this.add.text(0, -120, "【緊急ニュース】", {
            fontSize: '18px',
            color: '#ff0000',
            fontFamily: 'Orbitron, monospace'
        }).setOrigin(0.5);

        const message = this.add.text(0, 0, seminarData.escape_event.message, {
            fontSize: '10px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width - 60, useAdvancedWrap: true },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 5
        }).setOrigin(0.5);

        const closeBtn = this.add.text(0, 120, "【...】", {
            fontSize: '14px',
            color: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        container.add([bg, title, message, closeBtn]);

        closeBtn.on('pointerdown', () => {
            state.isSeminarClosed = true;
            this.registry.set('gameState', state);
            this.scene.start('TownScene');
        });

        // フェードイン
        container.setAlpha(0);
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 1000,
            ease: 'Power2'
        });
    }
}

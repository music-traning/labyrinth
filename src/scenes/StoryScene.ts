import Phaser from 'phaser';

export default class StoryScene extends Phaser.Scene {
    private scenarioData: any[] = [];
    private currentIndex: number = 0;
    private textObject: Phaser.GameObjects.Text | null = null;
    private nameObject: Phaser.GameObjects.Text | null = null;
    private background: Phaser.GameObjects.Rectangle | null = null;

    constructor() {
        super('StoryScene');
    }

    init(data: any) {
        this.scenarioData = data.scenarioData || [];
        this.currentIndex = 0;
    }

    create() {
        const { width, height } = this.scale;

        // Background overlay
        this.background = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();

        // Text area background
        this.add.rectangle(0, height - 180, width, 180, 0x000033).setOrigin(0);

        // Name text
        this.nameObject = this.add.text(20, height - 170, '', {
            fontSize: '14px',
            color: '#aaaaaa',
            fontFamily: 'Rajdhani, sans-serif'
        });

        // Content text - より厳密な制限
        this.textObject = this.add.text(20, height - 145, '', {
            fontSize: '12px',
            color: '#ffffff',
            wordWrap: { width: width - 45, useAdvancedWrap: true },
            fontFamily: 'Rajdhani, sans-serif',
            lineSpacing: 4,
            maxLines: 6 // 最大6行に制限
        });

        // Skip Button
        const skipBtn = this.add.rectangle(width - 60, 30, 100, 40, 0x444444).setInteractive();
        this.add.text(width - 60, 30, "SKIP >>", { fontSize: '14px', color: '#fff' }).setOrigin(0.5);

        skipBtn.on('pointerdown', () => {
            this.skipToEnd();
        });

        // Click to advance
        this.background.on('pointerdown', () => {
            this.next();
        });

        this.next();
    }

    next() {
        if (!this.scene.isActive()) return;

        if (this.currentIndex >= this.scenarioData.length) {
            this.end();
            return;
        }

        const item = this.scenarioData[this.currentIndex];
        this.currentIndex++;

        if (item.event) {
            item.event();
            return;
        }

        if (item.speaker !== undefined) {
            this.nameObject?.setText(item.speaker);
        }

        if (item.text) {
            // テキストが長すぎる場合は自動で省略
            let displayText = item.text;
            if (displayText.length > 120) {
                displayText = displayText.substring(0, 117) + "...";
            }
            this.textObject?.setText(displayText);
        }
    }

    skipToEnd() {
        const endEvent = this.scenarioData.find(item => item.event);
        if (endEvent) {
            endEvent.event();
        } else {
            this.end();
        }
    }

    end() {
        this.scene.start('TownScene');
    }
}

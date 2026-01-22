import Phaser from 'phaser';
import { DataManager } from '../logic/DataManager';
import { resetGame } from '../logic/GameLogic';

export default class BadEndScene extends Phaser.Scene {
    constructor() {
        super('BadEndScene');
    }

    create() {
        const badEndData = DataManager.scenarios.bad_end;

        // Reset game state for next run
        this.registry.set('gameState', null);

        this.scene.start('StoryScene', {
            scenarioData: [
                ...badEndData,
                {
                    event: () => {
                        resetGame(this);
                    }
                }
            ]
        });
    }
}

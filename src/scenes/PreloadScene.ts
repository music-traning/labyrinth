import { DataManager } from '../logic/DataManager';
import { InitialState } from '../logic/GameLogic';


export default class PreloadScene extends Phaser.Scene {
    constructor() { super('PreloadScene'); }

    preload() {
        this.load.json('items', 'assets/items.json');
        this.load.json('enemies', 'assets/enemies.json');
        this.load.json('dialogues', 'assets/dialogues.json');
        this.load.json('skills', 'assets/skills.json');
        this.load.json('scenarios', 'assets/scenarios.json');
        this.load.json('ui', 'assets/ui.json');
        this.load.json('school', 'assets/school.json');
        this.load.json('seminar', 'assets/seminar.json');
        this.load.json('memories', 'assets/memories.json');
    }

    create() {
        const items = this.cache.json.get('items');
        const enemies = this.cache.json.get('enemies');
        const dialogues = this.cache.json.get('dialogues');
        const skills = this.cache.json.get('skills');
        const scenarios = this.cache.json.get('scenarios');
        const ui = this.cache.json.get('ui');
        const school = this.cache.json.get('school');
        const seminar = this.cache.json.get('seminar');
        const memories = this.cache.json.get('memories');

        DataManager.init({
            items,
            enemies,
            dialogues,
            skills,
            scenarios,
            ui,
            school,
            seminar,
            memories
        });

        if (!this.registry.get('gameState')) {
            // Deep copy to prevent reference issues
            const state = JSON.parse(JSON.stringify(InitialState));
            this.registry.set('gameState', state);
        }

        this.scene.start('TitleScene');
    }
}

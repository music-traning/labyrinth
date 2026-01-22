import type { MasterItem, MasterAffix, MasterEnemy, MasterSkill } from '../types';

export class DataManager {
    private static _enemies: MasterEnemy[] = [];
    private static _items: MasterItem[] = [];
    private static _affixes: MasterAffix[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static _flavors: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static _scenarios: any = {};
    private static _skills: MasterSkill[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static _rarityDef: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static _ui: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static _school: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static _seminar: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static _memories: any = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static init(data: { enemies: any, items: any, dialogues: any, skills: any, scenarios: any, ui: any, school: any, seminar: any, memories: any }) {
        this._enemies = data.enemies || [];
        this._items = data.items?.items || [];
        this._affixes = data.items?.affixes || [];
        this._rarityDef = data.items?.rarity_def || {};
        this._flavors = data.dialogues || {};
        this._skills = data.skills || [];
        this._scenarios = data.scenarios || {};
        this._ui = data.ui || {};
        this._school = data.school || {};
        this._seminar = data.seminar || {};
        this._memories = data.memories || {};
    }

    static get enemies(): MasterEnemy[] { return this._enemies; }
    static get items(): MasterItem[] { return this._items; }
    static get affixes(): MasterAffix[] { return this._affixes; }
    static get flavorTexts() { return this._flavors; }
    static get scenarios() { return this._scenarios; }
    static get skills(): MasterSkill[] { return this._skills; }
    static get rarityDef() { return this._rarityDef; }
    static get school() { return this._school; }
    static get seminar() { return this._seminar; }
    static get memories() { return this._memories; }

    static getRandomEnemy(depth: number = 1, isBossFloor: boolean = false): MasterEnemy {
        if (this._enemies.length === 0) {
            return { id: 'bug', name: 'Bug', exp: 0, atk: 1, hp: 1, flavor: 'No enemies loaded' };
        }

        if (isBossFloor) {
            const bosses = this._enemies.filter(e => e.isBoss);
            if (bosses.length > 0) {
                return bosses[Math.floor(Math.random() * bosses.length)];
            }
        }

        const validEnemies = this._enemies.filter(e => {
            if (e.isBoss) return false;
            const minDepth = e.minDepth || 1;
            const maxDepth = e.maxDepth || 999;
            return depth >= minDepth && depth <= maxDepth;
        });

        if (validEnemies.length === 0) {
            const normalEnemies = this._enemies.filter(e => !e.isBoss);
            return normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
        }

        return validEnemies[Math.floor(Math.random() * validEnemies.length)];
    }

    static getRandomFlavor(category: string): string {
        const list = this._flavors[category];
        if (!list || list.length === 0) return "......";
        return list[Math.floor(Math.random() * list.length)];
    }

    static getUI(category: string, key: string): string {
        if (this._ui[category] && this._ui[category][key]) {
            return this._ui[category][key];
        }
        return `[${category}.${key}]`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static formatUI(category: string, key: string, ...args: any[]): string {
        let str = this.getUI(category, key);
        args.forEach((arg, index) => {
            str = str.replace(`{${index}}`, arg);
        });
        return str;
    }
}
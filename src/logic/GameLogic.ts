import type { InventoryItem, MasterItem, MasterAffix, MasterEnemy, GameState } from '../types';
import { DataManager } from './DataManager';
import Phaser from 'phaser';

export const InitialState: GameState = {
    money: 320,
    rentAmount: 50000,
    daysLeft: 30,
    currentDepth: 1,
    maxReachedDepth: 1,
    inventory: [],
    baseAtk: 5,
    baseDef: 2,

    level: 1,
    exp: 0,
    nextLevelExp: 100,
    hp: 50,
    maxHp: 50,
    mp: 20,
    maxMp: 20,

    equippedWeapon: null,
    equippedAccessory: null,

    bluffLevel: 1,
    skills: [],
    humanity: 100,
    pride: 100,
    isTutorialDone: false,
    isTeacherGone: false,
    defeatedBosses: [],
    soldMemories: [],
    soldInventory: [],
    dogezaCount: 0,
    seminarSkills: [],
    isSeminarClosed: false,
    explorationProgress: 0
};

export function resetGame(scene: Phaser.Scene) {
    // Reset registry
    const state = JSON.parse(JSON.stringify(InitialState));
    scene.registry.set('gameState', state);

    // Clear save
    localStorage.removeItem('labyrinth_save');

    // Restart logic
    scene.scene.start('TitleScene');
}

export class Calculator {
    static calculateEnemyStats(baseEnemy: MasterEnemy, state: GameState, isBoss: boolean): { atk: number, hp: number, maxHp: number } {
        // 深さに応じて指数的に強化
        // Depth 1: 1.0x, Depth 10: 1.67x, Depth 50: 4.33x, Depth 99: 7.6x
        const depthMultiplier = 1 + (state.currentDepth / 15) + Math.pow(state.currentDepth / 50, 1.5);

        // 変更後: (Depth - 40) * 0.02 (1階層につき2%増) -> B80Fで +80% (1.8倍)
        const deepZoneMultiplier = state.currentDepth > 40 ? 1 + (state.currentDepth - 40) * 0.035 : 1;

        // プレイヤーレベルに応じた補正（レベルが低いと敵も弱く）
        const levelAdjustment = 0.8 + (state.level * 0.02);

        let atk = Math.floor((baseEnemy.atk || 5) * depthMultiplier * deepZoneMultiplier * levelAdjustment);
        let hp = Math.floor((baseEnemy.hp || 10) * depthMultiplier * deepZoneMultiplier * levelAdjustment);

        if (isBoss || baseEnemy.isBoss) {
            // ボスはさらに強力に（ATK x2.5, HP x4）
            atk = Math.floor(atk * 2.5);
            hp = Math.floor(hp * 4);

            // 倒したボスの数に応じて強化
            const bossCount = state.defeatedBosses.length;
            if (bossCount > 0) {
                atk = Math.floor(atk * (1 + bossCount * 0.1));
                hp = Math.floor(hp * (1 + bossCount * 0.15));
            }
        }

        return { atk, hp, maxHp: hp };
    }

    static calculateAppraisalCost(item: InventoryItem): number {
        if (!item.price) return 100;
        return Math.max(50, Math.floor(item.price * 0.1));
    }

    static calculateSellPrice(item: InventoryItem, _isTrash: boolean = false): number {
        if (item.isIdentified) {
            // Note: Shop buy price is handled separately (usually full price)
            return Math.floor(item.price * 0.3);
        }
        return 10; // Garage/Trash price
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static calculateMemorySellPrice(memoryData: any): number {
        return (memoryData.price || 0) * 10;
    }
}

export class ItemGenerator {
    static generate(): InventoryItem {
        const baseItem = Phaser.Utils.Array.GetRandom(DataManager.items || []) as MasterItem | null;
        const affix = Phaser.Utils.Array.GetRandom(DataManager.affixes || []) as MasterAffix | null;

        if (!baseItem) {
            console.warn("ItemGenerator: No items found. Using default.");
            return this.createDefaultItem();
        }
        if (!affix) {
            console.warn("ItemGenerator: No affixes found. Using default.");
            return this.createDefaultItem();
        }

        const fullName = `${affix.name} ${baseItem.name}`;
        const price = Math.floor(baseItem.base_price * affix.stat_mod.price);
        const power = Math.floor(baseItem.base_power * affix.stat_mod.power);

        // 装備可能判定：typeがweaponかaccessoryで、かつequippableがtrueまたは未定義
        const isEquippable = (baseItem.type === 'weapon' || baseItem.type === 'accessory') &&
            (baseItem.equippable !== false);

        return {
            id: Phaser.Math.RND.uuid(),
            type: baseItem.type || 'trash',
            name: baseItem.name,
            fullName: `${fullName}\n(${baseItem.flavor})`,
            price: price,
            power: power,
            isIdentified: false,
            isEquippable: isEquippable
        };
    }

    private static createDefaultItem(): InventoryItem {
        return {
            id: Phaser.Math.RND.uuid(),
            type: 'trash',
            name: 'Dust',
            fullName: 'Just Dust',
            price: 1,
            power: 1,
            isIdentified: true,
            isEquippable: false
        };
    }
}
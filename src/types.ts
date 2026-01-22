export type InventoryItem = {
    id: string;
    type: 'trash' | 'weapon' | 'accessory' | 'book' | 'memory';
    name: string;
    fullName: string;
    price: number;
    power: number;
    isIdentified: boolean;
    isEquipped?: boolean;
    isEquippable?: boolean;
    memoryType?: 'letter' | 'tuner' | 'ring' | 'first_live' | 'broken_string' | 'first_guitar' | 'band_breakup' | 'fan_letter' | 'studio_all_night' | 'street_performance'; // 思い出の種類
    memoryData?: any; // 思い出の詳細データ
};

export type SkillType = string;

export type GameState = {
    money: number;
    rentAmount: number;
    daysLeft: number;
    maxReachedDepth: number;
    currentDepth: number;
    inventory: InventoryItem[];

    // Stats
    level: number;
    exp: number;
    nextLevelExp: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    baseAtk: number;
    baseDef: number;

    // Equipment
    equippedWeapon: InventoryItem | null;
    equippedAccessory: InventoryItem | null;

    bluffLevel: number;
    skills: SkillType[];
    humanity: number;
    pride: number; // プライド（0-100）
    isTutorialDone: boolean;
    isTeacherGone: boolean;
    defeatedBosses: number[];

    // 思い出売却フラグ
    soldMemories: string[];
    soldInventory: InventoryItem[];
    // 土下座回数
    dogezaCount: number;
    // セミナースキル
    seminarSkills: string[];
    // セミナー閉鎖フラグ
    isSeminarClosed: boolean;

    // ダンジョン探索進行度 (0-2)
    explorationProgress: number;
};

export interface MasterItem {
    id: string;
    name: string;
    rarity?: string;
    type?: 'trash' | 'weapon' | 'accessory' | 'book' | 'memory';
    base_price: number;
    base_power: number;
    flavor: string;
    equippable?: boolean;
    special_effect?: string;
}

export interface MasterAffix {
    id: string;
    name: string;
    rarity?: string;
    stat_mod: {
        price: number;
        power: number;
    };
    flavor: string;
}

export interface MasterEnemy {
    id: string;
    name: string;
    exp: number;
    atk: number;
    hp: number;
    flavor: string;
    minDepth?: number;
    maxDepth?: number;
    isBoss?: boolean;
    skills?: string[];
}

export interface MasterSkill {
    id: string;
    name: string;
    cost: number;
    mp_cost: number;
    desc: string;
    effect_type?: 'damage' | 'heal' | 'stun' | 'buff' | 'debuff';
    effect_value?: number;
}

export interface DialogueData {
    town_quotes: string[];
    appraisal: string[];
    rent_fail: string[];
    rent_success: string[];
    shop_buy: string[];
    school_teacher: string[];
    seminar_utsuro: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UIData {
    [key: string]: any;
}
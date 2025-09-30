import Phaser from 'phaser'

/**
 * 被动道具定义接口。
 */
export interface PassiveItemDefinition {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  maxLevel: number
  effects: {
    type: string // 效果类型：damage, cooldown, speed, health, etc.
    value: number // 效果值（百分比或绝对值）
  }[]
}

/**
 * 玩家已装备的被动道具实例。
 */
export interface PassiveItemInstance {
  definition: PassiveItemDefinition
  level: number
}

/**
 * `PassiveItemSystem` 被动道具系统管理器。
 * 负责管理玩家的被动道具、升级等。
 */
export class PassiveItemSystem {
  private equippedItems: Map<string, PassiveItemInstance> = new Map()
  private allItems: Map<string, PassiveItemDefinition> = new Map()

  constructor() {
    // 初始化被动道具库
    this.initializeItems()
  }

  /**
   * 初始化所有可用的被动道具。
   */
  private initializeItems(): void {
    // 纪元之书（减少冷却时间）
    this.allItems.set('tome_of_ages', {
      id: 'tome_of_ages',
      name: '纪元之书',
      description: '减少所有能力的冷却时间',
      icon: '📖',
      rarity: 'rare',
      maxLevel: 5,
      effects: [{ type: 'cooldown', value: -8 }], // 每级减少8%冷却
    })

    // 元素共鸣（增加伤害）
    this.allItems.set('elemental_resonance', {
      id: 'elemental_resonance',
      name: '元素共鸣',
      description: '增加所有元素能力的伤害',
      icon: '💫',
      rarity: 'rare',
      maxLevel: 5,
      effects: [{ type: 'damage', value: 10 }], // 每级增加10%伤害
    })

    // 疾风之靴（增加移动速度）
    this.allItems.set('swift_boots', {
      id: 'swift_boots',
      name: '疾风之靴',
      description: '增加移动速度',
      icon: '👟',
      rarity: 'common',
      maxLevel: 5,
      effects: [{ type: 'speed', value: 5 }], // 每级增加5%速度
    })

    // 生命护符（增加最大生命值）
    this.allItems.set('life_amulet', {
      id: 'life_amulet',
      name: '生命护符',
      description: '增加最大生命值',
      icon: '💚',
      rarity: 'common',
      maxLevel: 5,
      effects: [{ type: 'health', value: 20 }], // 每级增加20点生命
    })

    // 贪婪之戒（增加经验获取）
    this.allItems.set('greed_ring', {
      id: 'greed_ring',
      name: '贪婪之戒',
      description: '增加经验获取量',
      icon: '💍',
      rarity: 'rare',
      maxLevel: 5,
      effects: [{ type: 'exp_gain', value: 10 }], // 每级增加10%经验
    })

    // 效果范围扩展
    this.allItems.set('area_expansion', {
      id: 'area_expansion',
      name: '效果范围',
      description: '增加所有能力的效果范围',
      icon: '🔍',
      rarity: 'epic',
      maxLevel: 5,
      effects: [{ type: 'area', value: 10 }], // 每级增加10%范围
    })

    // 投射物速度
    this.allItems.set('projectile_speed', {
      id: 'projectile_speed',
      name: '投射物速度',
      description: '增加投射物飞行速度',
      icon: '🚀',
      rarity: 'common',
      maxLevel: 5,
      effects: [{ type: 'projectile_speed', value: 8 }], // 每级增加8%速度
    })

    // 穿透（投射物穿透敌人）
    this.allItems.set('piercing', {
      id: 'piercing',
      name: '穿透',
      description: '投射物可以穿透敌人',
      icon: '🎯',
      rarity: 'epic',
      maxLevel: 3,
      effects: [{ type: 'pierce', value: 1 }], // 每级增加1次穿透
    })
  }

  /**
   * 装备一个被动道具。
   */
  public equipItem(itemId: string): boolean {
    const definition = this.allItems.get(itemId)
    if (!definition) return false

    // 如果已装备，则升级
    if (this.equippedItems.has(itemId)) {
      return this.upgradeItem(itemId)
    }

    // 装备新道具
    this.equippedItems.set(itemId, {
      definition,
      level: 1,
    })

    return true
  }

  /**
   * 升级已装备的被动道具。
   */
  public upgradeItem(itemId: string): boolean {
    const item = this.equippedItems.get(itemId)
    if (!item) return false

    if (item.level >= item.definition.maxLevel) {
      return false // 已达到最大等级
    }

    item.level++
    return true
  }

  /**
   * 获取随机的被动道具选项（用于升级选择）。
   */
  public getRandomItemOptions(count: number = 3): PassiveItemDefinition[] {
    const options: PassiveItemDefinition[] = []
    const availableItems = Array.from(this.allItems.values())

    // 优先显示未装备的道具
    const unequipped = availableItems.filter((def) => !this.equippedItems.has(def.id))

    // 如果未装备的道具不够，添加可升级的道具
    const upgradeable = availableItems.filter((def) => {
      const equipped = this.equippedItems.get(def.id)
      return equipped && equipped.level < def.maxLevel
    })

    const pool = [...unequipped, ...upgradeable]

    // 随机选择
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const randomIndex = Phaser.Math.Between(0, pool.length - 1)
      options.push(pool[randomIndex])
      pool.splice(randomIndex, 1)
    }

    return options
  }

  /**
   * 获取已装备的被动道具列表。
   */
  public getEquippedItems(): PassiveItemInstance[] {
    return Array.from(this.equippedItems.values())
  }

  /**
   * 获取特定道具的等级。
   */
  public getItemLevel(itemId: string): number {
    const item = this.equippedItems.get(itemId)
    return item ? item.level : 0
  }

  /**
   * 计算某个效果类型的总加成。
   */
  public getTotalBonus(effectType: string): number {
    let total = 0

    this.equippedItems.forEach((item) => {
      item.definition.effects.forEach((effect) => {
        if (effect.type === effectType) {
          total += effect.value * item.level
        }
      })
    })

    return total
  }
}

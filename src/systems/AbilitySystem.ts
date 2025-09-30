import Phaser from 'phaser'
import { Player } from '../entities/Player'
import {
  FireProjectile,
  FrostProjectile,
  LightningProjectile,
  EarthProjectile,
  LavaProjectile,
  PlasmaProjectile,
  CrystalProjectile,
  SuperconductorProjectile,
  BlizzardProjectile,
  StormProjectile,
} from '../entities/Projectile'

/**
 * 能力定义接口。
 */
export interface AbilityDefinition {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  elementType: string
  maxLevel: number
  baseStats: {
    damage: number
    cooldown: number
    projectileCount?: number
    speed?: number
  }
  // 衍生元素相关
  isDerived?: boolean // 是否为衍生元素
  requiredElements?: string[] // 需要的基础元素
  replacesElement?: string // 替换哪个基础元素
  // 进化相关
  isEvolved?: boolean // 是否为进化形态
  evolvesFrom?: string // 从哪个能力进化而来
  requiredItem?: string // 需要的被动道具ID
  requiredItemLevel?: number // 需要的道具等级
}

/**
 * 玩家已装备的能力实例。
 */
export interface AbilityInstance {
  definition: AbilityDefinition
  level: number
  lastCastTime: number
}

/**
 * `AbilitySystem` 能力系统管理器。
 * 负责管理玩家的能力、升级、触发等。
 */
export class AbilitySystem {
  private scene: Phaser.Scene
  private player: Player
  private equippedAbilities: Map<string, AbilityInstance> = new Map()
  private allAbilities: Map<string, AbilityDefinition> = new Map()
  private banishedAbilities: Set<string> = new Set() // 被放逐的能力ID

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene
    this.player = player

    // 初始化能力库
    this.initializeAbilities()
  }

  /**
   * 初始化所有可用的能力。
   */
  private initializeAbilities(): void {
    // 火焰弹
    this.allAbilities.set('fireball', {
      id: 'fireball',
      name: '火焰弹',
      description: '发射火焰弹攻击敌人，对冰霜敌人造成额外伤害',
      icon: '🔥',
      rarity: 'common',
      elementType: 'fire',
      maxLevel: 5,
      baseStats: {
        damage: 15,
        cooldown: 1000,
        projectileCount: 1,
        speed: 350,
      },
    })

    // 冰霜箭
    this.allAbilities.set('frostbolt', {
      id: 'frostbolt',
      name: '冰霜箭',
      description: '发射冰霜箭减速敌人，对火焰敌人造成额外伤害',
      icon: '❄️',
      rarity: 'common',
      elementType: 'frost',
      maxLevel: 5,
      baseStats: {
        damage: 10,
        cooldown: 1200,
        projectileCount: 1,
        speed: 300,
      },
    })

    // 闪电链
    this.allAbilities.set('lightning', {
      id: 'lightning',
      name: '闪电链',
      description: '发射闪电攻击敌人，可以连锁攻击多个目标',
      icon: '⚡',
      rarity: 'rare',
      elementType: 'lightning',
      maxLevel: 5,
      baseStats: {
        damage: 12,
        cooldown: 800,
        projectileCount: 1,
        speed: 450,
      },
    })

    // 大地之矛
    this.allAbilities.set('earthspear', {
      id: 'earthspear',
      name: '大地之矛',
      description: '发射大地之矛，速度慢但伤害高，可以破甲',
      icon: '🪨',
      rarity: 'rare',
      elementType: 'earth',
      maxLevel: 5,
      baseStats: {
        damage: 20,
        cooldown: 1500,
        projectileCount: 1,
        speed: 250,
      },
    })

    // 火焰风暴
    this.allAbilities.set('firestorm', {
      id: 'firestorm',
      name: '火焰风暴',
      description: '同时发射多个火焰弹，覆盖更大范围',
      icon: '🌪️',
      rarity: 'epic',
      elementType: 'fire',
      maxLevel: 3,
      baseStats: {
        damage: 12,
        cooldown: 2000,
        projectileCount: 5,
        speed: 350,
      },
    })

    // 冰霜新星
    this.allAbilities.set('frostnova', {
      id: 'frostnova',
      name: '冰霜新星',
      description: '向四周发射冰霜箭，冻结周围的敌人',
      icon: '❄️',
      rarity: 'epic',
      elementType: 'frost',
      maxLevel: 3,
      baseStats: {
        damage: 8,
        cooldown: 2500,
        projectileCount: 8,
        speed: 300,
      },
    })

    // === 衍生元素 ===
    // 熔岩（火+土）
    this.allAbilities.set('lava', {
      id: 'lava',
      name: '熔岩',
      description: '投掷缓慢移动的熔岩球，在地面留下大范围燃烧区域',
      icon: '🌋',
      rarity: 'legendary',
      elementType: 'lava',
      maxLevel: 5,
      baseStats: {
        damage: 25,
        cooldown: 2000,
        projectileCount: 1,
        speed: 200,
      },
      isDerived: true,
      requiredElements: ['fire', 'earth'],
    })

    // 等离子（火+电）
    this.allAbilities.set('plasma', {
      id: 'plasma',
      name: '等离子',
      description: '发射超高温等离子光束，穿透路径上所有敌人',
      icon: '⚛️',
      rarity: 'legendary',
      elementType: 'plasma',
      maxLevel: 5,
      baseStats: {
        damage: 30,
        cooldown: 1800,
        projectileCount: 1,
        speed: 500,
      },
      isDerived: true,
      requiredElements: ['fire', 'lightning'],
    })

    // 晶刺（霜+土）
    this.allAbilities.set('crystal', {
      id: 'crystal',
      name: '晶刺',
      description: '从地面召唤尖锐的水晶碎片，穿刺并冰冻敌人',
      icon: '💎',
      rarity: 'legendary',
      elementType: 'crystal',
      maxLevel: 5,
      baseStats: {
        damage: 22,
        cooldown: 1600,
        projectileCount: 3,
        speed: 350,
      },
      isDerived: true,
      requiredElements: ['frost', 'earth'],
    })

    // 超导体（霜+电）
    this.allAbilities.set('superconductor', {
      id: 'superconductor',
      name: '超导体',
      description: '创造超低温力场，使感电敌人死亡时爆炸成冰霜新星',
      icon: '🔷',
      rarity: 'legendary',
      elementType: 'superconductor',
      maxLevel: 5,
      baseStats: {
        damage: 18,
        cooldown: 2200,
        projectileCount: 1,
        speed: 400,
      },
      isDerived: true,
      requiredElements: ['frost', 'lightning'],
    })

    // 暴雪（火+霜）
    this.allAbilities.set('blizzard', {
      id: 'blizzard',
      name: '暴雪',
      description: '召唤暴雪，同时造成冰霜和火焰伤害',
      icon: '🌨️',
      rarity: 'legendary',
      elementType: 'blizzard',
      maxLevel: 5,
      baseStats: {
        damage: 20,
        cooldown: 2400,
        projectileCount: 6,
        speed: 280,
      },
      isDerived: true,
      requiredElements: ['fire', 'frost'],
    })

    // 风暴（电+土）
    this.allAbilities.set('storm', {
      id: 'storm',
      name: '风暴',
      description: '召唤雷暴，闪电与岩石同时攻击敌人',
      icon: '⛈️',
      rarity: 'legendary',
      elementType: 'storm',
      maxLevel: 5,
      baseStats: {
        damage: 28,
        cooldown: 1900,
        projectileCount: 4,
        speed: 380,
      },
      isDerived: true,
      requiredElements: ['lightning', 'earth'],
    })

    // === 进化形态 ===
    // 火山喷发（熔岩进化）
    this.allAbilities.set('volcanic_eruption', {
      id: 'volcanic_eruption',
      name: '火山喷发',
      description: '周期性引发巨大的火山喷发，永久覆盖大范围熔岩地带',
      icon: '🌋',
      rarity: 'legendary',
      elementType: 'lava',
      maxLevel: 1,
      baseStats: {
        damage: 50,
        cooldown: 5000,
        projectileCount: 1,
        speed: 0,
      },
      isEvolved: true,
      evolvesFrom: 'lava',
      requiredItem: 'tome_of_ages',
      requiredItemLevel: 5,
    })

    // 超新星爆发（等离子进化）
    this.allAbilities.set('supernova', {
      id: 'supernova',
      name: '超新星爆发',
      description: '释放毁灭性的等离子爆炸，清空屏幕上所有敌人',
      icon: '✨',
      rarity: 'legendary',
      elementType: 'plasma',
      maxLevel: 1,
      baseStats: {
        damage: 100,
        cooldown: 8000,
        projectileCount: 1,
        speed: 0,
      },
      isEvolved: true,
      evolvesFrom: 'plasma',
      requiredItem: 'elemental_resonance',
      requiredItemLevel: 5,
    })

    // 永恒冰封（晶刺进化）
    this.allAbilities.set('eternal_freeze', {
      id: 'eternal_freeze',
      name: '永恒冰封',
      description: '召唤巨大的水晶尖刺，永久冰冻路径上的所有敌人',
      icon: '❄️',
      rarity: 'legendary',
      elementType: 'crystal',
      maxLevel: 1,
      baseStats: {
        damage: 60,
        cooldown: 6000,
        projectileCount: 5,
        speed: 400,
      },
      isEvolved: true,
      evolvesFrom: 'crystal',
      requiredItem: 'area_expansion',
      requiredItemLevel: 5,
    })
  }

  /**
   * 装备一个能力。
   */
  public equipAbility(abilityId: string): boolean {
    const definition = this.allAbilities.get(abilityId)
    if (!definition) return false

    // 如果已装备，则升级
    if (this.equippedAbilities.has(abilityId)) {
      return this.upgradeAbility(abilityId)
    }

    // 装备新能力
    this.equippedAbilities.set(abilityId, {
      definition,
      level: 1,
      lastCastTime: 0,
    })

    return true
  }

  /**
   * 升级已装备的能力。
   */
  public upgradeAbility(abilityId: string): boolean {
    const ability = this.equippedAbilities.get(abilityId)
    if (!ability) return false

    if (ability.level >= ability.definition.maxLevel) {
      return false // 已达到最大等级
    }

    ability.level++
    return true
  }

  /**
   * 更新能力系统（每帧调用）。
   */
  public update(time: number): void {
    // 自动触发所有已装备的能力
    this.equippedAbilities.forEach((ability) => {
      this.tryTriggerAbility(ability, time)
    })
  }

  /**
   * 尝试触发能力。
   */
  private tryTriggerAbility(ability: AbilityInstance, time: number): void {
    const cooldown = this.getAbilityCooldown(ability)

    // 检查冷却时间
    if (time - ability.lastCastTime < cooldown) {
      return
    }

    // 触发能力
    this.castAbility(ability)
    ability.lastCastTime = time
  }

  /**
   * 施放能力。
   */
  private castAbility(ability: AbilityInstance): void {
    const projectileCount = this.getAbilityProjectileCount(ability)
    const damage = this.getAbilityDamage(ability)

    // 根据投射物数量决定发射模式
    if (projectileCount === 1) {
      // 单发：朝最近的敌人
      this.castSingleProjectile(ability, damage)
    } else if (projectileCount <= 8) {
      // 多发：环形发射
      this.castCircleProjectiles(ability, damage, projectileCount)
    }
  }

  /**
   * 发射单个投射物。
   */
  private castSingleProjectile(_ability: AbilityInstance, _damage: number): void {
    // 触发玩家的攻击请求事件
    // 注意：实际的投射物创建由Player的fireProjectile方法处理
    this.player.emit('requestAttack')
  }

  /**
   * 环形发射多个投射物。
   */
  private castCircleProjectiles(
    ability: AbilityInstance,
    damage: number,
    count: number
  ): void {
    const angleStep = (Math.PI * 2) / count

    for (let i = 0; i < count; i++) {
      const angle = angleStep * i
      const direction = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle))

      // 创建投射物
      const projectile = this.createProjectile(ability.definition.elementType)
      if (projectile) {
        projectile.damage = damage
        projectile.setPosition(this.player.x, this.player.y)
        projectile.launch(direction)

        // 触发投射物创建事件
        this.player.emit('projectileCreated', projectile)
      }
    }
  }

  /**
   * 根据元素类型创建投射物。
   */
  private createProjectile(elementType: string): any {
    switch (elementType) {
      case 'fire':
        return new FireProjectile(this.scene, this.player.x, this.player.y)
      case 'frost':
        return new FrostProjectile(this.scene, this.player.x, this.player.y)
      case 'lightning':
        return new LightningProjectile(this.scene, this.player.x, this.player.y)
      case 'earth':
        return new EarthProjectile(this.scene, this.player.x, this.player.y)
      // 衍生元素
      case 'lava':
        return new LavaProjectile(this.scene, this.player.x, this.player.y)
      case 'plasma':
        return new PlasmaProjectile(this.scene, this.player.x, this.player.y)
      case 'crystal':
        return new CrystalProjectile(this.scene, this.player.x, this.player.y)
      case 'superconductor':
        return new SuperconductorProjectile(this.scene, this.player.x, this.player.y)
      case 'blizzard':
        return new BlizzardProjectile(this.scene, this.player.x, this.player.y)
      case 'storm':
        return new StormProjectile(this.scene, this.player.x, this.player.y)
      default:
        return new FireProjectile(this.scene, this.player.x, this.player.y)
    }
  }

  /**
   * 获取能力的伤害值（根据等级）。
   */
  private getAbilityDamage(ability: AbilityInstance): number {
    const baseDamage = ability.definition.baseStats.damage
    // 每级增加20%伤害
    return Math.floor(baseDamage * (1 + (ability.level - 1) * 0.2))
  }

  /**
   * 获取能力的冷却时间（根据等级）。
   */
  private getAbilityCooldown(ability: AbilityInstance): number {
    const baseCooldown = ability.definition.baseStats.cooldown
    // 每级减少5%冷却时间
    return Math.floor(baseCooldown * (1 - (ability.level - 1) * 0.05))
  }

  /**
   * 获取能力的投射物数量（根据等级）。
   */
  private getAbilityProjectileCount(ability: AbilityInstance): number {
    const baseCount = ability.definition.baseStats.projectileCount || 1
    // 某些能力每2级增加1个投射物
    if (ability.definition.id === 'firestorm' || ability.definition.id === 'frostnova') {
      return baseCount + Math.floor((ability.level - 1) / 2)
    }
    return baseCount
  }

  /**
   * 检查是否可以解锁衍生元素。
   */
  private checkDerivedAbilities(): AbilityDefinition[] {
    const availableDerived: AbilityDefinition[] = []
    const equippedElements = new Set<string>()

    // 收集已装备的基础元素类型
    this.equippedAbilities.forEach((ability) => {
      if (!ability.definition.isDerived) {
        equippedElements.add(ability.definition.elementType)
      }
    })

    // 检查所有衍生元素
    this.allAbilities.forEach((def) => {
      if (def.isDerived && def.requiredElements) {
        // 检查是否已装备
        if (this.equippedAbilities.has(def.id)) {
          return
        }

        // 检查是否满足所有需求的元素
        const hasAllRequired = def.requiredElements.every((element) =>
          equippedElements.has(element)
        )

        if (hasAllRequired) {
          availableDerived.push(def)
        }
      }
    })

    return availableDerived
  }

  /**
   * 放逐一个能力（在本局中永久移除）。
   */
  public banishAbility(abilityId: string): void {
    this.banishedAbilities.add(abilityId)
  }

  /**
   * 检查是否可以进化某个能力。
   * @param passiveItemSystem 被动道具系统引用
   */
  public checkEvolutions(passiveItemSystem: any): AbilityDefinition[] {
    const availableEvolutions: AbilityDefinition[] = []

    this.allAbilities.forEach((def) => {
      if (def.isEvolved && def.evolvesFrom && def.requiredItem && def.requiredItemLevel) {
        // 检查是否已装备进化形态
        if (this.equippedAbilities.has(def.id)) {
          return
        }

        // 检查基础能力是否达到最高等级
        const baseAbility = this.equippedAbilities.get(def.evolvesFrom)
        if (!baseAbility || baseAbility.level < baseAbility.definition.maxLevel) {
          return
        }

        // 检查被动道具是否达到要求等级
        const itemLevel = passiveItemSystem.getItemLevel(def.requiredItem)
        if (itemLevel < def.requiredItemLevel) {
          return
        }

        availableEvolutions.push(def)
      }
    })

    return availableEvolutions
  }

  /**
   * 获取随机的能力选项（用于升级选择）。
   * @param passiveItemSystem 被动道具系统（可选，用于检查进化）
   */
  public getRandomAbilityOptions(count: number = 3, passiveItemSystem?: any): AbilityDefinition[] {
    const options: AbilityDefinition[] = []
    const availableAbilities = Array.from(this.allAbilities.values())

    // 检查可用的进化形态（最高优先级）
    const evolutions = passiveItemSystem ? this.checkEvolutions(passiveItemSystem) : []
    const priorityEvolutions = evolutions.filter((def) => !this.banishedAbilities.has(def.id))

    // 检查可用的衍生元素
    const derivedAbilities = this.checkDerivedAbilities()

    // 优先显示衍生元素（如果有）
    const priorityDerived = derivedAbilities.filter(
      (def) => !this.banishedAbilities.has(def.id)
    )

    // 优先显示未装备的能力
    const unequipped = availableAbilities.filter(
      (def) =>
        !this.equippedAbilities.has(def.id) &&
        !this.banishedAbilities.has(def.id) &&
        !def.isDerived && // 普通能力不包括衍生元素
        !def.isEvolved // 也不包括进化形态
    )

    // 如果未装备的能力不够，添加可升级的能力
    const upgradeable = availableAbilities.filter((def) => {
      if (this.banishedAbilities.has(def.id)) return false
      if (def.isEvolved) return false // 进化形态不能升级
      const equipped = this.equippedAbilities.get(def.id)
      return equipped && equipped.level < def.maxLevel
    })

    // 构建选项池：进化 > 衍生元素 > 未装备 > 可升级
    const pool = [...priorityEvolutions, ...priorityDerived, ...unequipped, ...upgradeable]

    // 随机选择
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const randomIndex = Phaser.Math.Between(0, pool.length - 1)
      options.push(pool[randomIndex])
      pool.splice(randomIndex, 1)
    }

    return options
  }

  /**
   * 获取已装备的能力列表。
   */
  public getEquippedAbilities(): AbilityInstance[] {
    return Array.from(this.equippedAbilities.values())
  }
}

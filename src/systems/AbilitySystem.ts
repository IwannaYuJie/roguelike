import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { FireProjectile, FrostProjectile, LightningProjectile, EarthProjectile } from '../entities/Projectile'

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
   * 获取随机的能力选项（用于升级选择）。
   */
  public getRandomAbilityOptions(count: number = 3): AbilityDefinition[] {
    const options: AbilityDefinition[] = []
    const availableAbilities = Array.from(this.allAbilities.values())

    // 优先显示未装备的能力
    const unequipped = availableAbilities.filter(
      (def) => !this.equippedAbilities.has(def.id)
    )

    // 如果未装备的能力不够，添加可升级的能力
    const upgradeable = availableAbilities.filter((def) => {
      const equipped = this.equippedAbilities.get(def.id)
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
   * 获取已装备的能力列表。
   */
  public getEquippedAbilities(): AbilityInstance[] {
    return Array.from(this.equippedAbilities.values())
  }
}

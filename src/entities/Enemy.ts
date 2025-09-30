import Phaser from 'phaser'

/**
 * `Enemy` 基类，所有敌人类型的父类。
 * 提供基础的移动、追踪玩家、受击、死亡等功能。
 * 
 * 设计要点：
 * - 简单的追踪AI：朝玩家方向移动
 * - 碰撞伤害：接触玩家造成伤害
 * - 掉落经验值：死亡时生成精粹水晶
 * - 元素抗性：不同敌人对不同元素有不同的抗性
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  // 基础属性
  public maxHealth: number = 10
  public currentHealth: number = 10
  public moveSpeed: number = 80
  public damage: number = 10
  public expValue: number = 1 // 死亡时掉落的经验值

  // 元素抗性系统（值为伤害倍率，1.0=正常，0.5=抗性，1.5=弱点）
  public elementResistances: Map<string, number> = new Map([
    ['fire', 1.0],
    ['frost', 1.0],
    ['lightning', 1.0],
    ['earth', 1.0],
  ])

  // AI行为模式
  public behaviorMode: 'chase' | 'flee' | 'circle' | 'ranged' = 'chase'

  // AI目标
  protected target?: Phaser.GameObjects.GameObject

  // 视觉反馈
  private hitFlashTween?: Phaser.Tweens.Tween

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config?: Partial<{
      health: number
      speed: number
      damage: number
      expValue: number
    }>
  ) {
    super(scene, x, y, texture)

    // 应用自定义配置
    // 应用自定义配置
    if (config) {
      if (config.health !== undefined) {
        this.maxHealth = config.health
        this.currentHealth = config.health
      }
      if (config.speed !== undefined) this.moveSpeed = config.speed
      if (config.damage !== undefined) this.damage = config.damage
      if (config.expValue !== undefined) this.expValue = config.expValue
    }

    // 添加到场景并启用物理引擎
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 配置物理体
    this.setCollideWorldBounds(true)
  }

  /**
   * 设置追踪目标（通常是玩家）。
   */
  public setTarget(target: Phaser.GameObjects.GameObject): void {
    this.target = target
  }

  /**
   * 每帧更新：追踪玩家。
   */
  update(_time: number, _delta: number): void {
    this.moveTowardsTarget()
  }

  /**
   * 朝目标移动（根据行为模式）。
   */
  protected moveTowardsTarget(): void {
    if (!this.target || !this.body) return

    const targetSprite = this.target as Phaser.GameObjects.Sprite
    if (!targetSprite.x || !targetSprite.y) return

    switch (this.behaviorMode) {
      case 'chase':
        this.chaseTarget(targetSprite)
        break
      case 'flee':
        this.fleeFromTarget(targetSprite)
        break
      case 'circle':
        this.circleTarget(targetSprite)
        break
      case 'ranged':
        this.keepDistance(targetSprite)
        break
    }
  }

  /**
   * 追逐目标。
   */
  private chaseTarget(target: Phaser.GameObjects.Sprite): void {
    const direction = new Phaser.Math.Vector2(
      target.x - this.x,
      target.y - this.y
    )

    if (direction.length() > 0) {
      direction.normalize().scale(this.moveSpeed)
      this.setVelocity(direction.x, direction.y)
    }
  }

  /**
   * 逃离目标。
   */
  private fleeFromTarget(target: Phaser.GameObjects.Sprite): void {
    const direction = new Phaser.Math.Vector2(
      this.x - target.x,
      this.y - target.y
    )

    if (direction.length() > 0) {
      direction.normalize().scale(this.moveSpeed)
      this.setVelocity(direction.x, direction.y)
    }
  }

  /**
   * 环绕目标。
   */
  private circleTarget(target: Phaser.GameObjects.Sprite): void {
    const direction = new Phaser.Math.Vector2(
      target.x - this.x,
      target.y - this.y
    )

    const distance = direction.length()
    const idealDistance = 150 // 理想距离

    if (distance > 0) {
      // 如果距离太远，靠近；如果太近，远离
      if (distance > idealDistance + 50) {
        direction.normalize().scale(this.moveSpeed)
      } else if (distance < idealDistance - 50) {
        direction.normalize().scale(-this.moveSpeed)
      } else {
        // 在理想距离内，环绕移动
        direction.rotate(Math.PI / 2) // 旋转90度
        direction.normalize().scale(this.moveSpeed)
      }

      this.setVelocity(direction.x, direction.y)
    }
  }

  /**
   * 保持距离（远程敌人）。
   */
  private keepDistance(target: Phaser.GameObjects.Sprite): void {
    const direction = new Phaser.Math.Vector2(
      target.x - this.x,
      target.y - this.y
    )

    const distance = direction.length()
    const safeDistance = 200 // 安全距离

    if (distance < safeDistance) {
      // 太近了，后退
      direction.normalize().scale(-this.moveSpeed)
      this.setVelocity(direction.x, direction.y)
    } else {
      // 距离合适，停止移动
      this.setVelocity(0, 0)
    }
  }

  /**
   * 受到伤害。
   * @param amount 基础伤害值
   * @param elementType 元素类型（可选）
   */
  public takeDamage(amount: number, elementType: string = 'none'): void {
    // 应用元素抗性
    let finalDamage = amount
    if (elementType !== 'none' && this.elementResistances.has(elementType)) {
      const resistance = this.elementResistances.get(elementType)!
      finalDamage = amount * resistance

      // 显示伤害数字（根据抗性显示不同颜色）
      this.showDamageNumber(finalDamage, resistance)
    }

    this.currentHealth -= finalDamage

    // 受击闪烁反馈
    this.flashWhite()

    if (this.currentHealth <= 0) {
      this.die()
    }
  }

  /**
   * 受击时的白色闪烁效果。
   */
  private flashWhite(): void {
    if (this.hitFlashTween) {
      this.hitFlashTween.stop()
    }

    this.setTint(0xffffff)
    this.hitFlashTween = this.scene.tweens.add({
      targets: this,
      duration: 50,
      repeat: 1,
      yoyo: true,
      onComplete: () => {
        this.clearTint()
      },
    })
  }

  /**
   * 敌人死亡处理。
   */
  protected die(): void {
    // 触发死亡事件，供外部系统监听（如掉落经验值、统计击杀数等）
    this.emit('enemyDied', this)

    // 简单的消失动画
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => {
        this.destroy()
      },
    })
  }

  /**
   * 显示伤害数字。
   */
  private showDamageNumber(damage: number, resistance: number): void {
    // 根据抗性选择颜色
    let color = '#ffffff'
    if (resistance < 0.8) {
      color = '#888888' // 灰色：抗性
    } else if (resistance > 1.2) {
      color = '#ff4444' // 红色：弱点
    }

    const text = this.scene.add.text(
      this.x,
      this.y - 20,
      Math.floor(damage).toString(),
      {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: color,
        stroke: '#000000',
        strokeThickness: 2,
      }
    )
    text.setOrigin(0.5)
    text.setDepth(100)

    // 伤害数字上浮动画
    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        text.destroy()
      },
    })
  }

  /**
   * 设置元素抗性。
   */
  protected setElementResistance(element: string, value: number): void {
    this.elementResistances.set(element, value)
  }

  /**
   * 设置AI行为模式。
   */
  public setBehaviorMode(mode: 'chase' | 'flee' | 'circle' | 'ranged'): void {
    this.behaviorMode = mode
  }

  /**
   * 获取敌人类型名称，供子类重写。
   */
  public getTypeName(): string {
    return 'Enemy'
  }
}

/**
 * `Swarmling` - 虫群敌人。
 * 基础的快速近战敌人，是游戏早期的主要敌人类型。
 * 对所有元素没有特殊抗性。
 */
export class Swarmling extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('swarmling')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0xff4444, 1)
      graphics.fillCircle(0, 0, 8)
      graphics.generateTexture('swarmling', 16, 16)
      graphics.destroy()
    }

    super(scene, x, y, 'swarmling', {
      health: 10,
      speed: 100,
      damage: 5,
      expValue: 1,
    })

    // 虫群对所有元素没有特殊抗性，使用默认值
    this.behaviorMode = 'chase'
  }

  public getTypeName(): string {
    return 'Swarmling'
  }
}

/**
 * `FrostBat` - 冰霜蝙蝠。
 * 免疫冰冻效果，弱点是火元素。
 * 使用环绕攻击模式。
 */
export class FrostBat extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('frostbat')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0x4444ff, 1)
      graphics.fillCircle(0, 0, 10)
      graphics.generateTexture('frostbat', 20, 20)
      graphics.destroy()
    }

    super(scene, x, y, 'frostbat', {
      health: 15,
      speed: 120,
      damage: 8,
      expValue: 2,
    })

    // 冰霜蝙蝠对冰元素免疫，对火元素弱
    this.setElementResistance('frost', 0.2) // 80%抗性
    this.setElementResistance('fire', 1.5) // 50%额外伤害

    // 使用环绕攻击模式
    this.behaviorMode = 'circle'
  }

  public getTypeName(): string {
    return 'FrostBat'
  }
}

/**
 * `RockGolem` - 岩石魔像。
 * 高生命值和护甲，移动缓慢，弱点是土元素的破甲效果。
 * 对物理攻击有高抗性。
 */
export class RockGolem extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('rockgolem')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0x888888, 1)
      graphics.fillRect(-12, -12, 24, 24)
      graphics.generateTexture('rockgolem', 24, 24)
      graphics.destroy()
    }

    super(scene, x, y, 'rockgolem', {
      health: 50,
      speed: 40,
      damage: 15,
      expValue: 5,
    })

    // 岩石魔像对大多数元素有抗性，但对土元素弱
    this.setElementResistance('fire', 0.7) // 30%抗性
    this.setElementResistance('frost', 0.7) // 30%抗性
    this.setElementResistance('lightning', 0.8) // 20%抗性
    this.setElementResistance('earth', 1.8) // 80%额外伤害（破甲）

    this.behaviorMode = 'chase'
  }

  public getTypeName(): string {
    return 'RockGolem'
  }
}

// ==================== 精英敌人 ====================

/**
 * `EliteSwarmling` - 精英虫群。
 * 更强大的虫群变种，生命值和伤害更高。
 */
export class EliteSwarmling extends Swarmling {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    
    // 精英属性：2倍生命值和伤害
    this.maxHealth = 20
    this.currentHealth = 20
    this.damage = 20
    this.expValue = 5
    this.moveSpeed = 120
    
    // 精英标记（金色光环）
    this.setTint(0xffaa00)
    this.setScale(1.3)
  }

  public getTypeName(): string {
    return 'EliteSwarmling'
  }
}

/**
 * `EliteFrostBat` - 精英冰霜蝙蝠。
 */
export class EliteFrostBat extends FrostBat {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    
    this.maxHealth = 40
    this.currentHealth = 40
    this.damage = 25
    this.expValue = 8
    this.moveSpeed = 140
    
    this.setTint(0x00ffff)
    this.setScale(1.3)
  }

  public getTypeName(): string {
    return 'EliteFrostBat'
  }
}

/**
 * `EliteRockGolem` - 精英岩石魔像。
 */
export class EliteRockGolem extends RockGolem {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    
    this.maxHealth = 100
    this.currentHealth = 100
    this.damage = 30
    this.expValue = 15
    this.moveSpeed = 60
    
    this.setTint(0xff6600)
    this.setScale(1.5)
  }

  public getTypeName(): string {
    return 'EliteRockGolem'
  }
}

// ==================== 首领 ====================

/**
 * `BossLavaTurtle` - 熔岩巨龟（10分钟首领）。
 * 巨大的熔岩生物，拥有高生命值和强大的范围攻击。
 */
export class BossLavaTurtle extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('boss_lava_turtle')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0xff4400, 1)
      graphics.fillCircle(0, 0, 40)
      graphics.fillStyle(0x886644, 1)
      graphics.fillCircle(0, 0, 30)
      graphics.generateTexture('boss_lava_turtle', 80, 80)
      graphics.destroy()
    }

    super(scene, x, y, 'boss_lava_turtle', {
      health: 500,
      speed: 30,
      damage: 40,
      expValue: 100,
    })

    // 首领对所有元素有一定抗性
    this.setElementResistance('fire', 0.5) // 50%抗性
    this.setElementResistance('frost', 1.2)
    this.setElementResistance('lightning', 1.0)
    this.setElementResistance('earth', 0.8)

    this.behaviorMode = 'chase'
    this.setScale(2)
    this.setTint(0xff0000)
  }

  public getTypeName(): string {
    return 'BossLavaTurtle'
  }
}

/**
 * `BossChaosAlchemist` - 炼金之混沌（最终首领）。
 * 游戏的最终挑战，拥有极高的生命值和多样化的攻击模式。
 */
export class BossChaosAlchemist extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('boss_chaos_alchemist')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0x8800ff, 1)
      graphics.fillCircle(0, 0, 50)
      graphics.fillStyle(0xff00ff, 0.7)
      graphics.fillCircle(0, 0, 40)
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(0, 0, 20)
      graphics.generateTexture('boss_chaos_alchemist', 100, 100)
      graphics.destroy()
    }

    super(scene, x, y, 'boss_chaos_alchemist', {
      health: 2000,
      speed: 50,
      damage: 60,
      expValue: 500,
    })

    // 最终首领对所有元素都有抗性
    this.setElementResistance('fire', 0.8)
    this.setElementResistance('frost', 0.8)
    this.setElementResistance('lightning', 0.8)
    this.setElementResistance('earth', 0.8)

    this.behaviorMode = 'circle'
    this.setScale(2.5)
    this.setTint(0xff00ff)
  }

  public getTypeName(): string {
    return 'BossChaosAlchemist'
  }
}

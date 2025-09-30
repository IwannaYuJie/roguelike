import Phaser from 'phaser'

/**
 * `Enemy` 基类，所有敌人类型的父类。
 * 提供基础的移动、追踪玩家、受击、死亡等功能。
 * 
 * 设计要点：
 * - 简单的追踪AI：朝玩家方向移动
 * - 碰撞伤害：接触玩家造成伤害
 * - 掉落经验值：死亡时生成精粹水晶
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  // 基础属性
  public maxHealth: number = 10
  public currentHealth: number = 10
  public moveSpeed: number = 80
  public damage: number = 10
  public expValue: number = 1 // 死亡时掉落的经验值

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
   * 朝目标移动。
   */
  protected moveTowardsTarget(): void {
    if (!this.target || !this.body) return

    const targetSprite = this.target as Phaser.GameObjects.Sprite
    if (!targetSprite.x || !targetSprite.y) return

    // 计算朝向玩家的方向向量
    const direction = new Phaser.Math.Vector2(
      targetSprite.x - this.x,
      targetSprite.y - this.y
    )

    if (direction.length() > 0) {
      direction.normalize().scale(this.moveSpeed)
      this.setVelocity(direction.x, direction.y)
    }
  }

  /**
   * 受到伤害。
   */
  public takeDamage(amount: number): void {
    this.currentHealth -= amount

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
   * 获取敌人类型名称，供子类重写。
   */
  public getTypeName(): string {
    return 'Enemy'
  }
}

/**
 * `Swarmling` - 虫群敌人。
 * 基础的快速近战敌人，是游戏早期的主要敌人类型。
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
  }

  public getTypeName(): string {
    return 'Swarmling'
  }
}

/**
 * `FrostBat` - 冰霜蝙蝠。
 * 免疫冰冻效果，弱点是火元素。
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
  }

  public getTypeName(): string {
    return 'FrostBat'
  }
}

/**
 * `RockGolem` - 岩石魔像。
 * 高生命值和护甲，移动缓慢，弱点是土元素的破甲效果。
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
  }

  public getTypeName(): string {
    return 'RockGolem'
  }
}

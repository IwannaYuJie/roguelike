import Phaser from 'phaser'

/**
 * `Projectile` 投射物基类。
 * 用于玩家的元素攻击、敌人的远程攻击等。
 * 
 * 设计要点：
 * - 支持不同的元素类型（火、霜、电、土）
 * - 自动飞行并在碰撞或超时后销毁
 * - 可配置伤害、速度、生命周期等属性
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  // 基础属性
  public damage: number = 10
  public elementType: string = 'none' // 元素类型：fire, frost, lightning, earth
  public lifespan: number = 3000 // 生命周期（毫秒）
  public speed: number = 300

  // 内部状态
  private birthTime: number = 0

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config?: Partial<{
      damage: number
      elementType: string
      lifespan: number
      speed: number
    }>
  ) {
    super(scene, x, y, texture)

    // 应用自定义配置
    if (config) {
      if (config.damage !== undefined) this.damage = config.damage
      if (config.elementType !== undefined) this.elementType = config.elementType
      if (config.lifespan !== undefined) this.lifespan = config.lifespan
      if (config.speed !== undefined) this.speed = config.speed
    }

    // 添加到场景并启用物理引擎
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 记录创建时间
    this.birthTime = scene.time.now

    // 设置深度，确保在玩家和敌人之间显示
    this.setDepth(10)
  }

  /**
   * 发射投射物到指定方向。
   * @param direction 方向向量（会被自动标准化）
   */
  public launch(direction: Phaser.Math.Vector2): void {
    if (!this.body) return

    // 标准化方向并应用速度
    const velocity = direction.clone().normalize().scale(this.speed)
    this.setVelocity(velocity.x, velocity.y)

    // 设置旋转角度，让投射物朝向飞行方向
    this.setRotation(Math.atan2(velocity.y, velocity.x))
  }

  /**
   * 每帧更新：检查生命周期。
   */
  update(time: number, _delta: number): void {
    // 超过生命周期则销毁
    if (time - this.birthTime > this.lifespan) {
      this.destroy()
    }
  }

  /**
   * 击中目标时调用。
   */
  public onHit(): void {
    // 播放击中特效（根据元素类型）
    this.playHitEffect()

    // 销毁投射物
    this.destroy()
  }

  /**
   * 播放击中特效。
   */
  private playHitEffect(): void {
    // 根据元素类型显示不同的特效
    let color = 0xffffff

    switch (this.elementType) {
      case 'fire':
        color = 0xff4400
        break
      case 'frost':
        color = 0x44aaff
        break
      case 'lightning':
        color = 0xffff00
        break
      case 'earth':
        color = 0x886644
        break
    }

    // 简单的粒子爆炸效果
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      tint: color,
      lifespan: 300,
      quantity: 8,
      blendMode: 'ADD',
    })

    // 粒子播放完后销毁
    this.scene.time.delayedCall(300, () => {
      particles.destroy()
    })
  }
}

/**
 * `FireProjectile` - 火焰投射物。
 * 基础的火元素攻击，造成持续伤害。
 */
export class FireProjectile extends Projectile {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('fire_projectile')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0xff4400, 1)
      graphics.fillCircle(0, 0, 6)
      graphics.generateTexture('fire_projectile', 12, 12)
      graphics.destroy()
    }

    super(scene, x, y, 'fire_projectile', {
      damage: 15,
      elementType: 'fire',
      lifespan: 2000,
      speed: 350,
    })

    // 添加发光效果
    this.setBlendMode(Phaser.BlendModes.ADD)
  }
}

/**
 * `FrostProjectile` - 冰霜投射物。
 * 冰元素攻击，可以减速敌人。
 */
export class FrostProjectile extends Projectile {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('frost_projectile')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0x44aaff, 1)
      graphics.fillCircle(0, 0, 6)
      graphics.generateTexture('frost_projectile', 12, 12)
      graphics.destroy()
    }

    super(scene, x, y, 'frost_projectile', {
      damage: 10,
      elementType: 'frost',
      lifespan: 2500,
      speed: 300,
    })
  }
}

/**
 * `LightningProjectile` - 闪电投射物。
 * 电元素攻击，可以连锁攻击多个敌人。
 */
export class LightningProjectile extends Projectile {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('lightning_projectile')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0xffff00, 1)
      graphics.fillCircle(0, 0, 5)
      graphics.generateTexture('lightning_projectile', 10, 10)
      graphics.destroy()
    }

    super(scene, x, y, 'lightning_projectile', {
      damage: 12,
      elementType: 'lightning',
      lifespan: 1500,
      speed: 450,
    })

    // 添加发光效果
    this.setBlendMode(Phaser.BlendModes.ADD)
  }
}

/**
 * `EarthProjectile` - 大地投射物。
 * 土元素攻击，速度慢但伤害高，可以破甲。
 */
export class EarthProjectile extends Projectile {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 创建占位图形
    if (!scene.textures.exists('earth_projectile')) {
      const graphics = scene.add.graphics()
      graphics.fillStyle(0x886644, 1)
      graphics.fillRect(-6, -6, 12, 12)
      graphics.generateTexture('earth_projectile', 12, 12)
      graphics.destroy()
    }

    super(scene, x, y, 'earth_projectile', {
      damage: 20,
      elementType: 'earth',
      lifespan: 3000,
      speed: 250,
    })
  }
}

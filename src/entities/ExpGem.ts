import Phaser from 'phaser'

/**
 * `ExpGem` 经验宝石类。
 * 敌人死亡时掉落，玩家靠近时自动吸引并拾取。
 * 
 * 设计要点：
 * - 根据经验值大小显示不同颜色和大小
 * - 玩家靠近时会被吸引（磁力效果）
 * - 拾取后触发经验获取事件
 */
export class ExpGem extends Phaser.Physics.Arcade.Sprite {
  // 基础属性
  public expValue: number = 1
  public magnetRange: number = 100 // 磁力吸引范围
  public magnetSpeed: number = 300 // 被吸引时的移动速度

  // 内部状态
  private isBeingAttracted: boolean = false
  private target?: Phaser.GameObjects.GameObject

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    expValue: number = 1
  ) {
    // 根据经验值选择纹理
    const texture = ExpGem.getTextureForValue(scene, expValue)
    super(scene, x, y, texture)

    this.expValue = expValue

    // 添加到场景并启用物理引擎
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 配置物理体
    this.setCollideWorldBounds(true)
    this.setBounce(0.3, 0.3)
    this.setDrag(200, 200)

    // 设置深度，确保在地面上但在玩家下方
    this.setDepth(5)

    // 添加闪烁动画
    this.addTwinkleEffect()

    // 生成时的弹出效果
    this.playSpawnEffect()
  }

  /**
   * 根据经验值获取对应的纹理。
   * 小经验值：绿色小宝石
   * 中经验值：蓝色中宝石
   * 大经验值：紫色大宝石
   */
  private static getTextureForValue(scene: Phaser.Scene, value: number): string {
    if (value <= 2) {
      // 小宝石
      if (!scene.textures.exists('exp_gem_small')) {
        const graphics = scene.add.graphics()
        graphics.fillStyle(0x00ff88, 1)
        graphics.fillCircle(0, 0, 4)
        graphics.generateTexture('exp_gem_small', 8, 8)
        graphics.destroy()
      }
      return 'exp_gem_small'
    } else if (value <= 5) {
      // 中宝石
      if (!scene.textures.exists('exp_gem_medium')) {
        const graphics = scene.add.graphics()
        graphics.fillStyle(0x4488ff, 1)
        graphics.fillCircle(0, 0, 6)
        graphics.generateTexture('exp_gem_medium', 12, 12)
        graphics.destroy()
      }
      return 'exp_gem_medium'
    } else {
      // 大宝石
      if (!scene.textures.exists('exp_gem_large')) {
        const graphics = scene.add.graphics()
        graphics.fillStyle(0xaa44ff, 1)
        graphics.fillCircle(0, 0, 8)
        graphics.generateTexture('exp_gem_large', 16, 16)
        graphics.destroy()
      }
      return 'exp_gem_large'
    }
  }

  /**
   * 添加闪烁效果。
   */
  private addTwinkleEffect(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.6 },
      scale: { from: 1, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  /**
   * 生成时的弹出效果。
   */
  private playSpawnEffect(): void {
    // 随机弹出方向
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)
    const force = Phaser.Math.FloatBetween(50, 150)
    const vx = Math.cos(angle) * force
    const vy = Math.sin(angle) * force - 100 // 向上弹出

    this.setVelocity(vx, vy)

    // 从小到大的缩放动画
    this.setScale(0)
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    })
  }

  /**
   * 设置吸引目标（通常是玩家）。
   */
  public setTarget(target: Phaser.GameObjects.GameObject): void {
    this.target = target
  }

  /**
   * 每帧更新：检查是否应该被吸引。
   */
  update(_time: number, _delta: number): void {
    if (!this.target || !this.body) return

    const targetSprite = this.target as Phaser.GameObjects.Sprite
    if (!targetSprite.x || !targetSprite.y) return

    // 计算与目标的距离
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      targetSprite.x,
      targetSprite.y
    )

    // 如果在磁力范围内，开始吸引
    if (distance <= this.magnetRange) {
      this.attractToTarget(targetSprite)
    }
  }

  /**
   * 被吸引到目标。
   */
  private attractToTarget(target: Phaser.GameObjects.Sprite): void {
    if (!this.body) return

    this.isBeingAttracted = true

    // 计算朝向目标的方向向量
    const direction = new Phaser.Math.Vector2(
      target.x - this.x,
      target.y - this.y
    )

    if (direction.length() > 0) {
      direction.normalize().scale(this.magnetSpeed)
      this.setVelocity(direction.x, direction.y)
    }
  }

  /**
   * 被拾取时调用。
   */
  public onCollected(): void {
    // 播放拾取特效
    this.playCollectEffect()

    // 触发拾取事件
    this.emit('collected', this.expValue)

    // 销毁宝石
    this.destroy()
  }

  /**
   * 播放拾取特效。
   */
  private playCollectEffect(): void {
    // 快速缩小并上升
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      y: this.y - 30,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
    })

    // 粒子效果
    const color = this.expValue <= 2 ? 0x00ff88 : this.expValue <= 5 ? 0x4488ff : 0xaa44ff

    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.4, end: 0 },
      tint: color,
      lifespan: 300,
      quantity: 5,
      blendMode: 'ADD',
    })

    // 粒子播放完后销毁
    this.scene.time.delayedCall(300, () => {
      particles.destroy()
    })
  }

  /**
   * 获取是否正在被吸引。
   */
  public isAttracted(): boolean {
    return this.isBeingAttracted
  }
}

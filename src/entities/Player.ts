import Phaser from 'phaser'
import { FireProjectile } from './Projectile'

/**
 * `Player` 类负责玩家角色的所有逻辑：移动、生命值、冲刺技能等。
 * 继承自 Phaser.Physics.Arcade.Sprite，可以直接使用物理引擎功能。
 * 
 * 设计要点：
 * - WASD移动控制（后续支持触屏虚拟摇杆）
 * - 带元素附魔的冲刺技能（短暂无敌帧）
 * - 自动攻击：装备的元素能力根据冷却自动触发
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  // 基础属性
  public maxHealth: number = 100
  public currentHealth: number = 100
  public moveSpeed: number = 160

  // 经验与等级系统
  public currentExp: number = 0
  public currentLevel: number = 1
  public expToNextLevel: number = 10

  // 攻击系统
  public attackDamage: number = 15
  public attackCooldown: number = 1000 // 毫秒
  public attackRange: number = 400 // 攻击范围
  private lastAttackTime: number = 0
  private canAttack: boolean = true

  // 冲刺技能
  public dashSpeed: number = 400
  public dashDuration: number = 200 // 毫秒
  public dashCooldown: number = 3000 // 毫秒
  private isDashing: boolean = false
  private canDash: boolean = true

  // 输入控制
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd?: {
    up: Phaser.Input.Keyboard.Key
    down: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
  }
  private spaceKey?: Phaser.Input.Keyboard.Key

  // 视觉反馈
  private hitFlashTween?: Phaser.Tweens.Tween

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')

    // 添加到场景并启用物理引擎
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // 配置物理体
    this.setCollideWorldBounds(true)
    this.setDrag(800, 800) // 添加阻力，让移动更流畅

    // 初始化输入
    this.setupInput()

    // 临时使用简单的图形代替精灵
    // 后续会替换为实际的美术资源
    this.createPlaceholderGraphics()
  }

  /**
   * 创建占位图形，便于原型测试。
   * 后续会用真实的角色精灵图替换。
   */
  private createPlaceholderGraphics(): void {
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(0x00ff00, 1)
    graphics.fillCircle(0, 0, 16)
    graphics.generateTexture('player', 32, 32)
    graphics.destroy()

    this.setTexture('player')
  }

  /**
   * 设置输入控制：方向键、WASD、空格冲刺。
   */
  private setupInput(): void {
    if (!this.scene.input.keyboard) return

    this.cursors = this.scene.input.keyboard.createCursorKeys()

    this.wasd = {
      up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }

    this.spaceKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    )
  }

  /**
   * 每帧更新：处理移动、冲刺、攻击等逻辑。
   */
  update(time: number, _delta: number): void {
    this.handleMovement()
    this.handleDash()
    this.handleAutoAttack(time)
  }

  /**
   * 处理玩家移动输入。
   */
  private handleMovement(): void {
    if (this.isDashing) return // 冲刺时不接受移动输入

    if (!this.cursors || !this.wasd) return

    const moveX =
      (this.cursors.left.isDown || this.wasd.left.isDown ? -1 : 0) +
      (this.cursors.right.isDown || this.wasd.right.isDown ? 1 : 0)

    const moveY =
      (this.cursors.up.isDown || this.wasd.up.isDown ? -1 : 0) +
      (this.cursors.down.isDown || this.wasd.down.isDown ? 1 : 0)

    // 标准化对角线移动速度
    const velocity = new Phaser.Math.Vector2(moveX, moveY)
    if (velocity.length() > 0) {
      velocity.normalize().scale(this.moveSpeed)
    }

    this.setVelocity(velocity.x, velocity.y)
  }

  /**
   * 处理冲刺技能。
   * TODO: 后续添加元素附魔效果（火焰轨迹、冰冻范围等）
   */
  private handleDash(): void {
    if (!this.spaceKey) return

    // 触发冲刺
    if (
      Phaser.Input.Keyboard.JustDown(this.spaceKey) &&
      this.canDash &&
      !this.isDashing
    ) {
      this.executeDash()
    }
  }

  /**
   * 执行冲刺动作。
   */
  private executeDash(): void {
    // 获取当前移动方向
    const dashDirection = new Phaser.Math.Vector2(this.body!.velocity.x, this.body!.velocity.y)

    // 如果静止不动，默认朝向右方冲刺
    if (dashDirection.length() === 0) {
      dashDirection.set(1, 0)
    }

    dashDirection.normalize().scale(this.dashSpeed)

    this.isDashing = true
    this.canDash = false

    // 设置冲刺速度
    this.setVelocity(dashDirection.x, dashDirection.y)

    // 视觉反馈：半透明效果
    this.setAlpha(0.6)

    // 冲刺持续时间结束
    this.scene.time.delayedCall(this.dashDuration, () => {
      this.isDashing = false
      this.setAlpha(1)
    })

    // 冷却时间
    this.scene.time.delayedCall(this.dashCooldown, () => {
      this.canDash = true
    })
  }

  /**
   * 受到伤害。
   */
  public takeDamage(amount: number): void {
    // 冲刺时有无敌帧
    if (this.isDashing) return

    this.currentHealth = Math.max(0, this.currentHealth - amount)

    // 受击闪烁反馈
    this.flashRed()

    // 触发受击事件
    this.emit('healthChanged', this.currentHealth, this.maxHealth)

    if (this.currentHealth <= 0) {
      this.die()
    }
  }

  /**
   * 受击时的红色闪烁效果。
   */
  private flashRed(): void {
    if (this.hitFlashTween) {
      this.hitFlashTween.stop()
    }

    this.setTint(0xff0000)
    this.hitFlashTween = this.scene.tweens.add({
      targets: this,
      duration: 100,
      repeat: 2,
      yoyo: true,
      onComplete: () => {
        this.clearTint()
      },
    })
  }

  /**
   * 玩家死亡处理。
   */
  private die(): void {
    this.emit('playerDied')
    // TODO: 播放死亡动画，显示游戏结束界面
    this.setActive(false)
    this.setVisible(false)
  }

  /**
   * 恢复生命值。
   */
  public heal(amount: number): void {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount)
    this.emit('healthChanged', this.currentHealth, this.maxHealth)
  }

  /**
   * 处理自动攻击逻辑。
   * 自动朝最近的敌人发射投射物。
   */
  private handleAutoAttack(time: number): void {
    // 检查冷却时间
    if (time - this.lastAttackTime < this.attackCooldown) {
      return
    }

    if (!this.canAttack) return

    // 触发攻击事件，让GameScene处理寻找目标和发射投射物
    this.emit('requestAttack')
    this.lastAttackTime = time
  }

  /**
   * 发射投射物到指定方向。
   * 由GameScene调用，传入目标方向。
   */
  public fireProjectile(direction: Phaser.Math.Vector2): void {
    // 创建火焰投射物（默认元素）
    const projectile = new FireProjectile(this.scene, this.x, this.y)
    projectile.launch(direction)

    // 触发投射物创建事件，让GameScene处理碰撞检测
    this.emit('projectileCreated', projectile)
  }

  /**
   * 获得经验值。
   */
  public gainExp(amount: number): void {
    this.currentExp += amount

    // 触发经验变化事件
    this.emit('expChanged', this.currentExp, this.expToNextLevel)

    // 检查是否升级
    while (this.currentExp >= this.expToNextLevel) {
      this.levelUp()
    }
  }

  /**
   * 升级处理。
   */
  private levelUp(): void {
    this.currentExp -= this.expToNextLevel
    this.currentLevel++

    // 计算下一级所需经验（指数增长）
    this.expToNextLevel = Math.floor(10 * Math.pow(1.5, this.currentLevel - 1))

    // 触发升级事件
    this.emit('levelUp', this.currentLevel)

    // TODO: 显示升级选择界面
  }

  /**
   * 获取当前等级。
   */
  public getLevel(): number {
    return this.currentLevel
  }

  /**
   * 获取当前经验值。
   */
  public getExp(): number {
    return this.currentExp
  }

  /**
   * 获取升级所需经验值。
   */
  public getExpToNextLevel(): number {
    return this.expToNextLevel
  }
}

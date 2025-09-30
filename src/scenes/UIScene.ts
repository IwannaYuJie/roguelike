import Phaser from 'phaser'

/**
 * `UIScene` 与 `GameScene` 并行运行，用于渲染HUD、升级选择、
 * 元素协同提示等界面。
 * 
 * 当前阶段实现：
 * - 生命值显示
 * - 经验条与等级显示
 * - 游戏计时器
 * - 击杀统计
 */
export class UIScene extends Phaser.Scene {
  private healthText?: Phaser.GameObjects.Text
  private timerText?: Phaser.GameObjects.Text
  private killCountText?: Phaser.GameObjects.Text
  private levelText?: Phaser.GameObjects.Text
  private expBar?: Phaser.GameObjects.Graphics
  private expBarBg?: Phaser.GameObjects.Graphics

  private gameTime: number = 0
  private killCount: number = 0
  private currentExp: number = 0
  private expToNextLevel: number = 10

  constructor() {
    super('UIScene')
  }

  create(): void {
    // 生命值显示
    this.healthText = this.add
      .text(16, 16, '生命: 100/100', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(1000)

    // 计时器显示
    this.timerText = this.add
      .text(480, 16, '时间: 00:00', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1000)

    // 击杀统计
    this.killCountText = this.add
      .text(944, 16, '击杀: 0', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffaa00',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000)

    // 等级显示
    this.levelText = this.add
      .text(16, 50, 'Lv.1', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(1000)

    // 经验条背景
    this.expBarBg = this.add.graphics()
    this.expBarBg.fillStyle(0x333333, 0.8)
    this.expBarBg.fillRect(16, 80, 200, 12)
    this.expBarBg.setScrollFactor(0)
    this.expBarBg.setDepth(999)

    // 经验条
    this.expBar = this.add.graphics()
    this.expBar.setScrollFactor(0)
    this.expBar.setDepth(1000)
    this.updateExpBar()

    // 监听GameScene的事件
    const gameScene = this.scene.get('GameScene')
    gameScene.events.on('updatePlayerHealth', this.updateHealthDisplay, this)
    gameScene.events.on('enemyKilled', this.onEnemyKilled, this)
    gameScene.events.on('updatePlayerExp', this.updateExpDisplay, this)
    gameScene.events.on('playerLevelUp', this.onPlayerLevelUp, this)
  }

  update(_time: number, delta: number): void {
    // 更新计时器
    this.gameTime += delta
    this.updateTimerDisplay()
  }

  /**
   * 更新生命值显示。
   */
  private updateHealthDisplay(current: number, max: number): void {
    if (!this.healthText) return

    this.healthText.setText(`生命: ${Math.ceil(current)}/${max}`)

    // 根据生命值百分比改变颜色
    const percent = current / max
    if (percent > 0.6) {
      this.healthText.setColor('#00ff00')
    } else if (percent > 0.3) {
      this.healthText.setColor('#ffaa00')
    } else {
      this.healthText.setColor('#ff0000')
    }
  }

  /**
   * 更新计时器显示。
   */
  private updateTimerDisplay(): void {
    if (!this.timerText) return

    const totalSeconds = Math.floor(this.gameTime / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    this.timerText.setText(
      `时间: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    )
  }

  /**
   * 敌人被击杀回调。
   */
  private onEnemyKilled(_enemyType: string, totalKills: number): void {
    this.killCount = totalKills
    if (this.killCountText) {
      this.killCountText.setText(`击杀: ${this.killCount}`)
    }
  }

  /**
   * 更新经验显示。
   */
  private updateExpDisplay(current: number, toNext: number): void {
    this.currentExp = current
    this.expToNextLevel = toNext
    this.updateExpBar()
  }

  /**
   * 更新经验条。
   */
  private updateExpBar(): void {
    if (!this.expBar) return

    this.expBar.clear()

    // 计算经验百分比
    const percent = Math.min(this.currentExp / this.expToNextLevel, 1)
    const barWidth = 200 * percent

    // 绘制经验条
    this.expBar.fillStyle(0x00aaff, 1)
    this.expBar.fillRect(16, 80, barWidth, 12)

    // 绘制边框
    this.expBar.lineStyle(2, 0xffffff, 0.5)
    this.expBar.strokeRect(16, 80, 200, 12)
  }

  /**
   * 玩家升级回调。
   */
  private onPlayerLevelUp(level: number): void {
    if (this.levelText) {
      this.levelText.setText(`Lv.${level}`)

      // 升级闪烁效果
      this.tweens.add({
        targets: this.levelText,
        scale: { from: 1, to: 1.3 },
        duration: 200,
        yoyo: true,
        repeat: 2,
      })
    }
  }
}

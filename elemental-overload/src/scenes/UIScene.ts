import Phaser from 'phaser'

/**
 * `UIScene` 与 `GameScene` 并行运行，用于渲染HUD、升级选择、
 * 元素协同提示等界面。
 * 
 * 当前阶段实现：
 * - 生命值显示
 * - 游戏计时器
 * - 击杀统计
 */
export class UIScene extends Phaser.Scene {
  private healthText?: Phaser.GameObjects.Text
  private timerText?: Phaser.GameObjects.Text
  private killCountText?: Phaser.GameObjects.Text

  private gameTime: number = 0
  private killCount: number = 0

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

    // 监听GameScene的事件
    const gameScene = this.scene.get('GameScene')
    gameScene.events.on('updatePlayerHealth', this.updateHealthDisplay, this)
    gameScene.events.on('enemyKilled', this.onEnemyKilled, this)
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
  private onEnemyKilled(_enemyType: string, _expValue: number): void {
    this.killCount++
    if (this.killCountText) {
      this.killCountText.setText(`击杀: ${this.killCount}`)
    }
  }
}

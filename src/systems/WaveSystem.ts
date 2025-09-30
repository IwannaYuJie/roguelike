import Phaser from 'phaser'

/**
 * 波次配置接口。
 */
export interface WaveConfig {
  time: number // 触发时间（秒）
  enemies: Array<{
    type: string // 敌人类型
    count: number // 数量
    interval?: number // 生成间隔（毫秒）
  }>
  message?: string // 波次提示信息
  isBoss?: boolean // 是否为首领战
}

/**
 * `WaveSystem` 波次管理系统。
 * 负责管理游戏的波次节奏、敌人生成时机和首领战。
 */
export class WaveSystem {
  private scene: Phaser.Scene
  private waves: WaveConfig[] = []
  private currentWaveIndex: number = 0
  private gameTime: number = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.initializeWaves()
  }

  /**
   * 初始化波次配置（基于设计文档的20分钟游戏节奏）。
   */
  private initializeWaves(): void {
    // 0-1分钟：脆弱期，少量虫群
    this.waves.push({
      time: 0,
      enemies: [{ type: 'swarmling', count: 3, interval: 2000 }],
      message: '游戏开始！',
    })

    // 3分钟：大规模虫群，测试范围伤害
    this.waves.push({
      time: 180,
      enemies: [{ type: 'swarmling', count: 30, interval: 100 }],
      message: '虫群来袭！',
    })

    // 5分钟：引入冰霜蝙蝠，测试元素克制
    this.waves.push({
      time: 300,
      enemies: [
        { type: 'swarmling', count: 10, interval: 500 },
        { type: 'frostbat', count: 5, interval: 1000 },
      ],
      message: '冰霜蝙蝠出现了！',
    })

    // 7分钟：混合波次
    this.waves.push({
      time: 420,
      enemies: [
        { type: 'swarmling', count: 15, interval: 300 },
        { type: 'frostbat', count: 8, interval: 800 },
        { type: 'rockgolem', count: 3, interval: 2000 },
      ],
      message: '混合部队来袭！',
    })

    // 10分钟：首领战 - 熔岩巨龟
    this.waves.push({
      time: 600,
      enemies: [{ type: 'boss_lava_turtle', count: 1 }],
      message: '⚠️ 首领出现：熔岩巨龟！',
      isBoss: true,
    })

    // 12分钟：持盾敌人波次
    this.waves.push({
      time: 720,
      enemies: [
        { type: 'rockgolem', count: 10, interval: 500 },
        { type: 'frostbat', count: 10, interval: 500 },
      ],
      message: '重装部队来袭！',
    })

    // 15分钟：精英波次
    this.waves.push({
      time: 900,
      enemies: [
        { type: 'elite_swarmling', count: 5, interval: 1000 },
        { type: 'elite_frostbat', count: 3, interval: 1500 },
        { type: 'elite_rockgolem', count: 2, interval: 2000 },
      ],
      message: '⚠️ 精英部队出现！',
    })

    // 18分钟：终焉之潮前奏
    this.waves.push({
      time: 1080,
      enemies: [
        { type: 'swarmling', count: 50, interval: 100 },
        { type: 'frostbat', count: 20, interval: 200 },
        { type: 'rockgolem', count: 10, interval: 500 },
      ],
      message: '⚠️ 终焉之潮即将到来！',
    })

    // 20分钟：最终首领战
    this.waves.push({
      time: 1200,
      enemies: [{ type: 'boss_chaos_alchemist', count: 1 }],
      message: '⚠️⚠️⚠️ 最终首领：炼金之混沌！',
      isBoss: true,
    })
  }

  /**
   * 更新波次系统。
   */
  public update(deltaTime: number): void {
    this.gameTime += deltaTime / 1000 // 转换为秒

    // 检查是否需要触发下一个波次
    if (this.currentWaveIndex < this.waves.length) {
      const nextWave = this.waves[this.currentWaveIndex]
      if (this.gameTime >= nextWave.time) {
        this.triggerWave(nextWave)
        this.currentWaveIndex++
      }
    }
  }

  /**
   * 触发一个波次。
   */
  private triggerWave(wave: WaveConfig): void {
    // 显示波次提示
    if (wave.message) {
      this.showWaveMessage(wave.message, wave.isBoss)
    }

    // 触发波次事件，让GameScene生成敌人
    this.scene.events.emit('waveTriggered', wave)
  }

  /**
   * 显示波次提示信息。
   */
  private showWaveMessage(message: string, isBoss: boolean = false): void {
    const color = isBoss ? '#ff0000' : '#ffff00'
    const fontSize = isBoss ? '36px' : '28px'

    const text = this.scene.add.text(480, 100, message, {
      fontFamily: 'sans-serif',
      fontSize: fontSize,
      color: color,
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
    })
    text.setOrigin(0.5)
    text.setDepth(2000)
    text.setScrollFactor(0)

    // 动画效果
    this.scene.tweens.add({
      targets: text,
      y: 80,
      alpha: 0,
      scale: isBoss ? 1.5 : 1.2,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy()
      },
    })

    // 如果是首领战，播放震动效果
    if (isBoss) {
      this.scene.cameras.main.shake(500, 0.01)
    }
  }

  /**
   * 获取当前游戏时间（秒）。
   */
  public getGameTime(): number {
    return this.gameTime
  }

  /**
   * 获取当前波次索引。
   */
  public getCurrentWaveIndex(): number {
    return this.currentWaveIndex
  }

  /**
   * 重置波次系统。
   */
  public reset(): void {
    this.currentWaveIndex = 0
    this.gameTime = 0
  }
}

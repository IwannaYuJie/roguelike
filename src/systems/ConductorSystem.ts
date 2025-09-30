import Phaser from 'phaser'

/**
 * 玩家表现数据接口。
 */
interface PlayerPerformance {
  healthPercentage: number // 生命值百分比
  killRate: number // 击杀速度（每秒击杀数）
  damageReceived: number // 受到的伤害
  survivalTime: number // 生存时间
}

/**
 * `ConductorSystem` 指挥家动态难度调整系统。
 * 根据玩家表现动态调整敌人生成的构成，确保挑战性与趣味性平衡。
 * 
 * 设计理念：
 * - 不直接调整敌人强度，而是调整敌人构成的多样性
 * - 玩家表现好时增加骚扰型敌人和抗性敌人
 * - 玩家陷入困境时减少投射物敌人，增加可预测的近战敌人
 */
export class ConductorSystem {
  private scene: Phaser.Scene
  private checkInterval: number = 30000 // 30秒检查一次
  private lastCheckTime: number = 0
  
  // 难度调整参数
  private difficultyMultiplier: number = 1.0 // 1.0 = 正常难度
  private harassmentFactor: number = 1.0 // 骚扰型敌人比例
  private resistanceFactor: number = 1.0 // 抗性敌人比例
  
  // 玩家表现追踪
  private recentKills: number = 0
  private recentDamage: number = 0
  private lastPerformanceCheck: PlayerPerformance = {
    healthPercentage: 100,
    killRate: 0,
    damageReceived: 0,
    survivalTime: 0,
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * 更新指挥家系统。
   */
  public update(time: number, _delta: number): void {
    // 每30秒检查一次玩家表现
    if (time - this.lastCheckTime >= this.checkInterval) {
      this.lastCheckTime = time
      this.analyzePlayerPerformance()
      this.adjustDifficulty()
    }
  }

  /**
   * 分析玩家表现。
   */
  private analyzePlayerPerformance(): void {
    // 从GameScene获取玩家数据
    const gameScene = this.scene as any
    const player = gameScene.player
    
    if (!player) return

    // 计算击杀速度
    const killRate = this.recentKills / (this.checkInterval / 1000)
    
    // 更新表现数据
    this.lastPerformanceCheck = {
      healthPercentage: (player.currentHealth / player.maxHealth) * 100,
      killRate: killRate,
      damageReceived: this.recentDamage,
      survivalTime: gameScene.gameTime / 1000,
    }

    // 重置计数器
    this.recentKills = 0
    this.recentDamage = 0
  }

  /**
   * 调整难度参数。
   */
  private adjustDifficulty(): void {
    const perf = this.lastPerformanceCheck

    // 评估玩家表现
    const isPerformingWell = 
      perf.healthPercentage > 70 && 
      perf.killRate > 5 && 
      perf.damageReceived < 50

    const isStruggling = 
      perf.healthPercentage < 40 || 
      perf.killRate < 2 || 
      perf.damageReceived > 100

    if (isPerformingWell) {
      // 玩家表现出色，增加挑战
      this.difficultyMultiplier = Math.min(1.3, this.difficultyMultiplier + 0.1)
      this.harassmentFactor = Math.min(1.5, this.harassmentFactor + 0.1)
      this.resistanceFactor = Math.min(1.5, this.resistanceFactor + 0.1)
      
      console.log('🎯 指挥家：玩家表现出色，增加挑战！')
    } else if (isStruggling) {
      // 玩家陷入困境，降低难度
      this.difficultyMultiplier = Math.max(0.7, this.difficultyMultiplier - 0.1)
      this.harassmentFactor = Math.max(0.5, this.harassmentFactor - 0.1)
      this.resistanceFactor = Math.max(0.5, this.resistanceFactor - 0.1)
      
      console.log('💚 指挥家：玩家需要喘息，降低难度！')
    } else {
      // 表现正常，逐渐恢复到基准难度
      this.difficultyMultiplier = this.difficultyMultiplier * 0.95 + 1.0 * 0.05
      this.harassmentFactor = this.harassmentFactor * 0.95 + 1.0 * 0.05
      this.resistanceFactor = this.resistanceFactor * 0.95 + 1.0 * 0.05
    }

    // 触发难度调整事件
    this.scene.events.emit('difficultyAdjusted', {
      multiplier: this.difficultyMultiplier,
      harassment: this.harassmentFactor,
      resistance: this.resistanceFactor,
    })
  }

  /**
   * 记录击杀。
   */
  public recordKill(): void {
    this.recentKills++
  }

  /**
   * 记录受到的伤害。
   */
  public recordDamage(amount: number): void {
    this.recentDamage += amount
  }

  /**
   * 获取当前难度倍率。
   */
  public getDifficultyMultiplier(): number {
    return this.difficultyMultiplier
  }

  /**
   * 获取骚扰因子（用于调整快速敌人比例）。
   */
  public getHarassmentFactor(): number {
    return this.harassmentFactor
  }

  /**
   * 获取抗性因子（用于调整抗性敌人比例）。
   */
  public getResistanceFactor(): number {
    return this.resistanceFactor
  }

  /**
   * 根据难度调整敌人生成数量。
   */
  public adjustEnemyCount(baseCount: number): number {
    return Math.floor(baseCount * this.difficultyMultiplier)
  }

  /**
   * 决定是否生成骚扰型敌人（快速、低伤害）。
   */
  public shouldSpawnHarassment(): boolean {
    return Math.random() < (0.3 * this.harassmentFactor)
  }

  /**
   * 决定是否生成抗性敌人。
   */
  public shouldSpawnResistant(): boolean {
    return Math.random() < (0.4 * this.resistanceFactor)
  }

  /**
   * 重置指挥家系统。
   */
  public reset(): void {
    this.difficultyMultiplier = 1.0
    this.harassmentFactor = 1.0
    this.resistanceFactor = 1.0
    this.recentKills = 0
    this.recentDamage = 0
    this.lastCheckTime = 0
  }
}

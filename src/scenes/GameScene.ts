import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Enemy, Swarmling, FrostBat } from '../entities/Enemy'

/**
 * `GameScene` 承载核心游戏循环：玩家控制、敌人生成、元素能力、
 * 资源掉落、难度节奏等。
 * 
 * 当前阶段实现：
 * - 玩家实例化与控制
 * - 基础敌人生成系统
 * - 玩家与敌人的碰撞检测
 */
export class GameScene extends Phaser.Scene {
  private player?: Player
  private enemies: Phaser.GameObjects.Group

  // 游戏状态
  private gameTime: number = 0
  private spawnTimer: number = 0
  private spawnInterval: number = 2000 // 每2秒生成一波敌人

  constructor() {
    super('GameScene')
    this.enemies = {} as Phaser.GameObjects.Group
  }

  create(): void {
    // 设置世界边界
    this.physics.world.setBounds(0, 0, 960, 540)

    // 初始化玩家
    this.createPlayer()

    // 初始化敌人组
    this.enemies = this.add.group({
      classType: Enemy,
      runChildUpdate: true, // 自动调用每个敌人的update方法
    })

    // 设置碰撞检测
    this.setupCollisions()

    // 启动UI场景（与GameScene并行运行）
    this.scene.launch('UIScene')

    // 显示调试信息
    this.add
      .text(16, 500, 'WASD移动 | 空格冲刺', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(1000)
  }

  /**
   * 创建玩家实例。
   */
  private createPlayer(): void {
    this.player = new Player(this, 480, 270)

    // 监听玩家事件
    this.player.on('playerDied', this.onPlayerDied, this)
    this.player.on('healthChanged', this.onPlayerHealthChanged, this)
  }

  /**
   * 设置碰撞检测。
   */
  private setupCollisions(): void {
    if (!this.player) return

    // 玩家与敌人的碰撞
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onPlayerEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    )
  }

  /**
   * 玩家与敌人碰撞时触发。
   */
  private onPlayerEnemyCollision(
    playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const player = playerObj as Player
    const enemy = enemyObj as Enemy

    // 玩家受到伤害（冲刺时有无敌帧）
    player.takeDamage(enemy.damage)
  }

  /**
   * 玩家生命值变化回调。
   */
  private onPlayerHealthChanged(current: number, max: number): void {
    // 触发UI更新事件
    this.events.emit('updatePlayerHealth', current, max)
  }

  /**
   * 玩家死亡回调。
   */
  private onPlayerDied(): void {
    // TODO: 显示游戏结束界面，结算本局数据
    this.scene.pause()
    this.add
      .text(480, 270, '游戏结束', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#ff0000',
      })
      .setOrigin(0.5)
      .setDepth(2000)
  }

  update(time: number, delta: number): void {
    this.gameTime += delta

    // 更新玩家
    if (this.player) {
      this.player.update(time, delta)
    }

    // 敌人生成系统
    this.spawnTimer += delta
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0
      this.spawnEnemyWave()
    }
  }

  /**
   * 生成一波敌人。
   * TODO: 后续实现基于时间的脚本化波次系统。
   */
  private spawnEnemyWave(): void {
    if (!this.player) return

    // 随机生成3-5只敌人
    const count = Phaser.Math.Between(3, 5)

    for (let i = 0; i < count; i++) {
      this.spawnRandomEnemy()
    }
  }

  /**
   * 在屏幕边缘随机位置生成敌人。
   */
  private spawnRandomEnemy(): void {
    if (!this.player) return

    // 随机选择屏幕的哪一条边
    const edge = Phaser.Math.Between(0, 3)
    let x = 0
    let y = 0

    switch (edge) {
      case 0: // 上边
        x = Phaser.Math.Between(0, 960)
        y = -20
        break
      case 1: // 右边
        x = 980
        y = Phaser.Math.Between(0, 540)
        break
      case 2: // 下边
        x = Phaser.Math.Between(0, 960)
        y = 560
        break
      case 3: // 左边
        x = -20
        y = Phaser.Math.Between(0, 540)
        break
    }

    // 随机生成不同类型的敌人
    const enemyType = Phaser.Math.Between(0, 10)
    let enemy: Enemy

    if (enemyType < 8) {
      // 80% 概率生成虫群
      enemy = new Swarmling(this, x, y)
    } else {
      // 20% 概率生成冰霜蝙蝠
      enemy = new FrostBat(this, x, y)
    }

    // 设置追踪目标为玩家
    enemy.setTarget(this.player)

    // 监听敌人死亡事件
    enemy.on('enemyDied', this.onEnemyDied, this)

    // 添加到敌人组
    this.enemies.add(enemy)
  }

  /**
   * 敌人死亡回调。
   */
  private onEnemyDied(enemy: Enemy): void {
    // TODO: 生成经验值水晶，更新击杀统计
    this.events.emit('enemyKilled', enemy.getTypeName(), enemy.expValue)
  }
}

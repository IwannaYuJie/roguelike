import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { Enemy, Swarmling, FrostBat, RockGolem } from '../entities/Enemy'
import { Projectile } from '../entities/Projectile'
import { ExpGem } from '../entities/ExpGem'

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
  private projectiles: Phaser.GameObjects.Group
  private expGems: Phaser.GameObjects.Group

  // 游戏状态
  private gameTime: number = 0
  private spawnTimer: number = 0
  private spawnInterval: number = 2000 // 每2秒生成一波敌人
  private killCount: number = 0

  constructor() {
    super('GameScene')
    this.enemies = {} as Phaser.GameObjects.Group
    this.projectiles = {} as Phaser.GameObjects.Group
    this.expGems = {} as Phaser.GameObjects.Group
  }

  create(): void {
    // 设置世界边界
    this.physics.world.setBounds(0, 0, 960, 540)

    // 创建通用粒子纹理
    this.createParticleTexture()

    // 初始化玩家
    this.createPlayer()

    // 初始化对象组
    this.enemies = this.add.group({
      classType: Enemy,
      runChildUpdate: true, // 自动调用每个敌人的update方法
    })

    this.projectiles = this.add.group({
      classType: Projectile,
      runChildUpdate: true,
    })

    this.expGems = this.add.group({
      classType: ExpGem,
      runChildUpdate: true,
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
   * 创建通用粒子纹理。
   */
  private createParticleTexture(): void {
    if (!this.textures.exists('particle')) {
      const graphics = this.add.graphics()
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(4, 4, 4)
      graphics.generateTexture('particle', 8, 8)
      graphics.destroy()
    }
  }

  /**
   * 创建玩家实例。
   */
  private createPlayer(): void {
    this.player = new Player(this, 480, 270)

    // 监听玩家事件
    this.player.on('playerDied', this.onPlayerDied, this)
    this.player.on('healthChanged', this.onPlayerHealthChanged, this)
    this.player.on('requestAttack', this.onPlayerRequestAttack, this)
    this.player.on('projectileCreated', this.onProjectileCreated, this)
    this.player.on('expChanged', this.onPlayerExpChanged, this)
    this.player.on('levelUp', this.onPlayerLevelUp, this)
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

    // 投射物与敌人的碰撞
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.onProjectileEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    )

    // 玩家与经验宝石的碰撞
    this.physics.add.overlap(
      this.player,
      this.expGems,
      this.onPlayerExpGemCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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

    // 随机生成不同类型的敌人（根据游戏时间调整难度）
    const enemyType = Phaser.Math.Between(0, 100)
    let enemy: Enemy

    // 游戏时间越长，高级敌人出现概率越高
    const gameMinutes = this.gameTime / 60000

    if (enemyType < 60) {
      // 60% 概率生成虫群
      enemy = new Swarmling(this, x, y)
    } else if (enemyType < 85) {
      // 25% 概率生成冰霜蝙蝠
      enemy = new FrostBat(this, x, y)
    } else if (gameMinutes > 2) {
      // 15% 概率生成岩石魔像（游戏2分钟后出现）
      enemy = new RockGolem(this, x, y)
    } else {
      // 早期用虫群替代
      enemy = new Swarmling(this, x, y)
    }

    // 设置追踪目标为玩家
    enemy.setTarget(this.player)

    // 监听敌人死亡事件
    enemy.on('enemyDied', this.onEnemyDied, this)

    // 添加到敌人组
    this.enemies.add(enemy)
  }

  /**
   * 玩家请求攻击回调。
   */
  private onPlayerRequestAttack(): void {
    if (!this.player) return

    // 寻找最近的敌人
    const nearestEnemy = this.findNearestEnemy()
    if (!nearestEnemy) return

    // 计算攻击方向
    const direction = new Phaser.Math.Vector2(
      nearestEnemy.x - this.player.x,
      nearestEnemy.y - this.player.y
    )

    // 发射投射物
    this.player.fireProjectile(direction)
  }

  /**
   * 投射物创建回调。
   */
  private onProjectileCreated(projectile: Projectile): void {
    this.projectiles.add(projectile)
  }

  /**
   * 投射物与敌人碰撞回调。
   */
  private onProjectileEnemyCollision(
    projectileObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const projectile = projectileObj as Projectile
    const enemy = enemyObj as Enemy

    // 敌人受到伤害（应用元素抗性）
    enemy.takeDamage(projectile.damage, projectile.elementType)

    // 投射物击中效果
    projectile.onHit()
  }

  /**
   * 玩家与经验宝石碰撞回调。
   */
  private onPlayerExpGemCollision(
    playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    gemObj: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const player = playerObj as Player
    const gem = gemObj as ExpGem

    // 玩家获得经验
    player.gainExp(gem.expValue)

    // 宝石被拾取
    gem.onCollected()
  }

  /**
   * 玩家经验变化回调。
   */
  private onPlayerExpChanged(current: number, toNext: number): void {
    this.events.emit('updatePlayerExp', current, toNext)
  }

  /**
   * 玩家升级回调。
   */
  private onPlayerLevelUp(level: number): void {
    // 显示升级提示
    const text = this.add.text(
      480,
      200,
      `等级提升！Lv.${level}`,
      {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4,
      }
    )
    text.setOrigin(0.5)
    text.setDepth(1000)

    // 升级文字动画
    this.tweens.add({
      targets: text,
      y: 150,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        text.destroy()
      },
    })

    // 触发UI更新
    this.events.emit('playerLevelUp', level)

    // TODO: 显示升级选择界面
  }

  /**
   * 寻找最近的敌人。
   */
  private findNearestEnemy(): Enemy | null {
    if (!this.player) return null

    let nearestEnemy: Enemy | null = null
    let nearestDistance = this.player.attackRange

    this.enemies.getChildren().forEach((enemyObj) => {
      const enemy = enemyObj as Enemy
      const distance = Phaser.Math.Distance.Between(
        this.player!.x,
        this.player!.y,
        enemy.x,
        enemy.y
      )

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    })

    return nearestEnemy
  }

  /**
   * 敌人死亡回调。
   */
  private onEnemyDied(enemy: Enemy): void {
    // 生成经验宝石
    this.spawnExpGem(enemy.x, enemy.y, enemy.expValue)

    // 更新击杀统计
    this.killCount++
    this.events.emit('enemyKilled', enemy.getTypeName(), this.killCount)
  }

  /**
   * 生成经验宝石。
   */
  private spawnExpGem(x: number, y: number, expValue: number): void {
    const gem = new ExpGem(this, x, y, expValue)
    if (this.player) {
      gem.setTarget(this.player)
    }
    this.expGems.add(gem)
  }
}

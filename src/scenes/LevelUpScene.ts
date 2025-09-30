import Phaser from 'phaser'

/**
 * `LevelUpScene` 升级选择界面。
 * 玩家升级时暂停游戏，显示3张能力卡片供选择。
 * 
 * 设计要点：
 * - 暂停GameScene，显示半透明遮罩
 * - 随机生成3张能力卡片
 * - 支持重投（消耗金币）和放逐（移除不想要的能力）
 * - 选择后恢复游戏
 */
export class LevelUpScene extends Phaser.Scene {
  private selectedCallback?: (id: string, type: string) => void
  private rerollCallback?: () => void
  private banishCallback?: (id: string, type: string) => void
  private cardContainers: Phaser.GameObjects.Container[] = []
  private currentOptions: Array<{
    id: string
    name: string
    description: string
    icon: string
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    type: 'ability' | 'item'
  }> = []
  private playerGold: number = 0
  private rerollCost: number = 10

  constructor() {
    super('LevelUpScene')
  }

  /**
   * 显示升级选择界面。
   * @param options 可选择的选项列表（能力或道具）
   * @param onSelect 选择回调函数
   * @param onReroll 重投回调函数
   * @param onBanish 放逐回调函数
   * @param playerGold 玩家当前金币
   */
  public showLevelUp(
    options: Array<{
      id: string
      name: string
      description: string
      icon: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
      type: 'ability' | 'item'
    }>,
    onSelect: (id: string, type: string) => void,
    onReroll?: () => void,
    onBanish?: (id: string, type: string) => void,
    playerGold: number = 0
  ): void {
    this.selectedCallback = onSelect
    this.rerollCallback = onReroll
    this.banishCallback = onBanish
    this.currentOptions = options
    this.playerGold = playerGold

    // 清理之前的卡片
    this.clearCards()

    // 创建半透明遮罩
    this.createOverlay()

    // 创建标题
    this.createTitle()

    // 创建能力卡片
    this.createAbilityCards(options)

    // 创建底部按钮（重投、放逐等）
    this.createBottomButtons()
  }

  /**
   * 创建半透明遮罩。
   */
  private createOverlay(): void {
    const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.7)
    overlay.setDepth(1000)
    overlay.setScrollFactor(0)
  }

  /**
   * 创建标题。
   */
  private createTitle(): void {
    const title = this.add.text(480, 80, '等级提升！', {
      fontFamily: 'sans-serif',
      fontSize: '48px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 6,
    })
    title.setOrigin(0.5)
    title.setDepth(1001)
    title.setScrollFactor(0)

    // 标题闪烁动画
    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const subtitle = this.add.text(480, 130, '选择一个能力', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    })
    subtitle.setOrigin(0.5)
    subtitle.setDepth(1001)
    subtitle.setScrollFactor(0)
  }

  /**
   * 创建能力卡片。
   */
  private createAbilityCards(
    options: Array<{
      id: string
      name: string
      description: string
      icon: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
      type: 'ability' | 'item'
    }>
  ): void {
    const cardWidth = 200
    const cardHeight = 280
    const spacing = 40
    const startX = 480 - (cardWidth * 1.5 + spacing)

    options.forEach((option, index) => {
      const x = startX + index * (cardWidth + spacing)
      const y = 300

      const card = this.createCard(option, x, y, cardWidth, cardHeight, index)
      this.cardContainers.push(card)
    })
  }

  /**
   * 创建单个能力卡片。
   */
  private createCard(
    option: {
      id: string
      name: string
      description: string
      icon: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
      type: 'ability' | 'item'
    },
    x: number,
    y: number,
    width: number,
    height: number,
    index: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    container.setDepth(1001)
    container.setScrollFactor(0)

    // 根据稀有度选择颜色
    const rarityColors = {
      common: 0x888888,
      rare: 0x4488ff,
      epic: 0xaa44ff,
      legendary: 0xffaa00,
    }
    const color = rarityColors[option.rarity]

    // 卡片背景
    const bg = this.add.rectangle(0, 0, width, height, 0x222222, 1)
    bg.setStrokeStyle(4, color)
    container.add(bg)

    // 卡片图标（占位）
    const icon = this.add.text(0, -80, option.icon, {
      fontFamily: 'sans-serif',
      fontSize: '48px',
    })
    icon.setOrigin(0.5)
    container.add(icon)

    // 能力名称
    const name = this.add.text(0, -20, option.name, {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      wordWrap: { width: width - 20 },
      align: 'center',
    })
    name.setOrigin(0.5)
    container.add(name)

    // 能力描述
    const description = this.add.text(0, 40, option.description, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#cccccc',
      wordWrap: { width: width - 20 },
      align: 'center',
    })
    description.setOrigin(0.5)
    container.add(description)

    // 稀有度标签
    const rarityText = this.add.text(0, 120, option.rarity.toUpperCase(), {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
      padding: { x: 8, y: 4 },
    })
    rarityText.setOrigin(0.5)
    container.add(rarityText)

    // 添加交互
    bg.setInteractive({ useHandCursor: true })
    bg.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 200,
        ease: 'Power2',
      })
    })
    bg.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 200,
        ease: 'Power2',
      })
    })
    bg.on('pointerdown', () => {
      this.onCardSelected(option.id, option.type)
    })

    // 入场动画
    container.setScale(0)
    container.setAlpha(0)
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 300,
      delay: index * 100,
      ease: 'Back.easeOut',
    })

    return container
  }

  /**
   * 创建底部按钮。
   */
  private createBottomButtons(): void {
    // 重投按钮
    const canReroll = this.rerollCallback && this.playerGold >= this.rerollCost
    const rerollButton = this.add.text(
      300,
      500,
      `🎲 重投 (${this.rerollCost}金币)`,
      {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: canReroll ? '#ffff00' : '#888888',
        backgroundColor: canReroll ? '#444444' : '#333333',
        padding: { x: 16, y: 8 },
      }
    )
    rerollButton.setOrigin(0.5)
    rerollButton.setDepth(1001)
    rerollButton.setScrollFactor(0)

    if (canReroll) {
      rerollButton.setInteractive({ useHandCursor: true })
      rerollButton.on('pointerover', () => {
        rerollButton.setScale(1.1)
      })
      rerollButton.on('pointerout', () => {
        rerollButton.setScale(1)
      })
      rerollButton.on('pointerdown', () => {
        if (this.rerollCallback) {
          this.rerollCallback()
        }
      })
    } else {
      rerollButton.setAlpha(0.5)
    }

    // 放逐按钮
    const canBanish = this.banishCallback !== undefined
    const banishButton = this.add.text(660, 500, '🚫 放逐模式', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: canBanish ? '#ff6666' : '#888888',
      backgroundColor: canBanish ? '#444444' : '#333333',
      padding: { x: 16, y: 8 },
    })
    banishButton.setOrigin(0.5)
    banishButton.setDepth(1001)
    banishButton.setScrollFactor(0)

    if (canBanish) {
      banishButton.setInteractive({ useHandCursor: true })
      banishButton.on('pointerover', () => {
        banishButton.setScale(1.1)
      })
      banishButton.on('pointerout', () => {
        banishButton.setScale(1)
      })
      banishButton.on('pointerdown', () => {
        this.enterBanishMode()
      })
    } else {
      banishButton.setAlpha(0.5)
    }
  }

  /**
   * 进入放逐模式。
   */
  private enterBanishMode(): void {
    // 显示提示
    const hint = this.add.text(480, 150, '点击一个选项来放逐它', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ff6666',
      stroke: '#000000',
      strokeThickness: 4,
    })
    hint.setOrigin(0.5)
    hint.setDepth(1002)
    hint.setScrollFactor(0)

    // 修改卡片点击事件为放逐
    this.cardContainers.forEach((container, index) => {
      const option = this.currentOptions[index]
      // 添加红色边框
      const overlay = this.add.rectangle(0, 0, 200, 280, 0xff0000, 0.2)
      overlay.setStrokeStyle(4, 0xff0000)
      container.add(overlay)

      // 重新设置点击事件
      container.removeAllListeners('pointerdown')
      container.setInteractive({ useHandCursor: true })
      container.on('pointerdown', () => {
        if (this.banishCallback) {
          this.banishCallback(option.id, option.type)
        }
        hint.destroy()
        this.closeLevelUp()
      })
    })
  }

  /**
   * 卡片被选中时的回调。
   */
  private onCardSelected(id: string, type: string): void {
    if (this.selectedCallback) {
      this.selectedCallback(id, type)
    }

    // 关闭升级界面
    this.closeLevelUp()
  }

  /**
   * 关闭升级界面。
   */
  private closeLevelUp(): void {
    // 清理所有UI元素
    this.clearCards()

    // 清空场景
    this.children.removeAll()

    // 恢复GameScene
    const gameScene = this.scene.get('GameScene')
    gameScene.scene.resume()
  }

  /**
   * 清理卡片。
   */
  private clearCards(): void {
    this.cardContainers.forEach((container) => {
      container.destroy()
    })
    this.cardContainers = []
  }
}

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
  private selectedCallback?: (abilityId: string) => void
  private cardContainers: Phaser.GameObjects.Container[] = []

  constructor() {
    super('LevelUpScene')
  }

  /**
   * 显示升级选择界面。
   * @param abilities 可选择的能力列表
   * @param onSelect 选择回调函数
   */
  public showLevelUp(
    abilities: Array<{
      id: string
      name: string
      description: string
      icon: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
    }>,
    onSelect: (abilityId: string) => void
  ): void {
    this.selectedCallback = onSelect

    // 清理之前的卡片
    this.clearCards()

    // 创建半透明遮罩
    this.createOverlay()

    // 创建标题
    this.createTitle()

    // 创建能力卡片
    this.createAbilityCards(abilities)

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
    abilities: Array<{
      id: string
      name: string
      description: string
      icon: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
    }>
  ): void {
    const cardWidth = 200
    const cardHeight = 280
    const spacing = 40
    const startX = 480 - (cardWidth * 1.5 + spacing)

    abilities.forEach((ability, index) => {
      const x = startX + index * (cardWidth + spacing)
      const y = 300

      const card = this.createCard(ability, x, y, cardWidth, cardHeight, index)
      this.cardContainers.push(card)
    })
  }

  /**
   * 创建单个能力卡片。
   */
  private createCard(
    ability: {
      id: string
      name: string
      description: string
      icon: string
      rarity: 'common' | 'rare' | 'epic' | 'legendary'
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
    const color = rarityColors[ability.rarity]

    // 卡片背景
    const bg = this.add.rectangle(0, 0, width, height, 0x222222, 1)
    bg.setStrokeStyle(4, color)
    container.add(bg)

    // 卡片图标（占位）
    const icon = this.add.text(0, -80, ability.icon, {
      fontFamily: 'sans-serif',
      fontSize: '48px',
    })
    icon.setOrigin(0.5)
    container.add(icon)

    // 能力名称
    const name = this.add.text(0, -20, ability.name, {
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
    const description = this.add.text(0, 40, ability.description, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#cccccc',
      wordWrap: { width: width - 20 },
      align: 'center',
    })
    description.setOrigin(0.5)
    container.add(description)

    // 稀有度标签
    const rarityText = this.add.text(0, 120, ability.rarity.toUpperCase(), {
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
      this.onCardSelected(ability.id)
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
    // 重投按钮（暂时禁用，后续实现）
    const rerollButton = this.add.text(300, 500, '🎲 重投 (10金币)', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#888888',
      backgroundColor: '#333333',
      padding: { x: 16, y: 8 },
    })
    rerollButton.setOrigin(0.5)
    rerollButton.setDepth(1001)
    rerollButton.setScrollFactor(0)
    rerollButton.setAlpha(0.5)

    // 放逐按钮（暂时禁用，后续实现）
    const banishButton = this.add.text(660, 500, '🚫 放逐', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#888888',
      backgroundColor: '#333333',
      padding: { x: 16, y: 8 },
    })
    banishButton.setOrigin(0.5)
    banishButton.setDepth(1001)
    banishButton.setScrollFactor(0)
    banishButton.setAlpha(0.5)
  }

  /**
   * 卡片被选中时的回调。
   */
  private onCardSelected(abilityId: string): void {
    if (this.selectedCallback) {
      this.selectedCallback(abilityId)
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

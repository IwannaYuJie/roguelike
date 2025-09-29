import Phaser from 'phaser'

/**
 * `UIScene` 与 `GameScene` 并行运行，用于渲染HUD、升级选择、
 * 元素协同提示等界面。当前阶段仅放置占位文本，后续将扩展为完整UI。
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene')
  }

  create(): void {
    // TODO: 构建HUD、经验条、技能槽等UI元素。

    const placeholder = this.add.text(16, 16, 'UI Layer Ready', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    })

    placeholder.setScrollFactor(0)
  }
}

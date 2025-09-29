import Phaser from 'phaser'

/**
 * `MainMenuScene` 负责展示主菜单、角色选择以及进入游戏的入口。
 * 当前阶段提供最小化的占位逻辑，后续会结合UI场景与元进度系统。
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene')
  }

  create(): void {
    // TODO: 添加主菜单UI与交互。暂时直接进入GameScene，方便调试流程。
    this.scene.start('GameScene')
  }
}

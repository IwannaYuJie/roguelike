import Phaser from 'phaser'

/**
 * `BootScene` 负责初始化游戏基础配置，例如加载进度条资源、
 * 并在预加载完成后切换到主菜单场景。当前阶段暂未加载实际资源，
 * 仅示范场景流程，后续会扩展为完整的引导阶段。
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload(): void {
    // TODO: 在此处加载基础UI、Logo等资源。
  }

  create(): void {
    // 预加载完成后进入主菜单。
    this.scene.start('MainMenuScene')
  }
}

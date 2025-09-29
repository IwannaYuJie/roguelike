import Phaser from 'phaser'

/**
 * `GameScene` 将承载核心游戏循环：玩家控制、敌人生成、元素能力、
 * 资源掉落、难度节奏等。当前仅搭建基础框架，后续会逐步实现各系统。
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  create(): void {
    // TODO: 初始化玩家、敌人波次、输入控制等模块。

    // 在原型阶段，为便于验证流程，简单显示一行调试文本。
    this.add
      .text(480, 270, '元素超载 - 原型构建中', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#f0f0f0',
      })
      .setOrigin(0.5)
  }

  update(_time: number, _delta: number): void {
    // TODO: 更新玩家状态、处理敌人逻辑与能力冷却。
  }
}

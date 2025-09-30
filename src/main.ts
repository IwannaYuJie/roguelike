import Phaser from 'phaser'

import { BootScene } from './scenes/BootScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { GameScene } from './scenes/GameScene'
import { UIScene } from './scenes/UIScene'
import { LevelUpScene } from './scenes/LevelUpScene'

// 初始化根容器，确保Phaser可以正确挂载到#app节点上。
const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('未找到 #app 节点，无法初始化游戏。')
}

// 创建一个用于托管Phaser Canvas的容器。
root.innerHTML = '<div id="game-root" class="game-root"></div>'

// Phaser游戏配置，后续会根据设计需求继续扩展。
const config: Phaser.Types.Core.GameConfig = {
  title: '元素超载',
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#0a0a12',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene, MainMenuScene, GameScene, UIScene, LevelUpScene],
}

// 启动Phaser游戏实例。
// 后续各个系统（玩家、敌人、元素等）会在对应的Scene中初始化。
export const game = new Phaser.Game(config)

import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene';
import StoryScene from './scenes/StoryScene';
import TownScene from './scenes/TownScene';
import DungeonScene from './scenes/DungeonScene';
import AppraisalScene from './scenes/AppraisalScene';
import SchoolScene from './scenes/SchoolScene';
import ShopScene from './scenes/ShopScene';
import RentCheckScene from './scenes/RentCheckScene';
import LandladyScene from './scenes/LandladyScene';
import PawnShopScene from './scenes/PawnShopScene';
import SeminarScene from './scenes/SeminarScene';
import TempleScene from './scenes/TempleScene';
import BarScene from './scenes/BarScene';

import TitleScene from './scenes/TitleScene';

const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: '#0a0a1a',
  parent: 'app',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  pixelArt: false,
  scene: [
    PreloadScene,
    TitleScene,
    StoryScene,
    TownScene,
    DungeonScene,
    AppraisalScene,
    SchoolScene,
    ShopScene,
    RentCheckScene,
    LandladyScene,
    PawnShopScene,
    BarScene,
    SeminarScene,
    TempleScene
  ]
};

new Phaser.Game(config);
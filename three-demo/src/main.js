import './styles.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const STORAGE_KEY = 'gentleRobotStudioState.v3';
const TOTAL_DURATION = 24;
const timelineTracks = [
  { name: 'Head', icon: '☻' },
  { name: 'Arm / Hand', icon: '✋' },
  { name: 'Chest + Belly', icon: '◒' },
];

const behaviorModuleGroups = [
  {
    group: 'Head',
    icon: '☻',
    items: ['Head up', 'Head down', 'Head left', 'Head right', 'Soft head inflate'],
  },
  {
    group: 'Arm / Hand',
    icon: '✋',
    items: [
      'Forward / Backward Reach',
      'Side Lift',
      'Arm Inflate',
    ],
  },
  {
    group: 'Chest + Belly',
    icon: '◒',
    items: ['Breathing'],
  },
];

const baseClips = [];
const visibleModuleNames = new Set(behaviorModuleGroups.flatMap((group) => group.items));

const rhythmOptions = ['Slow', 'Pulse', 'Breathing', 'Heartbeat', 'Custom'];
const removedModules = new Set([
  'Turn to user',
  'Turn toward user',
  'Soft hand touch',
  'Soft grip',
  'Breathing light',
  'Heartbeat light',
  'Color change',
  'Soft glow',
  'Breathing rise',
  'Local warmth',
  'Gentle vibration',
  'Soft rebound',
  'Move closer',
  'Move away',
  'Stay nearby',
  'Stop',
]);
const responseSpeedOptions = ['Slow', 'Medium', 'Fast'];
const DEFAULT_NEW_CLIP_DURATION = 4;
const actionSpeedDurations = {
  Slow: 4,
  Medium: 2.5,
  Fast: 1.5,
};
const actionSideOptions = ['Right', 'Left', 'Both'];
const reachDirectionOptions = ['Forward', 'Backward'];
const responseRhythmOptions = ['Single', 'Pulse', 'Breathing', 'Wave'];
const surfaceStateOptions = ['Smooth', 'Soft bumps', 'Firm', 'Textured'];
const spatialPatternOptions = ['Single area', 'Line', 'Surface', 'Multi-zone'];
const materialKeys = ['default', 'silicone', 'fur', 'cotton', 'silk', 'foam'];
const speedOptions = [0.5, 1, 1.5, 2];
const cameraViews = {
  front: { label: '正面' },
  left: { label: '左侧' },
  right: { label: '右侧' },
  top: { label: '俯视' },
  free: { label: '自由视角' },
};

const sceneBackdrops = {
  studio: { label: '工作室', image: '' },
  living: { label: '客厅', image: '/scenes/living.png' },
  bedside: { label: '床边', image: '/scenes/bedside.png' },
  dining: { label: '厨房', image: '/scenes/dining.png' },
  entry: { label: '玄关', image: '/scenes/entry.png' },
  window: { label: '窗边', image: '/scenes/window.png' },
};

const materialLabels = {
  default: '默认',
  silicone: '硅胶',
  fur: '仿毛',
  cotton: '棉布',
  silk: '丝绸',
  foam: '泡棉',
};

const groupLabels = {
  Head: '头部',
  'Arm / Hand': '手臂/手',
  'Chest + Belly': '胸腹',
  Chest: '胸部',
  Belly: '腹部',
  'Body / Wheels': '身体/轮子',
};

const moduleLabels = {
  'Head up': '上看',
  'Head down': '下看',
  'Head left': '左转',
  'Head right': '右转',
  'Soft head inflate': '头部膨胀',
  'Forward / Backward Reach': '侧向抬手',
  'Side Lift': '前后伸手',
  'Arm Inflate': '手臂膨胀',
  Breathing: '胸腹呼吸',
  'Nod gently': '轻点头',
  'Look down': '低头',
  'Look up': '抬头',
  'Hand forward': '向前伸手',
  'Hand back': '收回手',
  'Hand up': '抬手',
  'Hand down': '放下手',
  'Open arms': '张开双臂',
  'Close arms': '合拢双臂',
  'Gentle pat': '轻拍',
  'Hand vibration': '手部轻震',
  'Warm hand': '手部升温',
  'Hand glow': '手部发光',
  'Hold still': '停留',
};

const optionLabels = {
  Center: '居中',
  Right: '右侧',
  Left: '左侧',
  Both: '双侧',
  Forward: '向前',
  Backward: '向后',
  Slow: '慢',
  Medium: '中',
  Fast: '快',
  Single: '单次',
  Pulse: '脉冲',
  Breathing: '呼吸',
  Wave: '波浪',
  Custom: '自定义',
  None: '无',
  'Single area': '单一区域',
  Row: '成排',
  Array: '点阵',
  Horizontal: '横向',
  Vertical: '纵向',
  Curve: '弧线',
  'Small area': '小区域',
  'Whole part': '整体',
  'Breathing area': '呼吸区',
  Line: '线',
  Surface: '面',
  'Multi-zone': '多区域',
  Smooth: '平滑',
  'Soft bumps': '柔和凸点',
  Firm: '变硬',
  Textured: '纹理化',
  distance: '点距',
  radius: '半径',
  sync: '同步',
  edges: '隔点',
};

function displayGroupName(name) {
  return groupLabels[name] ?? name;
}

function displayModuleName(name) {
  return moduleLabels[name] ?? name;
}

function displayOption(value) {
  return optionLabels[value] ?? value;
}

const materialSwatches = {
  default: '#f3f6fb',
  silicone: '#f8d7e8',
  fur: '#f2eee7',
  cotton: '#dceffd',
  silk: '#f6e6ff',
  foam: '#e6f4df',
};

const moduleActionIcons = {
  'Forward / Backward Reach': '↗',
  'Side Lift': '↔',
  'Arm Inflate': '◒',
  Breathing: '◒',
  'Head up': '↑',
  'Head down': '↓',
  'Head left': '←',
  'Head right': '→',
  'Hand forward': '↗',
  'Hand back': '↙',
  'Hand up': '↑',
  'Hand down': '↓',
  'Open arms': '⟷',
  'Close arms': '⟵',
  'Breathing light': '◌',
  'Heartbeat light': '♥',
  'Color change': '◐',
  'Soft glow': '✦',
  'Breathing rise': '◒',
  'Local warmth': '☼',
  'Gentle vibration': '≈',
  'Soft rebound': '◌',
  'Move closer': '↥',
  'Move away': '↧',
  'Stay nearby': '•',
  Stop: '■',
};

const deformationTypes = {
  none: {
    label: '无形变',
    icon: '○',
    description: '不产生材料形变',
  },
  inflate: {
    label: '膨胀/回弹',
    icon: '◒',
    description: '向外鼓起后回到原状',
  },
  rebound: {
    label: '按压/回弹',
    icon: '◌',
    description: '向内受压后柔和恢复',
  },
  surface: {
    label: '表面变化',
    icon: '≈',
    description: '改变软硬、纹理或表面状态',
  },
  wave: {
    label: '波纹/扩散',
    icon: '≋',
    description: '让变化沿区域传播',
  },
};

const deformationPatterns = [
  { key: 'none', label: '无', icon: '○', description: '不添加表面形变。' },
  { key: 'point', label: '点', icon: '•', description: '局部浅凸点标记。' },
  { key: 'line', label: '线', icon: '━', description: '沿表面形成条带变化。' },
  { key: 'surface', label: '面', icon: '◒', description: '较大区域一起变化。' },
];

const deformationTargets = [
  { key: 'head_shell', label: '头部外壳', icon: '☻' },
  { key: 'arm_hand', label: '手臂/手', icon: '✋' },
  { key: 'chest_belly', label: '胸腹部', icon: '◒' },
];

const moduleResponseMap = {
  'Head up': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', deformationTarget: 'head_shell', category: 'Head motion' },
  'Head down': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', deformationTarget: 'head_shell', category: 'Head motion' },
  'Head left': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', deformationTarget: 'head_shell', category: 'Head motion' },
  'Head right': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', deformationTarget: 'head_shell', category: 'Head motion' },
  'Nod gently': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', deformationTarget: 'head_shell', category: 'Head motion' },
  'Look down': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', deformationTarget: 'head_shell', category: 'Head motion' },
  'Look up': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', deformationTarget: 'head_shell', category: 'Head motion' },
  'Soft head inflate': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'inflate', deformationTarget: 'head_shell', category: 'Material deformation' },
  'Forward / Backward Reach': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Right', deformationType: 'none', deformationTarget: 'arm_hand', category: 'Directional arm motion' },
  'Side Lift': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Right', direction: 'Forward', deformationType: 'none', deformationTarget: 'arm_hand', category: 'Directional arm motion' },
  'Arm Inflate': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Right', deformationType: 'inflate', deformationTarget: 'arm_hand', category: 'Arm deformation' },
  Breathing: { targetPart: 'body', targetLabel: 'Chest + Belly', side: 'Center', deformationType: 'inflate', deformationTarget: 'chest_belly', category: 'Breathing deformation' },
  'Hand forward': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Hand back': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Hand up': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Hand down': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Open arms': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Close arms': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Raise hand': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Lower hand': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Reach forward': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Retract hand': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Move hand back': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion' },
  'Gentle pat': { targetPart: 'bothhands', targetLabel: 'Hand', side: 'Both', deformationType: 'rebound', category: 'Tactile rhythm' },
  'Hand vibration': { targetPart: 'bothhands', targetLabel: 'Hand', side: 'Both', deformationType: 'wave', category: 'Tactile rhythm' },
  'Warm hand': { targetPart: 'bothhands', targetLabel: 'Hand', side: 'Both', deformationType: 'surface', category: 'Thermal surface' },
  'Hand glow': { targetPart: 'bothhands', targetLabel: 'Hand', side: 'Both', deformationType: 'surface', category: 'Light response' },
  'Hold still': { targetPart: 'botharms', targetLabel: 'Arm / Hand', side: 'Both', deformationType: 'none', category: 'Motion hold' },
  'Breathing light': { targetPart: 'body', targetLabel: 'Chest', side: 'Center', deformationType: 'inflate', category: 'Light response' },
  'Heartbeat light': { targetPart: 'body', targetLabel: 'Chest', side: 'Center', deformationType: 'inflate', category: 'Light response' },
  'Color change': { targetPart: 'body', targetLabel: 'Chest', side: 'Center', deformationType: 'surface', category: 'Surface display' },
  'Soft glow': { targetPart: 'body', targetLabel: 'Chest', side: 'Center', deformationType: 'surface', category: 'Surface display' },
  'Breathing rise': { targetPart: 'body', targetLabel: 'Belly', side: 'Center', deformationType: 'inflate', category: 'Material deformation' },
  'Local warmth': { targetPart: 'body', targetLabel: 'Belly', side: 'Center', deformationType: 'surface', category: 'Thermal surface' },
  'Gentle vibration': { targetPart: 'body', targetLabel: 'Belly', side: 'Center', deformationType: 'wave', category: 'Tactile rhythm' },
  'Soft rebound': { targetPart: 'body', targetLabel: 'Belly', side: 'Center', deformationType: 'rebound', category: 'Material deformation' },
  'Move closer': { targetPart: 'body', targetLabel: 'Body / Wheels', side: 'Center', deformationType: 'none', category: 'Body movement' },
  'Move away': { targetPart: 'body', targetLabel: 'Body / Wheels', side: 'Center', deformationType: 'none', category: 'Body movement' },
  'Stay nearby': { targetPart: 'body', targetLabel: 'Body / Wheels', side: 'Center', deformationType: 'none', category: 'Body movement' },
  Stop: { targetPart: 'body', targetLabel: 'Body / Wheels', side: 'Center', deformationType: 'none', category: 'Body movement' },
};

const materialTargets = {
  body: ['body'],
  head: ['head'],
  leftarm: ['leftarm'],
  rightarm: ['rightarm'],
  botharms: ['leftarm', 'rightarm'],
  lefthand: ['lefthand'],
  righthand: ['righthand'],
  bothhands: ['lefthand', 'righthand'],
};

const materialTargetLabels = {
  body: '身体',
  head: '头部',
  leftarm: '左手臂',
  rightarm: '右手臂',
  botharms: '双手臂',
  lefthand: '左手',
  righthand: '右手',
  bothhands: '双手',
};

const moduleDefaults = {
  enabled: true,
  intensity: 45,
  amount: 45,
  speed: 'Slow',
  rhythm: 'Single',
  duration: DEFAULT_NEW_CLIP_DURATION,
  warmth: 0.7,
  maxForce: 5,
  contactLimit: 10,
  blendIn: 0.5,
  blendOut: 0.5,
  notes: '',
  targetPart: 'body',
  targetLabel: 'Body',
  side: 'Right',
  direction: 'Forward',
  category: 'Body movement',
  deformationType: 'none',
  deformationPattern: 'none',
  deformationTarget: 'arm_hand',
  coverage: 'Single',
  surfaceState: 'Smooth',
  spatialPattern: 'Single area',
  touchArea: 'Arm',
  variableMode: 'distance',
  motionMode: 'sync',
};

const defaultState = {
  selectedModule: 'Forward / Backward Reach',
  selectedClipId: null,
  selectedTab: 'Configure',
  collapsedGroups: {},
  customCounter: 1,
  moduleConfigs: {},
  materials: {
    body: 'default',
    head: 'default',
    leftarm: 'default',
    rightarm: 'default',
    lefthand: 'default',
    righthand: 'default',
  },
  selectedMaterialPart: 'botharms',
  timeline: baseClips,
  currentTime: 8.12,
  playing: false,
  speed: 1,
  sceneBackdrop: 'studio',
  cameraView: 'front',
  showGrid: true,
  showAxes: true,
  showPartHighlight: true,
  showUserReference: false,
  sceneMenuOpen: false,
  cameraMenuOpen: false,
  toast: '',
};

const appState = loadState();
appState.timeline = appState.timeline
  .filter((clip) => visibleModuleNames.has(clip.module) && !removedModules.has(clip.module))
  .map(normalizeTimelineClip);
if (appState.selectedClipId && !appState.timeline.some((clip) => clip.id === appState.selectedClipId)) {
  appState.selectedClipId = null;
}
appState.selectedMaterialPart = moduleToMaterialTarget(getModuleConfig());
const history = [];
const future = [];
let suppressPlaybackClick = false;
let timelineEdit = null;
let timelineScrub = null;
let suppressTimelineClick = false;

const threeState = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  robotRoot: null,
  gridPlane: null,
  axesHelper: null,
  parts: {},
  materialParts: {},
  deformationParts: {},
  baseQuaternions: {},
  baseScales: {},
  defaultMaterials: {},
  highlightOverlays: [],
  inflationOverlays: {},
  pointDeformationVisuals: [],
  pointDeformationOverlays: [],
  loaded: false,
  lastFrame: 0,
  playbackFrame: null,
};

const robotNodeBindings = {
  body: '躯干',
  head: '头盔',
  leftarm: '左手臂',
  lefthand: '左手',
  rightarm: '右手臂',
  righthand: '右手',
};

const robotMaterialBindings = {
  body: ['胸部', '腰部', '底部', '颈部（算胸部）'],
  head: ['头盔'],
  leftarm: ['左手臂'],
  rightarm: ['右手臂'],
  lefthand: ['左手'],
  righthand: ['右手'],
};

const robotDeformationBindings = {
  head: '头盔',
  chest: '胸部',
  belly: '腰部',
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    const timeline = (saved.timeline?.length ? saved.timeline : structuredClone(baseClips))
      .filter((clip) => !removedModules.has(clip.module) && clip.action !== 'turnBody')
      .map(normalizeTimelineClip);
    const selectedModule = visibleModuleNames.has(saved.selectedModule) && !removedModules.has(saved.selectedModule)
      ? saved.selectedModule
      : defaultState.selectedModule;
    const selectedClipId = timeline.some((clip) => clip.id === saved.selectedClipId) ? saved.selectedClipId : null;
    return {
      ...structuredClone(defaultState),
      ...saved,
      selectedModule,
      selectedClipId,
      moduleConfigs: saved.moduleConfigs ?? {},
      materials: { ...defaultState.materials, ...(saved.materials ?? {}) },
      timeline: timeline.length ? timeline : structuredClone(baseClips),
      collapsedGroups: saved.collapsedGroups ?? {},
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function getStaticModuleConfig(moduleName) {
  return {
    ...moduleDefaults,
    ...(moduleResponseMap[moduleName] ?? {}),
  };
}

function normalizeTimelineClip(clip) {
  const staticConfig = getStaticModuleConfig(clip.module);
  const duration = Number(clip.duration) || Number(staticConfig.duration) || durationForSpeed(staticConfig.speed);
  const track = inferTrack(clip.module);
  return {
    ...clip,
    track,
    icon: getModuleIcon(clip.module),
    color: inferColor(clip.module),
    action: inferAction(clip.module),
    duration,
    side: clip.side ?? staticConfig.side,
    direction: clip.direction ?? staticConfig.direction,
    amount: clip.amount ?? staticConfig.amount,
    speed: clip.speed ?? speedForDuration(duration),
    rhythm: clip.rhythm ?? staticConfig.rhythm,
    intensity: clip.intensity ?? staticConfig.intensity,
    coverage: clip.coverage ?? staticConfig.coverage,
    deformationPattern: clip.deformationPattern ?? staticConfig.deformationPattern,
    deformationTarget: lockedDeformationTarget(clip.module),
    variableMode: clip.variableMode ?? staticConfig.variableMode,
    motionMode: clip.motionMode ?? staticConfig.motionMode,
  };
}

function snapshot() {
  history.push(JSON.stringify({
    selectedModule: appState.selectedModule,
    selectedClipId: appState.selectedClipId,
    selectedTab: appState.selectedTab,
    collapsedGroups: appState.collapsedGroups,
    customCounter: appState.customCounter,
    moduleConfigs: appState.moduleConfigs,
    materials: appState.materials,
    selectedMaterialPart: appState.selectedMaterialPart,
    timeline: appState.timeline,
    currentTime: appState.currentTime,
    speed: appState.speed,
    sceneBackdrop: appState.sceneBackdrop,
    showGrid: appState.showGrid,
    showAxes: appState.showAxes,
    showPartHighlight: appState.showPartHighlight,
    showUserReference: appState.showUserReference,
    cameraView: appState.cameraView,
  }));
  if (history.length > 40) history.shift();
  future.length = 0;
}

function restore(serialized) {
  const restored = JSON.parse(serialized);
  Object.assign(appState, structuredClone(defaultState), restored);
  appState.playing = false;
  renderAll();
  applySceneBackdrop();
  applyAllMaterials();
  applyTimelinePose(appState.currentTime);
  applyPartHighlight();
}

function getScenarioModules() {
  return behaviorModuleGroups;
}

function getModuleConfig(moduleName = appState.selectedModule) {
  const mapping = getModuleResponseMapping(moduleName);
  if (!appState.moduleConfigs[moduleName]) {
    appState.moduleConfigs[moduleName] = { ...moduleDefaults, ...mapping };
  }
  appState.moduleConfigs[moduleName] = {
    ...moduleDefaults,
    ...mapping,
    ...appState.moduleConfigs[moduleName],
  };
  if (appState.moduleConfigs[moduleName].intensity <= 1) {
    appState.moduleConfigs[moduleName].intensity = Math.round(appState.moduleConfigs[moduleName].intensity * 100);
  }
  if (!responseRhythmOptions.includes(appState.moduleConfigs[moduleName].rhythm)) {
    appState.moduleConfigs[moduleName].rhythm = moduleDefaults.rhythm;
  }
  if (!responseSpeedOptions.includes(appState.moduleConfigs[moduleName].speed)) {
    appState.moduleConfigs[moduleName].speed = moduleDefaults.speed;
  }
  return appState.moduleConfigs[moduleName];
}

function getModuleResponseMapping(moduleName = appState.selectedModule) {
  return moduleResponseMap[moduleName] ?? {
    targetPart: inferTrack(moduleName) === 'Head' ? 'head' : 'body',
    targetLabel: inferTrack(moduleName),
    side: inferTrack(moduleName) === 'Arm / Hand' ? 'Both' : 'Center',
    deformationType: 'none',
    deformationTarget: inferTrack(moduleName) === 'Head'
      ? 'head_shell'
      : inferTrack(moduleName) === 'Arm / Hand'
        ? 'arm_hand'
        : 'chest_belly',
    category: inferTrack(moduleName),
  };
}

function lockedDeformationTarget(moduleName = appState.selectedModule) {
  return getModuleResponseMapping(moduleName).deformationTarget ?? moduleDefaults.deformationTarget;
}

function deformationTargetLabel(targetKey) {
  return deformationTargets.find((item) => item.key === targetKey)?.label ?? targetKey;
}

function deformationTargetIcon(targetKey) {
  return deformationTargets.find((item) => item.key === targetKey)?.icon ?? '◇';
}

function selectedClipMatchesModule() {
  const clip = getSelectedClip();
  return Boolean(clip && clip.module === appState.selectedModule);
}

function moduleDirectionLabel(moduleName = appState.selectedModule) {
  const name = moduleName.toLowerCase();
  if (name.includes('up')) return '向上';
  if (name.includes('down')) return '向下';
  if (name.includes('left')) return '向左';
  if (name.includes('right')) return '向右';
  if (moduleName === 'Forward / Backward Reach') return '侧向抬起';
  if (moduleName === 'Breathing') return '呼吸起伏';
  return '前后方向';
}

function coverageOptionsForPattern(pattern) {
  if (pattern === 'point') return ['Single', 'Row', 'Array'];
  if (pattern === 'line') return ['Horizontal', 'Vertical', 'Curve'];
  if (pattern === 'surface') return ['Small area', 'Whole part', 'Breathing area'];
  return ['None'];
}

function getSelectedGroup() {
  return getScenarioModules().find((group) => group.items.includes(appState.selectedModule));
}

function getModuleIcon(moduleName = appState.selectedModule) {
  if (moduleActionIcons[moduleName]) return moduleActionIcons[moduleName];
  const group = getScenarioModules().find((item) => item.items.includes(moduleName));
  return group?.icon ?? '◇';
}

function setToast(message) {
  appState.toast = message;
  renderToast();
  window.clearTimeout(setToast.timer);
  setToast.timer = window.setTimeout(() => {
    appState.toast = '';
    renderToast();
  }, 1900);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(value) {
  const seconds = clamp(value, 0, TOTAL_DURATION);
  return `00:${seconds.toFixed(2).padStart(5, '0')}`;
}

function clipPercent(startOrDuration) {
  return (startOrDuration / TOTAL_DURATION) * 100;
}

function activeClipIds() {
  return new Set(
    appState.timeline
      .filter((clip) => !isClipMuted(clip) && appState.currentTime >= clip.start && appState.currentTime <= clip.start + clip.duration)
      .map((clip) => clip.id)
  );
}

function isClipMuted(clip) {
  return clip.muted || getModuleConfig(clip.module).enabled === false;
}

function createTimelineClip(moduleName, startTime = appState.currentTime, trackName = inferTrack(moduleName)) {
  const resolvedTrack = inferTrack(moduleName);
  const config = getModuleConfig(moduleName);
  const configuredDuration = Number(config.duration) || durationForSpeed(config.speed);
  const initialDuration = configuredDuration < DEFAULT_NEW_CLIP_DURATION && config.speed !== 'Fast'
    ? DEFAULT_NEW_CLIP_DURATION
    : configuredDuration;
  const duration = clamp(initialDuration, 0.5, TOTAL_DURATION);
  return {
    id: `clip-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    module: moduleName,
    track: resolvedTrack,
    icon: getModuleIcon(moduleName),
    color: inferColor(moduleName),
    start: clamp(startTime, 0, TOTAL_DURATION - duration),
    duration,
    action: inferAction(moduleName),
    droppedTrack: trackName,
    side: config.side,
    direction: config.direction,
    amount: config.amount,
    speed: speedForDuration(duration),
    rhythm: config.rhythm,
    intensity: config.intensity,
    coverage: config.coverage,
    deformationPattern: defaultDeformationPatternForModule(moduleName, config.deformationPattern),
    deformationTarget: lockedDeformationTarget(moduleName),
  };
}

function timelineTimeFromDrop(event, lane) {
  const rect = lane.getBoundingClientRect();
  const x = clamp(event.clientX - rect.left, 0, rect.width);
  return Math.round((x / rect.width) * TOTAL_DURATION * 2) / 2;
}

function timelineDeltaFromPointer(event) {
  return ((event.clientX - timelineEdit.startPointerX) / timelineEdit.laneWidth) * TOTAL_DURATION;
}

function timelineTimeFromPointer(event) {
  const lane = event.target.closest('.track-lane') ?? document.querySelector('.track-lane');
  if (!lane) return appState.currentTime;
  const rect = lane.getBoundingClientRect();
  const percent = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  return Math.round(percent * TOTAL_DURATION * 10) / 10;
}

function snapTimelineValue(value) {
  return Math.round(value * 2) / 2;
}

function durationForSpeed(speed) {
  return actionSpeedDurations[speed] ?? actionSpeedDurations.Medium;
}

function speedForDuration(duration) {
  const numericDuration = Number(duration) || actionSpeedDurations.Medium;
  return Object.entries(actionSpeedDurations)
    .reduce((closest, [speed, value]) => {
      const distance = Math.abs(value - numericDuration);
      return distance < closest.distance ? { speed, distance } : closest;
    }, { speed: 'Medium', distance: Infinity }).speed;
}

function getSelectedClip() {
  return appState.timeline.find((clip) => clip.id === appState.selectedClipId) ?? null;
}

function getPanelConfig() {
  const config = getModuleConfig();
  const clip = getSelectedClip();
  if (!clip) {
    return {
      ...config,
      deformationTarget: lockedDeformationTarget(appState.selectedModule),
    };
  }
  return {
    ...config,
    side: clip.side ?? config.side,
    direction: clip.direction ?? config.direction,
    amount: clip.amount ?? config.amount,
    speed: clip.speed ?? speedForDuration(clip.duration),
    duration: clip.duration ?? config.duration,
    enabled: !clip.muted,
    rhythm: clip.rhythm ?? config.rhythm,
    intensity: clip.intensity ?? config.intensity,
    coverage: clip.coverage ?? config.coverage,
    deformationPattern: defaultDeformationPatternForModule(clip.module, clip.deformationPattern ?? config.deformationPattern),
    deformationTarget: lockedDeformationTarget(clip.module),
    variableMode: clip.variableMode ?? config.variableMode,
    motionMode: clip.motionMode ?? config.motionMode,
  };
}

function getEditableActionTarget() {
  const clip = getSelectedClip();
  if (clip) return clip;
  return getModuleConfig();
}

function isInflationModule(moduleName) {
  return ['Soft head inflate', 'Arm Inflate', 'Breathing'].includes(moduleName);
}

function defaultDeformationPatternForModule(moduleName, pattern = 'none') {
  if (isInflationModule(moduleName) && (!pattern || pattern === 'none')) return 'surface';
  return pattern ?? 'none';
}

function setActionParameter(key, value, shouldSnapshot = true) {
  if (shouldSnapshot) snapshot();
  const target = getEditableActionTarget();
  target[key] = value;
  const moduleName = target.module ?? appState.selectedModule;
  target.deformationTarget = lockedDeformationTarget(moduleName);

  if (key === 'speed') {
    target.duration = clamp(durationForSpeed(value), 0.5, target.start == null ? TOTAL_DURATION : TOTAL_DURATION - target.start);
  }

  if (key === 'duration') {
    target.speed = speedForDuration(value);
  }

  if (key === 'deformationPattern') {
    const coverageOptions = coverageOptionsForPattern(value);
    target.coverage = coverageOptions.includes(target.coverage) ? target.coverage : coverageOptions[0];
  }

  if (target.id) {
    appState.selectedClipId = target.id;
  }

  renderRightPanel();
  renderTimeline();
  applyTimelinePose(appState.currentTime);
  applyPartHighlight();
}

function updateClipDuration(clip, duration) {
  clip.duration = clamp(duration, 0.5, TOTAL_DURATION - clip.start);
  clip.speed = speedForDuration(clip.duration);
  if (clip.id === appState.selectedClipId) {
    const config = getModuleConfig(clip.module);
    config.duration = clip.duration;
    config.speed = clip.speed;
  }
}

function scrubTimelineTo(event) {
  appState.currentTime = timelineTimeFromPointer(event);
  applyTimelinePose(appState.currentTime);
  updateTimelineRuntimeDom();
}

function selectClip(clip) {
  appState.selectedModule = clip.module;
  appState.selectedClipId = clip.id;
  appState.currentTime = clip.start;
  appState.selectedMaterialPart = moduleToMaterialTarget(getModuleConfig(clip.module));
  renderAll();
  applyTimelinePose(appState.currentTime);
  applyPartHighlight();
}

function deleteTimelineClip(clipId) {
  const index = appState.timeline.findIndex((clip) => clip.id === clipId);
  if (index < 0) return;
  snapshot();
  const [deleted] = appState.timeline.splice(index, 1);
  const wasSelected = appState.selectedClipId === clipId;
  if (appState.selectedClipId === clipId) {
    appState.selectedClipId = null;
  }
  renderTimeline();
  if (wasSelected) renderRightPanel();
  applyTimelinePose(appState.currentTime);
  applyPartHighlight();
  setToast('已删除动作');
}

function moduleToMaterialTarget(config = getModuleConfig()) {
  if (config.targetPart) return config.targetPart;
  if (config.touchArea === 'Head') return 'head';
  if (config.touchArea === 'Chest' || config.touchArea === 'Back') return 'body';
  if (config.touchArea === 'Hand') {
    if (config.side === 'Left') return 'lefthand';
    if (config.side === 'Right') return 'righthand';
    return 'bothhands';
  }
  if (config.touchArea === 'Arm' || config.touchArea === 'Shoulder') {
    if (config.side === 'Left') return 'leftarm';
    if (config.side === 'Right') return 'rightarm';
    return 'botharms';
  }
  return 'body';
}

function appTemplate() {
  return `
    <div class="studio">
      <header class="topbar" id="topbar"></header>
      <aside class="left-panel">
        <div class="panel-title">
          <h2>行为模块</h2>
          <button id="addModuleButton" title="添加自定义模块">＋</button>
        </div>
        <div class="module-groups" id="moduleGroups"></div>
      </aside>
      <main class="workspace">
        ${robotPreviewTemplate()}
        <section class="timeline-panel" id="timelinePanel"></section>
      </main>
      <aside class="right-panel" id="rightPanel"></aside>
      <div class="toast" id="toast"></div>
      <div class="modal-backdrop" id="modalBackdrop" hidden></div>
    </div>
  `;
}

function robotPreviewTemplate() {
  return `
    <div class="viewport" id="viewport">
      <div class="scene-backdrop" id="sceneBackdrop"></div>
      <div class="scene-floor-shadow"></div>
      <div class="view-header" id="viewHeader">${viewHeaderTemplate()}</div>
      <div class="viewport-tools top">
        <button data-view-action="toggle-grid" class="${appState.showGrid ? 'active' : ''}" title="网格" aria-label="切换网格">▦</button>
        <button data-view-action="toggle-highlight" class="${appState.showPartHighlight ? 'active' : ''}" title="部位高亮" aria-label="切换部位高亮">⬡</button>
        <button data-view-action="toggle-user-reference" class="${appState.showUserReference ? 'active' : ''}" title="用户参考" aria-label="切换用户参考">♙</button>
        <button data-view-action="fullscreen" title="全屏预览" aria-label="全屏预览">⤢</button>
      </div>
      <div class="viewport-tools left">
        <button data-view-action="select" class="active">↖</button>
        <button data-view-action="pan">✥</button>
        <button data-view-action="reset-camera">⟳</button>
        <button data-view-action="fullscreen">⛶</button>
        <button data-view-action="toggle-grid">▣</button>
        <button data-view-action="more">…</button>
      </div>
      <div class="grid-floor"></div>
      <div class="axis-widget">
        <span class="axis-z">Z</span>
        <span class="axis-x">X</span>
      </div>
      <div class="user-reference ${appState.showUserReference ? 'visible' : ''}" id="userReference" aria-hidden="${appState.showUserReference ? 'false' : 'true'}">
        <span class="user-reference-ring"></span>
        <span class="user-reference-person">♙</span>
        <span class="user-reference-label">用户</span>
      </div>
      <canvas id="robotCanvas" aria-label="GentleRobot 3D 模型预览"></canvas>
      <svg class="deform-link-layer" id="deformLinkLayer" aria-hidden="true">
        <path id="deformLinkPath" fill="none" />
        <circle id="deformLinkDot" r="4.5" />
      </svg>
      <div class="deform-bubble anchor-head" id="deformBubble" hidden>
        <div class="deform-bubble-ring">
          <img id="deformBubbleImg" alt="形变视频预览" />
        </div>
        <div class="deform-bubble-caption" id="deformBubbleCaption"></div>
      </div>
      <div class="viewport-status" id="viewportStatus">正在加载机器人模型...</div>
    </div>
  `;
}

function viewHeaderTemplate() {
  const currentView = cameraViews[appState.cameraView] ?? cameraViews.front;
  const label = appState.sceneBackdrop === 'studio' ? currentView.label : '场景视图';
  return `
    <div class="camera-selector">
      <button class="select-pill ${appState.cameraMenuOpen ? 'active' : ''}" id="cameraMenuButton">
        <span>${label}</span>
        <span class="select-arrow">⌄</span>
      </button>
      <div class="camera-menu" ${appState.cameraMenuOpen ? '' : 'hidden'}>
        ${Object.entries(cameraViews)
          .map(([key, item]) => `
            <button class="${key === appState.cameraView ? 'active' : ''}" data-camera-view="${key}">
              <span class="scene-check">${key === appState.cameraView ? '✓' : ''}</span>
              <span>${item.label}</span>
            </button>
          `)
          .join('')}
      </div>
    </div>
  `;
}

function renderViewHeader() {
  const header = document.querySelector('#viewHeader');
  if (header) header.innerHTML = viewHeaderTemplate();
}

function renderAll() {
  renderTopbar();
  renderModules();
  renderRightPanel();
  renderTimeline();
  renderToast();
  renderViewHeader();
  updateViewportToolState();
}

function renderTopbar() {
  const currentScene = sceneBackdrops[appState.sceneBackdrop] ?? sceneBackdrops.studio;
  document.querySelector('#topbar').innerHTML = `
    <div class="product">
      <div class="app-icon"><span></span></div>
      <strong>GentleRobot Studio</strong>
      <small>v0.9.0</small>
    </div>
    <div class="scene-selector">
      <button class="scenario-select ${appState.sceneMenuOpen ? 'active' : ''}" id="sceneMenuButton">
        <span>⬡</span>
        <strong>${currentScene.label}场景</strong>
        <span class="select-arrow">⌄</span>
      </button>
      <div class="scenario-menu" id="sceneMenu" ${appState.sceneMenuOpen ? '' : 'hidden'}>
        ${Object.entries(sceneBackdrops)
          .map(([key, item]) => `
            <button class="${key === appState.sceneBackdrop ? 'active' : ''}" data-scene-backdrop="${key}">
              <span class="scene-check">${key === appState.sceneBackdrop ? '✓' : ''}</span>
              <span>${item.label}场景</span>
            </button>
          `)
          .join('')}
      </div>
    </div>
    <button class="save-button" id="saveButton" title="保存到浏览器">▣</button>
    <div class="top-spacer"></div>
    <div class="connection"><i></i> 机器人已连接</div>
    <button class="icon-button" id="undoButton" ${history.length ? '' : 'disabled'}>↶</button>
    <button class="icon-button" id="redoButton" ${future.length ? '' : 'disabled'}>↷</button>
    <button class="preview-button" id="previewButton">▷ 预览</button>
    <button class="deploy-button" id="deployButton">导出 <span>⌄</span></button>
    <button class="icon-button" id="moreButton">⋮</button>
  `;
}

function renderModules() {
  document.querySelector('#moduleGroups').innerHTML = getScenarioModules()
    .map((group) => {
      const items = group.items
        .map((item) => {
          const active = item === appState.selectedModule;
          const disabled = getModuleConfig(item).enabled === false;
          return `
            <button
              class="module-item action-chip ${active ? 'active' : ''} ${disabled ? 'disabled-module' : ''}"
              data-module="${item}"
              draggable="true"
              title="${displayModuleName(item)}"
            >
              <span class="item-icon">${moduleActionIcons[item] ?? group.icon}</span>
              <span>${displayModuleName(item)}</span>
            </button>
          `;
        })
        .join('');

      return `
        <section class="module-group part-action-card">
          <button class="group-title" data-group="${group.group}">
            <span class="group-icon">${group.icon}</span>
            <span>${displayGroupName(group.group)}</span>
            <span class="part-count">${group.items.length}</span>
          </button>
          <div class="module-items">${items}</div>
        </section>
      `;
    })
    .join('');
}

function renderRightPanel() {
  const selectedClip = getSelectedClip();
  if (!selectedClip) {
    renderEmptyInspector();
    refreshDeformationBubble();
    return;
  }

  const config = getPanelConfig();
  const moduleName = selectedClip.module;
  const isInflationAction = isInflationModule(moduleName);
  const isReachAction = moduleName === 'Side Lift';
  const trackName = selectedClip.track ?? inferTrack(moduleName);
  const showSideControl = trackName === 'Arm / Hand';
  const targetLabel = deformationTargetLabel(config.deformationTarget);

  document.querySelector('#rightPanel').innerHTML = `
    <header class="inspector-head">
      <div class="hand-mark">${getModuleIcon(moduleName)}</div>
      <div>
        <h2>动作检查器</h2>
        <p>正在编辑时间轴动作</p>
      </div>
      <label class="switch">
        <input id="moduleEnabled" type="checkbox" ${config.enabled ? 'checked' : ''} />
        <span></span>
      </label>
    </header>
    <section class="inspector-section selected-action-section">
      <div class="section-row">
        <h3>当前动作</h3>
        <span>${config.duration.toFixed(1)} 秒动作</span>
      </div>
      <div class="action-summary-card is-clip">
        <small>${isInflationAction ? '膨胀模块' : '动作模块'}</small>
        <strong>${displayModuleName(moduleName)}</strong>
        <div class="summary-meta">
          <span>${getModuleIcon(moduleName)}</span>
          <span>${targetLabel}</span>
          <span>${config.duration.toFixed(1)}s</span>
        </div>
      </div>
    </section>
    ${isInflationAction
      ? inflationParameterSection(config, { moduleName, showSideControl, targetLabel })
      : motionParameterSection(config, { isReachAction, showSideControl, trackName })}
  `;
  refreshDeformationBubble();
}

function renderEmptyInspector() {
  document.querySelector('#rightPanel').innerHTML = `
    <header class="inspector-head empty-inspector-head">
      <div class="hand-mark">□</div>
      <div>
        <h2>动作检查器</h2>
        <p>请选择时间轴中的动作块</p>
      </div>
    </header>
    <section class="inspector-section empty-inspector-section">
      <div class="empty-inspector-card">
        <strong>还没有正在编辑的动作</strong>
        <p>先把左侧动作拖到下方时间轴，再点击时间轴里的动作块。右侧只编辑已经进入方案的动作。</p>
      </div>
    </section>
  `;
}

function motionParameterSection(config, options) {
  return `
    <section class="inspector-section action-parameters-section">
      <div class="section-row">
        <h3>动作参数</h3>
        <span>${displayGroupName(options.trackName)}</span>
      </div>
      ${motionParameterTemplate(config, options)}
    </section>
  `;
}

function labeledSegmentedField(label, key, options, value) {
  return `
    <div class="parameter-row">
      <span>${label}</span>
      <div class="segmented-control" role="group" aria-label="${label}">
        ${options.map((option) => `
          <button
            data-action-param-button="${key}"
            data-value="${option.value}"
            class="${option.value === value ? 'active' : ''}"
          >${option.label}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function variableModeField(config) {
  const isLine = config.deformationPattern === 'line';
  return labeledSegmentedField('变量模式', 'variableMode', [
    { value: 'distance', label: isLine ? '线距' : '点距' },
    { value: 'radius', label: isLine ? '线宽' : '半径' },
  ], config.variableMode);
}

function motionModeField(config) {
  const isLine = config.deformationPattern === 'line';
  return labeledSegmentedField('运动方式', 'motionMode', [
    { value: 'sync', label: '同步' },
    { value: 'wave', label: '波浪' },
    { value: 'edges', label: isLine ? '隔条' : '隔点' },
  ], config.motionMode);
}

function inflationParameterSection(config, { moduleName, showSideControl, targetLabel }) {
  const patternChoices = deformationPatterns.filter((item) => item.key !== 'none');
  const hasPointLinePreview = ['point', 'line'].includes(config.deformationPattern);
  return `
    <section class="inspector-section surface-response-section">
      <div class="section-row">
        <h3>膨胀参数</h3>
        <span>${targetLabel}</span>
      </div>
      <div class="locked-target-card">
        <b>${deformationTargetIcon(config.deformationTarget)}</b>
        <div>
          <small>膨胀部位</small>
          <strong>${targetLabel}</strong>
        </div>
      </div>
      ${showSideControl ? segmentedField('侧别', 'side', actionSideOptions, config.side) : ''}
      ${choiceGrid('形变方式', patternChoices, config.deformationPattern, 'deformation-pattern')}
      ${hasPointLinePreview ? variableModeField(config) : ''}
      ${hasPointLinePreview ? motionModeField(config) : ''}
      ${deformationLivePreviewTemplate(config)}
      ${amountField(config.amount)}
      ${segmentedField('节奏', 'rhythm', responseRhythmOptions, config.rhythm)}
      ${segmentedField('速度', 'speed', responseSpeedOptions, config.speed)}
      ${intensityField(config.intensity)}
      <p class="section-hint">${displayModuleName(moduleName)}只调整材料/表面形变，不显示额外动作参数。面表示整体膨胀/呼吸，点和线用于局部形变提示。</p>
    </section>
  `;
}

function motionParameterTemplate(config, { isReachAction, showSideControl, trackName }) {
  if (trackName === 'Head') {
    return `
      <div class="read-only-field">
        <span>方向</span>
        <strong>${moduleDirectionLabel()}</strong>
      </div>
      ${amountField(config.amount)}
      ${segmentedField('速度', 'speed', responseSpeedOptions, config.speed)}
    `;
  }

  if (trackName === 'Chest + Belly') {
    return `
      ${amountField(config.amount)}
      ${segmentedField('节奏', 'rhythm', responseRhythmOptions, config.rhythm)}
      ${segmentedField('速度', 'speed', responseSpeedOptions, config.speed)}
    `;
  }

  return `
      ${showSideControl ? segmentedField('侧别', 'side', actionSideOptions, config.side) : ''}
      ${isReachAction ? segmentedField('方向', 'direction', reachDirectionOptions, config.direction) : ''}
      ${amountField(config.amount)}
      ${segmentedField('速度', 'speed', responseSpeedOptions, config.speed)}
  `;
}

function surfaceResponseParameterTemplate(config) {
  if (config.deformationPattern === 'none') {
    return '<p class="section-hint">当前动作未启用表面形变。</p>';
  }

  const coverageOptions = coverageOptionsForPattern(config.deformationPattern);
  return `
    ${segmentedField('覆盖方式', 'coverage', coverageOptions, config.coverage)}
    ${segmentedField('节奏', 'rhythm', responseRhythmOptions, config.rhythm)}
    ${intensityField(config.intensity)}
  `;
}

function segmentedField(label, key, options, value) {
  return `
    <div class="parameter-row">
      <span>${label}</span>
      <div class="segmented-control" role="group" aria-label="${label}">
        ${options.map((option) => `
          <button
            data-action-param-button="${key}"
            data-value="${option}"
            class="${option === value ? 'active' : ''}"
          >${displayOption(option)}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function amountField(value) {
  const safeValue = clamp(Number(value) || 0, 0, 100);
  return `
    <label class="parameter-row amount-row">
      <span>幅度</span>
      <input data-action-param="amount" type="range" min="0" max="100" step="1" value="${safeValue}" />
      <output>${safeValue}</output>
    </label>
  `;
}

function intensityField(value) {
  const safeValue = clamp(Number(value) || 0, 0, 100);
  return `
    <label class="parameter-row amount-row">
      <span>强度</span>
      <input data-action-param="intensity" type="range" min="0" max="100" step="1" value="${safeValue}" />
      <output>${safeValue}</output>
    </label>
  `;
}

function choiceGrid(label, items, value, datasetName) {
  const safeValue = items.some((item) => item.key === value) ? value : items[0]?.key;
  return `
    <div class="choice-block">
      <h4>${label}</h4>
      <div class="choice-grid">
        ${items.map((item) => `
          <button
            class="choice-card ${item.key === safeValue ? 'active' : ''}"
            data-${datasetName}="${item.key}"
          >
            <b>${item.icon}</b>
            <span>${item.label}</span>
            ${item.description ? `<small>${item.description}</small>` : ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function deformationLivePreviewTemplate(config) {
  const targetLabel = deformationTargets.find((item) => item.key === config.deformationTarget)?.label ?? config.deformationTarget;
  const patternLabel = deformationPatterns.find((item) => item.key === config.deformationPattern)?.label ?? config.deformationPattern;
  const live = ['point', 'line'].includes(config.deformationPattern);
  if (config.deformationPattern === 'none') {
    return `
      <div class="live-preview-frame">
        <strong>无表面回应</strong>
        <span>${targetLabel}</span>
        <small>该动作仅使用动作参数。</small>
      </div>
    `;
  }
  const isLine = config.deformationPattern === 'line';
  const variableLabel = config.variableMode === 'radius' ? (isLine ? '线宽' : '半径') : (isLine ? '线距' : '点距');
  const motionLabel = { sync: '同步', wave: '波浪', edges: isLine ? '隔条' : '隔点' }[config.motionMode] ?? '同步';
  return `
    <div class="live-preview-frame ${live ? 'active' : ''}">
      <strong>${live ? '已在 3D 视图气泡中预览' : '预览待接入'}</strong>
      <span>${live ? `${patternLabel} · ${variableLabel} · ${motionLabel} · ${targetLabel}` : `${patternLabel} · ${targetLabel}`}</span>
      <small>${live ? '3D 视图右上方的圆形气泡正在播放对应形变视频。' : '该形变方式已保存到动作块，后续可接入可视化。'}</small>
    </div>
  `;
}

function deformationVideoFor(config) {
  const pattern = config.deformationPattern;
  if (pattern !== 'point' && pattern !== 'line') return null;
  const isLine = pattern === 'line';
  const series = isLine
    ? (config.variableMode === 'radius' ? 'line_width' : 'line_distance')
    : (config.variableMode === 'radius' ? 'point_radius' : 'point_distance');
  const motion = config.motionMode ?? 'sync';
  const file = motion === 'wave'
    ? '方式2-波浪.gif'
    : motion === 'edges'
      ? (isLine ? '方式3-隔条.gif' : '方式3-隔点.gif')
      : '方式1-同步.gif';
  return encodeURI(`/deformations/${series}/${file}`);
}

const bubbleAnchorState = { object: null, cls: '' };
const bubbleProjectVector = new THREE.Vector3();

function bubbleAnchorForTarget(config) {
  if (config.deformationTarget === 'head_shell') {
    return { object: threeState.parts.head ?? null, cls: 'anchor-head' };
  }
  if (config.deformationTarget === 'arm_hand') {
    const key = config.side === 'Left' ? 'leftarm' : 'rightarm';
    return { object: threeState.parts[key] ?? threeState.parts.rightarm ?? null, cls: 'anchor-arm' };
  }
  return { object: threeState.deformationParts.chest ?? threeState.parts.body ?? null, cls: 'anchor-chest' };
}

function refreshDeformationBubble() {
  const bubble = document.querySelector('#deformBubble');
  if (!bubble) return;
  const layer = document.querySelector('#deformLinkLayer');
  const clip = getSelectedClip();
  const config = getPanelConfig();
  const video = clip && isInflationModule(clip.module) ? deformationVideoFor(config) : null;
  if (!video) {
    bubble.hidden = true;
    layer?.classList.remove('visible');
    bubbleAnchorState.object = null;
    bubbleAnchorState.cls = '';
    return;
  }
  const isLine = config.deformationPattern === 'line';
  const patternLabel = isLine ? '线' : '点';
  const variableLabel = config.variableMode === 'radius' ? (isLine ? '线宽' : '半径') : (isLine ? '线距' : '点距');
  const motionLabel = { sync: '同步', wave: '波浪', edges: isLine ? '隔条' : '隔点' }[config.motionMode] ?? '同步';
  const img = bubble.querySelector('#deformBubbleImg');
  if (img && img.getAttribute('src') !== video) img.src = video;
  const caption = bubble.querySelector('#deformBubbleCaption');
  if (caption) caption.textContent = `${patternLabel} · ${variableLabel} · ${motionLabel}`;
  const anchor = bubbleAnchorForTarget(config);
  bubble.classList.remove('anchor-head', 'anchor-arm', 'anchor-chest');
  bubble.classList.add(anchor.cls);
  bubble.hidden = false;
  bubbleAnchorState.object = anchor.object;
  bubbleAnchorState.cls = anchor.cls;
  layer?.classList.add('visible');
}

function updateDeformationLink() {
  const bubble = document.querySelector('#deformBubble');
  const layer = document.querySelector('#deformLinkLayer');
  const path = document.querySelector('#deformLinkPath');
  const dot = document.querySelector('#deformLinkDot');
  if (!bubble || !layer || !path || !dot) return;
  if (bubble.hidden || !bubbleAnchorState.object || !threeState.camera) {
    layer.classList.remove('visible');
    return;
  }
  layer.classList.add('visible');
  const viewport = document.querySelector('#viewport');
  const rect = viewport.getBoundingClientRect();
  bubbleAnchorState.object.getWorldPosition(bubbleProjectVector);
  bubbleProjectVector.project(threeState.camera);
  if (bubbleProjectVector.z > 1) {
    path.style.opacity = '0';
    dot.style.opacity = '0';
    return;
  }
  path.style.opacity = '';
  dot.style.opacity = '';
  const tx = (bubbleProjectVector.x * 0.5 + 0.5) * rect.width;
  const ty = (-bubbleProjectVector.y * 0.5 + 0.5) * rect.height;
  const bubbleRect = bubble.querySelector('.deform-bubble-ring').getBoundingClientRect();
  const bx = bubbleRect.left + bubbleRect.width / 2 - rect.left;
  const by = bubbleRect.top + bubbleRect.height / 2 - rect.top;
  const mx = (bx + tx) / 2;
  const my = Math.min(by, ty) - 26;
  path.setAttribute('d', `M ${bx} ${by} Q ${mx} ${my} ${tx} ${ty}`);
  dot.setAttribute('cx', tx);
  dot.setAttribute('cy', ty);
}

function renderTabContent(config) {
  if (appState.selectedTab === 'Notes') {
    return `
      <section class="inspector-section notes-section">
        <h3>设计备注</h3>
        <textarea id="notesInput" placeholder="记录参与者反馈、设计理由或待讨论问题...">${config.notes ?? ''}</textarea>
      </section>
      ${renderActionButtons()}
    `;
  }

  if (appState.selectedTab === 'Parameters') {
    return `
      <section class="inspector-section">
        <h3>详细参数</h3>
        ${numberField('duration', '时长', config.duration, 0.5, 12, 0.1, 's')}
        ${numberField('amount', '幅度', config.amount, 0, 100, 1, '%')}
        ${numberField('intensity', '强度', config.intensity, 0, 100, 1, '%')}
        ${numberField('contactLimit', '接触上限', config.contactLimit, 1, 30, 0.5, 's')}
        ${numberField('blendIn', '渐入', config.blendIn, 0, 3, 0.1, 's')}
        ${numberField('blendOut', '渐出', config.blendOut, 0, 3, 0.1, 's')}
      </section>
      ${renderActionButtons()}
    `;
  }

  return `
    ${actionMappingTemplate(config)}
    ${deformationResponseTemplate(config)}
    ${responseParametersTemplate(config)}
    ${materialTemplate()}
    ${renderActionButtons()}
  `;
}

function renderActionButtons() {
  return `<button class="add-button" id="addToTimelineButton">⊕ 加入时间轴</button>`;
}

function actionMappingTemplate(config) {
  return `
    <section class="inspector-section action-mapping-section">
      <div class="section-row">
        <h3>动作映射</h3>
        <span>3D 已高亮</span>
      </div>
      <div class="mapping-grid">
        <div>
          <small>动作</small>
          <strong>${displayModuleName(appState.selectedModule)}</strong>
        </div>
        <div>
          <small>目标部位</small>
          <strong>${displayGroupName(config.targetLabel)}</strong>
        </div>
        <div>
          <small>侧别</small>
          <strong>${displayOption(config.side)}</strong>
        </div>
        <div>
          <small>类型</small>
          <strong>${config.category}</strong>
        </div>
      </div>
    </section>
  `;
}

function deformationResponseTemplate(config) {
  return `
    <section class="inspector-section deformation-section">
      <div class="section-row">
        <h3>形变回应</h3>
        <span>${deformationTypes[config.deformationType]?.label ?? '无形变'}</span>
      </div>
      <div class="deformation-cards">
        ${Object.entries(deformationTypes).map(([key, item]) => {
          const recommended = key === getModuleResponseMapping(appState.selectedModule).deformationType;
          return `
            <button class="deformation-card ${config.deformationType === key ? 'active' : ''}" data-deformation-type="${key}">
              <b>${item.icon}</b>
              <span>${item.label}</span>
              <small>${item.description}</small>
              ${recommended ? '<em>推荐</em>' : ''}
            </button>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function responseParametersTemplate(config) {
  const extraControls = [
    config.deformationType === 'surface'
      ? selectField('surfaceState', '表面状态', config.surfaceState, surfaceStateOptions)
      : '',
    config.deformationType === 'wave'
      ? selectField('spatialPattern', '空间模式', config.spatialPattern, spatialPatternOptions)
      : '',
  ].join('');

  return `
    <section class="inspector-section response-parameters-section">
      <h3>回应参数</h3>
      ${rangeField('amount', '幅度', config.amount, 0, 100, 1, '%')}
      ${selectField('speed', '速度', config.speed, responseSpeedOptions)}
      ${selectField('rhythm', '节奏', config.rhythm, responseRhythmOptions)}
      ${numberField('duration', '时长', config.duration, 0.5, 12, 0.1, 's')}
      ${rangeField('intensity', '强度', config.intensity, 0, 100, 1, '%')}
      ${extraControls}
    </section>
  `;
}

function rangeField(key, label, value, min, max, step, unit) {
  return `
    <label class="field range-field">
      <span>${label}</span>
      <input data-param="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" />
      <output>${Number(value).toFixed(2)}</output>
      ${unit ? `<em>${unit}</em>` : '<em></em>'}
    </label>
  `;
}

function numberField(key, label, value, min, max, step, unit) {
  return `
    <label class="field">
      <span>${label}</span>
      <input data-param="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${value}" />
      <em>${unit}</em>
    </label>
  `;
}

function selectField(key, label, value, options) {
  return `
    <label class="field">
      <span>${label}</span>
      <select data-param="${key}" class="select-value">
        ${options.map((option) => `<option value="${option}" ${option === value ? 'selected' : ''}>${displayOption(option)}</option>`).join('')}
      </select>
    </label>
  `;
}

function materialTemplate() {
  const target = appState.selectedMaterialPart;
  const activeMaterial = getMaterialForTarget(target);
  return `
    <section class="inspector-section material-section">
      <div class="section-row">
        <h3>材质预设</h3>
        <span id="materialTarget">${materialTargetLabels[target]}</span>
      </div>
      <div class="part-segment" id="materialPartSegment">
        ${Object.entries(materialTargetLabels).map(([key, label]) => `<button data-part="${key}" class="${target === key ? 'active' : ''}">${label.replace('Both ', '')}</button>`).join('')}
      </div>
      <div class="material-swatches" id="materialSwatches">
        ${materialKeys.map((key) => `
          <button data-material="${key}" class="${activeMaterial === key ? 'active' : ''}">
            <i style="--swatch:${materialSwatches[key]}"></i><span>${materialLabels[key]}</span>
          </button>
        `).join('')}
      </div>
      <button class="reset-material-button" id="resetMaterialsButton">恢复默认材质</button>
      <p class="material-note">这里是临时预览材质，后续可以替换为 Meshy 生成的 PBR 材质。</p>
    </section>
  `;
}

function getMaterialForTarget(targetKey) {
  const targets = materialTargets[targetKey] ?? [targetKey];
  return appState.materials[targets[0]] ?? 'default';
}

function renderTimeline() {
  const activeIds = activeClipIds();
  const visibleTracks = getVisibleTimelineTracks();
  const compact = appState.timeline.length === 0;
  document.querySelector('#timelinePanel').innerHTML = `
    <div class="timeline-shell ${compact ? 'compact' : 'expanded'}">
      <div class="timeline-toolbar">
        <div class="playback">
          <button class="play ${appState.playing ? 'active' : ''}" id="playButton">${appState.playing ? '❚❚' : '▶'}</button>
          <button id="stopButton">■</button>
          <button class="speed" id="speedButton">${appState.speed.toFixed(1)}x ⌄</button>
          <span class="timecode"><b>${formatTime(appState.currentTime)}</b><em>/</em>${formatTime(TOTAL_DURATION)}</span>
        </div>
        <div class="zoom-tools">
          <button data-view-action="reset-camera">⌕</button>
          <button data-zoom="out">−</button>
          <span></span>
          <button data-zoom="in">⌕</button>
          <button data-view-action="fullscreen">⛶</button>
        </div>
      </div>
      ${compact ? compactTimelineTemplate() : `
        <div class="ruler">
          <div></div>
          ${[0, 4, 8, 12, 16, 20].map((time) => `<span style="left:${clipPercent(time)}%">${formatTime(time).slice(0, 5)}</span>`).join('')}
        </div>
        <div class="tracks">
          <div class="playhead" style="left:calc(138px + ${clipPercent(appState.currentTime)}%)"><span>${formatTime(appState.currentTime)}</span></div>
          ${visibleTracks.map((track) => trackTemplate(track, activeIds)).join('')}
        </div>
      `}
    </div>
  `;
}

function compactTimelineTemplate() {
  return `
    <div class="compact-timeline-drop track-lane" data-track="Auto">
      <span class="compact-drop-icon">＋</span>
      <div>
        <strong>拖入一个动作模块</strong>
        <small>加入第一个动作后，会显示对应部位的时间轴轨道。</small>
      </div>
    </div>
  `;
}

function getVisibleTimelineTracks() {
  const occupiedTracks = new Set(appState.timeline.map((clip) => clip.track));
  occupiedTracks.add(inferTrack(appState.selectedModule));
  return timelineTracks.filter((track) => occupiedTracks.has(track.name));
}

function trackTemplate(track, activeIds) {
  const clips = appState.timeline.filter((item) => item.track === track.name);
  return `
    <div class="track">
      <div class="track-label">
        <span>${track.icon}</span>
        <strong>${displayGroupName(track.name)}</strong>
      </div>
      <div class="track-lane" data-track="${track.name}">
        ${clips.length ? '' : '<span class="drop-hint">拖入动作</span>'}
        ${clips.map((item) => clipTemplate(item, activeIds)).join('')}
      </div>
    </div>
  `;
}

function clipTemplate(clip, activeIds) {
  const active = activeIds.has(clip.id);
  const selected = clip.id === appState.selectedClipId;
  const muted = isClipMuted(clip);
  return `
    <div
      class="clip clip-${clip.color} ${muted ? 'muted' : ''} ${active ? 'is-playing' : ''} ${selected ? 'selected' : ''}"
      data-clip="${clip.id}"
      role="button"
      tabindex="0"
      aria-label="${displayModuleName(clip.module)}，${clip.duration === Infinity ? '无限时长' : `${clip.duration.toFixed(1)} 秒`}"
      style="left:${clipPercent(clip.start)}%; width:${clipPercent(clip.duration)}%"
    >
      <span class="clip-main">
        <span class="clip-name">${displayModuleName(clip.module)}</span>
        <small>${clip.duration === Infinity ? '∞' : `${clip.duration.toFixed(1)}s`}</small>
      </span>
      <button class="clip-delete" type="button" data-delete-clip="${clip.id}" aria-label="删除 ${displayModuleName(clip.module)}" title="从时间轴删除">×</button>
      <span class="clip-resize-handle" data-resize-clip="${clip.id}" title="拖动调整时长"></span>
    </div>
  `;
}

function renderToast() {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  toast.textContent = appState.toast;
  toast.classList.toggle('visible', Boolean(appState.toast));
}

function renderModal() {
  const config = exportConfig();
  document.querySelector('#modalBackdrop').hidden = false;
  document.querySelector('#modalBackdrop').innerHTML = `
    <section class="summary-modal">
      <header>
        <div>
          <h2>方案摘要</h2>
          <p>用于研究讨论的模拟摘要，不会真实部署机器人。</p>
        </div>
        <button id="closeModalButton">×</button>
      </header>
      <div class="summary-grid">
        <div><span>场景</span><strong>${sceneBackdrops[appState.sceneBackdrop]?.label ?? '工作室'}</strong></div>
        <div><span>当前模块</span><strong>${displayModuleName(appState.selectedModule)}</strong></div>
        <div><span>目标部位</span><strong>${displayGroupName(getModuleConfig().targetLabel)} · ${displayOption(getModuleConfig().side)}</strong></div>
        <div><span>形变</span><strong>${deformationTypes[getModuleConfig().deformationType]?.label ?? '无形变'}</strong></div>
        <div><span>时间轴动作</span><strong>${appState.timeline.length}</strong></div>
      </div>
      <textarea readonly>${JSON.stringify(config, null, 2)}</textarea>
      <footer>
        <button id="copyJsonButton">复制 JSON</button>
        <button id="closeModalButtonFooter">关闭</button>
      </footer>
    </section>
  `;
}

function exportConfig() {
  return {
    mode: 'Robot Response Prototype',
    sceneBackdrop: sceneBackdrops[appState.sceneBackdrop]?.label ?? 'Studio',
    selectedModule: appState.selectedModule,
    modules: appState.moduleConfigs,
    targetPart: getModuleConfig().targetPart,
    deformationType: getModuleConfig().deformationType,
    materials: appState.materials,
    viewTools: {
      showGrid: appState.showGrid,
      showPartHighlight: appState.showPartHighlight,
      showUserReference: appState.showUserReference,
    },
    timeline: appState.timeline,
  };
}

document.querySelector('#app').innerHTML = appTemplate();
renderAll();
applySceneBackdrop();

document.addEventListener('fullscreenchange', updateViewportToolState);

document.querySelector('#app').addEventListener('pointerdown', (event) => {
  if (event.target.closest('[data-delete-clip]')) return;

  const resizeHandle = event.target.closest('[data-resize-clip]');
  const clipButton = event.target.closest('[data-clip]');
  if (resizeHandle || clipButton) {
    const clipId = resizeHandle?.dataset.resizeClip ?? clipButton.dataset.clip;
    const clip = appState.timeline.find((item) => item.id === clipId);
    const lane = event.target.closest('.track-lane');
    if (clip && lane) {
      event.preventDefault();
      snapshot();
      timelineEdit = {
        mode: resizeHandle ? 'resize' : 'move',
        clipId,
        lane,
        laneWidth: lane.getBoundingClientRect().width,
        startPointerX: event.clientX,
        originalStart: clip.start,
        originalDuration: clip.duration,
        moved: false,
      };
      document.body.classList.add(timelineEdit.mode === 'resize' ? 'resizing-clip' : 'moving-clip');
      event.target.setPointerCapture?.(event.pointerId);
      return;
    }
  }

  const scrubTarget = event.target.closest('.playhead, .ruler, .track-lane');
  if (scrubTarget && !event.target.closest('.clip') && !event.target.closest('.track-label')) {
    event.preventDefault();
    pauseTimeline();
    timelineScrub = {
      startPointerX: event.clientX,
      moved: false,
    };
    document.body.classList.add('scrubbing-timeline');
    scrubTimelineTo(event);
    return;
  }

  const target = event.target.closest('button');
  if (!target) return;

  if (target.id === 'playButton') {
    event.preventDefault();
    suppressPlaybackClick = true;
    appState.playing ? pauseTimeline() : playTimeline(appState.currentTime >= TOTAL_DURATION ? 0 : appState.currentTime);
    return;
  }

  if (target.id === 'stopButton') {
    event.preventDefault();
    suppressPlaybackClick = true;
    pauseTimeline();
    appState.currentTime = 0;
    renderTimeline();
    applyTimelinePose(0);
  }
});

window.addEventListener('pointermove', (event) => {
  if (timelineScrub) {
    if (Math.abs(event.clientX - timelineScrub.startPointerX) > 2) timelineScrub.moved = true;
    scrubTimelineTo(event);
    return;
  }

  if (!timelineEdit) return;
  const clip = appState.timeline.find((item) => item.id === timelineEdit.clipId);
  if (!clip) return;
  const delta = timelineDeltaFromPointer(event);
  if (Math.abs(delta) > 0.08) timelineEdit.moved = true;

  if (timelineEdit.mode === 'move') {
    clip.start = clamp(
      snapTimelineValue(timelineEdit.originalStart + delta),
      0,
      TOTAL_DURATION - clip.duration
    );
    appState.currentTime = clip.start;
  } else {
    updateClipDuration(clip, clamp(
      snapTimelineValue(timelineEdit.originalDuration + delta),
      0.5,
      TOTAL_DURATION - clip.start
    ));
  }

  renderTimeline();
  if (clip.id === appState.selectedClipId) renderRightPanel();
  applyTimelinePose(appState.currentTime);
});

window.addEventListener('pointerup', () => {
  if (timelineScrub) {
    suppressTimelineClick = timelineScrub.moved;
    document.body.classList.remove('scrubbing-timeline');
    timelineScrub = null;
    return;
  }

  if (!timelineEdit) return;
  const clip = appState.timeline.find((item) => item.id === timelineEdit.clipId);
  document.body.classList.remove('moving-clip', 'resizing-clip');
  if (clip) {
    selectClip(clip);
    setToast(timelineEdit.mode === 'resize' ? '时长已更新' : '开始时间已更新');
  }
  timelineEdit = null;
});

document.querySelector('#app').addEventListener('click', (event) => {
  if (suppressTimelineClick) {
    suppressTimelineClick = false;
    return;
  }
  if (timelineEdit?.moved) return;
  if (appState.sceneMenuOpen && !event.target.closest('.scene-selector')) {
    appState.sceneMenuOpen = false;
    renderTopbar();
  }
  if (appState.cameraMenuOpen && !event.target.closest('.camera-selector')) {
    appState.cameraMenuOpen = false;
    renderViewHeader();
  }

  const deleteClipTarget = event.target.closest('[data-delete-clip]');
  if (deleteClipTarget) {
    deleteTimelineClip(deleteClipTarget.dataset.deleteClip);
    return;
  }

  const clickedClip = event.target.closest('[data-clip]');
  if (clickedClip && !event.target.closest('[data-resize-clip]')) {
    const clip = appState.timeline.find((item) => item.id === clickedClip.dataset.clip);
    if (clip) {
      selectClip(clip);
    }
    return;
  }

  const target = event.target.closest('button');
  if (!target) return;

  if (suppressPlaybackClick && (target.id === 'playButton' || target.id === 'stopButton')) {
    suppressPlaybackClick = false;
    return;
  }

  if (target.id === 'sceneMenuButton') {
    appState.sceneMenuOpen = !appState.sceneMenuOpen;
    renderTopbar();
    return;
  }

  if (target.id === 'cameraMenuButton') {
    appState.cameraMenuOpen = !appState.cameraMenuOpen;
    renderViewHeader();
    return;
  }

  if (target.dataset.sceneBackdrop) {
    snapshot();
    appState.sceneBackdrop = target.dataset.sceneBackdrop;
    appState.sceneMenuOpen = false;
    renderTopbar();
    renderViewHeader();
    applySceneBackdrop();
    setToast(`${sceneBackdrops[appState.sceneBackdrop].label} scene`);
    return;
  }

  if (target.dataset.cameraView) {
    snapshot();
    appState.cameraView = target.dataset.cameraView;
    appState.cameraMenuOpen = false;
    appState.sceneBackdrop = 'studio';
    renderTopbar();
    renderViewHeader();
    applySceneBackdrop();
    setToast(`${cameraViews[appState.cameraView].label} · 工作室背景`);
    return;
  }

  if (target.dataset.group) {
    appState.collapsedGroups[target.dataset.group] = !appState.collapsedGroups[target.dataset.group];
    renderModules();
    return;
  }

  if (target.dataset.module) {
    appState.selectedModule = target.dataset.module;
    appState.selectedClipId = null;
    appState.selectedTab = 'Configure';
    appState.currentTime = findModuleStart(target.dataset.module) ?? appState.currentTime;
    appState.selectedMaterialPart = moduleToMaterialTarget(getModuleConfig(target.dataset.module));
    renderAll();
    applyTimelinePose(appState.currentTime);
    applyPartHighlight();
    return;
  }

  if (target.id === 'addModuleButton') {
    snapshot();
    const group = getSelectedGroup() ?? getScenarioModules()[0];
    const label = `Custom action ${appState.customCounter++}`;
    group.items.push(label);
    appState.selectedModule = label;
    getModuleConfig(label);
    appState.selectedMaterialPart = moduleToMaterialTarget(getModuleConfig(label));
    renderAll();
    applyPartHighlight();
    setToast('已添加自定义动作');
    return;
  }

  if (target.dataset.tab) {
    appState.selectedTab = target.dataset.tab;
    renderRightPanel();
    return;
  }

  if (target.dataset.actionParamButton) {
    if (!getSelectedClip()) {
      setToast('请先点击时间轴中的动作块');
      renderRightPanel();
      return;
    }
    setActionParameter(target.dataset.actionParamButton, target.dataset.value);
    return;
  }

  if (target.dataset.deformationPattern) {
    if (!getSelectedClip()) {
      setToast('请先点击时间轴中的动作块');
      renderRightPanel();
      return;
    }
    setActionParameter('deformationPattern', target.dataset.deformationPattern);
    return;
  }

  if (target.dataset.deformationTarget) {
    if (!getSelectedClip()) {
      setToast('请先点击时间轴中的动作块');
      renderRightPanel();
      return;
    }
    setActionParameter('deformationTarget', target.dataset.deformationTarget);
    return;
  }

  if (target.dataset.deformationType) {
    if (!getSelectedClip()) {
      setToast('请先点击时间轴中的动作块');
      renderRightPanel();
      return;
    }
    setActionParameter('deformationType', target.dataset.deformationType);
    setToast(`已选择${deformationTypes[target.dataset.deformationType].label}`);
    return;
  }

  if (target.dataset.part) {
    appState.selectedMaterialPart = target.dataset.part;
    renderRightPanel();
    return;
  }

  if (target.dataset.material) {
    snapshot();
    setMaterialForTarget(appState.selectedMaterialPart, target.dataset.material);
    applyMaterialToPart(appState.selectedMaterialPart, target.dataset.material);
    renderRightPanel();
    applyPartHighlight();
    return;
  }

  if (target.id === 'resetMaterialsButton') {
    snapshot();
    Object.keys(appState.materials).forEach((key) => {
      appState.materials[key] = 'default';
    });
    applyAllMaterials();
    renderRightPanel();
    setToast('材质已恢复默认');
    return;
  }

  if (target.id === 'playButton') {
    appState.playing ? pauseTimeline() : playTimeline(appState.currentTime >= TOTAL_DURATION ? 0 : appState.currentTime);
    return;
  }

  if (target.id === 'stopButton') {
    pauseTimeline();
    appState.currentTime = 0;
    renderTimeline();
    applyTimelinePose(0);
    return;
  }

  if (target.id === 'speedButton') {
    const index = speedOptions.indexOf(appState.speed);
    appState.speed = speedOptions[(index + 1) % speedOptions.length];
    renderTimeline();
    return;
  }

  if (target.id === 'previewButton') {
    playTimeline(0);
    setToast('开始预览');
    return;
  }

  if (target.id === 'saveButton') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportConfigForStorage()));
    setToast('已保存到浏览器');
    return;
  }

  if (target.id === 'deployButton') {
    renderModal();
    return;
  }

  if (target.id === 'undoButton') {
    if (!history.length) return;
    future.push(JSON.stringify(exportConfigForStorage()));
    restore(history.pop());
    setToast('已撤销');
    return;
  }

  if (target.id === 'redoButton') {
    if (!future.length) return;
    history.push(JSON.stringify(exportConfigForStorage()));
    restore(future.pop());
    setToast('已重做');
    return;
  }

  if (target.id === 'addToTimelineButton') {
    snapshot();
    const clip = createTimelineClip(appState.selectedModule, appState.currentTime);
    appState.timeline.push(clip);
    appState.selectedClipId = clip.id;
    renderTimeline();
    renderRightPanel();
    setToast('已加入时间轴');
    return;
  }

  if (target.dataset.viewAction) {
    handleViewAction(target.dataset.viewAction);
    return;
  }

  if (target.id === 'closeModalButton' || target.id === 'closeModalButtonFooter') {
    document.querySelector('#modalBackdrop').hidden = true;
    return;
  }

  if (target.id === 'copyJsonButton') {
    navigator.clipboard?.writeText(JSON.stringify(exportConfig(), null, 2));
    setToast('JSON 已复制');
  }
});

document.querySelector('#app').addEventListener('dragstart', (event) => {
  const moduleButton = event.target.closest('[data-module]');
  if (!moduleButton) return;
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('text/plain', moduleButton.dataset.module);
  moduleButton.classList.add('dragging');
});

document.querySelector('#app').addEventListener('dragend', (event) => {
  event.target.closest('[data-module]')?.classList.remove('dragging');
  document.querySelectorAll('.track-lane.drag-over').forEach((lane) => lane.classList.remove('drag-over'));
});

document.querySelector('#app').addEventListener('dragover', (event) => {
  const lane = event.target.closest('.track-lane');
  if (!lane) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  document.querySelectorAll('.track-lane.drag-over').forEach((item) => {
    if (item !== lane) item.classList.remove('drag-over');
  });
  lane.classList.add('drag-over');
});

document.querySelector('#app').addEventListener('dragleave', (event) => {
  const lane = event.target.closest('.track-lane');
  if (!lane || lane.contains(event.relatedTarget)) return;
  lane.classList.remove('drag-over');
});

document.querySelector('#app').addEventListener('drop', (event) => {
  const lane = event.target.closest('.track-lane');
  if (!lane) return;
  event.preventDefault();
  lane.classList.remove('drag-over');
  const moduleName = event.dataTransfer.getData('text/plain');
  if (!moduleName) return;
  const intendedTrack = lane.dataset.track;
  const resolvedTrack = inferTrack(moduleName);
  const start = timelineTimeFromDrop(event, lane);
  snapshot();
  const clip = createTimelineClip(moduleName, start, intendedTrack);
  appState.timeline.push(clip);
  appState.selectedModule = moduleName;
  appState.selectedClipId = clip.id;
  appState.currentTime = clip.start;
  appState.selectedMaterialPart = moduleToMaterialTarget(getModuleConfig(moduleName));
  renderAll();
  applyTimelinePose(appState.currentTime);
  applyPartHighlight();
    setToast(`已加入${displayGroupName(resolvedTrack)}轨道`);
});

window.addEventListener('keydown', (event) => {
  if (!['Delete', 'Backspace'].includes(event.key)) return;
  const activeTag = document.activeElement?.tagName?.toLowerCase();
  if (['input', 'textarea', 'select'].includes(activeTag)) return;
  if (!appState.selectedClipId) return;
  event.preventDefault();
  deleteTimelineClip(appState.selectedClipId);
});

document.querySelector('#app').addEventListener('input', (event) => {
  const target = event.target;
  if (target.dataset?.actionParam) {
    if (!getSelectedClip()) {
      setToast('请先点击时间轴中的动作块');
      renderRightPanel();
      return;
    }
    const value = target.type === 'number' || target.type === 'range' ? Number(target.value) : target.value;
    setActionParameter(target.dataset.actionParam, value, false);
    return;
  }
  if (!target.dataset?.param) return;
  if (!getSelectedClip()) {
    setToast('请先点击时间轴中的动作块');
    renderRightPanel();
    return;
  }
  const config = getModuleConfig();
  const value = target.type === 'number' || target.type === 'range' ? Number(target.value) : target.value;
  config[target.dataset.param] = value;
  const output = target.closest('.field')?.querySelector('output');
  if (output && typeof value === 'number') output.textContent = value.toFixed(2);
});

document.querySelector('#app').addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'moduleEnabled') {
    const clip = getSelectedClip();
    if (!clip) {
      renderRightPanel();
      return;
    }
    snapshot();
    clip.muted = !target.checked;
    renderTimeline();
    return;
  }
  if (target.dataset?.param) {
    if (!getSelectedClip()) {
      setToast('请先点击时间轴中的动作块');
      renderRightPanel();
      return;
    }
    snapshot();
    getModuleConfig()[target.dataset.param] = target.type === 'number' ? Number(target.value) : target.value;
    renderRightPanel();
  }
  if (target.dataset?.actionParam) {
    if (!getSelectedClip()) {
      setToast('请先点击时间轴中的动作块');
      renderRightPanel();
      return;
    }
    const value = target.type === 'number' || target.type === 'range' ? Number(target.value) : target.value;
    setActionParameter(target.dataset.actionParam, value);
  }
  if (target.id === 'notesInput') {
    snapshot();
    getModuleConfig().notes = target.value;
  }
});

function exportConfigForStorage() {
  return {
    selectedModule: appState.selectedModule,
    selectedClipId: appState.selectedClipId,
    selectedTab: appState.selectedTab,
    collapsedGroups: appState.collapsedGroups,
    customCounter: appState.customCounter,
    moduleConfigs: appState.moduleConfigs,
    materials: appState.materials,
    selectedMaterialPart: appState.selectedMaterialPart,
    timeline: appState.timeline,
    currentTime: appState.currentTime,
    speed: appState.speed,
    sceneBackdrop: appState.sceneBackdrop,
    cameraView: appState.cameraView,
    showGrid: appState.showGrid,
    showAxes: appState.showAxes,
    showPartHighlight: appState.showPartHighlight,
    showUserReference: appState.showUserReference,
  };
}

function findModuleStart(moduleName) {
  return appState.timeline.find((clip) => clip.module === moduleName)?.start;
}

function inferTrack(moduleName) {
  if (/head|nod|look/i.test(moduleName)) return 'Head';
  if (/hand|arm|pat|vibration|reach|side lift|retract|hold still|open arms|close arms/i.test(moduleName)) return 'Arm / Hand';
  if (/^breathing$/i.test(moduleName)) return 'Chest + Belly';
  if (/breathing light|heartbeat|color|glow/i.test(moduleName)) return 'Chest';
  if (/breathing rise|local warmth|soft rebound/i.test(moduleName)) return 'Belly';
  if (/move|stay|stop/i.test(moduleName)) return 'Body / Wheels';
  return 'Body / Wheels';
}

function inferColor(moduleName) {
  const track = inferTrack(moduleName);
  return { Head: 'blue', 'Arm / Hand': 'green', 'Chest + Belly': 'orange', Chest: 'pink', Belly: 'orange', 'Body / Wheels': 'cyan' }[track] ?? 'blue';
}

function inferAction(moduleName) {
  if (/head up/i.test(moduleName)) return 'headUp';
  if (/head down/i.test(moduleName)) return 'headDown';
  if (/head left/i.test(moduleName)) return 'headLeft';
  if (/head right/i.test(moduleName)) return 'headRight';
  if (/nod|look/i.test(moduleName)) return 'nodHead';
  if (/soft head inflate/i.test(moduleName)) return 'headInflate';
  if (/arm inflate/i.test(moduleName)) return 'armInflate';
  if (/forward \/ backward reach/i.test(moduleName)) return 'handForward';
  if (/side lift/i.test(moduleName)) return 'raiseArm';
  if (/hand up/i.test(moduleName)) return 'raiseArm';
  if (/hand down/i.test(moduleName)) return 'lowerArm';
  if (/hand forward/i.test(moduleName)) return 'handForward';
  if (/hand back/i.test(moduleName)) return 'handBack';
  if (/open arms/i.test(moduleName)) return 'openArms';
  if (/close arms/i.test(moduleName)) return 'closeArms';
  if (/raise hand/i.test(moduleName)) return 'raiseArm';
  if (/lower hand/i.test(moduleName)) return 'lowerArm';
  if (/reach forward/i.test(moduleName)) return 'reachForward';
  if (/retract hand/i.test(moduleName)) return 'retractHand';
  if (/move hand back/i.test(moduleName)) return 'moveHandBack';
  if (/gentle pat/i.test(moduleName)) return 'patHand';
  if (/hand vibration/i.test(moduleName)) return 'vibrateHand';
  if (/warm hand/i.test(moduleName)) return 'warmHand';
  if (/hand glow/i.test(moduleName)) return 'glowHand';
  if (/hold still/i.test(moduleName)) return 'holdStill';
  if (/^breathing$/i.test(moduleName)) return 'bellyBreathing';
  if (/breathing rise/i.test(moduleName)) return 'bellyBreathing';
  if (/soft rebound/i.test(moduleName)) return 'bellyRebound';
  if (/heartbeat light/i.test(moduleName)) return 'chestHeartbeat';
  if (/breathing light/i.test(moduleName)) return 'chestBreathing';
  return 'idle';
}

function setMaterialForTarget(targetKey, materialKey) {
  const targets = materialTargets[targetKey] ?? [targetKey];
  targets.forEach((target) => {
    appState.materials[target] = materialKey;
  });
}

const materialLibrary = {
  silicone: () => new THREE.MeshStandardMaterial({ color: '#f7cfe3', roughness: 0.48, metalness: 0, envMapIntensity: 0.6 }),
  fur: () => new THREE.MeshStandardMaterial({ color: '#eee8dc', roughness: 0.94, metalness: 0, envMapIntensity: 0.18 }),
  cotton: () => new THREE.MeshStandardMaterial({ color: '#d9edf8', roughness: 0.86, metalness: 0, envMapIntensity: 0.24 }),
  silk: () => new THREE.MeshStandardMaterial({ color: '#eee0fb', roughness: 0.32, metalness: 0, envMapIntensity: 0.85 }),
  foam: () => new THREE.MeshStandardMaterial({ color: '#e2f1dc', roughness: 0.72, metalness: 0, envMapIntensity: 0.34 }),
};

const defaultMaterialLibrary = {
  body: () => new THREE.MeshStandardMaterial({ color: '#edf3f8', roughness: 0.64, metalness: 0, envMapIntensity: 0.34 }),
  head: () => new THREE.MeshStandardMaterial({ color: '#f0f5fa', roughness: 0.56, metalness: 0, envMapIntensity: 0.32 }),
  leftarm: () => new THREE.MeshStandardMaterial({ color: '#d9cbfb', roughness: 0.66, metalness: 0, envMapIntensity: 0.42 }),
  rightarm: () => new THREE.MeshStandardMaterial({ color: '#d9cbfb', roughness: 0.66, metalness: 0, envMapIntensity: 0.42 }),
  lefthand: () => new THREE.MeshStandardMaterial({ color: '#d6ccfb', roughness: 0.52, metalness: 0, envMapIntensity: 0.5 }),
  righthand: () => new THREE.MeshStandardMaterial({ color: '#d6ccfb', roughness: 0.52, metalness: 0, envMapIntensity: 0.5 }),
};

function cloneMaterial(material) {
  if (Array.isArray(material)) return material.map((item) => item.clone());
  return material?.clone();
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose?.());
    return;
  }
  material?.dispose?.();
}

function collectMeshes(object) {
  if (!object) return [];
  if (object.isMesh) return [object];
  const meshes = [];
  object.traverse?.((child) => {
    if (child.isMesh) meshes.push(child);
  });
  return meshes;
}

function getMaterialMeshes(partKey) {
  return threeState.materialParts[partKey] ?? collectMeshes(threeState.parts[partKey]);
}

function applyMaterialToPart(partKey, materialKey) {
  const targets = materialTargets[partKey] ?? [partKey];
  targets.forEach((targetKey) => {
    getMaterialMeshes(targetKey).forEach((object, index) => {
      disposeMaterial(object.material);
      object.material = materialKey === 'default'
        ? cloneMaterial(threeState.defaultMaterials[targetKey]?.[index] ?? threeState.defaultMaterials[targetKey]?.[0])
        : materialLibrary[materialKey]();
    });
  });
}

function applyAllMaterials() {
  Object.entries(appState.materials).forEach(([partKey, materialKey]) => {
    applyMaterialToPart(partKey, materialKey);
  });
  applyPartHighlight();
}

function setMaterialHighlight(material, active) {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((item) => {
    if (!item?.emissive) return;
    item.emissive.set(active ? '#58a5ff' : '#000000');
    item.emissiveIntensity = active ? 0.34 : 0;
  });
}

function clearPartHighlight() {
  threeState.highlightOverlays.forEach((overlay) => {
    overlay.parent?.remove(overlay);
    disposeMaterial(overlay.material);
  });
  threeState.highlightOverlays = [];
  Object.keys(threeState.materialParts).forEach((partKey) => {
    getMaterialMeshes(partKey).forEach((object) => {
      if (object?.material) setMaterialHighlight(object.material, false);
    });
  });
}

function createHighlightOverlay(object) {
  const overlay = new THREE.Mesh(
    object.geometry,
    new THREE.MeshBasicMaterial({
      color: '#2f8cff',
      transparent: true,
      opacity: 0.38,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  overlay.name = `${object.name || 'part'}_selection_highlight`;
  overlay.renderOrder = 20;
  overlay.scale.setScalar(1.055);
  object.add(overlay);
  threeState.highlightOverlays.push(overlay);
}

function applyPartHighlight() {
  if (!threeState.loaded) return;
  clearPartHighlight();
  if (!appState.showPartHighlight) return;
  const highlightTargets = materialTargets[moduleToMaterialTarget(getModuleConfig())] ?? [];
  Object.entries(threeState.materialParts).forEach(([key, meshes]) => {
    const active = highlightTargets.includes(key);
    if (!active) return;
    meshes.forEach((object) => {
      setMaterialHighlight(object.material, true);
      createHighlightOverlay(object);
    });
  });
}

function clearPointDeformationVisuals() {
  threeState.pointDeformationVisuals.forEach((marker) => {
    marker.parent?.remove(marker);
    marker.geometry?.dispose?.();
    marker.material?.dispose?.();
    marker.children.forEach((child) => {
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    });
  });
  threeState.pointDeformationOverlays.forEach((overlay) => {
    overlay.parent?.remove(overlay);
    overlay.geometry?.dispose?.();
    overlay.material?.dispose?.();
  });
  threeState.pointDeformationVisuals = [];
  threeState.pointDeformationOverlays = [];
}

function makePointMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: '#f6f7f7',
    emissive: '#f0f1f2',
    emissiveIntensity: 0.08,
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.46,
    clearcoatRoughness: 0.3,
    depthTest: true,
    depthWrite: true,
  });
}

function makePointHaloMaterial() {
  return new THREE.MeshBasicMaterial({
    color: '#a8dcff',
    transparent: true,
    opacity: 0.035,
    depthTest: true,
    depthWrite: false,
  });
}

function pointTargetMeshes(targetKey) {
  if (targetKey === 'head_shell') return collectMeshes(threeState.parts.head);
  if (targetKey === 'arm_hand') {
    return ['leftarm', 'rightarm', 'lefthand', 'righthand'].flatMap((key) => collectMeshes(threeState.parts[key]));
  }
  if (targetKey === 'chest_belly') {
    return ['chest', 'belly'].flatMap((key) => collectMeshes(threeState.deformationParts[key]));
  }
  return [];
}

function pointLayoutsForTarget(targetKey, mesh, meshIndex) {
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  if (!box) return;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const rayConfigs = {
    front: {
      origin: (item) => new THREE.Vector3(box.max.x + size.x * 0.35, center.y + item.y * size.y, center.z + item.lateral * size.z),
      direction: new THREE.Vector3(-1, 0, 0),
    },
    back: {
      origin: (item) => new THREE.Vector3(box.min.x - size.x * 0.35, center.y + item.y * size.y, center.z + item.lateral * size.z),
      direction: new THREE.Vector3(1, 0, 0),
    },
    left: {
      origin: (item) => new THREE.Vector3(center.x + item.lateral * size.x, center.y + item.y * size.y, box.min.z - size.z * 0.35),
      direction: new THREE.Vector3(0, 0, 1),
    },
    right: {
      origin: (item) => new THREE.Vector3(center.x - item.lateral * size.x, center.y + item.y * size.y, box.max.z + size.z * 0.35),
      direction: new THREE.Vector3(0, 0, -1),
    },
  };

  if (targetKey === 'head_shell') {
    return {
      box,
      size,
      radius: Math.min(size.y, size.z) * 0.062,
      rayConfigs,
      layout: [
        { side: 'front', y: 0.43, lateral: -0.26, scale: 0.94 },
        { side: 'front', y: 0.43, lateral: 0, scale: 1 },
        { side: 'front', y: 0.43, lateral: 0.26, scale: 0.94 },
        { side: 'front', y: 0.25, lateral: -0.38, scale: 0.88 },
        { side: 'front', y: 0.25, lateral: 0.38, scale: 0.88 },
        { side: 'left', y: 0.42, lateral: -0.08, scale: 0.9 },
        { side: 'left', y: 0.24, lateral: 0.08, scale: 0.84 },
        { side: 'right', y: 0.42, lateral: -0.08, scale: 0.9 },
        { side: 'right', y: 0.24, lateral: 0.08, scale: 0.84 },
        { side: 'back', y: 0.42, lateral: -0.26, scale: 0.9 },
        { side: 'back', y: 0.42, lateral: 0, scale: 0.96 },
        { side: 'back', y: 0.42, lateral: 0.26, scale: 0.9 },
        { side: 'back', y: 0.24, lateral: -0.2, scale: 0.82 },
        { side: 'back', y: 0.24, lateral: 0.2, scale: 0.82 },
      ],
    };
  }

  if (targetKey === 'arm_hand') {
    const isHand = /hand|手/.test(mesh.name.toLowerCase());
    return {
      box,
      size,
      radius: Math.min(size.x, size.y, size.z) * (isHand ? 0.2 : 0.16),
      rayConfigs,
      layout: isHand
        ? [
            { side: 'front', y: 0.22, lateral: -0.18, scale: 0.88 },
            { side: 'front', y: 0.22, lateral: 0.18, scale: 0.88 },
            { side: 'front', y: -0.12, lateral: 0, scale: 0.82 },
          ]
        : [
            { side: 'front', y: 0.36, lateral: 0, scale: 0.86 },
            { side: 'front', y: 0.12, lateral: 0, scale: 0.9 },
            { side: 'front', y: -0.12, lateral: 0, scale: 0.9 },
            { side: 'front', y: -0.36, lateral: 0, scale: 0.82 },
          ],
    };
  }

  const rowOffset = meshIndex % 2 === 0 ? 0 : 0.04;
  return {
    box,
    size,
    radius: Math.min(size.y, size.z) * 0.065,
    rayConfigs,
    layout: [
      { side: 'front', y: 0.28 + rowOffset, lateral: -0.24, scale: 0.9 },
      { side: 'front', y: 0.28 + rowOffset, lateral: 0, scale: 0.96 },
      { side: 'front', y: 0.28 + rowOffset, lateral: 0.24, scale: 0.9 },
      { side: 'front', y: -0.06 + rowOffset, lateral: -0.16, scale: 0.84 },
      { side: 'front', y: -0.06 + rowOffset, lateral: 0.16, scale: 0.84 },
    ],
  };
}

function createPointOverlay(mesh, targetKey) {
  if (!mesh?.geometry) return;
  const overlay = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({
      color: '#68c9ff',
      transparent: true,
      opacity: targetKey === 'head_shell' ? 0.035 : 0.045,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  overlay.name = `${targetKey}_point_surface_hint`;
  overlay.scale.setScalar(1.012);
  overlay.renderOrder = 24;
  overlay.visible = false;
  mesh.add(overlay);
  threeState.pointDeformationOverlays.push(overlay);
}

function createPointMarkersForMesh(mesh, targetKey, meshIndex) {
  if (!mesh?.isMesh || !mesh.geometry) return;
  const configSet = pointLayoutsForTarget(targetKey, mesh, meshIndex);
  if (!configSet) return;

  mesh.updateWorldMatrix(true, false);
  createPointOverlay(mesh, targetKey);
  const raycaster = new THREE.Raycaster();
  configSet.layout.forEach((item) => {
    const config = configSet.rayConfigs[item.side];
    if (!config) return;
    const localOrigin = config.origin(item);
    const worldOrigin = localOrigin.clone().applyMatrix4(mesh.matrixWorld);
    const worldDirection = config.direction.clone().transformDirection(mesh.matrixWorld);
    raycaster.set(worldOrigin, worldDirection);
    const hit = raycaster.intersectObject(mesh, false)[0];
    if (!hit?.face) return;

    const localPoint = mesh.worldToLocal(hit.point.clone());
    const localNormal = hit.face.normal.clone().normalize();
    if (localNormal.dot(config.direction) > 0) localNormal.negate();
    const bubbleRadius = configSet.radius * item.scale;

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(bubbleRadius, 24, 16),
      makePointMaterial()
    );
    marker.name = `${targetKey}_point_deformation_bubble`;
    marker.position.copy(localPoint).addScaledVector(localNormal, -bubbleRadius * 0.64);
    marker.renderOrder = 32;
    marker.visible = false;
    marker.userData.delay = item.delay ?? 0;
    marker.userData.baseScale = 1;
    marker.userData.basePosition = marker.position.clone();
    marker.userData.localNormal = localNormal.clone();
    marker.userData.bubbleRadius = bubbleRadius;
    marker.userData.targetKey = targetKey;

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(bubbleRadius * 1.1, 20, 12),
      makePointHaloMaterial()
    );
    halo.name = `${targetKey}_point_deformation_halo`;
    halo.renderOrder = 31;
    marker.add(halo);

    mesh.add(marker);
    threeState.pointDeformationVisuals.push(marker);
  });
}

function createPointDeformationVisuals() {
  clearPointDeformationVisuals();
  deformationTargets.forEach(({ key }) => {
    pointTargetMeshes(key).forEach((mesh, index) => createPointMarkersForMesh(mesh, key, index));
  });
}

function activePointDeformationTarget() {
  const config = getPanelConfig();
  return config.deformationPattern === 'point' ? config.deformationTarget : null;
}

function updatePointDeformationVisuals(time, activeTarget = activePointDeformationTarget()) {
  threeState.pointDeformationOverlays.forEach((overlay) => {
    overlay.visible = Boolean(activeTarget && overlay.name.startsWith(activeTarget));
  });
  if (!threeState.pointDeformationVisuals.length) return;
  threeState.pointDeformationVisuals.forEach((marker) => {
    const visible = marker.userData.targetKey === activeTarget;
    marker.visible = visible;
    if (!visible) return;
    const phase = time * 1.8 + marker.userData.delay;
    const pulse = 0.5 + Math.sin(phase) * 0.5;
    const scale = marker.userData.baseScale * (0.9 + pulse * 0.28);
    marker.scale.setScalar(scale);
    if (marker.userData.basePosition && marker.userData.localNormal && marker.userData.bubbleRadius) {
      marker.position.copy(marker.userData.basePosition)
        .addScaledVector(marker.userData.localNormal, -marker.userData.bubbleRadius * pulse * 0.28);
    }
    const halo = marker.children[0];
    if (halo?.material) halo.material.opacity = 0.025 + pulse * 0.075;
  });
}

function updateViewportToolState() {
  document.querySelector('[data-view-action="toggle-grid"]')?.classList.toggle('active', appState.showGrid);
  document.querySelector('[data-view-action="toggle-highlight"]')?.classList.toggle('active', appState.showPartHighlight);
  document.querySelector('[data-view-action="toggle-user-reference"]')?.classList.toggle('active', appState.showUserReference);
  document.querySelector('[data-view-action="fullscreen"]')?.classList.toggle('active', document.fullscreenElement === document.querySelector('#viewport'));
  const userReference = document.querySelector('#userReference');
  if (userReference) {
    userReference.classList.toggle('visible', appState.showUserReference);
    userReference.setAttribute('aria-hidden', appState.showUserReference ? 'false' : 'true');
  }
}

function setupRobotViewport() {
  const canvas = document.querySelector('#robotCanvas');
  const viewport = document.querySelector('#viewport');
  const status = document.querySelector('#viewportStatus');

  threeState.scene = new THREE.Scene();
  threeState.camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  threeState.camera.position.set(0, 1.14, 4.68);

  threeState.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  threeState.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  threeState.renderer.outputColorSpace = THREE.SRGBColorSpace;
  threeState.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  threeState.renderer.toneMappingExposure = 1.04;

  threeState.controls = new OrbitControls(threeState.camera, threeState.renderer.domElement);
  threeState.controls.enableDamping = true;
  threeState.controls.dampingFactor = 0.08;
  threeState.controls.target.set(0, 0.5, 0);
  threeState.controls.minDistance = 1.8;
  threeState.controls.maxDistance = 6.5;

  threeState.scene.add(new THREE.HemisphereLight('#ffffff', '#d6e5f7', 2.35));
  const keyLight = new THREE.DirectionalLight('#ffffff', 2.65);
  keyLight.position.set(3, 5, 4);
  threeState.scene.add(keyLight);
  const sideLight = new THREE.DirectionalLight('#b9e9ff', 1.15);
  sideLight.position.set(-3.5, 2.6, -2.5);
  threeState.scene.add(sideLight);
  const rimLight = new THREE.DirectionalLight('#d9ecff', 1.55);
  rimLight.position.set(-3.8, 2.4, 3.2);
  threeState.scene.add(rimLight);

  threeState.axesHelper = new THREE.AxesHelper(0.7);
  threeState.axesHelper.visible = appState.showAxes;
  threeState.scene.add(threeState.axesHelper);

  threeState.robotRoot = new THREE.Group();
  threeState.scene.add(threeState.robotRoot);

  function resize() {
    const rect = viewport.getBoundingClientRect();
    threeState.renderer.setSize(rect.width, rect.height, false);
    threeState.camera.aspect = rect.width / rect.height;
    threeState.camera.updateProjectionMatrix();
  }

  function centerModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2.05 / Math.max(size.x, size.y, size.z);
    threeState.robotRoot.scale.setScalar(scale);
    threeState.robotRoot.position.sub(center.multiplyScalar(scale));
    threeState.robotRoot.position.y += 0.04;
    const scaledBox = new THREE.Box3().setFromObject(threeState.robotRoot);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    threeState.controls.target.copy(scaledCenter);
    threeState.controls.target.y += 0.08;
    threeState.controls.update();
  }

  new GLTFLoader().load(
    '/models/gentle_robot_v0.glb',
    (gltf) => {
      const model = gltf.scene;
      threeState.robotRoot.add(model);
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
        child.material.side = THREE.DoubleSide;
      });

      Object.entries(robotNodeBindings).forEach(([key, nodeName]) => {
        const object = model.getObjectByName(nodeName);
        if (!object) return;
        threeState.parts[key] = object;
        threeState.baseQuaternions[key] = object.quaternion.clone();
        threeState.baseScales[key] = object.scale.clone();
      });

      Object.entries(robotMaterialBindings).forEach(([key, nodeNames]) => {
        const meshes = nodeNames.flatMap((nodeName) => collectMeshes(model.getObjectByName(nodeName)));
        threeState.materialParts[key] = meshes;
        threeState.defaultMaterials[key] = meshes.map((object) => cloneMaterial(object.material));
      });

      Object.entries(robotDeformationBindings).forEach(([key, nodeName]) => {
        const object = model.getObjectByName(nodeName);
        if (!object) return;
        threeState.deformationParts[key] = object;
        threeState.baseScales[key] = object.scale.clone();
      });
      Object.keys(threeState.deformationParts)
        .filter((key) => key !== 'chest')
        .forEach((key) => createInflationOverlays(key));

      centerModel(model);
      threeState.loaded = true;
      status.textContent = '模型已加载 · 层级已就绪';
      status.classList.add('loaded');
      createPointDeformationVisuals();
      applyAllMaterials();
      applyTimelinePose(appState.currentTime);
      refreshDeformationBubble();
    },
    (event) => {
      if (event.total) status.textContent = `正在加载机器人模型... ${Math.round((event.loaded / event.total) * 100)}%`;
    },
    () => {
      status.textContent = '模型加载失败';
      status.classList.add('error');
    }
  );

  window.addEventListener('resize', resize);
  resize();
  applySceneBackdrop();

  function animate() {
    const now = performance.now();
    updatePlayback(now);
    updatePointDeformationVisuals(now / 1000);
    threeState.controls.update();
    threeState.renderer.render(threeState.scene, threeState.camera);
    updateDeformationLink();
    requestAnimationFrame(animate);
  }
  animate();
}

function handleViewAction(action) {
  if (action === 'toggle-grid') {
    appState.showGrid = !appState.showGrid;
    applySceneBackdrop();
    updateViewportToolState();
    setToast(appState.showGrid ? 'Grid on' : 'Grid off');
    return;
  }
  if (action === 'toggle-highlight') {
    appState.showPartHighlight = !appState.showPartHighlight;
    applyPartHighlight();
    updateViewportToolState();
    setToast(appState.showPartHighlight ? 'Part highlight on' : 'Part highlight off');
    return;
  }
  if (action === 'toggle-user-reference') {
    appState.showUserReference = !appState.showUserReference;
    updateViewportToolState();
    setToast(appState.showUserReference ? 'User reference on' : 'User reference off');
    return;
  }
  if (action === 'toggle-axes') {
    appState.showAxes = !appState.showAxes;
    if (threeState.axesHelper) threeState.axesHelper.visible = appState.showAxes;
    return;
  }
  if (action === 'reset-camera') {
    if (appState.sceneBackdrop !== 'studio') {
      applySceneBackdrop();
    } else {
      applyCameraView();
    }
    return;
  }
  if (action === 'fullscreen') {
    const viewport = document.querySelector('#viewport');
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      viewport?.requestFullscreen?.();
    }
    return;
  }
  setToast('已选择视图工具');
}

function applySceneBackdrop() {
  const viewport = document.querySelector('#viewport');
  const backdrop = document.querySelector('#sceneBackdrop');
  if (!viewport || !backdrop) return;

  const scene = sceneBackdrops[appState.sceneBackdrop] ?? sceneBackdrops.studio;
  const isStudio = appState.sceneBackdrop === 'studio';
  viewport.classList.toggle('scene-mode', !isStudio);
  backdrop.style.backgroundImage = scene.image ? `url("${scene.image}")` : '';

  document.querySelectorAll('[data-scene-backdrop]').forEach((button) => {
    button.classList.toggle('active', button.dataset.sceneBackdrop === appState.sceneBackdrop);
    const icon = button.querySelector('.item-icon');
    if (icon) icon.textContent = button.dataset.sceneBackdrop === appState.sceneBackdrop ? '▶' : '○';
  });

  document.querySelector('.grid-floor')?.classList.toggle('hidden', !appState.showGrid || !isStudio);

  if (!threeState.camera || !threeState.controls) return;
  if (isStudio) {
    applyCameraView();
    return;
  }

  threeState.camera.position.set(2.72, 1.36, 3.78);
  threeState.controls.target.set(0, 0.58, 0);
  threeState.controls.minAzimuthAngle = -0.72;
  threeState.controls.maxAzimuthAngle = 0.72;
  threeState.controls.minPolarAngle = 0.88;
  threeState.controls.maxPolarAngle = 1.34;
  threeState.controls.update();
}

function applyCameraView() {
  if (!threeState.camera || !threeState.controls) return;

  const controls = threeState.controls;
  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI - 0.1;
  controls.target.set(0, 0.5, 0);
  controls.minDistance = 1.8;
  controls.maxDistance = 6.5;

  const lockAroundCurrentView = (azimuthPadding = 0.18, polarPadding = 0.16) => {
    controls.update();
    const azimuth = controls.getAzimuthalAngle();
    const polar = controls.getPolarAngle();
    controls.minAzimuthAngle = azimuth - azimuthPadding;
    controls.maxAzimuthAngle = azimuth + azimuthPadding;
    controls.minPolarAngle = Math.max(0.1, polar - polarPadding);
    controls.maxPolarAngle = Math.min(Math.PI - 0.1, polar + polarPadding);
  };

  if (appState.cameraView === 'left') {
    threeState.camera.position.set(0.1, 1.14, -4.65);
    lockAroundCurrentView();
    return;
  }

  if (appState.cameraView === 'right') {
    threeState.camera.position.set(0.1, 1.14, 4.65);
    lockAroundCurrentView();
    return;
  }

  if (appState.cameraView === 'top') {
    controls.target.set(0, 0.38, 0);
    threeState.camera.position.set(2.85, 3.28, 3.52);
    lockAroundCurrentView(0.28, 0.18);
    return;
  }

  if (appState.cameraView === 'free') {
    threeState.camera.position.set(2.72, 1.36, 3.78);
    controls.target.set(0, 0.58, 0);
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI - 0.1;
    controls.update();
    return;
  }

  threeState.camera.position.set(4.68, 1.14, 0.1);
  lockAroundCurrentView();
}

function rotateFromBase(partKey, rotations) {
  const part = threeState.parts[partKey];
  const base = threeState.baseQuaternions[partKey];
  if (!part || !base) return;
  const axes = {
    x: new THREE.Vector3(1, 0, 0),
    y: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(0, 0, 1),
  };
  const composed = base.clone();
  rotations.forEach(({ axis, angle }) => {
    if (!angle) return;
    composed.multiply(new THREE.Quaternion().setFromAxisAngle(axes[axis], angle));
  });
  part.quaternion.copy(composed);
}

function resetRobotPose() {
  Object.keys(threeState.parts).forEach((partKey) => {
    const part = threeState.parts[partKey];
    const base = threeState.baseQuaternions[partKey];
    if (part && base) part.quaternion.copy(base);
    const baseScale = threeState.baseScales[partKey];
    if (part && baseScale) part.scale.copy(baseScale);
  });
  Object.keys(threeState.deformationParts).forEach((partKey) => {
    const part = threeState.deformationParts[partKey];
    const base = threeState.baseScales[partKey];
    if (part && base) part.scale.copy(base);
  });
  Object.values(threeState.inflationOverlays).flat().forEach((overlay) => {
    overlay.visible = false;
    overlay.material.opacity = 0;
    const baseScale = overlay.userData.baseScale;
    if (baseScale) overlay.scale.copy(baseScale);
  });
}

function scaleFromBase(partKey, scaleDelta) {
  const part = threeState.deformationParts[partKey];
  const base = threeState.baseScales[partKey];
  if (!part || !base) return;
  part.scale.set(
    base.x * scaleDelta.x,
    base.y * scaleDelta.y,
    base.z * scaleDelta.z
  );
}

function scaleRobotPartFromBase(partKey, scaleDelta) {
  const part = threeState.parts[partKey];
  const base = threeState.baseScales[partKey];
  if (!part || !base) return;
  part.scale.set(
    base.x * scaleDelta.x,
    base.y * scaleDelta.y,
    base.z * scaleDelta.z
  );
}

function createInflationOverlays(partKey) {
  const object = threeState.deformationParts[partKey];
  const meshes = collectMeshes(object);
  threeState.inflationOverlays[partKey] = meshes.map((mesh) => {
    const overlay = new THREE.Mesh(
      mesh.geometry,
      new THREE.MeshBasicMaterial({
        color: '#86e7ff',
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        depthTest: false,
        depthWrite: false,
      })
    );
    overlay.name = `${partKey}_inflation_overlay`;
    overlay.renderOrder = 18;
    overlay.visible = false;
    overlay.userData.baseScale = overlay.scale.clone();
    mesh.add(overlay);
    return overlay;
  });
}

function setInflationOverlay(partKey, value) {
  const overlays = threeState.inflationOverlays[partKey] ?? [];
  overlays.forEach((overlay) => {
    const baseScale = overlay.userData.baseScale ?? new THREE.Vector3(1, 1, 1);
    const multiplier = partKey === 'chest'
      ? { x: 0.28, y: 0.08, z: 0.34 }
      : { x: 0.22, y: 0.06, z: 0.28 };
    overlay.visible = value > 0.02;
    overlay.material.opacity = clamp(0.04 + value * 0.18, 0, 0.26);
    overlay.scale.set(
      baseScale.x * (1 + value * multiplier.x),
      baseScale.y * (1 + value * multiplier.y),
      baseScale.z * (1 + value * multiplier.z)
    );
  });
}

function breathingPulse(progress) {
  return 0.5 - Math.cos(progress * Math.PI * 2) / 2;
}

function heartbeatPulse(progress) {
  const phase = progress % 1;
  const beat1 = Math.exp(-Math.pow((phase - 0.18) / 0.055, 2));
  const beat2 = Math.exp(-Math.pow((phase - 0.34) / 0.04, 2)) * 0.58;
  return clamp(beat1 + beat2, 0, 1);
}

function reboundPulse(progress) {
  const attack = Math.sin(clamp(progress * 1.35, 0, 1) * Math.PI);
  const decay = Math.max(0, 1 - progress);
  return clamp(attack * decay * 1.2, 0, 1);
}

function applyInflation(partKey, value) {
  if (partKey === 'head') {
    scaleFromBase(partKey, {
      x: 1 + value * 0.022,
      y: 1 + value * 0.014,
      z: 1 + value * 0.022,
    });
    setInflationOverlay(partKey, value);
    return;
  }

  if (partKey === 'chest') {
    scaleFromBase(partKey, {
      x: 1 + value * 0.07,
      y: 1 + value * 0.015,
      z: 1 + value * 0.1,
    });
    return;
  }

  if (partKey === 'belly') {
    scaleFromBase(partKey, {
      x: 1 + value * 0.055,
      y: 1 + value * 0.018,
      z: 1 + value * 0.075,
    });
    setInflationOverlay(partKey, value);
  }
}

function applyTorsoInflation(value) {
  const safeValue = clamp(value, 0, 1);
  scaleFromBase('chest', {
    x: 1 + safeValue * 0.026,
    y: 1 + safeValue * 0.006,
    z: 1 + safeValue * 0.034,
  });
  scaleFromBase('belly', {
    x: 1 + safeValue * 0.055,
    y: 1 + safeValue * 0.018,
    z: 1 + safeValue * 0.075,
  });
  setInflationOverlay('belly', safeValue);
}

function applyArmInflation(side, value) {
  const safeValue = clamp(value, 0, 1);
  const armScale = {
    x: 1 + safeValue * 0.04,
    y: 1 + safeValue * 0.02,
    z: 1 + safeValue * 0.055,
  };
  const handScale = {
    x: 1 + safeValue * 0.05,
    y: 1 + safeValue * 0.03,
    z: 1 + safeValue * 0.05,
  };
  const sides = side === 'Left'
    ? ['left']
    : side === 'Both'
      ? ['left', 'right']
      : ['right'];

  sides.forEach((targetSide) => {
    scaleRobotPartFromBase(`${targetSide}arm`, armScale);
    scaleRobotPartFromBase(`${targetSide}hand`, handScale);
  });
}

function armSideWeights(side = 'Both') {
  return {
    left: side === 'Left' || side === 'Both',
    right: side === 'Right' || side === 'Both' || !side,
  };
}

function getArmLiftPose(time) {
  const sideLiftBase = { leftZ: 0.62, rightZ: -0.62 };
  let pose = { leftZ: 0, rightZ: 0 };
  const armClips = appState.timeline
    .filter((clip) => !isClipMuted(clip) && ['raiseArm', 'lowerArm'].includes(clip.action))
    .sort((a, b) => a.start - b.start);

  const targetForClip = (clip) => {
    if (clip.action !== 'raiseArm') return { leftZ: 0, rightZ: 0 };
    const amount = clamp((Number(clip.amount) || 45) / 100, 0, 1);
    const weights = armSideWeights(clip.side);
    return {
      leftZ: weights.left ? sideLiftBase.leftZ * amount : 0,
      rightZ: weights.right ? sideLiftBase.rightZ * amount : 0,
    };
  };

  for (const clip of armClips) {
    const start = clip.start;
    const end = clip.start + clip.duration;
    if (time < start) break;
    const target = targetForClip(clip);

    if (time >= end) {
      pose = { ...target };
      continue;
    }

    const progress = clamp((time - start) / clip.duration, 0, 1);
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    pose = {
      leftZ: pose.leftZ + (target.leftZ - pose.leftZ) * eased,
      rightZ: pose.rightZ + (target.rightZ - pose.rightZ) * eased,
    };
    break;
  }

  return pose;
}

function getArmReachAngle(time) {
  const reachPose = { leftX: -0.72, rightX: -0.72, leftZ: 0, rightZ: 0 };
  const backPose = { leftX: 0.34, rightX: 0.34, leftZ: 0, rightZ: 0 };
  const openPose = { leftX: 0, rightX: 0, leftZ: 0.42, rightZ: -0.42 };
  const closePose = { leftX: 0, rightX: 0, leftZ: -0.22, rightZ: 0.22 };
  const retractPose = { leftX: 0, rightX: 0, leftZ: 0, rightZ: 0 };
  let pose = { leftX: 0, rightX: 0, leftZ: 0, rightZ: 0 };
  const reachClips = appState.timeline
    .filter((clip) => !isClipMuted(clip) && ['reachForward', 'handForward', 'retractHand', 'handBack', 'moveHandBack', 'openArms', 'closeArms'].includes(clip.action))
    .sort((a, b) => a.start - b.start);

  const applyClipParameters = (target, clip) => {
    const amount = clamp((Number(clip.amount) || 45) / 100, 0, 1);
    const directionMultiplier = clip.direction === 'Backward' ? -1 : 1;
    const weights = armSideWeights(clip.side);
    return {
      leftX: weights.left ? target.leftX * amount * directionMultiplier : 0,
      rightX: weights.right ? target.rightX * amount * directionMultiplier : 0,
      leftZ: weights.left ? target.leftZ * amount : 0,
      rightZ: weights.right ? target.rightZ * amount : 0,
    };
  };

  for (const clip of reachClips) {
    const start = clip.start;
    const end = clip.start + clip.duration;
    if (time < start) break;

    const rawTarget = ['reachForward', 'handForward'].includes(clip.action)
      ? reachPose
      : ['moveHandBack', 'handBack'].includes(clip.action)
        ? backPose
        : clip.action === 'openArms'
          ? openPose
          : clip.action === 'closeArms'
            ? closePose
            : retractPose;
    const target = applyClipParameters(rawTarget, clip);

    if (time >= end) {
      pose = { ...target };
      continue;
    }

    const progress = clamp((time - start) / clip.duration, 0, 1);
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    pose = {
      leftX: pose.leftX + (target.leftX - pose.leftX) * eased,
      rightX: pose.rightX + (target.rightX - pose.rightX) * eased,
      leftZ: pose.leftZ + (target.leftZ - pose.leftZ) * eased,
      rightZ: pose.rightZ + (target.rightZ - pose.rightZ) * eased,
    };
    break;
  }

  return pose;
}

function setPartSignal(partKey, color, intensity) {
  const object = threeState.parts[partKey];
  if (!object?.material) return;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => {
    if (!material?.emissive) return;
    material.emissive.set(color);
    material.emissiveIntensity = intensity;
  });
}

function resetHandSignalEffects() {
  const highlighted = materialTargets[moduleToMaterialTarget(getModuleConfig())] ?? [];
  ['lefthand', 'righthand'].forEach((partKey) => {
    const object = threeState.parts[partKey];
    if (!object?.material) return;
    setMaterialHighlight(object.material, highlighted.includes(partKey));
  });
}

function applyTimelinePose(time) {
  if (!threeState.loaded) return;
  resetRobotPose();
  resetHandSignalEffects();
  const active = appState.timeline.filter((clip) => {
    if (['raiseArm', 'lowerArm', 'reachForward', 'handForward', 'retractHand', 'handBack', 'moveHandBack', 'openArms', 'closeArms'].includes(clip.action)) return false;
    return !isClipMuted(clip) && time >= clip.start && time <= clip.start + clip.duration;
  });
  const headPose = { x: 0, y: 0, z: 0 };
  const armLift = getArmLiftPose(time);
  const armReach = getArmReachAngle(time);
  let leftHand = 0;
  let rightHand = 0;
  let handSignal = null;
  const inflation = {
    head: 0,
    chest: 0,
    belly: 0,
    leftArm: 0,
    rightArm: 0,
  };

  active.forEach((clip) => {
    const progress = clamp((time - clip.start) / clip.duration, 0, 1);
    const elapsed = Math.max(0, time - clip.start);
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    if (clip.action === 'nodHead') headPose.x = -0.16 * Math.sin(progress * Math.PI * 2);
    if (clip.action === 'headUp') headPose.x = -0.24 * eased;
    if (clip.action === 'headDown') headPose.x = 0.24 * eased;
    if (clip.action === 'headLeft') headPose.y = 0.34 * eased;
    if (clip.action === 'headRight') headPose.y = -0.34 * eased;
    if (clip.action === 'patHand') {
      const pat = Math.max(0, Math.sin(progress * Math.PI * 6)) * 0.34;
      leftHand = pat;
      rightHand = -pat;
    }
    if (clip.action === 'vibrateHand') {
      const vibration = Math.sin(progress * Math.PI * 28) * 0.08;
      leftHand = vibration;
      rightHand = -vibration;
      handSignal = { color: '#6ff3ff', intensity: 0.7 + Math.abs(vibration) * 4 };
    }
    if (clip.action === 'warmHand') {
      handSignal = { color: '#ffb06a', intensity: 0.35 + eased * 0.65 };
    }
    if (clip.action === 'glowHand') {
      const pulse = 0.45 + Math.sin(progress * Math.PI * 4) * 0.25;
      handSignal = { color: '#6fe9ff', intensity: pulse };
    }
    if (clip.action === 'holdStill') {
      leftHand *= 0.25;
      rightHand *= 0.25;
    }
    if (clip.action === 'headInflate') {
      inflation.head = Math.max(inflation.head, breathingPulse(progress) * 0.9);
    }
    if (clip.action === 'armInflate') {
      const armValue = breathingPulse(progress);
      if (clip.side === 'Left' || clip.side === 'Both') inflation.leftArm = Math.max(inflation.leftArm, armValue);
      if (clip.side === 'Right' || clip.side === 'Both' || !clip.side) inflation.rightArm = Math.max(inflation.rightArm, armValue);
    }
    if (clip.action === 'chestBreathing') {
      inflation.chest = Math.max(inflation.chest, 0.34 + breathingPulse(progress) * 0.66);
    }
    if (clip.action === 'chestHeartbeat') {
      inflation.chest = Math.max(inflation.chest, 0.3 + heartbeatPulse(elapsed * 1.35) * 0.7);
    }
    if (clip.action === 'bellyBreathing') {
      inflation.belly = Math.max(inflation.belly, breathingPulse(progress));
    }
    if (clip.action === 'bellyRebound') {
      inflation.belly = Math.max(inflation.belly, reboundPulse(progress));
    }
  });

  applyInflation('head', inflation.head);
  applyTorsoInflation(Math.max(inflation.chest, inflation.belly));
  applyArmInflation('Left', inflation.leftArm);
  applyArmInflation('Right', inflation.rightArm);
  rotateFromBase('head', [{ axis: 'x', angle: headPose.x }, { axis: 'y', angle: headPose.y }, { axis: 'z', angle: headPose.z }]);
  rotateFromBase('leftarm', [{ axis: 'x', angle: armReach.leftX }, { axis: 'z', angle: armLift.leftZ + armReach.leftZ }]);
  rotateFromBase('rightarm', [{ axis: 'x', angle: armReach.rightX }, { axis: 'z', angle: armLift.rightZ + armReach.rightZ }]);
  rotateFromBase('lefthand', [{ axis: 'x', angle: leftHand }]);
  rotateFromBase('righthand', [{ axis: 'x', angle: rightHand }]);
  if (handSignal) {
    setPartSignal('lefthand', handSignal.color, handSignal.intensity);
    setPartSignal('righthand', handSignal.color, handSignal.intensity);
  }
}

function playTimeline(startTime = appState.currentTime) {
  appState.currentTime = startTime;
  appState.playing = true;
  threeState.lastFrame = performance.now();
  renderTimeline();
}

function pauseTimeline() {
  appState.playing = false;
  renderTimeline();
}

function updatePlayback(now) {
  if (!appState.playing) return;
  const delta = ((now - threeState.lastFrame) / 1000) * appState.speed;
  threeState.lastFrame = now;
  appState.currentTime += delta;
  if (appState.currentTime >= TOTAL_DURATION) {
    appState.currentTime = TOTAL_DURATION;
    appState.playing = false;
    renderTimeline();
    applyTimelinePose(appState.currentTime);
    return;
  }
  applyTimelinePose(appState.currentTime);
  updateTimelineRuntimeDom();
}

setupRobotViewport();

function updateTimelineRuntimeDom() {
  const timeLabel = document.querySelector('.timecode b');
  if (timeLabel) timeLabel.textContent = formatTime(appState.currentTime);

  const playhead = document.querySelector('.playhead');
  if (playhead) playhead.style.left = `calc(138px + ${clipPercent(appState.currentTime)}%)`;

  const playheadLabel = document.querySelector('.playhead span');
  if (playheadLabel) playheadLabel.textContent = formatTime(appState.currentTime);

  const activeIds = activeClipIds();
  document.querySelectorAll('.clip').forEach((clipElement) => {
    const clip = appState.timeline.find((item) => item.id === clipElement.dataset.clip);
    if (!clip) return;
    clipElement.classList.toggle('is-playing', activeIds.has(clip.id));
  });
}

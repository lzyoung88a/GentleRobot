import './styles.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const STORAGE_KEY = 'gentleRobotStudioState.v3';
const TOTAL_DURATION = 24;
const timelineTracks = [
  { name: 'Head', icon: '☻' },
  { name: 'Arm / Hand', icon: '✋' },
  { name: 'Chest', icon: '☼' },
  { name: 'Belly', icon: '◍' },
  { name: 'Body / Wheels', icon: '♟' },
];

const behaviorModuleGroups = [
  {
    group: 'Head',
    icon: '☻',
    items: ['Nod gently', 'Look down', 'Look up'],
  },
  {
    group: 'Arm / Hand',
    icon: '✋',
    items: [
      'Raise hand',
      'Lower hand',
      'Reach forward',
      'Retract hand',
      'Move hand back',
      'Gentle pat',
      'Hand vibration',
      'Warm hand',
      'Hand glow',
      'Hold still',
    ],
  },
  {
    group: 'Chest',
    icon: '☼',
    items: ['Breathing light', 'Heartbeat light', 'Color change', 'Soft glow'],
  },
  {
    group: 'Belly',
    icon: '◍',
    items: ['Breathing rise', 'Local warmth', 'Gentle vibration', 'Soft rebound'],
  },
  {
    group: 'Body / Wheels',
    icon: '♟',
    items: ['Move closer', 'Move away', 'Stay nearby', 'Stop'],
  },
];

const baseClips = [];

const rhythmOptions = ['Slow', 'Pulse', 'Breathing', 'Heartbeat', 'Custom'];
const removedModules = new Set(['Turn to user', 'Turn toward user', 'Soft hand touch', 'Soft grip']);
const responseSpeedOptions = ['Slow', 'Medium', 'Fast'];
const responseRhythmOptions = ['Single', 'Pulse', 'Breathing', 'Wave'];
const surfaceStateOptions = ['Smooth', 'Soft bumps', 'Firm', 'Textured'];
const spatialPatternOptions = ['Single area', 'Line', 'Surface', 'Multi-zone'];
const materialKeys = ['default', 'silicone', 'fur', 'cotton', 'silk', 'foam'];
const speedOptions = [0.5, 1, 1.5, 2];
const cameraViews = {
  front: { label: 'Front' },
  left: { label: 'Left Side' },
  right: { label: 'Right Side' },
  top: { label: 'Slight Top' },
  free: { label: 'Free Orbit' },
};

const sceneBackdrops = {
  studio: { label: 'Studio', image: '' },
  living: { label: 'Living', image: '/scenes/living.png' },
  bedside: { label: 'Bedside', image: '/scenes/bedside.png' },
  dining: { label: 'Kitchen', image: '/scenes/dining.png' },
  entry: { label: 'Entry', image: '/scenes/entry.png' },
  window: { label: 'Window', image: '/scenes/window.png' },
};

const materialLabels = {
  default: 'Default',
  silicone: 'Silicone',
  fur: 'Faux fur',
  cotton: 'Cotton',
  silk: 'Silk',
  foam: 'Foam',
};

const materialSwatches = {
  default: '#f3f6fb',
  silicone: '#f8d7e8',
  fur: '#f2eee7',
  cotton: '#dceffd',
  silk: '#f6e6ff',
  foam: '#e6f4df',
};

const deformationTypes = {
  none: {
    label: 'No deformation',
    icon: '○',
    description: 'No material shape change',
  },
  inflate: {
    label: 'Inflate / Deflate',
    icon: '◒',
    description: 'Bulge outward, then return',
  },
  rebound: {
    label: 'Press / Rebound',
    icon: '◌',
    description: 'Press inward, then softly recover',
  },
  surface: {
    label: 'Surface Shift',
    icon: '≈',
    description: 'Change softness, texture, or surface state',
  },
  wave: {
    label: 'Wave / Spread',
    icon: '≋',
    description: 'Let changes travel across areas',
  },
};

const moduleResponseMap = {
  'Nod gently': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', category: 'Head motion' },
  'Look down': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', category: 'Head motion' },
  'Look up': { targetPart: 'head', targetLabel: 'Head', side: 'Center', deformationType: 'none', category: 'Head motion' },
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
  'Breathing light': { targetPart: 'body', targetLabel: 'Chest', side: 'Center', deformationType: 'none', category: 'Light response' },
  'Heartbeat light': { targetPart: 'body', targetLabel: 'Chest', side: 'Center', deformationType: 'none', category: 'Light response' },
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
  body: 'Body',
  head: 'Head',
  leftarm: 'Left arm',
  rightarm: 'Right arm',
  botharms: 'Both arms',
  lefthand: 'Left hand',
  righthand: 'Right hand',
  bothhands: 'Both hands',
};

const moduleDefaults = {
  enabled: true,
  intensity: 45,
  amount: 45,
  speed: 'Slow',
  rhythm: 'Single',
  duration: 2,
  warmth: 0.7,
  maxForce: 5,
  contactLimit: 10,
  blendIn: 0.5,
  blendOut: 0.5,
  notes: '',
  targetPart: 'body',
  targetLabel: 'Body',
  side: 'Center',
  category: 'Body movement',
  deformationType: 'none',
  surfaceState: 'Smooth',
  spatialPattern: 'Single area',
  touchArea: 'Arm',
};

const defaultState = {
  selectedModule: 'Raise hand',
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
appState.timeline = appState.timeline.map(normalizeTimelineClip);
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
  baseQuaternions: {},
  defaultMaterials: {},
  highlightOverlays: [],
  loaded: false,
  lastFrame: 0,
  playbackFrame: null,
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);
    const timeline = (saved.timeline?.length ? saved.timeline : structuredClone(baseClips))
      .filter((clip) => !removedModules.has(clip.module) && clip.action !== 'turnBody')
      .map(normalizeTimelineClip);
    const selectedModule = removedModules.has(saved.selectedModule) ? defaultState.selectedModule : saved.selectedModule;
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

function normalizeTimelineClip(clip) {
  const track = inferTrack(clip.module);
  return {
    ...clip,
    track,
    icon: getModuleIcon(clip.module),
    color: inferColor(clip.module),
    action: inferAction(clip.module),
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
    category: inferTrack(moduleName),
  };
}

function getSelectedGroup() {
  return getScenarioModules().find((group) => group.items.includes(appState.selectedModule));
}

function getModuleIcon(moduleName = appState.selectedModule) {
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
  const duration = clamp(Number(config.duration) || 2, 0.5, TOTAL_DURATION);
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
  if (appState.selectedClipId === clipId) {
    appState.selectedClipId = null;
  }
  renderTimeline();
  applyTimelinePose(appState.currentTime);
  applyPartHighlight();
  setToast(`${deleted.module} removed from timeline`);
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
          <h2>Behavior Modules</h2>
          <button id="addModuleButton" title="Add custom module">＋</button>
        </div>
        <div id="moduleGroups"></div>
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
        <button data-view-action="toggle-grid" class="${appState.showGrid ? 'active' : ''}" title="Grid" aria-label="Toggle grid">▦</button>
        <button data-view-action="toggle-highlight" class="${appState.showPartHighlight ? 'active' : ''}" title="Part highlight" aria-label="Toggle part highlight">⬡</button>
        <button data-view-action="toggle-user-reference" class="${appState.showUserReference ? 'active' : ''}" title="User reference" aria-label="Toggle user reference">♙</button>
        <button data-view-action="fullscreen" title="Fullscreen preview" aria-label="Fullscreen preview">⤢</button>
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
        <span class="user-reference-label">User</span>
      </div>
      <canvas id="robotCanvas" aria-label="GentleRobot 3D model preview"></canvas>
      <div class="viewport-status" id="viewportStatus">Loading robot model...</div>
    </div>
  `;
}

function viewHeaderTemplate() {
  const currentView = cameraViews[appState.cameraView] ?? cameraViews.front;
  const label = appState.sceneBackdrop === 'studio' ? currentView.label : 'Scene View';
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
        <strong>${currentScene.label} Scene</strong>
        <span class="select-arrow">⌄</span>
      </button>
      <div class="scenario-menu" id="sceneMenu" ${appState.sceneMenuOpen ? '' : 'hidden'}>
        ${Object.entries(sceneBackdrops)
          .map(([key, item]) => `
            <button class="${key === appState.sceneBackdrop ? 'active' : ''}" data-scene-backdrop="${key}">
              <span class="scene-check">${key === appState.sceneBackdrop ? '✓' : ''}</span>
              <span>${item.label} Scene</span>
            </button>
          `)
          .join('')}
      </div>
    </div>
    <button class="save-button" id="saveButton" title="Save to browser">▣</button>
    <div class="top-spacer"></div>
    <div class="connection"><i></i> Robot connected</div>
    <button class="icon-button" id="undoButton" ${history.length ? '' : 'disabled'}>↶</button>
    <button class="icon-button" id="redoButton" ${future.length ? '' : 'disabled'}>↷</button>
    <button class="preview-button" id="previewButton">▷ Preview</button>
    <button class="deploy-button" id="deployButton">Deploy <span>⌄</span></button>
    <button class="icon-button" id="moreButton">⋮</button>
  `;
}

function renderModules() {
  document.querySelector('#moduleGroups').innerHTML = getScenarioModules()
    .map((group) => {
      const collapsed = appState.collapsedGroups[group.group];
      const items = group.items
        .map((item) => {
          const active = item === appState.selectedModule;
          const disabled = getModuleConfig(item).enabled === false;
          return `
            <button
              class="module-item ${active ? 'active' : ''} ${disabled ? 'disabled-module' : ''}"
              data-module="${item}"
              draggable="true"
            >
              <span class="item-icon">${active ? '▶' : '○'}</span>
              <span>${item}</span>
              ${active ? '<span class="more">•••</span>' : ''}
            </button>
          `;
        })
        .join('');

      return `
        <section class="module-group ${collapsed ? 'collapsed' : ''}">
          <button class="group-title" data-group="${group.group}">
            <span class="group-icon">${group.icon}</span>
            <span>${group.group}</span>
            <span class="chevron">${collapsed ? '›' : '⌄'}</span>
          </button>
          <div class="module-items">${collapsed ? '' : items}</div>
        </section>
      `;
    })
    .join('');
}

function renderRightPanel() {
  const config = getModuleConfig();
  const tabs = ['Configure', 'Parameters', 'Notes'];

  document.querySelector('#rightPanel').innerHTML = `
    <header class="inspector-head">
      <div class="hand-mark">${getModuleIcon()}</div>
      <div><h2>${appState.selectedModule}</h2></div>
      <label class="switch">
        <input id="moduleEnabled" type="checkbox" ${config.enabled ? 'checked' : ''} />
        <span></span>
      </label>
    </header>
    <nav class="tabs">
      ${tabs.map((tab) => `<button data-tab="${tab}" class="${appState.selectedTab === tab ? 'active' : ''}">${tab}</button>`).join('')}
    </nav>
    ${renderTabContent(config)}
  `;
}

function renderTabContent(config) {
  if (appState.selectedTab === 'Notes') {
    return `
      <section class="inspector-section notes-section">
        <h3>Design Notes</h3>
        <textarea id="notesInput" placeholder="Record participant comments, rationale, or open questions...">${config.notes ?? ''}</textarea>
      </section>
      ${renderActionButtons()}
    `;
  }

  if (appState.selectedTab === 'Parameters') {
    return `
      <section class="inspector-section">
        <h3>Detailed Parameters</h3>
        ${numberField('duration', 'Duration', config.duration, 0.5, 12, 0.1, 's')}
        ${numberField('amount', 'Amount', config.amount, 0, 100, 1, '%')}
        ${numberField('intensity', 'Intensity', config.intensity, 0, 100, 1, '%')}
        ${numberField('contactLimit', 'Contact limit', config.contactLimit, 1, 30, 0.5, 's')}
        ${numberField('blendIn', 'Blend in', config.blendIn, 0, 3, 0.1, 's')}
        ${numberField('blendOut', 'Blend out', config.blendOut, 0, 3, 0.1, 's')}
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
  return `<button class="add-button" id="addToTimelineButton">⊕ Add to Timeline</button>`;
}

function actionMappingTemplate(config) {
  return `
    <section class="inspector-section action-mapping-section">
      <div class="section-row">
        <h3>Action Mapping</h3>
        <span>3D highlighted</span>
      </div>
      <div class="mapping-grid">
        <div>
          <small>Action</small>
          <strong>${appState.selectedModule}</strong>
        </div>
        <div>
          <small>Target part</small>
          <strong>${config.targetLabel}</strong>
        </div>
        <div>
          <small>Side</small>
          <strong>${config.side}</strong>
        </div>
        <div>
          <small>Type</small>
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
        <h3>Deformation Response</h3>
        <span>${deformationTypes[config.deformationType]?.label ?? 'No deformation'}</span>
      </div>
      <div class="deformation-cards">
        ${Object.entries(deformationTypes).map(([key, item]) => {
          const recommended = key === getModuleResponseMapping(appState.selectedModule).deformationType;
          return `
            <button class="deformation-card ${config.deformationType === key ? 'active' : ''}" data-deformation-type="${key}">
              <b>${item.icon}</b>
              <span>${item.label}</span>
              <small>${item.description}</small>
              ${recommended ? '<em>Recommended</em>' : ''}
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
      ? selectField('surfaceState', 'Surface state', config.surfaceState, surfaceStateOptions)
      : '',
    config.deformationType === 'wave'
      ? selectField('spatialPattern', 'Spatial pattern', config.spatialPattern, spatialPatternOptions)
      : '',
  ].join('');

  return `
    <section class="inspector-section response-parameters-section">
      <h3>Response Parameters</h3>
      ${rangeField('amount', 'Amount', config.amount, 0, 100, 1, '%')}
      ${selectField('speed', 'Speed', config.speed, responseSpeedOptions)}
      ${selectField('rhythm', 'Rhythm', config.rhythm, responseRhythmOptions)}
      ${numberField('duration', 'Duration', config.duration, 0.5, 12, 0.1, 's')}
      ${rangeField('intensity', 'Intensity', config.intensity, 0, 100, 1, '%')}
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
        ${options.map((option) => `<option value="${option}" ${option === value ? 'selected' : ''}>${option}</option>`).join('')}
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
        <h3>Material Preset</h3>
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
      <button class="reset-material-button" id="resetMaterialsButton">Reset materials</button>
      <p class="material-note">Presets are temporary viewport materials. Later Meshy PBR textures can replace these swatches.</p>
    </section>
  `;
}

function getMaterialForTarget(targetKey) {
  const targets = materialTargets[targetKey] ?? [targetKey];
  return appState.materials[targets[0]] ?? 'default';
}

function renderTimeline() {
  const activeIds = activeClipIds();
  document.querySelector('#timelinePanel').innerHTML = `
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
    <div class="ruler">
      <div></div>
      ${[0, 4, 8, 12, 16, 20].map((time) => `<span style="left:${clipPercent(time)}%">${formatTime(time).slice(0, 5)}</span>`).join('')}
    </div>
    <div class="tracks">
      <div class="playhead" style="left:calc(138px + ${clipPercent(appState.currentTime)}%)"><span>${formatTime(appState.currentTime)}</span></div>
      ${timelineTracks.map((track) => trackTemplate(track, activeIds)).join('')}
    </div>
  `;
}

function trackTemplate(track, activeIds) {
  const clips = appState.timeline.filter((item) => item.track === track.name);
  return `
    <div class="track">
      <div class="track-label">
        <span>${track.icon}</span>
        <strong>${track.name}</strong>
        <button>⋮</button>
      </div>
      <div class="track-lane" data-track="${track.name}">
        ${clips.length ? '' : '<span class="drop-hint">Drop action here</span>'}
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
    <button
      class="clip clip-${clip.color} ${muted ? 'muted' : ''} ${active ? 'is-playing' : ''} ${selected ? 'selected' : ''}"
      data-clip="${clip.id}"
      style="left:${clipPercent(clip.start)}%; width:${clipPercent(clip.duration)}%"
    >
      <span>${clip.module}</span>
      <small>${clip.duration === Infinity ? '∞' : `${clip.duration.toFixed(1)}s`}</small>
      <i>•••</i>
      <span class="clip-delete" data-delete-clip="${clip.id}" title="Remove from timeline">×</span>
      <span class="clip-resize-handle" data-resize-clip="${clip.id}" title="Drag to change duration"></span>
    </button>
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
          <h2>Deploy Preview</h2>
          <p>Mock summary for study discussion. No robot is actually deployed.</p>
        </div>
        <button id="closeModalButton">×</button>
      </header>
      <div class="summary-grid">
        <div><span>Scene</span><strong>${sceneBackdrops[appState.sceneBackdrop]?.label ?? 'Studio'}</strong></div>
        <div><span>Selected module</span><strong>${appState.selectedModule}</strong></div>
        <div><span>Target</span><strong>${getModuleConfig().targetLabel} · ${getModuleConfig().side}</strong></div>
        <div><span>Deformation</span><strong>${deformationTypes[getModuleConfig().deformationType]?.label ?? 'No deformation'}</strong></div>
        <div><span>Timeline clips</span><strong>${appState.timeline.length}</strong></div>
      </div>
      <textarea readonly>${JSON.stringify(config, null, 2)}</textarea>
      <footer>
        <button id="copyJsonButton">Copy JSON</button>
        <button id="closeModalButtonFooter">Close</button>
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
    clip.duration = clamp(
      snapTimelineValue(timelineEdit.originalDuration + delta),
      0.5,
      TOTAL_DURATION - clip.start
    );
    getModuleConfig(clip.module).duration = clip.duration;
  }

  renderTimeline();
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
    setToast(timelineEdit.mode === 'resize' ? 'Duration updated' : 'Start time updated');
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
    setToast(`${cameraViews[appState.cameraView].label} view · Studio background`);
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
    setToast('Custom module added');
    return;
  }

  if (target.dataset.tab) {
    appState.selectedTab = target.dataset.tab;
    renderRightPanel();
    return;
  }

  if (target.dataset.deformationType) {
    snapshot();
    getModuleConfig().deformationType = target.dataset.deformationType;
    renderRightPanel();
    setToast(`${deformationTypes[target.dataset.deformationType].label} selected`);
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
    setToast('Materials reset');
    return;
  }

  if (target.dataset.clip) {
    const clip = appState.timeline.find((item) => item.id === target.dataset.clip);
    if (clip) {
      appState.selectedModule = clip.module;
      appState.currentTime = clip.start;
      appState.selectedMaterialPart = moduleToMaterialTarget(getModuleConfig(clip.module));
      renderAll();
      applyTimelinePose(appState.currentTime);
      applyPartHighlight();
    }
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
    setToast('Preview started');
    return;
  }

  if (target.id === 'saveButton') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exportConfigForStorage()));
    setToast('Saved to browser');
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
    setToast('Undo');
    return;
  }

  if (target.id === 'redoButton') {
    if (!future.length) return;
    history.push(JSON.stringify(exportConfigForStorage()));
    restore(future.pop());
    setToast('Redo');
    return;
  }

  if (target.id === 'addToTimelineButton') {
    snapshot();
    const clip = createTimelineClip(appState.selectedModule, appState.currentTime);
    appState.timeline.push(clip);
    appState.selectedClipId = clip.id;
    renderTimeline();
    setToast('Added to timeline');
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
    setToast('JSON copied');
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
  setToast(intendedTrack === resolvedTrack ? `Added to ${resolvedTrack}` : `Added to ${resolvedTrack}`);
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
  if (!target.dataset?.param) return;
  const config = getModuleConfig();
  const value = target.type === 'number' || target.type === 'range' ? Number(target.value) : target.value;
  config[target.dataset.param] = value;
  const output = target.closest('.field')?.querySelector('output');
  if (output && typeof value === 'number') output.textContent = value.toFixed(2);
});

document.querySelector('#app').addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'moduleEnabled') {
    snapshot();
    getModuleConfig().enabled = target.checked;
    renderTimeline();
    return;
  }
  if (target.dataset?.param) {
    snapshot();
    getModuleConfig()[target.dataset.param] = target.type === 'number' ? Number(target.value) : target.value;
    renderRightPanel();
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
  if (/hand|arm|pat|vibration|reach forward|retract|hold still/i.test(moduleName)) return 'Arm / Hand';
  if (/breathing light|heartbeat|color|glow/i.test(moduleName)) return 'Chest';
  if (/breathing rise|local warmth|soft rebound/i.test(moduleName)) return 'Belly';
  if (/move|stay|stop/i.test(moduleName)) return 'Body / Wheels';
  return 'Body / Wheels';
}

function inferColor(moduleName) {
  const track = inferTrack(moduleName);
  return { Head: 'blue', 'Arm / Hand': 'green', Chest: 'pink', Belly: 'orange', 'Body / Wheels': 'cyan' }[track] ?? 'blue';
}

function inferAction(moduleName) {
  if (/nod|look/i.test(moduleName)) return 'nodHead';
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

function applyMaterialToPart(partKey, materialKey) {
  const targets = materialTargets[partKey] ?? [partKey];
  targets.forEach((targetKey) => {
    const object = threeState.parts[targetKey];
    if (!object?.isMesh) return;
    disposeMaterial(object.material);
    object.material = materialKey === 'default'
      ? cloneMaterial(threeState.defaultMaterials[targetKey])
      : materialLibrary[materialKey]();
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
  Object.values(threeState.parts).forEach((object) => {
    if (object?.material) setMaterialHighlight(object.material, false);
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
  Object.entries(threeState.parts).forEach(([key, object]) => {
    const active = highlightTargets.includes(key);
    if (!active) return;
    setMaterialHighlight(object.material, true);
    createHighlightOverlay(object);
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

      ['body', 'head', 'leftarm', 'rightarm', 'lefthand', 'righthand'].forEach((key) => {
        const object = model.getObjectByName(key);
        if (!object?.isMesh) return;
        threeState.parts[key] = object;
        threeState.baseQuaternions[key] = object.quaternion.clone();
        disposeMaterial(object.material);
        object.material = defaultMaterialLibrary[key]();
        threeState.defaultMaterials[key] = cloneMaterial(object.material);
      });

      centerModel(model);
      threeState.loaded = true;
      status.textContent = 'GLB loaded · 0702 hierarchy ready';
      status.classList.add('loaded');
      applyAllMaterials();
      applyTimelinePose(appState.currentTime);
    },
    (event) => {
      if (event.total) status.textContent = `Loading robot model... ${Math.round((event.loaded / event.total) * 100)}%`;
    },
    () => {
      status.textContent = 'Model failed to load';
      status.classList.add('error');
    }
  );

  window.addEventListener('resize', resize);
  resize();
  applySceneBackdrop();

  function animate() {
    updatePlayback(performance.now());
    threeState.controls.update();
    threeState.renderer.render(threeState.scene, threeState.camera);
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
  setToast('View tool selected');
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
    threeState.camera.position.set(-4.65, 1.14, 0.1);
    lockAroundCurrentView();
    return;
  }

  if (appState.cameraView === 'right') {
    threeState.camera.position.set(4.65, 1.14, 0.1);
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

  threeState.camera.position.set(0, 1.14, 4.68);
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
  });
}

function getArmLiftPose(time) {
  const raisedPose = { leftZ: -0.66, rightZ: -0.66 };
  let pose = { leftZ: 0, rightZ: 0 };
  const armClips = appState.timeline
    .filter((clip) => !isClipMuted(clip) && ['raiseArm', 'lowerArm'].includes(clip.action))
    .sort((a, b) => a.start - b.start);

  for (const clip of armClips) {
    const start = clip.start;
    const end = clip.start + clip.duration;
    if (time < start) break;

    if (time >= end) {
      pose = clip.action === 'raiseArm' ? { ...raisedPose } : { leftZ: 0, rightZ: 0 };
      continue;
    }

    const progress = clamp((time - start) / clip.duration, 0, 1);
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    const target = clip.action === 'raiseArm' ? raisedPose : { leftZ: 0, rightZ: 0 };
    pose = {
      leftZ: pose.leftZ + (target.leftZ - pose.leftZ) * eased,
      rightZ: pose.rightZ + (target.rightZ - pose.rightZ) * eased,
    };
    break;
  }

  return pose;
}

function getArmReachAngle(time) {
  const reachPose = { leftX: 0.9, rightX: -0.9, leftZ: -0.2, rightZ: -0.2 };
  const retractPose = { leftX: -0.08, rightX: 0.08, leftZ: 0, rightZ: 0 };
  const backPose = { leftX: -0.34, rightX: 0.34, leftZ: 0.1, rightZ: 0.1 };
  let pose = { leftX: 0, rightX: 0, leftZ: 0, rightZ: 0 };
  const reachClips = appState.timeline
    .filter((clip) => !isClipMuted(clip) && ['reachForward', 'retractHand', 'moveHandBack'].includes(clip.action))
    .sort((a, b) => a.start - b.start);

  for (const clip of reachClips) {
    const start = clip.start;
    const end = clip.start + clip.duration;
    if (time < start) break;

    const target = clip.action === 'reachForward'
      ? reachPose
      : clip.action === 'moveHandBack'
        ? backPose
        : retractPose;

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
    if (['raiseArm', 'lowerArm', 'reachForward', 'retractHand', 'moveHandBack'].includes(clip.action)) return false;
    return !isClipMuted(clip) && time >= clip.start && time <= clip.start + clip.duration;
  });
  let headNod = 0;
  const armLift = getArmLiftPose(time);
  const armReach = getArmReachAngle(time);
  let leftHand = 0;
  let rightHand = 0;
  let handSignal = null;

  active.forEach((clip) => {
    const progress = clamp((time - clip.start) / clip.duration, 0, 1);
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    if (clip.action === 'nodHead') headNod = -0.16 * Math.sin(progress * Math.PI * 2);
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
  });

  rotateFromBase('head', [{ axis: 'x', angle: headNod }]);
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

// Main Globals
const _objectURLs = new Set();

const uid = () => 't_' + Math.random().toString(36).slice(2,10);

const els = {
  themeToggle: document.getElementById('themeToggle'),
  newItemBtn: document.getElementById('newItemBtn'),
  importBtn: document.getElementById('importBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  todoList: document.getElementById('todoList'),
  completedList: document.getElementById('completedList'),
  itemDialog: document.getElementById('itemDialog'),
  itemForm: document.getElementById('itemForm'),
  dialogTitle: document.getElementById('dialogTitle'),
  closeDialogBtn: document.getElementById('closeDialogBtn'),
  titleInput: document.getElementById('titleInput'),
  dueInput: document.getElementById('dueInput'),
  descInput: document.getElementById('descInput'),
  colorInput: document.getElementById('colorInput'),
  iconInput: document.getElementById('iconInput'),
  filesInput: document.getElementById('filesInput'),
  attachPreview: document.getElementById('attachmentPreview'),
  saveItemBtn: document.getElementById('saveItemBtn'),
  cancelItemBtn: document.getElementById('cancelItemBtn'),
  template: document.getElementById('itemTemplate'),
};

let state = {
  tasks: [],
  sort: 'manual',
  theme: 'dark',
  autosaveAttachments: Boolean(localStorage.getItem('hw.autosaveAttachments') !== '0'),
  particles: true,
  particlesCount: parseInt(localStorage.getItem("hw.particlesCount")) || 3500,
};
let editingId = null;

// IndexedDB Globals
const DB_NAME = 'masterProcrastinator';
const DB_VERSION = 1;
let _dbPromise = null;

// Particle Globals
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 10, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

let originalPositions = [];
let ripples = [];

let targetColor = new THREE.Color();

let animationId = null;
let geometry;
let particles;
let material;
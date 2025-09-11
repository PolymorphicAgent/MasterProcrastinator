/* Master Procrastinator — Client-side, no dependencies (for now).
   Features:
   - Drag-to-reorder within Active list
   - Title, due date, description, color, optional icon thumbnail
   - Attach multiple files per task (stored as data URLs for export)
   - Light/Dark theme toggle with persistence
   - Export/Import JSON (attachments inlined as base64 data URLs)
   - LocalStorage autosave
*/

const _objectURLs = new Set();
function revokeAllObjectURLs() {
  for (const u of _objectURLs) URL.revokeObjectURL(u);
  _objectURLs.clear();
}

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
  template: document.getElementById('itemTemplate'),
};

let state = {
  tasks: [],
  sort: 'manual',
  theme: 'dark',
  autosaveAttachments: Boolean(localStorage.getItem('hw.autosaveAttachments') !== '0'),
  particles: true,
  particlesCount: parseInt(localStorage.getItem("hw.particlesCount")),
};
let editingId = null;

document.getElementById("settingsBtn").onclick = () => {
  document.getElementById("settingsModal").showModal();
};
document.getElementById("closeSettingsBtn").onclick = () => {
  document.getElementById("settingsModal").close();
};
document.getElementById("autosaveAttachmentsToggle").onchange = e => {
  state.autosaveAttachments = e.target.checked;
  saveLocal();
};
document.getElementById("particlesToggle").onchange = e => {
  state.particles = e.target.checked;
  // hide/show particle count input
  let clst = document.getElementById("particleCount").classList;
  if(state.particles){
    if(clst.contains("hidden"))clst.remove("hidden");
  }
  else {
    if(!clst.contains("hidden"))clst.add("hidden");
  }

  toggleParticles(state.particles);
  saveLocal();
};

// ---------- Theme ----------
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  state.theme = t;
  localStorage.setItem('hw.theme', t);
}
(function initTheme(){
  const stored = localStorage.getItem('hw.theme');
  applyTheme(stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
})();
els.themeToggle.addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
// window.addEventListener('keydown', (e)=>{ if(e.key.toLowerCase()==='t' && !els.itemDialog.open) els.themeToggle.click(); });

// ---------- Persistence ----------
function saveLocal() {
  try {
    // Save only metadata: attachments references (id/name/type) and iconId
    const smallTasks = state.tasks.map(t => {
      const copy = { ...t };
      // remove heavy fields if present (old-style)
      delete copy.iconDataURL;
      // attachments should already be id refs after migration; ensure it is safe:
      copy.attachments = (t.attachments || []).map(a => ({ id: a.id, name: a.name, type: a.type }));
      return copy;
    });
    localStorage.setItem('hw.tasks', JSON.stringify(smallTasks));
    localStorage.setItem('hw.sort', state.sort);
    localStorage.setItem('hw.autosaveAttachments', state.autosaveAttachments ? '1' : '0');
    localStorage.setItem('hw.particles', state.particles ? '1' : '0');
  } catch (err) {
    console.error('saveLocal failed', err);
  }
}

async function loadLocal() {
  await openDB(); // ensure DB exists
  try {
    const raw = localStorage.getItem('hw.tasks') || '[]';
    const loaded = JSON.parse(raw);
    state.tasks = Array.isArray(loaded) ? loaded : [];
    state.sort = localStorage.getItem('hw.sort') || 'manual';
  } catch (err) {
    console.warn('loadLocal error', err);
    state.tasks = [];
  }

  const as = localStorage.getItem('hw.autosaveAttachments');
  state.autosaveAttachments = as !== '0';
  document.getElementById("autosaveAttachmentsToggle").checked = state.autosaveAttachments;

  const ps = localStorage.getItem('hw.particles');
  state.particles = ps !== '0';
  document.getElementById("particlesToggle").checked = state.particles;

  document.getElementById("particleCount").value = parseInt(localStorage.getItem("hw.particlesCount"));
  // hide/show particle count input
  let clst = document.getElementById("particleCount").classList;
  if(state.particles){
    if(clst.contains("hidden"))clst.remove("hidden");
  }
  else {
    if(!clst.contains("hidden"))clst.add("hidden");
  }

  // Migrate any inlined attachments or iconDataURL to IndexedDB
  for (const task of state.tasks) {
    // migrate iconDataURL -> iconId
    if (task.iconDataURL) {
      try {
        const blob = dataURLToBlob(task.iconDataURL);
        const id = await putFileBlob(blob, task.iconName || 'icon', task.iconType || blob.type);
        task.iconId = id;
        delete task.iconDataURL;
        delete task.iconName;
        delete task.iconType;
      } catch (e) {
        console.warn('icon migration failed', e);
      }
    }

    // migrate attachments array
    if (Array.isArray(task.attachments) && task.attachments.length) {
      const newAttachments = [];
      for (const a of task.attachments) {
        if (a.dataURL) {
          try {
            const blob = dataURLToBlob(a.dataURL);
            const id = await putFileBlob(blob, a.name || 'file', a.type || blob.type);
            newAttachments.push({ id, name: a.name || 'file', type: a.type || blob.type });
          } catch (e) {
            console.warn('attachment migration failed', e);
          }
        } else if (a.id) {
          // already migrated previously
          newAttachments.push(a);
        }
      }
      task.attachments = newAttachments;
    }
  }

  // persist the migrated, lighter tasks (without dataURLs) back to localStorage
  saveLocal(); // later in patch we ensure saveLocal strips attachments if desired
}

window.addEventListener("beforeunload", function(e){
   saveLocal();
});

// ---------- Utilities ----------
const uid = () => 't_' + Math.random().toString(36).slice(2,10);
// formatDue helper
function parseDateLocal(iso) {
  // Parse "YYYY-MM-DD" into a local Date at midnight to avoid UTC shift issues.
  if (!iso) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length < 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d); // local midnight
}

function formatDue(dueStr) {
  if (!dueStr) return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const due = parseDateLocal(dueStr);
  if (!due) return '';
  // both `today` and `due` are local-midnight dates -> differences are integer multiples of days
  const diffDays = Math.round((due - today) / 86400000);
  const nice = due.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
  if (diffDays < 0) return `${nice} • overdue`;
  if (diffDays === 0) return `${nice} • due today`;
  if (diffDays === 1) return `${nice} • due tomorrow`;
  return `${nice} • in ${diffDays} days`;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sanitize(str){ return (str || '').toString(); }

function updateProgress() {
//   console.log('Updating progress bar...');
  const done = state.tasks.filter(t => t.completed).length;
  const total = state.tasks.length;
  const percent = total > 0 ? (done / total) * 100 : 0;
//   console.log(`Progress: ${done}/${total} (${percent.toFixed(2)}%)`);
  document.getElementById("progressBar").style.width = percent + "%";
}

/* ---------- IndexedDB helpers for storing file Blobs ---------- */
const DB_NAME = 'masterProcrastinator';
const DB_VERSION = 1;
let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('files')) {
        // store objects shaped { id: string, blob: Blob, name: string, type: string }
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
  return _dbPromise;
}

function generateFileId() {
  return 'f_' + Math.random().toString(36).slice(2, 10);
}

async function putFileBlob(blob, name = 'file', type = '') {
  const db = await openDB();
  const id = generateFileId();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    store.put({ id, blob, name, type });
    tx.oncomplete = () => resolve(id);
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('putFileBlob failed'));
  });
}

async function getFileRecord(id) {
  if (!id) return null;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFileById(id) {
  if (!id) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* Helpers to convert between dataURL and Blob (for import/export) */
function dataURLToBlob(dataURL) {
  const parts = dataURL.split(',');
  const header = parts[0];
  const data = parts[1];
  const isBase64 = header.indexOf('base64') !== -1;
  const mime = (header.match(/:(.*?);/) || [,'application/octet-stream'])[1];
  let byteString;
  if (isBase64) byteString = atob(data);
  else byteString = decodeURIComponent(data);
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ia], { type: mime });
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

// ---------- Rendering ----------
function render() {
  
  revokeAllObjectURLs(); // clean up any old object URLs

  const filter = els.searchInput.value.trim().toLowerCase();
  const sort = state.sort;
  const active = state.tasks.filter(t => !t.completed);
  const done = state.tasks.filter(t => t.completed);

  if (sort === 'dueAsc') active.sort((a,b)=>(a.due||'').localeCompare(b.due||''));
  else if (sort === 'dueDesc') active.sort((a,b)=>(b.due||'').localeCompare(a.due||''));
  else if (sort === 'title') active.sort((a,b)=>sanitize(a.title).localeCompare(sanitize(b.title)));
  // manual: maintain stored order (implicit)

  const match = t => !filter || sanitize(t.title).toLowerCase().includes(filter);

  els.todoList.innerHTML = '';
  els.completedList.innerHTML = '';

  active.filter(match).forEach(t => els.todoList.appendChild(renderItem(t)));
  done.filter(match).forEach(t => els.completedList.appendChild(renderItem(t, true)));

  saveLocal();
  updateProgress();
  //TODO: toggle particles based on state.particles
}

function renderItem(task, isCompleted=false) {
  const li = els.template.content.firstElementChild.cloneNode(true);
  li.dataset.id = task.id;

  li.querySelector('.color-strip').style.background = task.color || 'var(--primary)';
  const handle = li.querySelector('.drag-handle');
  handle.setAttribute('draggable', 'true');

  const checkbox = li.querySelector('.check');
  checkbox.checked = !!task.completed;

  const iconEl = li.querySelector('.icon');
  if (task.iconId) {
    // show a small placeholder immediately, then fetch the blob
    iconEl.style.display = 'block';
    iconEl.src = ''; // placeholder
    getFileRecord(task.iconId).then(rec => {
      if (!rec || !rec.blob) return;
      const url = URL.createObjectURL(rec.blob);
      _objectURLs.add(url);
      iconEl.src = url;
      iconEl.alt = rec.name || '';
    }).catch(err => console.warn('icon load failed', err));
  } else {
    iconEl.src = 'img/1920.png';
    iconEl.style.display = 'block';
  }

  li.querySelector('.title').textContent = task.title || '(Untitled)';
  const dueEl = li.querySelector('.due');
  dueEl.textContent = formatDue(task.due);
  li.querySelector('.desc').textContent = task.description || '';

  // Attachments
  const attDiv = li.querySelector('.attachments');
  attDiv.innerHTML = '';
  for (const a of (task.attachments || [])) {
    const pill = document.createElement('a');
    pill.className = 'attachment-pill';
    pill.download = a.name || 'file';
    pill.title = a.name || 'file';
    // placeholder image for non-image types
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><rect width="24" height="24" rx="4" fill="#6d28d9"/><path d="M7 8h10v8H7z" fill="white"/></svg>`);
    const label = document.createElement('span');
    label.textContent = a.name || 'file';
    pill.append(img, label);
    attDiv.appendChild(pill);

    // fetch the blob and populate href + thumbnail if image
    getFileRecord(a.id).then(rec => {
      if (!rec) return;
      const url = URL.createObjectURL(rec.blob);
      _objectURLs.add(url);
      pill.href = url;
      if ((rec.type || '').startsWith('image/')) img.src = url;
    }).catch(err => console.warn('attachment load failed', err));
  }

  if (isCompleted) li.classList.add('completed');

  // Actions
  li.querySelector('.edit-btn').addEventListener('click', () => openEditor(task.id));
  li.querySelector('.duplicate-btn').addEventListener('click', () => duplicateTask(task.id));
  li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
  checkbox.addEventListener('change', () => {toggleComplete(task.id, checkbox.checked); updateProgress();});

  // Drag events
  li.addEventListener('dragstart', e => {
    li.classList.add('dragging');
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  li.addEventListener('dragend', () => li.classList.remove('dragging'));

  return li;
}

// Setup drag-and-drop for reordering and moving between lists
function setupDragAndDrop(listEl, completedFlag) {
  ['dragover', 'drop'].forEach(evt => {
    listEl.addEventListener(evt, (e) => {
      e.preventDefault();
      const dragging = document.querySelector('.todo-item.dragging');
      if (!dragging) return;

      const after = getDragAfterElement(listEl, e.clientY);

      if (evt === 'dragover') {
        if (after == null) listEl.appendChild(dragging);
        else listEl.insertBefore(dragging, after);
      }

      if (evt === 'drop') {
        const id = dragging.dataset.id;
        const task = state.tasks.find(t => t.id === id);
        if (task) task.completed = completedFlag; // mark as completed or active

        // Commit new order
        const ids = [...listEl.querySelectorAll('.todo-item')].map(li => li.dataset.id);
        const thisListTasks = ids.map(id => state.tasks.find(t => t.id === id));
        const otherListTasks = state.tasks.filter(t => t.completed !== completedFlag);

        // Preserve order: this list first, then the other
        state.tasks = completedFlag ? [...otherListTasks, ...thisListTasks] 
                                    : [...thisListTasks, ...otherListTasks];

        render();
      }
    });
  });
}

setupDragAndDrop(els.todoList, false);     // Active list
setupDragAndDrop(els.completedList, true); // Completed list

function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll('.todo-item:not(.dragging)')];
  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ---------- CRUD ----------
async function openEditor(id=null) {
  editingId = id;
  els.dialogTitle.textContent = id ? 'Edit Task' : 'New Task';
  const task = id ? state.tasks.find(t => t.id === id) : null;

  els.titleInput.value = task?.title || '';
  els.dueInput.value = task?.due || '';
  els.descInput.value = task?.description || '';
  els.colorInput.value = task?.color || '#6d28d9';
  els.iconInput.value = '';
  els.filesInput.value = '';
  els.attachPreview.innerHTML = '';

  // Preview any existing attachments & icon
  if (task?.iconId) {
    const rec = await getFileRecord(task.iconId);
    if (rec) {
      const card = document.createElement('div'); card.className = 'preview-card';
      const img = document.createElement('img'); img.src = URL.createObjectURL(rec.blob);
      _objectURLs.add(img.src);
      const cap = document.createElement('div'); cap.textContent = 'Current icon';
      card.append(img, cap); els.attachPreview.appendChild(card);
    }
  }

  for (const a of task?.attachments || []) {
    const rec = await getFileRecord(a.id);
    if (rec) {
      const card = document.createElement('div'); card.className = 'preview-card';
      const img = document.createElement('img');
      if ((rec.type || '').startsWith('image/')) img.src = URL.createObjectURL(rec.blob);
      else img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg...>${a.name}</svg>`); // keep your previous fallback
      _objectURLs.add(img.src);
      const cap = document.createElement('div'); cap.textContent = a.name;
      card.append(img, cap); els.attachPreview.appendChild(card);
    }
  }
  els.itemDialog.showModal();
}
els.newItemBtn.addEventListener('click', () => openEditor());
els.closeDialogBtn.addEventListener('click', () => els.itemDialog.close());

els.itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = els.titleInput.value.trim();
  if (!title) return;
  const due = els.dueInput.value || '';
  const description = els.descInput.value || '';
  const color = els.colorInput.value || '#6d28d9';

  // icon
  let iconId = null;
  if (els.iconInput.files && els.iconInput.files[0]) {
    iconId = await putFileBlob(els.iconInput.files[0], els.iconInput.files[0].name, els.iconInput.files[0].type);
  } else if (editingId) {
    iconId = state.tasks.find(t => t.id === editingId)?.iconId || null;
  }

  // attachments
  let newAtt = [];
  if (els.filesInput.files && els.filesInput.files.length) {
    for (const f of els.filesInput.files) {
      const id = await putFileBlob(f, f.name, f.type);
      newAtt.push({ id, name: f.name, type: f.type });
    }
  }
  // keep existing attachments on edit
  if (editingId) {
    const existing = state.tasks.find(t => t.id === editingId)?.attachments || [];
    newAtt = existing.concat(newAtt);
  }

  if (editingId) {
    Object.assign(state.tasks.find(t => t.id === editingId), {
      title, due, description, color, iconDataURL, attachments: newAtt
    });
  } else {
    state.tasks.push({
      id: uid(),
      title, due, description, color,
      iconId: iconId || null,
      attachments: newAtt,
      completed: false,
      createdAt: Date.now(),
    });
  }
  els.itemDialog.close();
  render();
});

function deleteTask(id, prompt=true) {
  const i = state.tasks.findIndex(t => t.id === id);
  if (i >= 0) {
    if (prompt) {
      if(confirm('Delete this task?')){
        const removed = state.tasks.splice(i, 1)[0];
        // gather referenced IDs still in use
        const stillUsed = new Set();
        for (const t of state.tasks) {
          if (t.iconId) stillUsed.add(t.iconId);
          for (const a of t.attachments || []) stillUsed.add(a.id);
        }
        // delete files that belonged to removed and are not in stillUsed
        (async () => {
          if (removed.iconId && !stillUsed.has(removed.iconId)) await deleteFileById(removed.iconId);
          for (const a of removed.attachments || []) {
            if (!stillUsed.has(a.id)) await deleteFileById(a.id);
          }
        })().catch(err => console.warn('cleanup failed', err));
        render();
      }
    } else {
        const removed = state.tasks.splice(i, 1)[0];
        // gather referenced IDs still in use
        const stillUsed = new Set();
        for (const t of state.tasks) {
          if (t.iconId) stillUsed.add(t.iconId);
          for (const a of t.attachments || []) stillUsed.add(a.id);
        }
        // delete files that belonged to removed and are not in stillUsed
        (async () => {
          if (removed.iconId && !stillUsed.has(removed.iconId)) await deleteFileById(removed.iconId);
          for (const a of removed.attachments || []) {
            if (!stillUsed.has(a.id)) await deleteFileById(a.id);
          }
        })().catch(err => console.warn('cleanup failed', err));
        render();
    }
  }
}

function duplicateTask(id) {
  const t = state.tasks.find(tt => tt.id === id);
  if (!t) return;
  const copy = JSON.parse(JSON.stringify(t));
  copy.id = uid();
  copy.title = copy.title + ' (copy)';
  copy.completed = false;
  state.tasks.splice(state.tasks.indexOf(t)+1, 0, copy);
  render();
}
function toggleComplete(id, isDone) {
  const t = state.tasks.find(tt => tt.id === id);
  if (!t) return;
  t.completed = !!isDone;
  render();
}

// ---------- Sorting & Filtering ----------
els.searchInput.addEventListener('input', render);
els.sortSelect.addEventListener('change', (e) => {
  state.sort = e.target.value;
  render();
});

// ---------- Completed utilities ----------
els.clearCompletedBtn.addEventListener('click', () => {
  if (confirm('Clear all completed tasks?')) {
    state.tasks = state.tasks.filter(t => !t.completed);
    render();
  }
});

// ---------- Export/Import ----------
els.exportBtn.addEventListener('click', () => {
  els.exportBtn.addEventListener('click', async () => {
  // Build full export object with attachments inlined
  const exportTasks = [];
  for (const t of state.tasks) {
    const tcopy = { ...t };
    // icon
    if (t.iconId) {
      const rec = await getFileRecord(t.iconId);
      if (rec && rec.blob) {
        tcopy.iconDataURL = await blobToDataURL(rec.blob);
        tcopy.iconName = rec.name;
        tcopy.iconType = rec.type;
      }
    }
    // attachments
    const outAtt = [];
    for (const a of t.attachments || []) {
      const rec = await getFileRecord(a.id);
      if (rec && rec.blob) {
        outAtt.push({
          name: rec.name,
          type: rec.type,
          dataURL: await blobToDataURL(rec.blob)
        });
      }
    }
    tcopy.attachments = outAtt;
    exportTasks.push(tcopy);
  }
  const blob = new Blob([JSON.stringify({ version:1, exportedAt: new Date().toISOString(), tasks: exportTasks }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'todo-list.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 3000);
});

});

els.importBtn.addEventListener('click', () => {
  els.importFile.click();
});

els.importFile.addEventListener('change', async (e) => {
  if(state.tasks.length !== 0){
    if(!confirm('Importing will OVERWRITE your current tasks. This is not reversible. Continue?')) {
      e.target.value = '';
      return;
    }
  }
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data.tasks)) throw new Error('Invalid file.');

    const tasks = [];
    for (const t of data.tasks) {
      const tcopy = { ...t };
      // handle icon inlined
      if (t.iconDataURL) {
        const blob = dataURLToBlob(t.iconDataURL);
        const id = await putFileBlob(blob, t.iconName || 'icon', t.iconType || blob.type);
        tcopy.iconId = id;
      }
      delete tcopy.iconDataURL; delete tcopy.iconName; delete tcopy.iconType;

      const newAtt = [];
      for (const a of t.attachments || []) {
        if (a.dataURL) {
          const blob = dataURLToBlob(a.dataURL);
          const id = await putFileBlob(blob, a.name || 'file', a.type || blob.type);
          newAtt.push({ id, name: a.name || 'file', type: a.type || blob.type });
        } else if (a.id) {
          newAtt.push(a);
        }
      }
      tcopy.attachments = newAtt;
      tcopy.id = tcopy.id || uid();
      tasks.push(tcopy);
    }

    state.tasks = tasks;
    render();
  } catch (err) {
    alert('Import failed: ' + err.message);
  } finally {
    e.target.value = '';
  }
});

// ---------- Keyboard shortcuts ----------
window.addEventListener('keydown', (e) => {
  if (e.key === 'n' && !els.itemDialog.open && els.searchInput !== document.activeElement) { openEditor(); }
});

// ---------- Particle Driver ------------
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

let originalPositions = [];
let ripples = [];
let targetColor = new THREE.Color(0.1, 0.1, 0.1); // dark base tone

let animationId = null;
let geometry;
let particles;
let material;
let particlesCount = parseInt(localStorage.getItem('hw.particlesCount')) || 3500;

function init() {
    // Create particles
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
        const x = (Math.random() - 0.5) * 150;
        const y = (Math.random() - 0.5) * 150;
        const z = (Math.random() - 0.5) * 200;

        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;

        originalPositions.push(x, y, z);
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load('https://todo.polimorph.dev/img/circle.png');

    material = new THREE.PointsMaterial({
        map: particleTexture,
        size: 1.5,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function regenerateParticles() {
  scene.remove(particles);
  geometry.dispose();
  material.dispose();

  init(); // Recreate particles with new count
}


camera.position.z = 50;

// Mouse parallax
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

let scrollY = 0, lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

window.addEventListener('click', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * -2;

  ripples.push({
    x: x * 75,
    y: y * 75,
    radius: 0,
    maxRadius: 80,
  });
});

function repelParticles() {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const origX = originalPositions[i];
      const origY = originalPositions[i + 1];
      const origZ = originalPositions[i + 2];
  
      let px = positions[i];
      let py = positions[i + 1];
      let pz = positions[i + 2];
  
      // Cursor repulsion in 2D screen space
      let dx = px - camera.position.x - mouseX * 50;
      let dy = py - camera.position.y + mouseY * 50;
      let distSq = dx * dx + dy * dy;
  
      if (distSq < 2000) {
        const dist = Math.sqrt(distSq);
        const force = (1 - dist / 100) * 0.25;
        positions[i] += (dx / dist) * force;
        positions[i + 1] += (dy / dist) * force;
      }
  
      // Elastic pullback to original position
      positions[i] += (origX - px) * 0.01;
      positions[i + 1] += (origY - py) * 0.01;
      positions[i + 2] += (origZ - pz) * 0.01;
    }
    
    // Wave propagation from clicks
    for (let r = ripples.length - 1; r >= 0; r--) {
      const ripple = ripples[r];
      ripple.radius += 0.9;
   
      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - ripple.x;
        const dy = positions[i + 1] - ripple.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
   
        if (dist > ripple.radius - 5 && dist < ripple.radius + 5) {
          const force = 0.4 * (1 - dist / ripple.maxRadius);
          positions[i] += (dx / dist) * force;
          positions[i + 1] += (dy / dist) * force;

          // Light flash effect: increase brightness briefly
          const glowColor = new THREE.Color();
          const lightness = 0.3 + Math.random() * 0.2; // random slight glow
          glowColor.setHSL(hue / 360, 0.9, lightness);
          material.color.lerp(glowColor, 0.02); // blend toward brighter
        }
      }
   
      // Remove ripple after it exceeds max
      if (ripple.radius > ripple.maxRadius) {
        ripples.splice(r, 1);
      }

    }

    geometry.attributes.position.needsUpdate = true;
}

// Animate
let hue = 220;
function animate() {
  animationId = requestAnimationFrame(animate);

  hue = (hue + 0.1) % 360;

  const scrollDiff = scrollY - lastScrollY;
  lastScrollY = scrollY;

  particles.rotation.y += 0.0008;
  particles.rotation.x += 0.0005;

  particles.position.x += (mouseX * 0.5 - particles.position.x) * 0.02;
  particles.position.y += (-mouseY * 0.5 - particles.position.y + scrollDiff * 0.5) * 0.02;

  // Particle repulsion
  repelParticles();

  // Gradually fade the material color back to base dark hue
  targetColor.setHSL(hue / 360, 0.9, 0.1); // dark but tinted to hue
  material.color.lerp(targetColor, 0.05); // adjust 0.05 for slower or faster fade


  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('particleCount').value = particlesCount;
document.getElementById('particleCount').addEventListener('change', (e) => {
    const newCount = parseInt(e.target.value, 10);
    if (!isNaN(newCount)) {
        localStorage.setItem('hw.particlesCount', newCount);
        state.particlesCount = newCount;
        regenerateParticles();
    }
});

function initParticles() {
  init();
  animate();
}

function toggleParticles(on) {  
  if (on) {
    // Turn ON: clean, then start
    if (!particles) {
      originalPositions = [];
      ripples = [];
      init();
    }
    if (!animationId) animate();
  } else {
    // Turn OFF: stop animation and remove from scene
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (particles) {
      scene.remove(particles);
      geometry.dispose();
      material.dispose();
      particles.geometry = null;
      particles.material = null;
      particles = null;
      ripples = [];
      originalPositions = [];
    }
    renderer.clear();
    renderer.renderLists.dispose(); // free GPU memory
    renderer.setRenderTarget(null);
    renderer.clearColor();
  }
}

// Initial functions
(async function initApp(){
//   console.log('Initializing app...');
  await loadLocal();
  render();
  if(state.particles)initParticles();
})();

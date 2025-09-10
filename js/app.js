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
  console.log('Updating progress bar...');
  const done = state.tasks.filter(t => t.completed).length;
  const total = state.tasks.length;
  const percent = total > 0 ? (done / total) * 100 : 0;
  console.log(`Progress: ${done}/${total} (${percent.toFixed(2)}%)`);
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
  if (e.key === 'n' && !els.itemDialog.open) { openEditor(); }
});

// Initial render
// render();
(async function initApp(){
//   console.log('Initializing app...');
  await loadLocal();
  render();
})();

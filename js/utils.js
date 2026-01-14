function revokeAllObjectURLs() {
  for (const u of _objectURLs) URL.revokeObjectURL(u);
  _objectURLs.clear();
}

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

  document.getElementById("particleCount").value = parseInt(localStorage.getItem("hw.particlesCount")) || 3500;
  // hide/show particle count input
  let clst = document.getElementById("particleOpts").classList;
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

// ---------- Utilities ----------

// onLoad helper
function onPageLoad(){

    // If this is the user's first visit, show the readme dialog
    if(!localStorage.noFirstVisit){
        showReadme();
        localStorage.noFirstVisit=true;
        localStorage.lastLoadedVersion = JSON.stringify(VERSION);
        return;
    }

    console.log("lastLoadedVersion: "+ localStorage.lastLoadedVersion);
    console.log("currentVersion: "+ JSON.stringify(VERSION));
    
    // Check if the current version is newer than the previous version
    if(VERSION.ver > JSON.parse(localStorage.lastLoadedVersion).ver){

        // Show the version readme
        showVersionReadme();

        // Save the current version
        localStorage.lastLoadedVersion = JSON.stringify(VERSION);
    }
}

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

function ensurePathLength(inpString, length){
    if(inpString.length > length){
        // get the difference in length
        let diff = inpString.length-length;

        // remove diff characters after the fifth character of prefix
        return inpString.substring(0, 6) + "..." + inpString.substring(6+diff+3);
    }
    else return inpString;
}

function simpleMarkdown(md) {
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*?)\*/gim, '<i>$1</i>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^\s*[-*] (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/\n$/gim, '<br>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');
}

async function showReadme() {
  const modal = document.getElementById('readmeModal');
  const content = document.getElementById('readmeContent');
  const title = document.getElementById('readmeDialogTitle');
  title.innerHTML = 'ℹ️ About';
  content.innerHTML = 'Loading...';

  try {
    const resp = await fetch('/README.md');
    if (!resp.ok) throw new Error('README not found');
    const text = await resp.text();
    content.innerHTML = marked.parse(text);
  } catch (err) {
    content.innerHTML = `<p style="color:red">Error loading README: ${err.message}</p>`;
    title.innerHTML = `Error`;
    title.style = "color:red; "+title.style;
  }

  modal.showModal();
}

async function showVersionReadme() {
  const modal = document.getElementById('readmeModal');
  const content = document.getElementById('readmeContent');
  const title = document.getElementById('readmeDialogTitle');
  content.innerHTML = 'Loading...';

  try {
    const path = '/version-readmes/'+VERSION.major+'.'+VERSION.minor+'.md';
    const resp = await fetch(path);
    if (!resp.ok) throw new Error('Version README not found at '+path);
    const text = await resp.text();
    content.innerHTML = marked.parse(text);
    title.innerHTML = path;
  } catch (err) {
    content.innerHTML = `<p style="color:red">Error loading Version README: ${err.message}</p>`;
    title.innerHTML = `Error`;
    title.style = "color:red; "+title.style;
  }

  modal.showModal();

}

function sanitize(str){ return (str || '').toString(); }

function updateProgress() {
  const done = state.tasks.filter(t => t.completed).length;
  const total = state.tasks.length;
  const percent = total > 0 ? (done / total) * 100 : 0;
  document.getElementById("progressBar").style.width = percent + "%";
}

/* ---------- IndexedDB helpers for storing file Blobs ---------- */
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

function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll('.todo-item:not(.dragging)')];
  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
/* Master Procrastinator — Client-side, no dependencies (for now).
   Features:
   - Drag-to-reorder within Active list
   - Title, due date, description, color, optional icon thumbnail
   - Attach multiple files per task (stored as data URLs for export)
   - Light/Dark theme toggle with persistence
   - Export/Import JSON (attachments inlined as base64 data URLs)
   - LocalStorage autosave
*/

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
    iconEl.src = 'img/placeholder.png';
    iconEl.style.display = 'block';
  }

  li.querySelector('.title').textContent = task.title || '(Untitled)';
  const dueEl = li.querySelector('.due');
  dueEl.textContent = formatDue(task.due);
  li.querySelector('.desc').innerHTML =
    simpleMarkdown((task.description || '').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>'));


  // Attachments
  const attDiv = li.querySelector('.attachments');
  attDiv.innerHTML = '';
  for (const a of (task.attachments || [])) {
    const pill = document.createElement('a');
    pill.className = 'attachment-pill';
    pill.download = a.name || 'file';
    pill.title = a.name || 'file';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = ensurePathLength(a.name, 35) || 'file';
    // nameSpan.download = a.name || 'file';

    // placeholder image for non-image types
    const img = document.createElement('img');
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><rect width="24" height="24" rx="4" fill="#6d28d9"/><path d="M7 8h10v8H7z" fill="white"/></svg>`);

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.className = 'remove-attachment-btn';
    removeBtn.title = 'Remove this file';
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (confirm('Remove this attachment?')) {
        removeAttachment(task.id, a.id);
        }
    };

    // preview/download link
    const link = document.createElement('a');
    // link.textContent = '📎';
    link.title = 'Download';
    link.style.marginRight = '6px';
    link.onclick = async (e) => {
        e.stopPropagation();
        const rec = await getFileRecord(a.id);
        if (rec?.blob) {
        const url = URL.createObjectURL(rec.blob);
        const temp = document.createElement('a');
        temp.href = url;
        temp.download = rec.name;
        temp.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
    };

    pill.append(img, nameSpan, removeBtn);
    attDiv.appendChild(pill);

    // fetch the blob and populate href + thumbnail if image
    getFileRecord(a.id).then(rec => {
      if (!rec) return;
      const url = URL.createObjectURL(rec.blob);
      _objectURLs.add(url);
      pill.href = url;
      if ((rec.type || '').startsWith('image/')) img.src = url;
    }).catch(err => console.warn('attachment load failed:', err));
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

setupDragAndDrop(els.todoList, false);     // Active list
setupDragAndDrop(els.completedList, true); // Completed list

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
      const card = document.createElement('div');
      card.className = 'preview-card';
      const img = document.createElement('img');
      if ((rec.type || '').startsWith('image/')) img.src = URL.createObjectURL(rec.blob);
      // keep previous fallback
      else img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><rect width="24" height="24" rx="4" fill="#6d28d9"/><path d="M7 8h10v8H7z" fill="white"/></svg>`);
      _objectURLs.add(img.src);
      const cap = document.createElement('div'); cap.textContent = ensurePathLength(a.name, 24);
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.className = 'remove-attachment-btn';
      removeBtn.title = 'Remove this file';
      removeBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm('Remove this attachment?')) {
          await removeAttachment(task.id, a.id);
          // re-open editor to refresh preview
          await openEditor(task.id);
        }
      };
      card.append(img, cap, removeBtn); els.attachPreview.appendChild(card);
    }
  }
  els.itemDialog.showModal();
  els.titleInput.focus();
}

// Update
els.itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (els.itemDialog.returnValue === 'cancel') {
    itemDialog.close();
    return;
  }
  const title = els.titleInput.value.trim();
  if (!title) return;
  const due = els.dueInput.value || '';
  const description = els.descInput.value || '';
  const color = els.colorInput.value || '#6d28d9';

  // icon
  let iconId = null;
  if (els.iconInput.files && els.iconInput.files[0]) {
      const file = els.iconInput.files[0];
      iconId = await putFileBlob(file, file.name, file.type);
  } else if (editingId) {
      const existing = state.tasks.find(t => t.id === editingId);
      iconId = existing?.iconId || null;
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
      title, due, description, color, iconId, attachments: newAtt
    });
  } else {
    state.tasks.unshift({
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

async function removeAttachment(taskId, fileId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  // Remove from task
  task.attachments = task.attachments.filter(a => a.id !== fileId);

  // If no other task uses this file, delete from IndexedDB
  const stillUsed = state.tasks.some(t =>
    (t.iconId === fileId) ||
    (t.attachments || []).some(a => a.id === fileId)
  );
  if (!stillUsed) {
    await deleteFileById(fileId);
  }

  saveLocal();
  render();
}

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

// ---------- Keyboard shortcuts ----------
window.addEventListener('keydown', (e) => {
  if (e.key === 'n' && !els.itemDialog.open && els.searchInput !== document.activeElement) { openEditor(); }
});

// fixes hitting reset on enter
window.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && (document.activeElement === document.getElementById('particleCount'))) {
    // Cancel the default action
    e.preventDefault();
    
    //unfocus the element
    document.getElementById('particleCount').blur();

    //force-update particles
    document.getElementById('particleCount').value = document.getElementById('particleCount').value;
  }
  else if(e.key === "Enter" && els.itemDialog.open && els.descInput != document.activeElement){
    e.preventDefault();
    //save
    els.saveItemBtn.click();
  }
});

// ---------- Theme ----------
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  state.theme = t;
  localStorage.setItem('hw.theme', t);
  // Update particle colors to match new theme
  if (material) {
    const p = PARTICLE_COLORS[t];
    material.color.setHSL(p.h/360, p.s, p.l);
    material.opacity = p.opacity;
  }
}
(function initTheme(){
  const stored = localStorage.getItem('hw.theme');
  applyTheme(stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
})();
els.themeToggle.addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
// window.addEventListener('keydown', (e)=>{ if(e.key.toLowerCase()==='t' && !els.itemDialog.open) els.themeToggle.click(); });

// Initial functions
(async function initApp(){
  await loadLocal();
  render();
  if(state.particles)initParticles();
})();

// Button triggers
document.getElementById("settingsBtn").onclick = () => {
  document.getElementById("settingsModal").showModal();
};

document.getElementById("closeSettingsBtn").onclick = () => {
  document.getElementById("settingsModal").close();
};

document.getElementById("settingsInfo").onclick = e => {
    showReadme();
};

els.newItemBtn.addEventListener('click', () => openEditor());

els.closeDialogBtn.addEventListener('click', () => els.itemDialog.close());

els.cancelItemBtn.addEventListener('click', (e) => {
  e.preventDefault();
  // User clicked Cancel, just close without saving
  els.itemDialog.close();
  editingId = null;
});

els.importBtn.addEventListener('click', () => {
  els.importFile.click();
});

document.getElementById('closeReadmeBtn').onclick = () => {
  document.getElementById('readmeModal').close();
};

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

// Checkbox triggers
document.getElementById("autosaveAttachmentsToggle").onchange = e => {
  state.autosaveAttachments = e.target.checked;
  saveLocal();
};
document.getElementById("particlesToggle").onchange = e => {
  state.particles = e.target.checked;
  // hide/show particle count input
  let clst = document.getElementById("particleOpts").classList;
  let chclst = document.getElementById("particleToggleField").classList;
  let spacer = document.getElementById("particleSpacer").classList;
  if(state.particles){
    if(clst.contains("hidden"))clst.remove("hidden");
    if(chclst.contains("span-2"))chclst.remove("span-2");
    if(spacer.contains("hidden"))spacer.remove("hidden");
  }
  else {
    if(!clst.contains("hidden"))clst.add("hidden");
    if(!chclst.contains("span-2"))chclst.add("span-2");
    if(!spacer.contains("hidden"))spacer.add("hidden");
  }

  toggleParticles(state.particles);
  saveLocal();
};

// Saves before page closes
window.addEventListener("beforeunload", function(e){
   saveLocal();
});
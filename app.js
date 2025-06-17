// app.js
// Enthält die Logik für Admin-Login, Artikelverwaltung und UI-Animationen

// Dummy-Login (nur Demo, kein echtes Backend!)
const ADMIN_USER = "admin";
const ADMIN_PASS = "holz123";

let isAdmin = false;

function setAdmin(state) {
  isAdmin = state;
  document.getElementById('logout-admin').style.display = isAdmin ? 'inline-block' : 'none';
  document.getElementById('open-admin-login').style.display = isAdmin ? 'none' : 'inline-block';
  renderArtikel();
}

function openLoginModal() {
  document.getElementById("admin-login-modal").style.display = "flex";
}

function closeLoginModal() {
  document.getElementById("admin-login-modal").style.display = "none";
}

function showAdminPanel() {
  document.getElementById("admin-panel-modal").style.display = "flex";
  // Tabs und Events JETZT initialisieren
  const tabCreate = document.getElementById('admin-tab-create');
  const tabEdit = document.getElementById('admin-tab-edit');
  const panelCreate = document.getElementById('admin-panel-create');
  const panelEdit = document.getElementById('admin-panel-edit');
  if (tabCreate && tabEdit && panelCreate && panelEdit) {
    tabCreate.classList.add('active');
    tabEdit.classList.remove('active');
    panelCreate.style.display = '';
    panelEdit.style.display = 'none';
    // Events entfernen und neu setzen
    tabCreate.onclick = () => {
      tabCreate.classList.add('active');
      tabEdit.classList.remove('active');
      panelCreate.style.display = '';
      panelEdit.style.display = 'none';
    };
    tabEdit.onclick = () => {
      tabEdit.classList.add('active');
      tabCreate.classList.remove('active');
      panelEdit.style.display = '';
      panelCreate.style.display = 'none';
      fillEditArtikelSelect();
    };
  }
}

function closeAdminPanel() {
  document.getElementById("admin-panel-modal").style.display = "none";
  isAdmin = false;
}

// === jsonbin.io Integration ===
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/68517f448561e97a5025dd40";
const JSONBIN_KEY = "$2a$10$BSBITPua./ItMaiZnmCGlu7UnVRLdQwuJAl5voLRb/X2ut5KBIt1i";

let artikel = [];

async function ladeArtikel() {
  try {
    const res = await fetch(JSONBIN_URL + "/latest", {
      headers: { "X-Access-Key": JSONBIN_KEY }
    });
    if (!res.ok) throw new Error("Fehler beim Laden der Angebote");
    const data = await res.json();
    artikel = data.record || [];
    renderArtikel();
  } catch (e) {
    alert("Angebote konnten nicht geladen werden: " + e.message);
    artikel = [];
    renderArtikel();
  }
}

async function speichereArtikel() {
  try {
    const res = await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Key": JSONBIN_KEY
      },
      body: JSON.stringify(artikel)
    });
    if (!res.ok) throw new Error("Fehler beim Speichern der Angebote");
  } catch (e) {
    alert("Angebote konnten nicht gespeichert werden: " + e.message);
  }
}

function artikelGeaendert() {
  speichereArtikel();
  renderArtikel();
}

// Scroll-Animationen für alle wichtigen Bereiche
function setupScrollAnimations() {
  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.scroll-animate').forEach(el => {
    observer.observe(el);
  });
}

function renderArtikel() {
  const grid = document.getElementById("artikel-grid");
  if (!grid) return;
  grid.innerHTML = "";
  artikel.forEach(a => {
    const card = document.createElement("div");
    card.className = "card scroll-animate";
    card.tabIndex = 0;
    card.style.cursor = 'pointer';
    let preisText = a.preis + ' €';
    if (a.vb) preisText += ' (VB)';
    if (a.rabatt && a.rabatt > 0) {
      const rabattPreis = Math.round(a.preis * (1 - a.rabatt / 100));
      preisText = `<span style='text-decoration:line-through;color:#bdbdbd;'>${a.preis} €</span> <span style='color:#d93b30;font-weight:bold;'>${rabattPreis} €</span> <span style='color:#388e3c;font-size:0.95em;'>(-${a.rabatt}%${a.vb ? ', VB' : ''})</span>`;
    }
    card.innerHTML = `
      <img src="${Array.isArray(a.bild) ? a.bild[0] : a.bild}" alt="${a.name}">
      <h3>${a.name}</h3>
      <div class="desc">${a.beschreibung || ''}</div>
      <div class="price">${preisText}</div>
      <a href="${a.kleinanzeigen ? a.kleinanzeigen : '#'}" class="btn contact-btn" target="_blank" rel="noopener">Kleinanzeigen</a>
      ${a.status === "ausverkauft" ? '<div class="soldout-badge">Ausverkauft</div>' : ""}
      ${isAdmin ? `<button class='btn delete-btn' data-id='${a.id}' tabindex="-1">Löschen</button>` : ""}
      <div class="artikel-id-admin" style="${isAdmin ? '' : 'display:none;'}">ID: ${a.id}</div>
    `;
    // Klick auf Card öffnet Modal (außer auf Löschen-Button)
    card.addEventListener('click', function(e) {
      if (e.target.classList.contains('delete-btn')) return;
      openProduktModal(a);
    });
    card.addEventListener('keydown', function(e) {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.classList.contains('delete-btn')) {
        openProduktModal(a);
      }
    });
    grid.appendChild(card);
  });
  // Admin: Delete-Button Listener
  if (isAdmin) {
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = parseInt(this.getAttribute('data-id'));
        artikel = artikel.filter(a => a.id !== id);
        artikelGeaendert();
      });
    });
    // Multi-Select für Admin: Checkboxen und Mehrfach-Löschen-Button
    if (!document.getElementById('multi-delete-btn')) {
      const multiBtn = document.createElement('button');
      multiBtn.id = 'multi-delete-btn';
      multiBtn.className = 'btn delete-btn';
      multiBtn.textContent = 'Ausgewählte löschen';
      multiBtn.style.margin = '1.2rem auto 1rem auto';
      multiBtn.style.display = 'block';
      multiBtn.onclick = function() {
        const checked = Array.from(document.querySelectorAll('.artikel-multicheck:checked')).map(cb => parseInt(cb.value));
        if (checked.length && confirm('Wirklich ' + checked.length + ' Artikel löschen?')) {
          artikel = artikel.filter(a => !checked.includes(a.id));
          artikelGeaendert();
        }
      };
      grid.parentElement.insertBefore(multiBtn, grid);
    }
    // Checkboxen an Cards
    document.querySelectorAll('.card').forEach(card => {
      const id = card.querySelector('.delete-btn')?.getAttribute('data-id');
      if (id && !card.querySelector('.artikel-multicheck')) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'artikel-multicheck';
        cb.value = id;
        cb.title = 'Für Mehrfach-Löschen auswählen';
        cb.style.position = 'absolute';
        cb.style.left = '10px';
        cb.style.top = '10px';
        card.insertBefore(cb, card.firstChild);
      }
    });
  } else {
    // Button entfernen, falls nicht Admin
    const multiBtn = document.getElementById('multi-delete-btn');
    if (multiBtn) multiBtn.remove();
    document.querySelectorAll('.artikel-multicheck').forEach(cb => cb.remove());
  }
  // Nach dem Rendern neue Cards für Scroll-Animationen beobachten
  if (window.setupScrollAnimations) window.setupScrollAnimations();
}

function openProduktModal(a) {
  // Galerie/Thumbnails
  let bilder = Array.isArray(a.bild) ? a.bild : [a.bild];
  let current = 0;
  const mainImg = document.getElementById('produkt-modal-img');
  const thumbs = document.getElementById('produkt-modal-thumbs');
  if (!mainImg || !thumbs) {
    alert('Fehler: Produkt-Modal nicht gefunden!');
    return;
  }
  mainImg.src = bilder[0];
  mainImg.classList.remove('enlarged');
  thumbs.innerHTML = '';
  bilder.forEach((src, idx) => {
    const thumb = document.createElement('img');
    thumb.src = src;
    thumb.className = idx === 0 ? 'selected' : '';
    thumb.addEventListener('click', function(e) {
      e.stopPropagation();
      mainImg.src = src;
      thumbs.querySelectorAll('img').forEach(t => t.classList.remove('selected'));
      thumb.classList.add('selected');
    });
    thumbs.appendChild(thumb);
  });
  mainImg.onclick = function() {
    this.classList.toggle('enlarged');
  };
  document.getElementById('produkt-modal-title').textContent = a.name;
  // Preis im Modal
  let preisText = a.preis + ' €';
  if (a.vb) preisText += ' (VB)';
  if (a.rabatt && a.rabatt > 0) {
    const rabattPreis = Math.round(a.preis * (1 - a.rabatt / 100));
    preisText = `${a.preis} € → <span style='color:#d93b30;font-weight:bold;'>${rabattPreis} €</span> <span style='color:#388e3c;font-size:0.95em;'>(-${a.rabatt}%${a.vb ? ', VB' : ''})</span>`;
  }
  document.getElementById('produkt-modal-price').innerHTML = preisText;
  document.getElementById('produkt-modal-desc').textContent = a.beschreibung || '';
  // Features
  const features = document.getElementById('produkt-modal-features');
  features.innerHTML = '';
  if (a.features && a.features.length) {
    a.features.forEach(f => {
      const li = document.createElement('li');
      li.textContent = f;
      features.appendChild(li);
    });
  }
  document.getElementById('produkt-modal').style.display = 'flex';
  // Kontaktieren-Button setzen (jetzt Kleinanzeigen)
  const contactBtn = document.getElementById('produkt-modal-contact');
  if (contactBtn) {
    if (a.kleinanzeigen) {
      contactBtn.href = a.kleinanzeigen;
      contactBtn.style.display = '';
      contactBtn.target = '_blank';
      contactBtn.rel = 'noopener';
    } else {
      contactBtn.href = '#';
      contactBtn.style.display = 'none';
    }
  }
  setTimeout(() => {
    document.getElementById('produkt-modal').focus();
  }, 10);
}

// --- POPUP-MODAL CLOSE FIX ---
function setupProduktModalClose() {
  const modal = document.getElementById('produkt-modal');
  const closeBtn = document.getElementById('close-produkt-modal');
  if (closeBtn) {
    closeBtn.onclick = closeProduktModal;
  }
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeProduktModal();
    });
    document.addEventListener('keydown', function(e) {
      if (modal.style.display === 'flex' && (e.key === 'Escape' || e.key === 'Esc')) {
        closeProduktModal();
      }
    });
  }
}

function closeProduktModal() {
  document.getElementById('produkt-modal').style.display = 'none';
}

// --- DRAG & DROP FIX ---
// Cloudinary Upload Funktion
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'unsigned_preset');
  const res = await fetch('https://api.cloudinary.com/v1_1/dg89cdhrz/image/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (res.ok) {
    return data.secure_url;
  } else {
    throw new Error(data.error.message);
  }
}

// --- DRAG & DROP für ARTIKEL ERSTELLEN ---
function setupBildDropzone() {
  let artikelBilderLocal = [];
  const dropzone = document.getElementById('bild-dropzone');
  const fileInput = document.getElementById('bild-file-input');
  const preview = document.getElementById('bild-preview');
  if (!dropzone || !fileInput || !preview) return;

  dropzone.replaceWith(dropzone.cloneNode(true));
  const newDropzone = document.getElementById('bild-dropzone');
  const newFileInput = document.getElementById('bild-file-input');
  const newPreview = document.getElementById('bild-preview');

  newDropzone.addEventListener('click', (e) => {
    if (e.target === newDropzone || e.target.id === 'bild-dropzone-text') {
      newFileInput.value = '';
      newFileInput.click();
    }
  });
  newDropzone.addEventListener('dragover', e => {
    e.preventDefault();
    newDropzone.classList.add('dragover');
  });
  newDropzone.addEventListener('dragleave', e => {
    e.preventDefault();
    newDropzone.classList.remove('dragover');
  });
  newDropzone.addEventListener('drop', async e => {
    e.preventDefault();
    newDropzone.classList.remove('dragover');
    await handleFiles(e.dataTransfer.files);
  });
  newFileInput.addEventListener('change', async e => {
    await handleFiles(e.target.files);
  });
  async function handleFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const url = await uploadToCloudinary(file);
        artikelBilderLocal.push(url);
        renderPreview();
      } catch (err) {
        alert('Bild-Upload zu Cloudinary fehlgeschlagen!');
      }
    }
  }
  function renderPreview() {
    newPreview.innerHTML = '';
    artikelBilderLocal.forEach((src, idx) => {
      const img = document.createElement('img');
      img.src = src;
      img.style.maxWidth = '60px';
      img.style.maxHeight = '60px';
      img.style.borderRadius = '6px';
      img.style.border = '1px solid #eee';
      img.title = 'Bild ' + (idx+1);
      // Entfernen-Button
      const del = document.createElement('span');
      del.textContent = '×';
      del.style.cursor = 'pointer';
      del.style.marginLeft = '-18px';
      del.style.color = '#d93b30';
      del.style.fontWeight = 'bold';
      del.onclick = () => {
        artikelBilderLocal.splice(idx, 1);
        renderPreview();
      };
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.style.display = 'inline-block';
      wrap.appendChild(img);
      wrap.appendChild(del);
      newPreview.appendChild(wrap);
    });
  }
  newPreview.innerHTML = '';
  // Schreibe die Bilder in das globale Array beim Absenden
  const form = document.getElementById('add-artikel-form');
  if (form) {
    form.onsubmit = function(e) {
      window.artikelBilder = [...artikelBilderLocal];
    };
  }
}
// --- NEUES DRAG & DROP für ARTIKEL BEARBEITEN ---
function setupEditBildDropzone() {
  let editArtikelBilderLocal = [];
  const dropzone = document.getElementById('edit-bild-dropzone');
  const fileInput = document.getElementById('edit-bild-file-input');
  const preview = document.getElementById('edit-bild-preview');
  if (!dropzone || !fileInput || !preview) return;

  dropzone.replaceWith(dropzone.cloneNode(true));
  const newDropzone = document.getElementById('edit-bild-dropzone');
  const newFileInput = document.getElementById('edit-bild-file-input');
  const newPreview = document.getElementById('edit-bild-preview');

  newDropzone.addEventListener('click', (e) => {
    if (e.target === newDropzone || e.target.id === 'edit-bild-dropzone-text') {
      newFileInput.value = '';
      newFileInput.click();
    }
  });
  newDropzone.addEventListener('dragover', e => {
    e.preventDefault();
    newDropzone.classList.add('dragover');
  });
  newDropzone.addEventListener('dragleave', e => {
    e.preventDefault();
    newDropzone.classList.remove('dragover');
  });
  newDropzone.addEventListener('drop', async e => {
    e.preventDefault();
    newDropzone.classList.remove('dragover');
    await handleFiles(e.dataTransfer.files);
  });
  newFileInput.addEventListener('change', async e => {
    await handleFiles(e.target.files);
  });
  async function handleFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const url = await uploadToCloudinary(file);
        editArtikelBilderLocal.push(url);
        renderPreview();
      } catch (err) {
        alert('Bild-Upload zu Cloudinary fehlgeschlagen!');
      }
    }
  }
  function renderPreview() {
    newPreview.innerHTML = '';
    editArtikelBilderLocal.forEach((src, idx) => {
      const img = document.createElement('img');
      img.src = src;
      img.style.maxWidth = '60px';
      img.style.maxHeight = '60px';
      img.style.borderRadius = '6px';
      img.style.border = '1px solid #eee';
      img.title = 'Bild ' + (idx+1);
      // Entfernen-Button
      const del = document.createElement('span');
      del.textContent = '×';
      del.style.cursor = 'pointer';
      del.style.marginLeft = '-18px';
      del.style.color = '#d93b30';
      del.style.fontWeight = 'bold';
      del.onclick = () => {
        editArtikelBilderLocal.splice(idx, 1);
        renderPreview();
      };
      const wrap = document.createElement('div');
      wrap.style.position = 'relative';
      wrap.style.display = 'inline-block';
      wrap.appendChild(img);
      wrap.appendChild(del);
      newPreview.appendChild(wrap);
    });
  }
  newPreview.innerHTML = '';
  // Schreibe die Bilder in das globale Array beim Absenden
  const form = document.getElementById('edit-artikel-form');
  if (form) {
    form.onsubmit = function(e) {
      window.editArtikelBilder = [...editArtikelBilderLocal];
    };
  }
}

// Admin-Panel Tabs und Bearbeiten-Logik
let editArtikelBilder = [];
function setupAdminPanelTabs() {
  const tabCreate = document.getElementById('admin-tab-create');
  const tabEdit = document.getElementById('admin-tab-edit');
  const panelCreate = document.getElementById('admin-panel-create');
  const panelEdit = document.getElementById('admin-panel-edit');
  if (!tabCreate || !tabEdit || !panelCreate || !panelEdit) {
    console.error('Admin-Panel Tabs nicht gefunden!');
    return;
  }
  tabCreate.onclick = () => {
    tabCreate.classList.add('active');
    tabEdit.classList.remove('active');
    panelCreate.style.display = '';
    panelEdit.style.display = 'none';
    setupBildDropzone(); // Dropzone für Erstellen-Tab immer neu initialisieren
    artikelBilder = [];
    document.getElementById('bild-preview').innerHTML = '';
    console.log('Tab: Artikel erstellen');
  };
  tabEdit.onclick = () => {
    tabEdit.classList.add('active');
    tabCreate.classList.remove('active');
    panelEdit.style.display = '';
    panelCreate.style.display = 'none';
    fillEditArtikelSelect();
    console.log('Tab: Artikel bearbeiten');
    // Sichtbarkeit debuggen
    setTimeout(() => {
      console.log('panelEdit display:', panelEdit.style.display, panelEdit);
    }, 100);
  };
}
function fillEditArtikelSelect() {
  const select = document.getElementById('edit-artikel-select');
  select.innerHTML = '';
  artikel.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.name + ' (ID: ' + a.id + ')';
    select.appendChild(opt);
  });
  if (artikel.length) loadEditArtikel(artikel[0].id);
  // Event-Listener immer neu setzen
  select.onchange = function() {
    loadEditArtikel(this.value);
    // Dropzone-Events nach jedem Wechsel neu setzen
    setupEditBildDropzone();
  };
  // Dropzone-Events auch nach jedem Neuaufbau setzen
  setupEditBildDropzone();
}
function loadEditArtikel(id) {
  const a = artikel.find(x => x.id == id);
  if (!a) return;
  document.getElementById('edit-artikel-name').value = a.name;
  document.getElementById('edit-artikel-preis').value = a.preis;
  document.getElementById('edit-artikel-vb').checked = !!a.vb;
  document.getElementById('edit-artikel-rabatt').value = a.rabatt || '';
  document.getElementById('edit-artikel-beschreibung').value = a.beschreibung || '';
  document.getElementById('edit-artikel-features').value = (a.features||[]).join('; ');
  document.getElementById('edit-artikel-kleinanzeigen').value = a.kleinanzeigen || '';
  editArtikelBilder = Array.isArray(a.bild) ? [...a.bild] : (a.bild ? [a.bild] : []);
  renderEditBildPreview();
}
function renderEditBildPreview() {
  const preview = document.getElementById('edit-bild-preview');
  preview.innerHTML = '';
  editArtikelBilder.forEach((src, idx) => {
    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '60px';
    img.style.maxHeight = '60px';
    img.style.borderRadius = '6px';
    img.style.border = '1px solid #eee';
    img.title = 'Bild ' + (idx+1);
    // Entfernen-Button
    const del = document.createElement('span');
    del.textContent = '×';
    del.style.cursor = 'pointer';
    del.style.marginLeft = '-18px';
    del.style.color = '#d93b30';
    del.style.fontWeight = 'bold';
    del.onclick = () => {
      editArtikelBilder.splice(idx, 1);
      renderEditBildPreview();
    };
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.style.display = 'inline-block';
    wrap.appendChild(img);
    wrap.appendChild(del);
    preview.appendChild(wrap);
  });
}
function setupEditBildDropzone() {
  const dropzone = document.getElementById('edit-bild-dropzone');
  const fileInput = document.getElementById('edit-bild-file-input');
  const preview = document.getElementById('edit-bild-preview');
  if (!dropzone) return;
  dropzone.replaceWith(dropzone.cloneNode(true));
  const newDropzone = document.getElementById('edit-bild-dropzone');
  const newFileInput = document.getElementById('edit-bild-file-input');
  const newPreview = document.getElementById('edit-bild-preview');

  newDropzone.addEventListener('click', (e) => {
    if (e.target === newDropzone || e.target.id === 'edit-bild-dropzone-text') {
      newFileInput.value = '';
      newFileInput.click();
    }
  });
  newDropzone.addEventListener('dragover', e => {
    e.preventDefault();
    newDropzone.classList.add('dragover');
  });
  newDropzone.addEventListener('dragleave', e => {
    e.preventDefault();
    newDropzone.classList.remove('dragover');
  });
  newDropzone.addEventListener('drop', e => {
    e.preventDefault();
    newDropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  newFileInput.addEventListener('change', e => {
    handleFiles(e.target.files);
  });
  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        editArtikelBilder.push(evt.target.result);
        renderEditBildPreview();
      };
      reader.readAsDataURL(file);
    });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  // Scroll-Animationen initialisieren
  window.setupScrollAnimations = setupScrollAnimations;
  setupScrollAnimations();
  // renderArtikel(); // ENTFERNT, damit nur ladeArtikel() beim Start läuft
  document.getElementById("open-admin-login").addEventListener("click", openLoginModal);
  document.getElementById("close-admin-login").addEventListener("click", closeLoginModal);
  document.getElementById("close-admin-panel").addEventListener("click", closeAdminPanel);
  document.getElementById("logout-admin").addEventListener("click", function() {
    setAdmin(false);
    closeAdminPanel();
  });
  document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();
    const user = document.getElementById("login-user").value;
    const pass = document.getElementById("login-pass").value;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      setAdmin(true);
      closeLoginModal();
      showAdminPanel();
    } else {
      alert("Falsche Zugangsdaten!");
    }
  });
  document.getElementById("add-artikel-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const name = document.getElementById("artikel-name").value;
    const preis = parseFloat(document.getElementById("artikel-preis").value);
    const vb = document.getElementById("artikel-vb").checked;
    const rabatt = parseInt(document.getElementById("artikel-rabatt").value) || 0;
    const beschreibung = document.getElementById("artikel-beschreibung").value;
    const features = document.getElementById("artikel-features").value.split(';').map(f=>f.trim()).filter(Boolean);
    const kleinanzeigen = document.getElementById("artikel-kleinanzeigen").value.trim();
    if (!name || isNaN(preis) || !beschreibung || artikelBilder.length === 0) {
      alert('Bitte alle Pflichtfelder ausfüllen und mindestens ein Bild hochladen!');
      return;
    }
    const id = artikel.length ? Math.max(...artikel.map(a=>a.id))+1 : 1;
    artikel.push({ id, name, preis, vb, rabatt, beschreibung, features, bild: [...artikelBilder], kleinanzeigen });
    artikelGeaendert();
    this.reset();
    artikelBilder = [];
    document.getElementById('bild-preview').innerHTML = '';
    alert('Artikel hinzugefügt!');
  });
  // --- ARTIKEL BEARBEITEN ---
  document.getElementById('edit-artikel-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('edit-artikel-select').value);
    const a = artikel.find(x => x.id === id);
    if (!a) return;
    a.name = document.getElementById('edit-artikel-name').value;
    a.preis = parseFloat(document.getElementById('edit-artikel-preis').value);
    a.vb = document.getElementById('edit-artikel-vb').checked;
    a.rabatt = parseInt(document.getElementById('edit-artikel-rabatt').value) || 0;
    a.beschreibung = document.getElementById('edit-artikel-beschreibung').value;
    a.features = document.getElementById('edit-artikel-features').value.split(';').map(f=>f.trim()).filter(Boolean);
    a.bild = [...editArtikelBilder];
    a.kleinanzeigen = document.getElementById('edit-artikel-kleinanzeigen').value.trim();
    artikelGeaendert();
    alert('Änderungen gespeichert!');
  });
  // Fix: Admin-Panel-Tab immer korrekt initialisieren
  const tabCreate = document.getElementById('admin-tab-create');
  const tabEdit = document.getElementById('admin-tab-edit');
  const panelCreate = document.getElementById('admin-panel-create');
  const panelEdit = document.getElementById('admin-panel-edit');
  // Setze initial immer auf "Erstellen"
  if (tabCreate && tabEdit && panelCreate && panelEdit) {
    tabCreate.classList.add('active');
    tabEdit.classList.remove('active');
    panelCreate.style.display = '';
    panelEdit.style.display = 'none';
  }
  setupProduktModalClose();
  setupBildDropzone();
  setupEditBildDropzone();
  // Tab-Event-Listener nur einmal deklarieren
  const tabCreateBtn = document.getElementById('admin-tab-create');
  if (tabCreateBtn) {
    tabCreateBtn.addEventListener('click', () => {
      setupBildDropzone();
    });
  }
  const tabEditBtn = document.getElementById('admin-tab-edit');
  if (tabEditBtn) {
    tabEditBtn.addEventListener('click', () => {
      setupEditBildDropzone();
    });
  }
  // Beim Seitenstart laden:
  window.addEventListener('DOMContentLoaded', ladeArtikel);
});

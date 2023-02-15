BGPAGE = null;
BOOKMARKS = null;
ICONS = null;

TAB = null;

ENTRY = null;
EXISTING = null;

async function fillPaths() {
  const container = document.getElementById('paths');
  while (container.firstChild) { container.removeChild(container.lastChild); }

  for (const path of ENTRY.paths) {
    const option = document.createElement('option');
    option.value = path.title;
    option.innerText = path.title;
    container.appendChild(option);
  }

  const matchingPath = await BOOKMARKS.getMatchingPath(TAB.url, ENTRY);
  container.value = matchingPath.title;
}

const Listeners = {
  onAdd: function() {
    const option = document.getElementById('paths').value;
    const path = ENTRY.paths.find(x => x.title === option);
    if (path) {
      Listeners._onAdd(path);
    }
  },

  _onAdd: function(path) {
    BOOKMARKS.add(TAB.id, TAB.url, TAB.title, ENTRY, path);
    window.close();
  },

  onMove: function() {
    const option = document.getElementById('paths').value;
    const path = ENTRY.paths.find(x => x.title === option);
    BOOKMARKS.move(TAB.id, TAB.url, ENTRY, path);
    window.close();
  },

  onMoveTo: function() {
    browser.tabs.update(TAB.id, {url: EXISTING});
    window.close();
  },

  onRemove: function() {
    BOOKMARKS.remove(TAB.id, TAB.url, ENTRY);
    window.close();
  },
};

function adding() {
  const defaultPath = ENTRY.paths.find(x => x.default);
  if (defaultPath) {
    Listeners._onAdd(defaultPath);
    return;
  }

  fillPaths();

  const addBtn = document.getElementById('add-btn');
  addBtn.removeEventListener('click', Listeners.onAdd);
  addBtn.addEventListener('click', Listeners.onAdd);
  addBtn.classList.remove('hidden');

  document.getElementById('move-btn').classList.add('hidden');
  document.getElementById('move-to-btn').classList.add('hidden');
  document.getElementById('remove-btn').classList.add('hidden');
}

function viewing() {
  fillPaths();

  const moveBtn = document.getElementById('move-btn');
  moveBtn.removeEventListener('click', Listeners.onMove);
  moveBtn.addEventListener('click', Listeners.onMove);
  moveBtn.classList.remove('hidden');

  const removeBtn = document.getElementById('remove-btn');
  removeBtn.removeEventListener('click', Listeners.onRemove);
  removeBtn.addEventListener('click', Listeners.onRemove);
  removeBtn.classList.remove('hidden');

  const moveToBtn = document.getElementById('move-to-btn');
  if (EXISTING != TAB.url) {
    moveToBtn.removeEventListener('click', Listeners.onMoveTo);
    moveToBtn.addEventListener('click', Listeners.onMoveTo);
    moveToBtn.classList.remove('hidden');
  } else {
    moveToBtn.classList.add('hidden');
  }

  document.getElementById('add-btn').classList.add('hidden');
}

window.addEventListener('load', async () => {
  BGPAGE = await HELPERS.get.background.page();
  HELPERS = await HELPERS.get.background.helpers(BGPAGE);
  BOOKMARKS = await HELPERS.get.background.bookmarks(BGPAGE);
  ICONS = await HELPERS.get.background.icons(BGPAGE);

  TAB = (await browser.tabs.query({active: true, currentWindow: true}))[0];

  ENTRY = await BOOKMARKS.getEntryMatching(TAB.url);
  EXISTING = await BOOKMARKS.find(TAB.url, ENTRY);

  if (EXISTING) {
    viewing();
  } else {
    adding();
  }
});
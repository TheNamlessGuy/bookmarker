BGPAGE = null;
BOOKMARKS = null;
ICONS = null;

let CONTAINER = null;
let ENTRY_CONTAINER_TEMPLATE = null;
let ENTRY_PATH_TEMPLATE = null;

function initTemplate(template) {
  return template.content.firstElementChild.cloneNode(true)
}

async function addNewPathEntryTo(pathContainer, path = null) {
  const element = initTemplate(ENTRY_PATH_TEMPLATE);
  const defaultElem = element.getElementsByClassName('entry-default')[0];

  if (path) {
    element.getElementsByClassName('entry-title')[0].value = path.title;
    element.getElementsByClassName('entry-path-root')[0].value = path.root;
    element.getElementsByClassName('entry-path')[0].value = path.path.join('/');
    defaultElem.checked = path.default;
  }

  element.getElementsByClassName('remove-entry-path-container-btn')[0].addEventListener('click', () => {
    pathContainer.removeChild(element);
    if (!pathContainer.firstChild) {
      CONTAINER.removeChild(pathContainer.parentNode);
    }
  });

  defaultElem.addEventListener('click', () => {
    for (const def of pathContainer.getElementsByClassName('entry-default')) {
      if (def === defaultElem) { continue; }

      def.checked = false;
    }
  });

  element.getElementsByClassName('entry-up-btn')[0].addEventListener('click', () => {
    const children = Array.from(pathContainer.children);
    const idx = children.findIndex(x => x === element);
    if (idx === 0) { return; }

    const above = children[idx - 1];
    pathContainer.insertBefore(element, above);
  });

  element.getElementsByClassName('entry-down-btn')[0].addEventListener('click', () => {
    const children = Array.from(pathContainer.children);
    const idx = children.findIndex(x => x === element);
    if (idx === children.length - 1) {
      return;
    } else if (idx === children.length - 2) {
      pathContainer.appendChild(element);
    } else {
      pathContainer.insertBefore(element, children[idx + 2]);
    }
  });

  pathContainer.appendChild(element);
}

async function addNewEntry(entry = null) {
  const container = initTemplate(ENTRY_CONTAINER_TEMPLATE);
  const pathContainer = container.getElementsByClassName('entry-path-container-container')[0];

  if (entry != null) {
    container.getElementsByClassName('entry-regex')[0].value = entry.regex;
    container.getElementsByClassName('entry-parameters')[0].value = entry.parameters.join(',');

    for (const path of entry.paths) {
      addNewPathEntryTo(pathContainer, path);
    }

    if (entry.paths.length === 0) {
      addNewPathEntryTo(pathContainer);
    }
  } else {
    addNewPathEntryTo(pathContainer);
  }

  container.getElementsByClassName('add-entry-path-container-btn')[0].addEventListener('click', () => {
    addNewPathEntryTo(pathContainer);
  });

  container.getElementsByClassName('entry-container-up-btn')[0].addEventListener('click', () => {
    const children = Array.from(CONTAINER.children);
    const idx = children.findIndex(x => x === container);
    if (idx === 0) { return; }

    const above = children[idx - 1];
    CONTAINER.insertBefore(container, above);
  });

  container.getElementsByClassName('entry-container-down-btn')[0].addEventListener('click', () => {
    const children = Array.from(CONTAINER.children);
    const idx = children.findIndex(x => x === container);
    if (idx === children.length - 1) {
      return;
    } else if (idx === children.length - 2) {
      CONTAINER.appendChild(container);
    } else {
      CONTAINER.insertBefore(container, children[idx + 2]);
    }
  });

  CONTAINER.appendChild(container);
}

function getSaveObject() {
  const opts = {
    entries: [],
  };

  const containers = document.getElementsByClassName('entry-container');
  for (const container of containers) {
    const entry = {
      regex: container.getElementsByClassName('entry-regex')[0].value,
      parameters: container.getElementsByClassName('entry-parameters')[0].value.split(','),
      paths: [],
    };

    entry.parameters = entry.parameters.map(x => x.trim()).filter(x => x != '');

    if (entry.regex.length === 0) {
      console.log('ERROR: regex cant be empty');
      return;
    }

    const paths = container.getElementsByClassName('entry-path-container');
    for (const path of paths) {
      const pathEntry = {
        title:   path.getElementsByClassName('entry-title')[0].value,
        root:    path.getElementsByClassName('entry-path-root')[0].value,
        path:    path.getElementsByClassName('entry-path')[0].value.split('/'),
        default: path.getElementsByClassName('entry-default')[0].checked,
      };

      if (pathEntry.title.length === 0) {
        console.log('ERROR: title cant be empty');
        return;
      } else if (pathEntry.path.length === 0 || (pathEntry.path.length === 1 && pathEntry.path[0].length === 0)) {
        console.log('ERROR: path cant be empty');
        return;
      } else if (entry.paths.some(x => x.title === pathEntry.title)) {
        console.log('ERROR: title must be unique');
        return;
      }

      entry.paths.push(pathEntry);
    }

    opts.entries.push(entry);
  }

  return opts;
}

async function save() {
  const opts = getSaveObject();
  await HELPERS.set.options(opts);
}

async function load() {
  const opts = await HELPERS.get.options();
  if ('entries' in opts) {
    for (const entry of opts.entries) {
      addNewEntry(entry);
    }

    if (opts.entries.length === 0) {
      addNewEntry();
    }
  } else {
    addNewEntry();
  }
}

async function importSaveObject() {
  let opts = prompt('Data to import:');
  try {
    opts = JSON.parse(opts);
  } catch {
    console.log('COULD NOT PARSE', opts);
    return;
  }

  await HELPERS.set.options(opts);
  window.location.reload(true);
}

function exportSaveObject() {
  const opts = JSON.stringify(getSaveObject());
  prompt('Exported data (save this somewhere):', opts);
}

window.addEventListener('load', async () => {
  BGPAGE = await HELPERS.get.background.page();
  HELPERS = await HELPERS.get.background.helpers(BGPAGE);
  BOOKMARKS = await HELPERS.get.background.bookmarks(BGPAGE);
  ICONS = await HELPERS.get.background.icons(BGPAGE);

  CONTAINER = document.getElementById('entries-container');
  ENTRY_CONTAINER_TEMPLATE = document.getElementById('entry-container-template');
  ENTRY_PATH_TEMPLATE = document.getElementById('entry-path-template');

  await load();

  document.getElementById('add-new-entry').addEventListener('click', () => { addNewEntry(); });
  document.getElementById('save').addEventListener('click', save);
  document.getElementById('import').addEventListener('click', importSaveObject);
  document.getElementById('export').addEventListener('click', exportSaveObject);
});
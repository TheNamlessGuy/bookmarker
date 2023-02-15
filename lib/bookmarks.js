const BOOKMARKS = {
  /*
   * [{
   *   regex: /blah.com\/.*\/user/,
   *   parameters: [{key: 'search', value?: string}],
   *   paths: [{
   *     root: 'toolbar_____',
   *     path: ['Sites', 'blah.com', 'Users']
   *     folder: BookmarkFolder?, // null if not created yet
   *     title: 'Users',
   *     default: boolean,
   *   }],
   * }]
   */
  entries: [],

  init: async function() {
    const options = await HELPERS.get.options();

    if ('entries' in options) {
      BOOKMARKS.entries = HELPERS.clone(options.entries);
      for (let e = 0; e < BOOKMARKS.entries.length; ++e) {
        BOOKMARKS.entries[e].regex = new RegExp(BOOKMARKS.entries[e].regex);

        for (let p = 0; p < BOOKMARKS.entries[e].parameters.length; ++p) {
          const parameter = BOOKMARKS.entries[e].parameters[p];

          if (parameter.includes('=')) {
            const split = parameter.split('=');
            BOOKMARKS.entries[e].parameters[p] = {key: split[0], value: split[1], optional: false};
          } else {
            BOOKMARKS.entries[e].parameters[p] = {key: parameter, optional: false};
          }

          if (BOOKMARKS.entries[e].parameters[p].key.endsWith('?')) {
            BOOKMARKS.entries[e].parameters[p].optional = true;
            BOOKMARKS.entries[e].parameters[p].key = BOOKMARKS.entries[e].parameters[p].key.substring(0, BOOKMARKS.entries[e].parameters[p].key.length - 1);
          }
        }

        for (let p = 0; p < BOOKMARKS.entries[e].paths.length; ++p) {
          await BOOKMARKS.getOrCreatePath(BOOKMARKS.entries[e].paths[p], false);
        }
      }
    } else {
      BOOKMARKS.entries = [];
    }
  },

  getOrCreatePath: async function(path, create) {
    let bookmarkFolder = HELPERS.clone(await browser.bookmarks.getTree());
    bookmarkFolder = bookmarkFolder[0].children.find((x) => x.id === path.root);

    for (const pathEntry of path.path) {
      const match = bookmarkFolder.children.find((x) => x.title === pathEntry);

      if (match != null) {
        bookmarkFolder = match;
      } else if (create) {
        bookmarkFolder = await browser.bookmarks.create({
         parentId: bookmarkFolder.id,
         title: pathEntry,
         type: 'folder',
       });

       if (!('children' in bookmarkFolder)) { bookmarkFolder.children = []; }
      } else {
        path.folder = null;
        return null;
      }
    }

    path.folder = bookmarkFolder;
    return bookmarkFolder;
  },

  add: async function(tabID, url, title, entry, path) {
    const folder = await BOOKMARKS.getOrCreatePath(path, true);

    await browser.bookmarks.create({
      parentId: folder.id,
      title: title,
      url: HELPERS.URLToString(await BOOKMARKS.format(url, entry), true),
      type: 'bookmark',
    });

    await HELPERS.set.pageActionIcon(tabID, url, entry);
  },

  remove: async function(tabID, url, entry) {
    const match = await BOOKMARKS.getMatchingBookmark(url, entry);
    if (match) {
      await browser.bookmarks.remove(match.id);
      await HELPERS.set.pageActionIcon(tabID, url, entry);
    }
  },

  move: async function(tabID, url, entry, toPath) {
    const match = await BOOKMARKS.getMatchingBookmark(url, entry);
    if (match) {
      const folder = await BOOKMARKS.getOrCreatePath(toPath, true);
      await browser.bookmarks.move(match.id, {parentId: folder.id});
      await HELPERS.set.pageActionIcon(tabID, url, entry);
    }
  },

  getMatchingPath: async function(url, entry) {
    url = HELPERS.URLToString(await BOOKMARKS.format(url, entry), true);
    const result = await browser.bookmarks.search({url: url});

    let match = null;
    for (let r = 0; r < result.length; ++r) {
      match = entry.paths.find((path) => path.folder && result[r].parentId === path.folder.id)
      if (match) { break; }
    }

    return match;
  },

  getMatchingBookmark: async function(url, entry) {
    url = HELPERS.URLToString(await BOOKMARKS.format(url, entry), true);
    const result = await browser.bookmarks.search({url: url});

    let match = null;
    for (let r = 0; r < result.length; ++r) {
      match = entry.paths.find((path) => path.folder && result[r].parentId === path.folder.id)
      if (match) { match = result[r]; break; }
    }

    return match;
  },

  find: async function(url, entry) {
    const match = await BOOKMARKS.getMatchingPath(url, entry);
    return match ? HELPERS.URLToString(await BOOKMARKS.format(url, entry), true) : null;
  },

  format: async function(url, entry) {
    url = new URL(url);
    let retval = new URL(HELPERS.URLToString(url, false));

    for (const param of entry.parameters) {
      if (!url.searchParams.has(param.key)) {
        if (param.optional) {
          continue;
        } else {
          return null;
        }
      }

      const value = url.searchParams.get(param.key);
      if (!('value' in param) || value === param.value) {
        retval.searchParams.set(param.key, value);
      } else {
        return null;
      }
    }

    return retval;
  },

  getEntryMatching: async function(url) {
    for (const entry of BOOKMARKS.entries) {
      const match = HELPERS.URLToString(await BOOKMARKS.format(url, entry), false).match(entry.regex);
      if (match) {
        return entry;
      }
    }

    return null;
  },
};

function getBookmarks() {
  return BOOKMARKS;
}
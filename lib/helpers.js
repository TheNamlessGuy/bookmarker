let HELPERS = {
  clone: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  reload: async function() {
    await BOOKMARKS.init(); // lib/bookmarks.js
  },

  get: {
    options: async function() {
      return await browser.storage.local.get();
    },

    background: {
      page: async function() {
        return await browser.runtime.getBackgroundPage();
      },

      bookmarks: async function(bgPage = null) {
        if (bgPage == null) { bgPage = await HELPERS.get.background.page(); }
        return bgPage.getBookmarks();
      },

      helpers: async function(bgPage = null) {
        if (bgPage == null) { bgPage = await HELPERS.get.background.page(); }
        return bgPage.getHelpers();
      },

      icons: async function(bgPage = null) {
        if (bgPage == null) { bgPage = await HELPERS.get.background.page(); }
        return bgPage.getIcons();
      },
    }
  },

  set: {
    options: async function(opts) {
      await browser.storage.local.set(opts);
      await HELPERS.reload();
    },

    pageActionIcon: async function(tabID, url, entry) {
      const existing = await BOOKMARKS.find(url, entry);

      if (existing == null) {
        await ICONS.set(ICONS.NOT_FAVORITED, tabID);
      } else if (existing != url) {
        await ICONS.set(ICONS.FAVORITED_OTHER_URL, tabID);
      } else {
        await ICONS.set(ICONS.FAVORITED, tabID);
      }
    },
  },

  onTabUpdate: async function(tabID, changeInfo, tabInfo) {
    const entry = await BOOKMARKS.getEntryMatching(tabInfo.url);
    const isShown = await browser.pageAction.isShown({tabId: tabID});
    if (entry != null && !isShown) {
      browser.pageAction.show(tabID);
      HELPERS.set.pageActionIcon(tabID, tabInfo.url, entry);
    } else if (entry == null && isShown) {
      browser.pageAction.hide(tabID);
    }
  },

  onPageActionClicked: function(tab) {
    browser.pageAction.setPopup({tabId: tab.id, popup: '/popup/index.html'});
    browser.pageAction.openPopup();
    browser.pageAction.setPopup({tabId: tab.id, popup: ''});
  },

  URLToString: function(url, searchparams) {
    if (url == null) { return '%#%¤#%&&%¤%'; }

    url = searchparams ? url.toString() : url.origin + url.pathname;
    url = decodeURIComponent(url);
    return url;
  },
};

function getHelpers() {
  return HELPERS;
}
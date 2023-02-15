const ICONS = {
  FAVORITED:           'res/icons/favorited/',
  NOT_FAVORITED:       'res/icons/not-favorited/',
  FAVORITED_OTHER_URL: 'res/icons/favorited-other-url/',

  set: async function(iconType, tabID) {
    await browser.pageAction.setIcon({
      tabId: tabID,
      path: {
        16: `${iconType}/16.png`,
        19: `${iconType}/19.png`,
        32: `${iconType}/32.png`,
        38: `${iconType}/38.png`,
        48: `${iconType}/48.png`,
      },
    }).catch((e) => { console.error('Setting page action icon failed:', e); });
  },
};

function getIcons() {
  return ICONS;
}
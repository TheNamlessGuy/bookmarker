async function main() {
  await HELPERS.reload();

  browser.tabs.onUpdated.addListener(HELPERS.onTabUpdate);
  browser.pageAction.onClicked.addListener(HELPERS.onPageActionClicked);
}

main();
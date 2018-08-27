function pinTabs (urls, pinsCount, sendResponse) {
  browser.windows.create({ url: urls }).then((newWindow) => {
    newWindow.tabs.slice(0, pinsCount).map((tab, index) => {
      browser.tabs.update(tab.id, { pinned: true })
    })
  })

  sendResponse({ response: "Tabs pinned" })
}

function handleMessage(request, sender, sendResponse) {
  switch (request.message) {
    case 'window_opened':
      pinTabs(request.urls, request.pinsCount, sendResponse)
      break
  }
}

browser.runtime.onMessage.addListener(handleMessage)

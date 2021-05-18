import { browserAPI } from 'copdeck-scraper'

chrome.alarms.onAlarm.addListener(async () => {})

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
	if (msg.search) {
		sendResponse('got it')
		const items = await browserAPI.searchItems(msg.search)
		const stringified = JSON.stringify(items)
		chrome.storage.sync.set({ searchResults: stringified })
	}
})

chrome.runtime.onInstalled.addListener(() => {
	chrome.alarms.get('copdeckAlarm', (a) => {
		if (!a) {
			chrome.alarms.create('copdeckAlarm', { delayInMinutes: 0.1 })
		}
	})
})

// todo: add timeout
// todo: add retry
// todo: useragents
// todo:

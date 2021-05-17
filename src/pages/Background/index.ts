import { searchStockx } from 'copdeck-scraper'

chrome.alarms.onAlarm.addListener(async () => {})

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
	if (msg.search) {
		sendResponse('got it')
		const names = await searchStockx(msg.search)
		chrome.storage.sync.set({ names: names })
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

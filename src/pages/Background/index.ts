import { browserAPI } from 'copdeck-scraper'
import { assert, string, number, array } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'

chrome.alarms.onAlarm.addListener(async () => {})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.search) {
		;(async () => {
			const searchTerm = msg.search
			assert(searchTerm, string())
			const items = await browserAPI.searchItems(searchTerm)
			sendResponse(items)
		})()
		return true
	} else if (msg.getItemDetails) {
		;(async () => {
			const item = msg.getItemDetails
			assert(item, Item)
			const itemWithPrices = await browserAPI.getItemPrices(item)
			sendResponse(itemWithPrices)
		})()
		return true
	}
})

chrome.runtime.onInstalled.addListener(() => {
	chrome.alarms.get('copdeckAlarm', (a) => {
		if (!a) {
			chrome.alarms.create('copdeckAlarm', { delayInMinutes: 0.1 })
		}
	})
})

// todo: add uninstall survey
// chrome.runtime.onInstalled.addListener((reason) => {
// 	if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
// 		chrome.runtime.setUninstallURL('https://example.com/extension-survey')
// 	}
// })

// todo: add caching
// todo: sizes
// todo: add timeout
// todo: add retry
// todo: useragents
// todo:

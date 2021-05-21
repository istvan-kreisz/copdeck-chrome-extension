import { browserAPI } from 'copdeck-scraper'
import { assert, string, number, array } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import { databaseCoordinator } from '../services/databaseCoordinator'

const refreshPeriod = 5

chrome.alarms.onAlarm.addListener(async () => {
	const { getAlertsWithItems, deleteAlert } = databaseCoordinator()

	getAlertsWithItems((alerts) => {
		alerts.forEach(([alert, item]) => {
			if (item.updated)
		})
	})
	console.log('yooo')
})

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
				chrome.storage.sync.set({ refreshPerriod: 5 }, () => {

                })

	chrome.alarms.get('copdeckAlarm', (a) => {
		if (!a) {
			chrome.alarms.create('copdeckAlarm', { periodInMinutes: 0.1 })
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

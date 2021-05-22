import { browserAPI } from 'copdeck-scraper'
import { assert, string, number, array } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import { databaseCoordinator } from '../services/databaseCoordinator'
import { Settings } from '../utils/types'
import { parse, stringify } from '../utils/proxyparser'

const minUpdateInterval = 1
const maxUpdateInterval = 1440

chrome.alarms.onAlarm.addListener(async () => {
	const { getAlertsWithItems } = databaseCoordinator()

	getAlertsWithItems((alerts) => {
		alerts.forEach(([alert, item]) => {
			if (item.updated) {
			}
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
	} else if (msg.settings) {
		const { saveSettings } = databaseCoordinator()

		;(async () => {
			const item = msg.settings
			assert(item, Settings)

			let proxiesString = item.proxies
			if (proxiesString) {
				try {
					proxiesString = stringify(parse(proxiesString))
				} catch (err) {
					proxiesString = undefined
					console.log(err)
				}
			}
			item.proxies = proxiesString
			if (item.updateInterval < minUpdateInterval) {
				item.updateInterval = minUpdateInterval
			} else if (item.updateInterval > maxUpdateInterval) {
				item.updateInterval = maxUpdateInterval
			}
			console.log(item)
			saveSettings(item)
		})()
		return
	}
})

// chrome.runtime.onInstalled.addListener(() => {
// 				chrome.storage.sync.set({ refreshPerriod: 5 }, () => {

//                 })

// 	chrome.alarms.get('copdeckAlarm', (a) => {
// 		if (!a) {
// 			chrome.alarms.create('copdeckAlarm', { periodInMinutes: 0.1 })
// 		}
// 	})
// })

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

import { browserAPI, promiseAllSkippingErrors, notEmpty } from 'copdeck-scraper'
import { assert, string, number, array } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'
import { databaseCoordinator } from '../services/databaseCoordinator'
import { Settings } from '../utils/types'
import { parse, stringify } from '../utils/proxyparser'

const minUpdateInterval = 1
const maxUpdateInterval = 1440

const updatePrices = async () => {
	const { getItems, saveItems, getAlerts, updateItems, getSettings } = databaseCoordinator()

	const settings = await getSettings()
	const savedAlerts = await getAlerts()
	const savedItems = await getItems()

	// delete items without alerts
	const activeItems = savedItems.filter((item) =>
		savedAlerts.find((alert) => alert.itemId === item.id)
	)
	if (activeItems.length !== savedItems.length) {
		await saveItems(activeItems)
	}

	// refresh items
	const result = await promiseAllSkippingErrors(
		activeItems.map((item) => {
			const lastUpdated = item.updated
			if (
				(lastUpdated &&
					lastUpdated < new Date().getTime() - 60 * 1000 * settings.updateInterval) ||
				!lastUpdated
			) {
				return browserAPI.getItemPrices(item)
			} else {
				return new Promise<Item>((resolve, reject) => reject())
			}
		})
	)

	const items = result.filter((item) => item.storePrices && item.storePrices.length)
	if (items && items.length) {
		await updateItems(items)
	}
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.search) {
		;(async () => {
			await updatePrices()
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

chrome.alarms.onAlarm.addListener(async () => {
	await updatePrices()
})

chrome.runtime.onInstalled.addListener(async () => {
	chrome.alarms.clearAll()
	// chrome.alarms.get('copdeckAlarm', (a) => {
	// 	if (!a) {
	// 		chrome.alarms.create('copdeckAlarm', { periodInMinutes: 0.1 })
	// 	}
	// })
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

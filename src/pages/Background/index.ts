import {
	browserAPI,
	promiseAllSkippingErrors,
	isOlderThan,
	itemBestPrice,
	itemImageURL,
} from 'copdeck-scraper'
import { assert, string, number, array } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'
import { databaseCoordinator } from '../services/databaseCoordinator'
import { Settings } from '../utils/types'
import { parse, stringify } from '../utils/proxyparser'
import { v4 as uuidv4 } from 'uuid'

const minUpdateInterval = 5
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
				(lastUpdated && isOlderThan(lastUpdated, settings.updateInterval, 'minutes')) ||
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
		console.log('updated items')
		console.log(items)
	}
}

const fetchAndCache = async (item: Item) => {
	const { cacheItem } = databaseCoordinator()
	const newItem = await browserAPI.getItemPrices(item)
	console.log('fetched')
	await cacheItem(newItem)
	return newItem
}

const getItemDetails = async (item: Item) => {
	const { getItemWithId } = databaseCoordinator()

	try {
		const savedItem = await getItemWithId(item.id)
		if (savedItem) {
			console.log(savedItem)
			return savedItem
		} else {
			return fetchAndCache(item)
		}
	} catch (err) {
		return fetchAndCache(item)
	}
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.search) {
		;(async () => {
			// todo remove
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
			const itemWithPrices = await getItemDetails(item)
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

const addAlarm = async (deleteIfExists: boolean) => {
	const alarmName = 'copdeckAlarm'
	const { getSettings } = databaseCoordinator()
	const settings = await getSettings()

	return new Promise<void>((resolve, reject) => {
		chrome.alarms.get(alarmName, (a) => {
			if (deleteIfExists) {
				if (a) {
					chrome.alarms.clear(alarmName, (wasCleared) => {
						if (wasCleared) {
							chrome.alarms.create(alarmName, {
								periodInMinutes: settings.updateInterval,
							})
						}
						resolve()
					})
				} else {
					chrome.alarms.create(alarmName, {
						periodInMinutes: settings.updateInterval,
					})
					resolve()
				}
			} else {
				if (!a) {
					chrome.alarms.create(alarmName, {
						periodInMinutes: settings.updateInterval,
					})
				}
				resolve()
			}
		})
	})
}

const sendNotifications = async () => {
	const { getSettings, updateLastNotificationDateForAlert } = databaseCoordinator()
	const settings = await getSettings()

	const { getAlertsWithItems } = databaseCoordinator()
	const alerts = await getAlertsWithItems()
	console.log(alerts)
	const alertsFiltered = alerts
		.filter(([alert, item]) => {
			// todo
			return true
			// if (alert.lastNotificationSent) {
			// 	return isOlderThan(
			// 		alert.lastNotificationSent,
			// 		settings.notificationFrequency,
			// 		'hours'
			// 	)
			// } else {
			// 	return true
			// }
		})
		.filter(([alert, item]) => {
			const bestPrice = itemBestPrice(item, alert)
			console.log(bestPrice, alert.targetPrice)
			if (bestPrice) {
				if (bestPrice < alert.targetPrice) {
					return true
				} else {
					return false
				}
			} else {
				return false
			}
		})

	// return promiseAllSkippingErrors(
	// 	alertsFiltered.map(([alert, item]) => {
	// 		const bestPrice = itemBestPrice(item, alert)
	// 		chrome.notifications.create(
	// 			uuidv4(),
	// 			{
	// 				type: 'basic',
	// 				iconUrl: 'http://www.google.com/favicon.ico',
	// 				title: 'CopDeck Price Alert!',
	// 				message: `${item.name} price dropped below ${alert.targetPrice}! Current best price: ${settings.currency}${bestPrice}`,
	// 				priority: 2,
	// 			},
	// 			() => {
	// 				console.log('Last error:', chrome.runtime.lastError)
	// 			}
	// 		)
	// 		return updateLastNotificationDateForAlert(alert)
	// 	})
	// )
}

chrome.alarms.onAlarm.addListener(async () => {
	await updatePrices()
	await sendNotifications()
})

chrome.runtime.onInstalled.addListener(async () => {
	// await addAlarm(false)

	await updatePrices()
	await sendNotifications()

	chrome.storage.onChanged.addListener(function (changes, namespace) {
		for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
			console.log(
				`Storage key "${key}" in namespace "${namespace}" changed.`,
				`Old value was "${oldValue}", new value is "${newValue}".`
			)
		}
	})
})

// todo: add uninstall survey
// chrome.runtime.onInstalled.addListener((reason) => {
// 	if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
// 		chrome.runtime.setUninstallURL('https://example.com/extension-survey')
// 	}
// })

// todo: figure out currecy, size updates
// add check for duplicate alerts
// todo: image caching
// todo: add refresh button
// todo: alert added confirmation
// todo: QUOTA_BYTES_PER_ITEM
// todo: reset alarm when fetch interval changed
// todo refine error handling
// todo: clearr cache
// todo: add delay between requests
// todo: add caching
// todo: sizes
// todo: add timeout
// todo: add retry
// todo: useragents
// todo:

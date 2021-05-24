import {
	browserAPI,
	promiseAllSkippingErrors,
	isOlderThan,
	itemBestPrice,
	config,
} from 'copdeck-scraper'
import { assert, string, is } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import { databaseCoordinator } from '../services/databaseCoordinator'
import { Settings } from '../utils/types'
import { parse, stringify } from '../utils/proxyparser'

const minUpdateInterval = 5
const maxUpdateInterval = 1440
const cacheAlarm = 'copdeckCacheAlarm'
const refreshAlarm = 'copdeckRefreshAlarm'
const requestDelayMax = 1000

const clearCache = async () => {
	const { clearItemCache } = databaseCoordinator()
	try {
		await clearItemCache()
	} catch (err) {
		console.log(err)
	}
}

const updatePrices = async (forced: boolean = false) => {
	const { getItems, saveItems, getAlerts, updateItems, getSettings } = databaseCoordinator()

	try {
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
					forced ||
					(lastUpdated && isOlderThan(lastUpdated, settings.updateInterval, 'minutes')) ||
					!lastUpdated
				) {
					return new Promise<Item>((resolve, reject) => {
						const delay = Math.random() * requestDelayMax
						console.log('delay: ' + delay)
						setTimeout(() => {
							browserAPI
								.getItemPrices(item)
								.then((result) => {
									resolve(result)
								})
								.catch((err) => {
									reject(err)
								})
						}, delay)
					})
				} else {
					return new Promise<Item>((resolve, reject) => reject())
				}
			})
		)

		const items = result.filter((item) => item.storePrices && item.storePrices.length)
		if (items && items.length) {
			await updateItems(items)
		}
	} catch (err) {
		console.log(err)
	}
}

const fetchAndCache = async (item: Item) => {
	const { cacheItem } = databaseCoordinator()
	const newItem = await browserAPI.getItemPrices(item)
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
			try {
				const searchTerm = msg.search
				assert(searchTerm, string())
				const items = await browserAPI.searchItems(searchTerm)
				sendResponse(items)
			} catch (err) {
				sendResponse([])
				console.log(err)
			}
		})()
		return true
	} else if (msg.getItemDetails) {
		;(async () => {
			try {
				const item = msg.getItemDetails
				assert(item, Item)
				const itemWithPrices = await getItemDetails(item)
				sendResponse(itemWithPrices)
			} catch (err) {
				sendResponse(undefined)
				console.log(err)
			}
		})()
		return true
	} else if (msg.settings) {
		const { saveSettings } = databaseCoordinator()
		;(async () => {
			try {
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
				saveSettings(item)
			} catch (err) {
				console.log(err)
			}
		})()
		return true
	} else if (msg.refresh) {
		;(async () => {
			try {
				await updatePrices()
			} catch (err) {
				console.log(err)
			}
			sendResponse()
		})()
		return true
	}
})

const addClearCacheAlarm = async () => {
	return new Promise<void>((resolve, reject) => {
		chrome.alarms.get(cacheAlarm, (a) => {
			if (!a) {
				chrome.alarms.create(cacheAlarm, {
					periodInMinutes: 10080,
				})
			}
			resolve()
		})
	})
}

const addRefreshAlarm = async (deleteIfExists: boolean) => {
	const { getSettings } = databaseCoordinator()
	try {
		const settings = await getSettings()

		return new Promise<void>((resolve, reject) => {
			chrome.alarms.get(refreshAlarm, (a) => {
				if (deleteIfExists) {
					if (a) {
						chrome.alarms.clear(refreshAlarm, (wasCleared) => {
							if (wasCleared) {
								chrome.alarms.create(refreshAlarm, {
									periodInMinutes: settings.updateInterval,
								})
							}
							resolve()
						})
					} else {
						chrome.alarms.create(refreshAlarm, {
							periodInMinutes: settings.updateInterval,
						})
						resolve()
					}
				} else {
					if (!a) {
						chrome.alarms.create(refreshAlarm, {
							periodInMinutes: settings.updateInterval,
						})
					}
					resolve()
				}
			})
		})
	} catch (err) {
		console.log(err)
	}
}

const sendNotifications = async () => {
	const { getSettings, updateLastNotificationDateForAlert } = databaseCoordinator()
	try {
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
	} catch (err) {
		console.log(err)
	}
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name == refreshAlarm) {
		await updatePrices()
		await sendNotifications()
	} else if (alarm.name == cacheAlarm) {
		await clearCache()
	}
})

chrome.runtime.onStartup.addListener(async () => {
	chrome.runtime.setUninstallURL('https://google.com')
})

chrome.runtime.onInstalled.addListener(async () => {
	await addRefreshAlarm(false)
	await addClearCacheAlarm()
})

chrome.storage.onChanged.addListener(async function (changes, namespace) {
	// 	for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
	// 		console.log(
	// 			`Storage key "${key}" in namespace "${namespace}" changed.`,
	// 			`Old value was "${oldValue}", new value is "${newValue}".`
	// 		)
	// 	}

	const settingsNew = changes.settings?.newValue
	const settingsOld = changes.settings?.oldValue
	if (settingsNew && settingsOld && is(settingsNew, Settings) && is(settingsOld, Settings)) {
		if (settingsOld.currency !== settingsNew.currency) {
			config.currency = settingsNew.currency
			await updatePrices(true)
		}
		if (settingsOld.updateInterval !== settingsNew.updateInterval) {
			await addRefreshAlarm(true)
		}
	}
})

// todo: check uninstall survey
// todo: add proxy support
// todo: add goat
// todo: why does communication keep breaking
// todo: useragents
// todo: test notifications

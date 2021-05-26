import {
	browserAPI,
	promiseAllSkippingErrors,
	isOlderThan,
	itemBestPrice,
	didFailToFetchAllStorePrices,
} from 'copdeck-scraper'
import { assert, string, is, boolean } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import { databaseCoordinator } from '../services/databaseCoordinator'
import { Settings } from '../utils/types'
import { parse } from '../utils/proxyparser'
import { log } from '../utils/logger'

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
		log(err, true)
	}
}

const shouldUpdateItem = (item: Item, updateInterval: number): boolean => {
	const lastUpdated = item.updated
	return (!!lastUpdated && isOlderThan(lastUpdated, updateInterval, 'minutes')) || !lastUpdated
}

const updatePrices = async (forced: boolean = false) => {
	return
	const { getItems, saveItems, getAlerts, updateItems, getSettings, getIsDevelopment } =
		databaseCoordinator()

	try {
		const [settings, savedAlerts, savedItems, dev] = await Promise.all([
			getSettings(),
			getAlerts(),
			getItems(),
			getIsDevelopment(),
		])

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
				if (forced || shouldUpdateItem(item, settings.updateInterval)) {
					return new Promise<Item>((resolve, reject) => {
						const delay = Math.random() * requestDelayMax
						setTimeout(() => {
							browserAPI
								.getItemPrices(item, settings.currency, dev)
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

const fetchAndSave = async (item: Item) => {
	const { updateItem, getSettings, getIsDevelopment } = databaseCoordinator()
	const [settings, dev] = await Promise.all([getSettings(), getIsDevelopment()])
	const newItem = await browserAPI.getItemPrices(item, settings.currency, dev)
	await updateItem(newItem, dev)
	return newItem
}

const getItemDetails = async (item: Item, forceRefresh: boolean) => {
	const { getItemWithId, getIsDevelopment, getSettings } = databaseCoordinator()

	try {
		const [savedItem, dev, settings] = await Promise.all([
			getItemWithId(item.id),
			getIsDevelopment(),
			getSettings(),
		])

		if (savedItem) {
			if (
				didFailToFetchAllStorePrices(savedItem) ||
				shouldUpdateItem(savedItem, settings.updateInterval) ||
				forceRefresh
			) {
				log('fetching new 1', dev)
				return fetchAndSave(savedItem)
			} else {
				log('returning saved', dev)
				return savedItem
			}
		} else {
			log('fetching new 2', dev)
			return fetchAndSave(item)
		}
	} catch (err) {
		log('fetching new 3', true)
		return fetchAndSave(item)
	}
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.search) {
		;(async () => {
			try {
				const searchTerm = msg.search
				assert(searchTerm, string())
				const { getSettings, getIsDevelopment } = databaseCoordinator()
				const [settings, dev] = await Promise.all([getSettings(), getIsDevelopment()])
				log('searching', dev)
				const items = await browserAPI.searchItems(searchTerm, settings.currency, dev)
				log('search results', dev)
				log(items, dev)
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
				const item = msg.getItemDetails?.item
				const forceRefresh = msg.getItemDetails?.forceRefresh
				assert(item, Item)
				assert(forceRefresh, boolean())
				const itemWithPrices = await getItemDetails(item, forceRefresh)
				sendResponse(itemWithPrices)
			} catch (err) {
				sendResponse(undefined)
				console.log(err)
			}
		})()
		return true
	} else if (msg.settings) {
		const { saveSettings, getIsDevelopment } = databaseCoordinator()
		;(async () => {
			try {
				const settings = msg.settings.settings
				const proxyString = msg.settings.proxyString
				assert(settings, Settings)
				assert(proxyString, string())
				const dev = await getIsDevelopment()

				let proxyParseError
				if (proxyString) {
					try {
						settings.proxies = parse(proxyString)
					} catch (err) {
						settings.proxies = []
						proxyParseError = err['message'] ?? 'Invalid proxy format'
						log('proxy error', dev)
						log(err, dev)
					}
				}
				if (settings.updateInterval < minUpdateInterval) {
					settings.updateInterval = minUpdateInterval
				} else if (settings.updateInterval > maxUpdateInterval) {
					settings.updateInterval = maxUpdateInterval
				}
				await saveSettings(settings)
				sendResponse(proxyParseError)
			} catch (err) {
				console.log(err)
				sendResponse(err)
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
		// console.log(alerts)
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
	await Promise.all([addRefreshAlarm(false), addClearCacheAlarm()])
})

chrome.storage.onChanged.addListener(async function (changes, namespace) {
	const { getIsDevelopment } = databaseCoordinator()
	const dev = await getIsDevelopment()

	if (dev) {
		for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
			console.log(
				`Storage key "${key}" in namespace "${namespace}" changed.`,
				`Old value was "${oldValue}", new value is "${newValue}".`
			)
		}
	}

	const settingsNew = changes.settings?.newValue
	const settingsOld = changes.settings?.oldValue
	if (settingsNew && settingsOld && is(settingsNew, Settings) && is(settingsOld, Settings)) {
		if (settingsOld.currency.code !== settingsNew.currency.code) {
			await updatePrices(true)
		}
		if (settingsOld.updateInterval !== settingsNew.updateInterval) {
			await addRefreshAlarm(true)
		}
	}
})

// investigate timeout errors
// goat currency
// todo: check uninstall survey
// todo: add proxy support
// todo: why does communication keep breaking
// todo: useragents
// todo: fix notifications
// test notification refresh

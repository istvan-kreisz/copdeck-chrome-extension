import { array, assert, boolean, is, number } from 'superstruct'
import { Item, PriceAlert, EUR } from 'copdeck-scraper/dist/types'
import { removeDuplicates } from 'copdeck-scraper'
import { Settings } from '../utils/types'
import { log } from '../utils/logger'

type AlertWithItem = [PriceAlert, Item]

export const databaseCoordinator = () => {
	const defaultSettings: Settings = {
		currency: EUR,
		updateInterval: 30,
		notificationFrequency: 24,
		proxies: [],
	}

	const asyncSet = async (
		key: string,
		value: any
	): Promise<chrome.runtime.LastError | undefined> => {
		return new Promise((resolve, reject) => {
			chrome.storage.local.set({ [key]: value }, () => {
				resolve(chrome.runtime.lastError)
			})
		})
	}

	const asyncGet = async (key: string): Promise<any> => {
		return new Promise((resolve, reject) => {
			chrome.storage.local.get([key], (result) => {
				resolve(result)
			})
		})
	}

	const getIsDevelopment = async (): Promise<boolean> => {
		const result = await asyncGet('isDevelopment')
		const isDevelopment = result.isDevelopment
		if (is(isDevelopment, boolean())) {
			return isDevelopment
		} else {
			return new Promise<boolean>((resolve, reject) => {
				chrome.management.getSelf(async (info) => {
					const isDevelopment = info?.installType === 'development'
					await saveIsDevelopment(isDevelopment)
					resolve(isDevelopment)
				})
			})
		}
	}

	const getCachedItemWithId = async (id: string): Promise<Item | undefined> => {
		const result = await asyncGet('cachedItems')
		const cachedItems = result.cachedItems
		if (is(cachedItems, array(Item))) {
			return cachedItems.find((item) => item.id == id)
		}
	}

	const getSavedItemWithId = async (id: string): Promise<Item | undefined> => {
		const result = await asyncGet('items')
		const items = result.items
		if (is(items, array(Item))) {
			return items.find((item) => item.id == id)
		}
	}

	const getItemWithId = async (id: string): Promise<Item | undefined> => {
		try {
			const item = await getSavedItemWithId(id)
			return item ?? (await getCachedItemWithId(id))
		} catch (err) {
			return getCachedItemWithId(id)
		}
	}

	const getItems = async (): Promise<Array<Item>> => {
		const result = await asyncGet('items')
		const items = result.items
		if (is(items, array(Item))) {
			return items
		} else {
			return []
		}
	}

	const getAlerts = async (): Promise<Array<PriceAlert>> => {
		const result = await asyncGet('alerts')
		const alerts = result.alerts
		if (is(alerts, array(PriceAlert))) {
			return alerts
		} else {
			return []
		}
	}

	const getSettings = async (): Promise<Settings> => {
		const result = await asyncGet('settings')
		const settings = result.settings
		if (is(settings, Settings)) {
			return settings
		} else {
			await saveSettings(defaultSettings)
			return defaultSettings
		}
	}

	const listenToSettingsChanges = async (callback: (settings: Settings) => void) => {
		chrome.storage.onChanged.addListener(function (changes, namespace) {
			const settings = changes.settings?.newValue
			if (settings) {
				assert(settings, Settings)
				callback(settings)
			}
		})
		return getSettings()
			.then((result) => {
				callback(result)
			})
			.catch((err) => {})
	}

	const getAlertsWithItems = (): Promise<Array<AlertWithItem>> => {
		const alertsPromise = getAlerts()
		const itemsPromise = getItems()

		return Promise.all([alertsPromise, itemsPromise]).then((values) => {
			if (values && values.length === 2) {
				const alerts = values[0]
				const items = values[1]
				const alertsWithItems: AlertWithItem[] = []
				alerts.forEach((alert) => {
					const item = items.find((item) => item.id === alert.itemId)
					if (item) {
						alertsWithItems.push([alert, item])
					}
				})
				return alertsWithItems
			} else {
				return []
			}
		})
	}

	const saveItem = async (item: Item) => {
		const items = await getItems()
		const newItems = items.filter((i) => item.id !== i.id)
		item.updated = new Date().getTime()
		newItems.push(item)
		await saveItems(newItems)
	}

	const setCache = async (items: Item[]) => {
		const result = await asyncSet('cachedItems', items)
		if (result) {
			await clearItemCache()
			await asyncSet('cachedItems', items)
		}
	}

	const cacheItem = async (item: Item) => {
		const result = await asyncGet('cachedItems')
		const cachedItems = result.cachedItems
		if (is(cachedItems, array(Item))) {
			const newItems = cachedItems.filter((i) => item.id !== i.id)
			item.updated = new Date().getTime()
			newItems.push(item)
			await setCache(newItems)
		} else {
			item.updated = new Date().getTime()
			await setCache([item])
		}
	}

	const saveItems = async (items: Item[]): Promise<void> => {
		asyncSet('items', items)
	}

	const updateItems = async (items: Item[]): Promise<void> => {
		if (!items.length) return
		const filteredItems = removeDuplicates(items)
		const i = await getItems()

		const newItems = i.filter((i) => !filteredItems.find((it) => it.id === i.id))
		filteredItems.forEach((item, index) => {
			item.updated = new Date().getTime()
			newItems.push(item)
		})
		if (newItems.length > 0) {
			await saveItems(newItems)
		} else {
			return
		}
	}

	const updateItem = async (item: Item, isLoggingEnabled: boolean): Promise<void> => {
		try {
			if (await getSavedItemWithId(item.id)) {
				log('saving item', isLoggingEnabled)
				log(item, isLoggingEnabled)
				saveItem(item)
			} else {
				log('caching item', isLoggingEnabled)
				log(item, isLoggingEnabled)
				cacheItem(item)
			}
		} catch (err) {
			log('caching item', isLoggingEnabled)
			log(item, isLoggingEnabled)
			cacheItem(item)
		}
	}

	const saveAlert = async (alert: PriceAlert, item: Item) => {
		const alerts = await getAlerts()
		await asyncSet('alerts', [...alerts, alert])
		await saveItem(item)
	}

	const saveSettings = async (settings: Settings) => {
		asyncSet('settings', settings)
	}

	const saveIsDevelopment = async (isDevelopment: boolean) => {
		asyncSet('isDevelopment', isDevelopment)
	}

	const deleteItemWithId = async (itemId: string) => {
		const items = await getItems()
		const newItems = items.filter((i) => itemId !== i.id)
		if (newItems.length !== items.length) {
			saveItems(newItems)
		}
	}

	const clearItemCache = async () => {
		await asyncSet('cachedItems', [])
	}

	const deleteAlert = async (alert: PriceAlert) => {
		const alerts = await getAlerts()
		const newAlerts = alerts.filter((a) => alert.id !== a.id)
		if (newAlerts.length !== alerts.length) {
			await asyncSet('alerts', newAlerts)

			if (!newAlerts.find((a) => a.itemId === alert.itemId)) {
				await deleteItemWithId(alert.itemId)
			}
		}
	}

	const updateLastNotificationDateForAlert = async (alert: PriceAlert) => {
		const alerts = await getAlerts()
		const savedAlert = alerts.find((a) => alert.id === a.id)
		if (savedAlert) {
			savedAlert.lastNotificationSent = new Date().getTime()
			await asyncSet('alerts', alerts)
		}
	}

	return {
		getAlertsWithItems: getAlertsWithItems,
		getItems: getItems,
		getItemWithId: getItemWithId,
		getAlerts: getAlerts,
		getSettings: getSettings,
		getIsDevelopment: getIsDevelopment,
		listenToSettingsChanges: listenToSettingsChanges,
		updateItem: updateItem,
		saveItems: saveItems,
		updateItems: updateItems,
		saveAlert: saveAlert,
		saveSettings: saveSettings,
		deleteAlert: deleteAlert,
		clearItemCache: clearItemCache,
		updateLastNotificationDateForAlert: updateLastNotificationDateForAlert,
	}
}

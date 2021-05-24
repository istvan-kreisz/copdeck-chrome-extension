import { array, assert, is, number } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'
import { removeDuplicates } from 'copdeck-scraper'
import { Settings } from '../utils/types'

type AlertWithItem = [PriceAlert, Item]

export const databaseCoordinator = () => {
	const defaultSettings: Settings = {
		currency: 'EUR',
		updateInterval: 30,
		notificationFrequency: 24,
		proxies: undefined,
	}

	const asyncSet = async (key: string, value: object): Promise<void> => {
		return new Promise((resolve, reject) => {
			chrome.storage.local.set({ [key]: value }, () => {
				resolve()
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

	const getCachedItemWithId = async (id: string): Promise<Item | undefined> => {
		const result = await asyncGet('cachedItems')
		const cachedItems = result.cachedItems
		if (is(cachedItems, array(Item))) {
			return cachedItems.find((item) => item.id == id)
		}
	}

	const getItemWithId = async (id: string): Promise<Item | undefined> => {
		const result = await asyncGet('items')
		const items = result.items
		if (is(items, array(Item))) {
			const item = items.find((item) => item.id == id)
			if (item) {
				return item
			} else {
				return getCachedItemWithId(id)
			}
		} else {
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

	const cacheItem = async (item: Item) => {
		const result = await asyncGet('cachedItems')
		const cachedItems = result.cachedItems
		if (is(cachedItems, array(Item))) {
			const newItems = cachedItems.filter((i) => item.id !== i.id)
			item.updated = new Date().getTime()
			newItems.push(item)
			await asyncSet('cachedItems', newItems)
		} else {
			item.updated = new Date().getTime()
			await asyncSet('cachedItems', [item])
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

	const saveAlert = async (alert: PriceAlert, item: Item) => {
		const alerts = await getAlerts()
		await asyncSet('alerts', [...alerts, alert])
		await saveItem(item)
	}

	const saveSettings = async (settings: Settings) => {
		asyncSet('settings', settings)
	}

	const deleteItem = async (item: Item) => {
		const items = await getItems()
		const newItems = items.filter((i) => item.id !== i.id)
		if (newItems.length !== items.length) {
			saveItems(newItems)
		}
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
		listenToSettingsChanges: listenToSettingsChanges,
		saveItem: saveItem,
		cacheItem: cacheItem,
		saveItems: saveItems,
		updateItems: updateItems,
		saveAlert: saveAlert,
		saveSettings: saveSettings,
		deleteAlert: deleteAlert,
		clearItemCache: clearItemCache,
		updateLastNotificationDateForAlert: updateLastNotificationDateForAlert,
	}
}

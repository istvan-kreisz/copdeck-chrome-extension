import { array, assert, is, number } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'
import { removeDuplicates } from 'copdeck-scraper'
import { Settings } from '../utils/types'

type AlertWithItem = [PriceAlert, Item]

export const databaseCoordinator = () => {
	const defaultSettings: Settings = {
		currency: 'EUR',
		updateInterval: 10,
		proxies: undefined,
	}

	const asyncSet = async (key: string, value: object): Promise<void> => {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.set({ [key]: value }, () => {
				resolve()
			})
		})
	}

	const asyncGet = async (key: string): Promise<any> => {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get([key], (result) => {
				resolve(result)
			})
		})
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
			return defaultSettings
		}
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
		getAlerts: getAlerts,
		getSettings: getSettings,
		saveItem: saveItem,
		saveItems: saveItems,
		updateItems: updateItems,
		saveAlert: saveAlert,
		saveSettings: saveSettings,
		deleteAlert: deleteAlert,
		updateLastNotificationDateForAlert: updateLastNotificationDateForAlert,
	}
}

import { array, assert, is, number } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'
import { Settings } from '../utils/types'

type AlertWithItem = [PriceAlert, Item]

export const databaseCoordinator = () => {
	const defaultSettings: Settings = {
		currency: 'EUR',
		updateInterval: 10,
		proxies: undefined,
	}

	const getItems = (callback: (alerts: Array<Item>) => void) => {
		chrome.storage.sync.get(['items'], (result) => {
			const items = result.items
			if (is(items, array(Item))) {
				callback(items)
			} else {
				callback([])
			}
		})
	}

	const getAlerts = (callback: (alerts: Array<PriceAlert>) => void) => {
		chrome.storage.sync.get(['alerts'], (result) => {
			const alerts = result.alerts
			if (is(alerts, array(PriceAlert))) {
				callback(alerts)
			} else {
				callback([])
			}
		})
	}

	const getSettings = (callback: (settings: Settings) => void) => {
		chrome.storage.sync.get(['settings'], (result) => {
			const settings = result.settings
			if (is(settings, Settings)) {
				callback(settings)
			} else {
				callback(defaultSettings)
			}
		})
	}

	const getAlertsWithItems = (callback: (alertsWithItems: Array<AlertWithItem>) => void) => {
		const alertsPromise = new Promise<Array<PriceAlert>>((resolve) => {
			getAlerts((alerts) => {
				resolve(alerts)
			})
		})
		const itemsPromise = new Promise<Array<Item>>((resolve) => {
			getItems((items) => {
				resolve(items)
			})
		})
		Promise.all([alertsPromise, itemsPromise]).then((values) => {
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
				callback(alertsWithItems)
			} else {
				callback([])
			}
		})
	}

	const saveItem = (item: Item) => {
		getItems((items) => {
			const newItems = items.filter((i) => item.id !== i.id)
			item.updated = new Date().getTime()
			newItems.push(item)
			chrome.storage.sync.set({ items: newItems })
		})
	}

	const saveAlert = (alert: PriceAlert, item: Item) => {
		getAlerts((alerts) => {
			chrome.storage.sync.set({ alerts: [...alerts, alert] }, () => {
				if (!chrome.runtime.lastError) {
					saveItem(item)
				}
			})
		})
	}

	const saveSettings = (settings: Settings) => {
		chrome.storage.sync.set({ settings: settings })
	}

	const deleteItem = (item: Item) => {
		getItems((items) => {
			const newItems = items.filter((i) => item.id !== i.id)
			if (newItems.length !== items.length) {
				chrome.storage.sync.set({ items: newItems })
			}
		})
	}

	const deleteItemWithId = (itemId: string) => {
		getItems((items) => {
			const newItems = items.filter((i) => itemId !== i.id)
			if (newItems.length !== items.length) {
				chrome.storage.sync.set({ items: newItems })
			}
		})
	}

	const deleteAlert = (alert: PriceAlert) => {
		getAlerts((alerts) => {
			const newAlerts = alerts.filter((a) => alert.id !== a.id)
			if (newAlerts.length !== alerts.length) {
				chrome.storage.sync.set({ alerts: newAlerts }, () => {
					if (!chrome.runtime.lastError) {
						if (!newAlerts.find((a) => a.itemId === alert.itemId)) {
							deleteItemWithId(alert.itemId)
						}
					}
				})
			}
		})
	}

	const updateLastNotificationDateForAlert = (alert: PriceAlert) => {
		getAlerts((alerts) => {
			const savedAlert = alerts.find((a) => alert.id === a.id)
			if (savedAlert) {
				savedAlert.lastNotificationSent = new Date().getTime()
				chrome.storage.sync.set({ alerts: alerts })
			}
		})
	}

	return {
		getAlertsWithItems: getAlertsWithItems,
		getSettings: getSettings,
		saveItem: saveItem,
		saveAlert: saveAlert,
		saveSettings: saveSettings,
		deleteAlert: deleteAlert,
		updateLastNotificationDateForAlert: updateLastNotificationDateForAlert,
	}
}

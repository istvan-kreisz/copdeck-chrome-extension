import { array, is } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'

export const databaseCoordinator = () => {
	const getSavedAlerts = (callback: (alerts: Array<PriceAlert>) => void) => {
		chrome.storage.sync.get(['alerts'], (result) => {
			const alerts = result.alerts
			if (is(alerts, array(PriceAlert))) {
				callback(alerts)
			} else {
				callback([])
			}
		})
	}

	const getSavedItems = (callback: (alerts: Array<Item>) => void) => {
		chrome.storage.sync.get(['items'], (result) => {
			const items = result.items
			if (is(items, array(Item))) {
				callback(items)
			} else {
				callback([])
			}
		})
	}

	const saveItem = (item: Item) => {
		getSavedItems((items) => {
			if (!items.find((i) => item.id === i.id)) {
				chrome.storage.sync.set({ items: [...items, item] })
			}
		})
	}

	const saveAlert = (alert: PriceAlert) => {
		getSavedAlerts((alerts) => {
			chrome.storage.sync.set({ alerts: [...alerts, alert] })
		})
	}

	const deleteItem = (item: Item) => {
		getSavedItems((items) => {
			const newItems = items.filter((i) => item.id !== i.id)
			if (newItems.length !== items.length) {
				chrome.storage.sync.set({ items: newItems })
			}
		})
	}

	const deleteAlert = (alert: PriceAlert) => {
		getSavedAlerts((alerts) => {
			const newAlerts = alerts.filter((a) => alert.id !== a.id)
			if (newAlerts.length !== alerts.length) {
				chrome.storage.sync.set({ items: newAlerts })
			}
		})
	}
	return {
		getSavedAlerts: getSavedAlerts,
		getSavedItems: getSavedItems,
		saveItem: saveItem,
		saveAlert: saveAlert,
		deleteItem: deleteItem,
		deleteAlert: deleteAlert,
	}
}

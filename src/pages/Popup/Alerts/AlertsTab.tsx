import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { assert, array } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'
import { itemImageURL, itemBestPrice } from 'copdeck-scraper'
import ItemDetail from '../../Components/ItemDetail'
import AlertListItem from './AlertListItem'
import { databaseCoordinator } from '../../services/databaseCoordinator'
import { Currency } from '../../utils/types'

const AlertsTab = (prop: { activeTab: 'main' | 'settings' | 'alerts'; currency: Currency }) => {
	const [priceAlerts, setPriceAlerts] = useState<[PriceAlert, Item][]>([])
	const [selectedItem, setSelectedItem] = useState<Item | null>()

	const { getAlertsWithItems, deleteAlert } = databaseCoordinator()

	useEffect(() => {
		if (prop.activeTab === 'alerts') {
			;(async () => {
				const alertsWithItems = await getAlertsWithItems()
				setPriceAlerts(alertsWithItems)
			})()
		}
	}, [prop.activeTab])

	const clickedItem = (item: Item) => {
		if (item.id !== selectedItem?.id) {
			setSelectedItem(item)
		}
	}

	const deletedAlert = (alert: PriceAlert, event) => {
		event.stopPropagation()
		;(async () => {
			await deleteAlert(alert)
			const alertsWithItems = await getAlertsWithItems()
			setPriceAlerts(alertsWithItems)
		})()
	}

	return (
		<>
			<div className="p-3">
				<h1 className="font-bold mb-4">Price Alerts</h1>
				<ul className="searchResults">
					{priceAlerts.map(([alert, item], index) => {
						return (
							<AlertListItem
								name={item.name}
								imageURL={itemImageURL(item)}
								id={alert.id}
								onClicked={clickedItem.bind(null, item)}
								bestPrice={prop.currency.symbol + itemBestPrice(item, alert)}
								targetSize={alert.targetSize}
								targetPrice={prop.currency.symbol + alert.targetPrice}
								onDeleted={deletedAlert.bind(null, alert)}
							></AlertListItem>
						)
					})}
				</ul>
				{!priceAlerts.length ? (
					<>
						<p className="text-center">No alerts added yet.</p>
						<p className="text-center">Use the search tab to set price alerts.</p>
					</>
				) : null}
			</div>
			{selectedItem ? (
				<ItemDetail
					currency={prop.currency}
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
				></ItemDetail>
			) : null}
		</>
	)
}

export default AlertsTab

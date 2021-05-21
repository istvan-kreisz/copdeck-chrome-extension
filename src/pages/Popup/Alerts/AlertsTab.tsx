import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { assert, array } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'
import ItemDetail from '../ItemDetail'
import { databaseCoordinator } from '../../services/databaseCoordinator'

const AlertsTab = (prop: { activeTab: 'main' | 'settings' | 'alerts' }) => {
	const [priceAlerts, setPriceAlerts] = useState<[PriceAlert, Item][]>([])
	const { getAlertsWithItems, deleteAlert } = databaseCoordinator()

	useEffect(() => {
		if (prop.activeTab === 'alerts') {
			getAlertsWithItems((alertsWithItems) => {
				setPriceAlerts(alertsWithItems)
			})
		}
	}, [prop.activeTab])

	return (
		<div>
			<h1>alerts</h1>
			<ul className="searchResults">
				{priceAlerts.map(([alert, item], index) => {
					return (
						<li
							// onClick={clickedItem.bind(null, item)}
							className="searchResult"
							key={alert.id}
						>
							{alert.targetPrice + ' ' + item.name}
						</li>
					)
				})}
			</ul>
		</div>
	)
}

export default AlertsTab

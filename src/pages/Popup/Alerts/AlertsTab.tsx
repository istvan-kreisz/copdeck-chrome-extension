import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { assert, array } from 'superstruct'
import { Item, PriceAlert } from 'copdeck-scraper/dist/types'
import { itemImageURL, itemBestPrice } from 'copdeck-scraper'
import ItemDetail from '../ItemDetail'
import { databaseCoordinator } from '../../services/databaseCoordinator'

const AlertsTab = (prop: { activeTab: 'main' | 'settings' | 'alerts' }) => {
	const [priceAlerts, setPriceAlerts] = useState<[PriceAlert, Item][]>([])
	const [selectedItem, setSelectedItem] = useState<Item | null>()

	const { getAlertsWithItems, deleteAlert } = databaseCoordinator()

	useEffect(() => {
		if (prop.activeTab === 'alerts') {
			getAlertsWithItems((alertsWithItems) => {
				setPriceAlerts(alertsWithItems)
			})
		}
	}, [prop.activeTab])

	const clickedItem = (item: Item) => {
		if (item.id !== selectedItem?.id) {
			setSelectedItem(item)
		}
	}

	return (
		<div>
			<h1>alerts</h1>
			<ul className="searchResults">
				{priceAlerts.map(([alert, item], index) => {
					return (
						<li
							onClick={clickedItem.bind(null, item)}
							style={{
								listStyle: 'none',
								display: 'flex',
								flexDirection: 'row',
								justifyItems: 'center',
								alignItems: 'center',
								flexWrap: 'nowrap',
							}}
							className="searchResult"
							key={alert.id}
						>
							<img
								style={{ height: '40px', width: '40px' }}
								src={itemImageURL(item)}
								alt=""
							/>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
								}}
							>
								<p>{item.name}</p>
								<p>{alert.targetSize}</p>
								<p>{alert.targetPrice}</p>
							</div>
							<h2>{`${itemBestPrice(item, alert)}`}</h2>
						</li>
					)
				})}
			</ul>
			{selectedItem ? (
				<ItemDetail
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
				></ItemDetail>
			) : null}
		</div>
	)
}

export default AlertsTab

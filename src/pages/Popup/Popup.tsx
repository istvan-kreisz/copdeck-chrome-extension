import React from 'react'
// import logo from '../../assets/img/logo.svg'
import './Popup.css'
import { useRef, useEffect, useState } from 'react'
import { assert, string, number, array, is } from 'superstruct'
import { Item, Store, StorePrices, PriceAlert } from 'copdeck-scraper/dist/types'
import { v4 as uuidv4 } from 'uuid'

const Popup = () => {
	const [searchResults, setSearchResults] = useState<Item[]>([])
	const [selectedItem, setSelectedItem] = useState<Item | null>()
	const [showAddPriceAlertModal, setShowAddPriceAlertModal] = useState(false)
	const [selectedStores, setSelectedStores] = useState<StorePrices[]>([])
	const [selectedSize, setSelectedSize] = useState<string>()

	const searchBar = useRef<HTMLInputElement>(null)
	const storeSelector = useRef<HTMLDivElement>(null)
	const priceField = useRef<HTMLInputElement>(null)

	const selectableStores = (): StorePrices[] => {
		return selectedItem?.storePrices.filter((prices) => prices.inventory.length) ?? []
	}

	const selectableSizes = (): string[] => {
		const sizeSet = new Set<string>()
		selectedStores.forEach((store) => {
			return store.inventory.map((inventoryItem) => {
				sizeSet.add(inventoryItem.size)
			})
		})
		return Array.from(sizeSet)
	}

	const search = () => {
		if (searchBar.current?.value) {
			chrome.runtime.sendMessage({ search: searchBar.current?.value }, (response) => {
				assert(response, array(Item))
				setSearchResults(response)
			})
		}
	}

	useEffect(() => {
		if (selectedItem && selectedItem.storePrices.length == 0) {
			chrome.runtime.sendMessage({ getItemDetails: selectedItem }, (item) => {
				assert(item, Item)
				setSelectedItem(item)
				const firstStore = item.storePrices.find((prices) => prices.inventory.length)
				if (firstStore) {
					setSelectedStores([firstStore])
					setSelectedSize(firstStore?.inventory?.[0]?.size)
				}
			})
		}
	}, [selectedItem])

	const clickedItem = (item: Item) => {
		if (item.id !== selectedItem?.id) {
			setSelectedItem(item)
		}
	}

	const storeToggled = (event: { target: HTMLInputElement }) => {
		const isChecked = event.target.checked
		const storeName = event.target.value
		const store = selectableStores().find((s) => s.store === storeName)
		if (!store) return

		setSelectedStores((stores) => {
			if (isChecked) {
				if (!stores.find((s) => s.store === storeName)) {
					return [...stores, store]
				} else {
					return stores
				}
			} else {
				return stores.filter((s) => s.store !== storeName)
			}
		})
	}

	const sizeSelected = (event: { target: HTMLSelectElement }) => {
		setSelectedSize(event.target.value)
	}

	const storeName = (store: Store): string => {
		switch (store) {
			case 'klekt':
				return 'Klekt'
			case 'stockx':
				return 'StockX'
			case 'restocks':
				return 'Restocks'
			default:
				return ''
		}
	}

	const storeLabel = (store: StorePrices): string => {
		let label = storeName(store.store)
		if (selectedSize) {
			const hasSelectedSize = store.inventory.find(
				(inventoryItem) => inventoryItem.size === selectedSize
			)
			if (!hasSelectedSize) {
				label += ' (selected size not available)'
			}
		}
		return label
	}

	const addAlert = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const price = parseFloat(priceField.current?.value ?? '')
		// todo: better error handling
		if (!price || !selectedSize || selectedStores.length === 0 || !selectedItem) return
		const newAlert: PriceAlert = {
			name: `${price} - ${selectedSize} (${selectedStores
				.map((store) => storeName(store.store))
				.join()})`,
			id: uuidv4(),
			itemId: selectedItem?.id ?? '',
			targetPrice: price,
			targetSize: selectedSize,
			stores: selectedStores.map((store) => store.store),
		}
		saveAlert(newAlert)
		saveItem(selectedItem)
	}

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

	return (
		<>
			<div className="App">
				<header className="App-header"></header>
				<main>
					<input ref={searchBar} type="text" />
					<button onClick={search}>Search yeezys</button>
					<ul className="searchResults">
						{searchResults.map((item, index) => {
							return (
								<li
									onClick={clickedItem.bind(null, item)}
									className="searchResult"
									key={item.id}
								>
									{item.name}
								</li>
							)
						})}
					</ul>
				</main>
			</div>
			{selectedItem ? (
				<>
					<div
						style={{
							position: 'fixed',
							left: 0,
							right: 0,
							bottom: 0,
							top: 0,
							display: 'flex',
							flexDirection: 'column',
							backgroundColor: 'blue',
							justifyItems: 'center',
							padding: '1rem',
							overflow: 'scroll',
						}}
					>
						<button onClick={setSelectedItem.bind(null, null)}> Back</button>
						<img src={selectedItem.storeInfo?.[0].imageURL ?? ''} alt="" />
						<h1>{selectedItem.name}</h1>
						<h2>{selectedItem.id}</h2>
						<p>{selectedItem.retailPrice}</p>
						<ul>
							{selectedItem.storePrices.map((storePrice) => {
								return (
									<li key={storePrice.store}>
										<h3>{storePrice.store}</h3>
										<ul>
											{storePrice.inventory
												.sort((a, b) => {
													const regex = /[\d|,|.|e|E|\+]+/g
													const aNum = parseFloat(
														a.size.match(regex)?.[0] ?? ''
													)
													const bNum = parseFloat(
														b.size.match(regex)?.[0] ?? ''
													)
													if (aNum < bNum) return -1
													if (aNum > bNum) return 1
													return 0
												})
												.map((inventoryItem) => {
													return (
														<li
															key={inventoryItem.size}
														>{`${inventoryItem.size} ${inventoryItem.lowestAsk}`}</li>
													)
												})}
										</ul>
									</li>
								)
							})}
						</ul>
						{selectedItem.storePrices.length ? (
							<button onClick={setShowAddPriceAlertModal.bind(null, true)}>
								Add Price Alert
							</button>
						) : null}
					</div>
					{showAddPriceAlertModal ? (
						<div
							style={{
								position: 'fixed',
								left: 0,
								right: 0,
								bottom: 0,
								top: 0,
								display: 'flex',
								flexDirection: 'column',
								backgroundColor: 'green',
								justifyItems: 'center',
								padding: '1rem',
								overflow: 'scroll',
							}}
						>
							<button onClick={setShowAddPriceAlertModal.bind(null, false)}>
								{' '}
								Back
							</button>
							<h3>Add price alert</h3>
							<form
								onSubmit={addAlert}
								style={{ display: 'flex', flexDirection: 'column' }}
							>
								<label>Select Store:</label>
								<div
									style={{ display: 'flex', flexDirection: 'column' }}
									ref={storeSelector}
								>
									{selectableStores().map((store) => {
										return (
											<div style={{ display: 'flex', flexDirection: 'row' }}>
												<label htmlFor={store.store}>
													{storeLabel(store)}
												</label>
												<input
													type="checkbox"
													id={store.store}
													name={store.store}
													value={store.store}
													onChange={storeToggled}
												/>
											</div>
										)
									})}
								</div>
								<select onChange={sizeSelected} name="size" id="size">
									{selectableSizes().map((size) => {
										return <option value={size}>{size}</option>
									})}
								</select>
								<label htmlFor="pricefield">Target Price:</label>
								<input
									ref={priceField}
									type="number"
									name="pricefield"
									id="pricefield"
									step={1}
									min={0}
								/>
								<input type="submit" value="Add price alert" />
							</form>
						</div>
					) : null}
				</>
			) : null}
		</>
	)
}

export default Popup

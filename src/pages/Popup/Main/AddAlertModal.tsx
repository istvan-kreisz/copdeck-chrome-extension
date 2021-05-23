import React from 'react'
import { useRef, useState } from 'react'
import { Item, Store, StorePrices, PriceAlert } from 'copdeck-scraper/dist/types'
import { v4 as uuidv4 } from 'uuid'
import { databaseCoordinator } from '../../services/databaseCoordinator'
import { itemImageURL, bestStoreInfo } from 'copdeck-scraper'
import { ChevronLeftIcon } from '@heroicons/react/outline'
import Popup from '../../Components/Popup'

const AddAlertModal = (prop: {
	selectedItem: Item
	showAddPriceAlertModal: boolean
	setShowAddPriceAlertModal: (show: boolean) => void
}) => {
	const [selectedStores, setSelectedStores] = useState<StorePrices[]>([])
	const [selectedSize, setSelectedSize] = useState<string>()

	const [showConfirmationModal, setShowConfirmationModal] = useState(false)

	const storeSelector = useRef<HTMLDivElement>(null)
	const priceField = useRef<HTMLInputElement>(null)

	const { saveAlert } = databaseCoordinator()

	const selectableStores = (): StorePrices[] => {
		return prop.selectedItem?.storePrices.filter((prices) => prices.inventory.length) ?? []
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
		console.log('sdsd')
		event.preventDefault()
		const price = parseFloat(priceField.current?.value ?? '')
		// todo: better error handling
		console.log(price)
		console.log(selectedSize)
		console.log(selectedStores)
		if (!price || !selectedSize || !selectedStores.length || !prop.selectedItem) return
		const newAlert: PriceAlert = {
			name: `${price} - ${selectedSize} (${selectedStores
				.map((store) => storeName(store.store))
				.join()})`,
			id: uuidv4(),
			itemId: prop.selectedItem?.id ?? '',
			targetPrice: price,
			targetSize: selectedSize,
			stores: selectedStores.map((store) => store.store),
		}
		console.log('yo')
		saveAlert(newAlert, prop.selectedItem)
			.then((result) => {
				console.log(result)
			})
			.catch((err) => {
				console.log(err)
			})
	}

	return (
		<>
			<div className="fixed inset-0 flex flex-col overflow-y-scroll">
				<button onClick={prop.setShowAddPriceAlertModal.bind(null, false)}> Back</button>
				<h3>Add price alert</h3>
				<form onSubmit={addAlert} style={{ display: 'flex', flexDirection: 'column' }}>
					<label>Select Store:</label>
					<div style={{ display: 'flex', flexDirection: 'column' }} ref={storeSelector}>
						{selectableStores().map((store) => {
							return (
								<div style={{ display: 'flex', flexDirection: 'row' }}>
									<label htmlFor={store.store}>{storeLabel(store)}</label>
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
			{/* <Popup
				title="Price alert added!"
				message="bblah bblah bblah bblah bblah bblah bblah bblah"
				open={true}
				close={setShowConfirmationModal}
			></Popup> */}
		</>
	)
}

export default AddAlertModal

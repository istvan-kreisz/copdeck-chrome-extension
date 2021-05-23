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

	const supportedStores: Store[] = []

	const [showConfirmationModal, setShowConfirmationModal] = useState(false)

	const storeSelector = useRef<HTMLDivElement>(null)
	const priceField = useRef<HTMLInputElement>(null)

	const { saveAlert } = databaseCoordinator()

	const selectableStores = (): StorePrices[] => {
		return prop.selectedItem?.storePrices.filter((prices) => prices.inventory.length) ?? []
	}

	const sizeSet = new Set<string>()
	selectedStores.forEach((store) => {
		return store.inventory.map((inventoryItem) => {
			sizeSet.add(inventoryItem.size)
		})
	})
	const selectableSizes = Array.from(sizeSet)

	if (!selectedSize && selectableSizes && selectableSizes.length) {
		console.log('waaaa')
		setSelectedSize(selectableSizes[0])
	}

	const storeToggled = (event: { target: HTMLInputElement }) => {
		const isChecked = event.target.checked
		const storeName = event.target.value
		const store = selectableStores().find((s) => s.store.id === storeName)
		if (!store) return

		setSelectedStores((stores) => {
			if (isChecked) {
				if (!stores.find((s) => s.store.id === storeName)) {
					return [...stores, store]
				} else {
					return stores
				}
			} else {
				return stores.filter((s) => s.store.id !== storeName)
			}
		})
	}

	const sizeSelected = (event: { target: HTMLSelectElement }) => {
		setSelectedSize(event.target.value)
	}

	const storeName = (store: Store): string => {
		switch (store.id) {
			case 'klekt':
				return 'Klekt'
			case 'stockx':
				return 'StockX'
			// case 'restocks':
			// 	return 'Restocks'
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
			<div className="fixed inset-0 flex flex-col overflow-y-scroll bg-gray-100">
				<div className="p-3">
					<h1 className="font-bold mb-4">Add Price Alert</h1>

					<form onSubmit={addAlert} className="flex flex-col">
						<h3 className="text-base">Select store(s)</h3>
						<div className="flex flex-row space-x-2 items-center" ref={storeSelector}>
							{selectableStores().map((store) => {
								return (
									<div className="flex flex-row items-center space-x-1">
										<label
											htmlFor={store.store.id}
											className="text-lg text-gray-800 font-bold"
										>
											{store.store.name}
										</label>
										<input
											name={store.store.id}
											value={store.store.id}
											type="checkbox"
											className="h-5 w-5 text-theme-blue rounded"
											onChange={storeToggled}
										></input>
									</div>
								)
							})}
						</div>
						<select onChange={sizeSelected} name="size" id="size">
							{selectableSizes.map((size) => {
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
					<button
						className="button-default text-white bg-theme-orange hover:bg-theme-orange-dark rounded-lg bg h-10 shadow-md border-transparent"
						onClick={prop.setShowAddPriceAlertModal.bind(null, false)}
					>
						Cancel
					</button>
				</div>
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

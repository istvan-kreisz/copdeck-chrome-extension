import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { assert, array, is, union, literal } from 'superstruct'
import { Item } from 'copdeck-scraper/dist/types'
import { databaseCoordinator } from '../../services/databaseCoordinator'
import { Settings } from '../../utils/types'

const SettingsTab = () => {
	const currencies = ['EUR', 'US']

	const proxyTextField = useRef<HTMLTextAreaElement>(null)
	const currencySelector = useRef<HTMLDivElement>(null)
	const intervalSlider = useRef<HTMLInputElement>(null)

	useEffect(() => {
		chrome.storage.onChanged.addListener(function (changes, namespace) {
			const settings = changes.settings?.newValue
			if (settings) {
				console.log(settings)
				assert(settings, Settings)

				const radioButtons = currencySelector.current?.childNodes
				if (radioButtons) {
					radioButtons.forEach((b, index) => {
						const button = b as HTMLInputElement
						if (button) {
							button.checked = button.value === settings.currency
						}
					})
				}

				const proxyField = proxyTextField.current
				if (proxyField) {
					proxyField.value = settings.proxies ?? ''
				}

				const slider = intervalSlider.current
				if (slider) {
					slider.value = `${settings.updateInterval}`
				}
			}
		})
	}, [])

	const saveSettings = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const proxies = proxyTextField.current?.value
		let selectedCurrency: string = 'EUR'

		const radioButtons = currencySelector.current?.childNodes
		if (radioButtons) {
			radioButtons.forEach((b) => {
				const button = b as HTMLInputElement
				if (button?.checked) {
					selectedCurrency = button.value
				}
			})
		}

		const updatePeriod = parseFloat(intervalSlider.current?.value ?? '')

		chrome.runtime.sendMessage({
			settings: {
				proxies: proxies,
				currency: selectedCurrency,
				updateInterval: updatePeriod,
			},
		})
	}

	return (
		<div className="bg-transparent">
			<h1 className="text-xl text-red-400">yo im settings</h1>
			<form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column' }}>
				<div style={{ display: 'flex', flexDirection: 'column' }} ref={currencySelector}>
					<>
						<h3>Currency:</h3>
						{currencies.map((currency) => {
							return (
								<>
									<label htmlFor={currency}>{currency}</label>

									<input
										type="radio"
										id={currency}
										name="currency"
										value={currency}
									/>
								</>
							)
						})}
					</>
				</div>

				<label htmlFor="proxies">Proxies:</label>
				<textarea
					ref={proxyTextField}
					style={{ resize: 'none' }}
					id="proxies"
					placeholder="Add a list of proxies here, separated by commas"
					name="proxies"
					rows={5}
					className="w-full h-32 bg-white rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
				></textarea>

				<div className="slidecontainer">
					<label htmlFor="pricefield">Target Price:</label>

					<input
						ref={intervalSlider}
						type="range"
						min="1"
						max="100"
						defaultValue="50"
						className="slider"
						id="myRange"
					/>
					<input type="submit" value="Save Settings" />
				</div>
			</form>
		</div>
	)
}

export default SettingsTab

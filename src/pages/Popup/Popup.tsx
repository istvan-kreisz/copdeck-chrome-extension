import React from 'react'
import MainTab from './Main/MainTab'
import SettingsTab from './Settings/SettingsTab'
import AlertsTab from './Alerts/AlertsTab'
import { useState } from 'react'
import { SearchIcon, CogIcon, BellIcon, DeviceMobileIcon } from '@heroicons/react/outline'

const Popup = () => {
	const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'alerts'>('main')

	const selectedTab = (tab: 'main' | 'settings' | 'alerts') => {
		setActiveTab(tab)
	}

	const clickedLink = () => {
		chrome.tabs.create({ url: 'https://copdeck.com' })
	}

	return (
		<div className="gap-0 grid grid-row-3 absolute top-0 left-0 right-0 bottom-0 text-left">
			<main className="bg-transparent h-96">
				<div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
					<SettingsTab></SettingsTab>
				</div>
				<div style={{ display: activeTab === 'main' ? 'block' : 'none' }}>
					<MainTab></MainTab>
				</div>
				<div style={{ display: activeTab === 'alerts' ? 'block' : 'none' }}>
					<AlertsTab activeTab={activeTab}></AlertsTab>
				</div>
			</main>
			<section className="bg-theme-orange w-full flex h-12">
				<button
					className="outline-none focus:outline-none flex-1"
					onClick={selectedTab.bind(null, 'settings')}
				>
					<CogIcon
						className="mx-auto text-center h-6 w-6 text-white"
						aria-hidden="true"
					></CogIcon>
					<p className="text-xs font-medium text-white">Settings</p>
				</button>
				<button
					className="outline-none focus:outline-none flex-1"
					onClick={selectedTab.bind(null, 'main')}
				>
					<SearchIcon
						className="mx-auto text-center h-6 w-6 text-white"
						aria-hidden="true"
					></SearchIcon>
					<p className="text-xs font-medium text-white">Search</p>
				</button>
				<button
					className="outline-none focus:outline-none flex-1"
					onClick={selectedTab.bind(null, 'alerts')}
				>
					<BellIcon
						className="mx-auto text-center h-6 w-6 text-white"
						aria-hidden="true"
					></BellIcon>
					<p className="text-xs font-medium text-white">Alerts</p>
				</button>
			</section>
			<footer className="h-8 w-full bg-theme-yellow flex-grow-0">
				<a
					onClick={clickedLink}
					className="w-full h-full flex space-x-1 flex-row align-middle items-center justify-center"
					href="https://copdeck.com"
				>
					<DeviceMobileIcon
						className="text-center h-6 text-gray-800"
						aria-hidden="true"
					></DeviceMobileIcon>

					<p className="text-gray-800 font-bold">Coming soon to iOS! Click for more!</p>
				</a>
			</footer>
		</div>
	)
}

export default Popup

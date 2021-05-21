import React from 'react'
import './Popup.css'
import MainTab from './Main/MainTab'
import SettingsTab from './Settings/SettingsTab'
import AlertsTab from './Alerts/AlertsTab'
import { useState } from 'react'

const Popup = () => {
	const [activeTab, setActiveTab] = useState<'main' | 'settings' | 'alerts'>('main')

	const selectedTab = (tab: 'main' | 'settings' | 'alerts') => {
		setActiveTab(tab)
	}

	return (
		<>
			<div
				style={{ position: 'relative', height: '400px', overflow: 'scroll' }}
				className="App"
			>
				<header className="App-header"></header>
				<main style={{ marginBottom: '2rem' }}>
					<h3 style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
						<SettingsTab></SettingsTab>
					</h3>
					<div style={{ display: activeTab === 'main' ? 'block' : 'none' }}>
						<MainTab></MainTab>
					</div>
					<div style={{ display: activeTab === 'alerts' ? 'block' : 'none' }}>
						<AlertsTab activeTab={activeTab}></AlertsTab>
					</div>
				</main>
				<footer
					style={{
						position: 'fixed',
						display: 'flex',
						justifyItems: 'stretch',
						justifyContent: 'space-between',
						height: '60px',
						bottom: 0,
						left: 0,
						right: 0,
					}}
				>
					<button onClick={selectedTab.bind(null, 'settings')}>Settings</button>
					<button onClick={selectedTab.bind(null, 'main')}>Search</button>
					<button onClick={selectedTab.bind(null, 'alerts')}>Alerts</button>
				</footer>
			</div>
		</>
	)
}

export default Popup

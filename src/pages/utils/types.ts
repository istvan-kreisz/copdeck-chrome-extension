import { union, literal, string, number, object, optional, Infer } from 'superstruct'

type Currency = { code: 'EUR'; symbol: '€' } | { code: 'USD'; symbol: '$' }

const SettingsSchema = {
	proxies: optional(string()),
	currency: union([literal('EUR'), literal('USD')]),
	updateInterval: number(),
	notificationFrequency: number(),
}

const Settings = object(SettingsSchema)

type Settings = Infer<typeof Settings>

export { Settings, Currency }

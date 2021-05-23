import { union, literal, string, number, object, optional, Infer } from 'superstruct'

type Currency = { code: 'EUR'; symbol: '€' } | { code: 'US'; symbol: '$' }

const SettingsSchema = {
	proxies: optional(string()),
	currency: union([literal('EUR'), literal('US')]),
	updateInterval: number(),
	notificationFrequency: number(),
}

const Settings = object(SettingsSchema)

type Settings = Infer<typeof Settings>

export { Settings, Currency }

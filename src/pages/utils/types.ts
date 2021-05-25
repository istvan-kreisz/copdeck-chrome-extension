import { string, number, object, optional, Infer } from 'superstruct'
import { Currency } from 'copdeck-scraper/dist/types'

const SettingsSchema = {
	proxies: optional(string()),
	currency: Currency,
	updateInterval: number(),
	notificationFrequency: number(),
}

const Settings = object(SettingsSchema)

type Settings = Infer<typeof Settings>

export { Settings }

import { union, literal, string, number, object, optional, Infer } from 'superstruct'

const SettingsSchema = {
	proxies: optional(string()),
	currency: union([literal('EUR'), literal('US')]),
	updateInterval: number(),
}

const Settings = object(SettingsSchema)

type Settings = Infer<typeof Settings>

export { Settings }

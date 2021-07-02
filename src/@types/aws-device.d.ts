import {
	DeviceConfig,
	Gps,
	Battery,
	SkyKeyInformation,
	DeviceInformation,
	RoamingInformation,
	Environment,
	ReportedState,
	MakeReceivedProperty,
} from './device-state'

export type AWSDeviceInformation = DeviceInformation & {
	v: {
		appV: string
	}
}

export type ReportedThingState = {
	cfg?: Partial<DeviceConfig>
	gps?: Gps
	bat?: Battery
	skyKey?: Partial<SkyKeyInformation>
	dev?: AWSDeviceInformation
	roam?: RoamingInformation
	env?: Environment
}

export type ThingStateMetadataProperty = {
	timestamp?: number
	[key: string]: any
}

export type AWSReportedState = ReportedState & {
	dev?: MakeReceivedProperty<AWSDeviceInformation>
}

export type ThingState = {
	reported: ReportedThingState
	desired: {
		skyKey?: Partial<SkyKeyInformation>
	}
	metadata: ThingStateMetadataProperty
	version: number
}

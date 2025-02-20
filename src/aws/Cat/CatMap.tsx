import { Location, CellLocation, Roaming } from '../../Map/Map'
import React, { useState, useEffect } from 'react'
import { TimestreamQueryContextType } from '../App'
import { geolocateCell } from '../geolocateCell'
import { isRight } from 'fp-ts/lib/Either'
import { CatInfo } from './Cat'
import { ThingState } from '../../@types/aws-device'
import { HistoricalDataMap } from '../../Map/HistoricalDataMap'

export const CatMap = ({
	timestreamQueryContext,
	cat,
	state: { reported },
	geolocationApiEndpoint,
}: {
	timestreamQueryContext: TimestreamQueryContextType
	cat: CatInfo
	state: ThingState
	geolocationApiEndpoint: string
}) => {
	const [cellLocation, setCellLocation] = useState<CellLocation>()

	useEffect(() => {
		let isCancelled = false
		if (reported.roam) {
			const { v, ts } = reported.roam
			geolocateCell(geolocationApiEndpoint)(v)
				.then((geolocation) => {
					if (isCancelled) return
					if (isRight(geolocation)) {
						const l: CellLocation = {
							ts: new Date(ts),
							position: geolocation.right,
						}
						setCellLocation(l)
					}
				})
				.catch((err) => {
					console.error('[geolocateCell]', err)
				})
		}
		return () => {
			isCancelled = true
		}
	}, [reported, geolocationApiEndpoint])

	let deviceLocation: Location | undefined = undefined

	if (reported.gps !== undefined) {
		deviceLocation = {
			ts: new Date(reported.gps.ts),
			position: {
				lat: reported.gps.v.lat,
				lng: reported.gps.v.lng,
				accuracy: reported.gps.v.acc,
				altitude: reported.gps.v.alt,
				heading: reported.gps.v.hdg,
				speed: reported.gps.v.spd,
			},
		}
	}

	return (
		<HistoricalDataMap
			deviceLocation={deviceLocation}
			cellLocation={cellLocation}
			cat={cat}
			fetchHistory={async (numEntries) =>
				timestreamQueryContext
					.query<{
						objectValues: string[]
						objectKeys: string[]
						objectSource: string[]
						date: Date
					}>(
						(table) => `SELECT
							array_agg(measure_value::double) AS objectValues,
							array_agg(measure_name) AS objectKeys,
							array_agg(source) AS objectSource,
							time AS date
							FROM ${table}
							WHERE deviceId='${cat.id}' 
							AND measureGroup IN (
								SELECT
								measureGroup
								FROM ${table}
								WHERE deviceId='${cat.id}' 
								AND substr(measure_name, 1, 4) = 'gps.'
								GROUP BY measureGroup, time
								ORDER BY time DESC
								LIMIT ${numEntries}
							)
							AND substr(measure_name, 1, 4) = 'gps.'
							GROUP BY measureGroup, time
							ORDER BY time DESC`,
					)
					.then((data) =>
						data.map(({ objectValues, objectKeys, date, objectSource }) => {
							const pos = objectKeys.reduce(
								(obj, k, i) => ({
									...obj,
									[k.split('.')[1]]: {
										v: objectValues[i],
										source: objectSource[i],
									},
								}),
								{} as {
									lat: {
										v: number
										source?: 'batch'
									}
									lng: {
										v: number
										source?: 'batch'
									}
									acc: {
										v: number
										source?: 'batch'
									}
									alt: {
										v: number
										source?: 'batch'
									}
									hdg: {
										v: number
										source?: 'batch'
									}
									spd: {
										v: number
										source?: 'batch'
									}
								},
							)
							const l: Location = {
								position: {
									lat: pos.lat.v,
									lng: pos.lng.v,
									accuracy: pos.acc.v,
									heading: pos.hdg.v,
									altitude: pos.alt.v,
									speed: pos.spd.v,
								},
								batch: [
									pos.lat.source,
									pos.lng.source,
									pos.acc.source,
									pos.hdg.source,
									pos.alt.source,
									pos.spd.source,
								].includes('batch'),
								ts: date as unknown as Date,
							}
							return l
						}),
					)
					.then(async (locations) => {
						if (!locations.length)
							return locations.map((location) => ({ location }))
						return timestreamQueryContext
							.query<{
								objectValuesDouble: number[]
								objectValuesVarchar: string[]
								objectKeys: string[]
								date: Date
							}>(
								(table) => `
								SELECT
								array_agg(measure_value::double) AS objectValuesDouble,
								array_agg(measure_value::varchar) AS objectValuesVarchar,
								array_agg(measure_name) AS objectKeys,
								time as date
								FROM ${table}
								WHERE deviceId='${cat.id}'
								AND substr(measure_name, 1, 5) = 'roam.'
								AND time <= '${timestreamQueryContext.formatDate(locations[0].ts)}'
								GROUP BY measureGroup, time
								ORDER BY time DESC
								`,
							)
							.then((result) => {
								const roaming = result.map(
									({
										objectValuesDouble,
										objectValuesVarchar,
										objectKeys,
										date,
									}) => {
										const roaming = objectKeys.reduce(
											(obj, k, i) => ({
												...obj,
												[k.split('.')[1]]:
													objectValuesDouble[i] ?? objectValuesVarchar[i],
											}),
											{} as {
												mccmnc: number
												rsrp: number
												cell: number
												area: number
												ip: string
											},
										)
										const l: Roaming = {
											roaming,
											ts: date as unknown as Date,
										}
										return l
									},
								)
								// Add roaming data to history
								return locations.map((location) => ({
									location,
									roaming: roaming.find(
										({ ts }) => ts.getTime() <= location.ts.getTime(),
									), // Find the first roaming entry that is older than the location
								}))
							})
					})
			}
		/>
	)
}

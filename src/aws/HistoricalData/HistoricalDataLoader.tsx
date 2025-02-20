import React, { useEffect, useState } from 'react'
import { Loading } from '../../Loading/Loading'
import { DisplayError as ShowError } from '../../Error/Error'
import { TimestreamQueryContextType } from '../App'

export const HistoricalDataLoader = <T extends Record<string, any>>({
	timestreamQueryContext,
	deviceId,
	children,
	QueryString,
	loading,
}: {
	timestreamQueryContext: TimestreamQueryContextType
	deviceId: string
	QueryString: Parameters<TimestreamQueryContextType['query']>[0]
	loading?: React.ReactElement<any>
	children: (args: { data: T[] }) => React.ReactElement<any>
}) => {
	const [data, setData] = useState<T[]>()
	const [error, setError] = useState<Error>()

	useEffect(() => {
		let removed = false

		timestreamQueryContext
			.query<T>(QueryString)
			.then((data) => {
				if (removed) {
					console.debug(
						'[Historical Data]',
						'Received result, but was removed already.',
					)
					return
				}
				console.debug('[Historical Data]', data)
				setData(data as unknown as T[])
			})
			.catch(setError)

		return () => {
			removed = true
		}
	}, [timestreamQueryContext, deviceId, QueryString])

	return (
		<>
			{!data && (loading || <Loading text={`Fetching historical data...`} />)}
			{error && <ShowError error={error} />}
			{data && children({ data })}
		</>
	)
}

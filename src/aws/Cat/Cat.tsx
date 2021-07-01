import { default as introJs } from 'intro.js'
import { FOTA, OnCreateUpgradeJob } from '../FOTA/FOTA'
import { DeviceUpgradeFirmwareJob } from '../listUpgradeFirmwareJobs'
import { ICredentials } from '@aws-amplify/core'
import React, { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader } from 'reactstrap'
import { DisplayError } from '../../Error/Error'
import { Toggle } from '../../Toggle/Toggle'
import { ConnectionInformation } from '../../ConnectionInformation/ConnectionInformation'
import { emojify } from '../../Emojify/Emojify'
import { ReportedTime } from '../../ReportedTime/ReportedTime'
import { Collapsable } from '../../Collapsable/Collapsable'
import { DeviceInfo } from '../../DeviceInformation/DeviceInformation'
import { CatCard } from '../../Cat/CatCard'
import { CatHeader, CatPersonalization } from '../../Cat/CatPersonality'
import { ThingState } from '../../@types/aws-device'
import { DeviceConfig, SkyKeyInformation } from '../../@types/device-state'
import { Settings } from '../../Settings/Settings'
import { toReportedWithReceivedAt } from '../toReportedWithReceivedAt'
import { Option, isSome } from 'fp-ts/lib/Option'
import { CreatePasswordUpdateJob } from '../PasswordUpload/CreatePasswordUpdateJob'

const intro = introJs()

export type CatInfo = {
	id: string
	name: string
	avatar: string
	version: number
}

const isNameValid = (name: string) => /^[0-9a-z_.,@/:#-]{1,800}$/i.test(name)

export const Cat = ({
	cat,
	onCreateUpgradeJob,
	onAvatarChange,
	onNameChange,
	listUpgradeJobs,
	cancelUpgradeJob,
	deleteUpgradeJob,
	cloneUpgradeJob,
	credentials,
	children,
	getThingState,
	updateDeviceConfig,
	listenForStateChange,
	catMap,
	onPasswordUpdate,
}: {
	onAvatarChange: (avatar: Blob) => void
	onNameChange: (name: string) => void
	onCreateUpgradeJob: OnCreateUpgradeJob
	listUpgradeJobs: () => Promise<DeviceUpgradeFirmwareJob[]>
	cancelUpgradeJob: (args: { jobId: string; force: boolean }) => Promise<void>
	cloneUpgradeJob: (args: {
		jobId: string
	}) => Promise<DeviceUpgradeFirmwareJob>
	deleteUpgradeJob: (args: {
		jobId: string
		executionNumber: number
	}) => Promise<void>
	getThingState: () => Promise<Option<ThingState>>
	updateDeviceConfig: (skyKey: Partial<SkyKeyInformation>) => Promise<void>
	cat: CatInfo
	credentials: ICredentials
	children: React.ReactElement<any> | React.ReactElement<any>[]
	listenForStateChange: (listeners: {
		onNewState: (newState: ThingState) => void
	}) => Promise<() => void>
	catMap: (state: ThingState) => React.ReactElement<any>
	onPasswordUpdate: (database: File) => unknown
}) => {
	const [state, setState] = useState<ThingState>()
	const [error, setError] = useState<Error>()
	const reported = state?.reported

	useEffect(() => {
		let didCancel = false
		let stopListening: () => void

		const setStateIfNotCanceled = (state: ThingState) =>
			!didCancel && setState(state)
		const setErrorIfNotCanceled = (error: Error) =>
			!didCancel && setError(error)

		getThingState()
			.then((maybeState) => {
				if (isSome(maybeState)) {
					setStateIfNotCanceled(maybeState.value)
				}
			})
			.catch(setErrorIfNotCanceled)

		listenForStateChange({
			onNewState: (newState) => {
				setState((state) => ({ ...state, ...newState }))
			},
		})
			.then((s) => {
				if (didCancel) {
					s()
				}
				stopListening = s
			})
			.catch(setErrorIfNotCanceled)

		return () => {
			if (stopListening !== undefined) {
				console.log('Stopping listening...')
				stopListening()
			}
			didCancel = true
		}
	}, [credentials, getThingState, listenForStateChange])

	useEffect(() => {
		if (!error) {
			setTimeout(() => {
				window.requestAnimationFrame(() => {
					if (window.localStorage.getItem('asset-tracker:cat:intro') === null) {
						intro.start()
						intro.onexit(() => {
							window.localStorage.setItem('asset-tracker:cat:intro', 'done')
						})
						console.log('Starting Intro.js')
					}
				})
			}, 1000)
		}
	}, [error])

	if (error)
		return (
			<Card>
				<CardBody>
					{error !== undefined && <DisplayError error={error} />}
				</CardBody>
			</Card>
		)

	const reportedWithReceived =
		state?.reported &&
		toReportedWithReceivedAt({
			reported: state.reported,
			metadata: state.metadata,
		})

	// Calculate the interval in which the device is expected to publish data
	const expectedSendIntervalInSeconds =
		(state?.reported.cfg?.act ?? true // default device mode is active
			? state?.reported.cfg?.actwt ?? 120 // default active wait time is 120 seconds
			: state?.reported.cfg?.mvt ?? 3600) + // default movement timeout is 3600
		(state?.reported.cfg?.gpst ?? 60) + // default GPS timeout is 60 seconds
		60 // add 1 minute for sending and processing

	return (
		<CatCard>
			{state && catMap(state)}
			<CardHeader>
				<CatHeader
					cat={cat}
					isNameValid={isNameValid}
					onAvatarChange={onAvatarChange}
					onNameChange={onNameChange}
				/>
				{reported && (
					<>
						{reportedWithReceived?.roam !== undefined && (
							<Toggle>
								<ConnectionInformation
									mccmnc={reportedWithReceived.roam.v.value.mccmnc}
									rsrp={reportedWithReceived.roam.v.value.rsrp}
									receivedAt={reportedWithReceived.roam.v.receivedAt}
									reportedAt={new Date(reportedWithReceived.roam.ts.value)}
									networkMode={reportedWithReceived.dev?.v.value.nw}
									iccid={reportedWithReceived.dev?.v.value.iccid}
									dataStaleAfterSeconds={expectedSendIntervalInSeconds}
								/>
							</Toggle>
						)}
						{reportedWithReceived?.bat && (
							<Toggle>
								<div className={'info'}>
									{emojify(`🔋 ${reportedWithReceived.bat.v.value / 1000}V`)}
									<span />
									<ReportedTime
										receivedAt={reportedWithReceived.bat.v.receivedAt}
										reportedAt={new Date(reportedWithReceived.bat.ts.value)}
										staleAfterSeconds={expectedSendIntervalInSeconds}
									/>
								</div>
							</Toggle>
						)}
						{reportedWithReceived?.skyKey && (
							<Toggle>
								<div className={'info'}>
									{emojify(`🚨  ${reportedWithReceived.skyKey.unlockTime}`)}
									<span />{' '}
									{/* 
									<ReportedTime
										receivedAt={reportedWithReceived.skyKey.unlockTime.receivedAt}
										reportedAt={new Date(reportedWithReceived.skyKey.unlockTime.value)}
										staleAfterSeconds={expectedSendIntervalInSeconds}
									/>*/}
								</div>
							</Toggle>
						)}
					</>
				)}
			</CardHeader>
			<CardBody>
				{state && (
					<>
						<hr />
						<Collapsable
							id={'cat:settings'}
							title={<h3>{emojify('⚙️ Settings')}</h3>}
						>
							<Settings
								reported={reportedWithReceived?.skyKey}
								desired={state.desired?.skyKey}
								key={JSON.stringify(state?.desired?.skyKey ?? {})}
								onSave={(config) => {
									updateDeviceConfig(config)
										.catch(setError)
										.then(() => {
											setState((state) => {
												if (state) {
													return {
														...state,
														desired: {
															...state.desired,
															skyKey: config,
														},
													}
												}
											})
										})
										.catch(setError)
								}}
							/>
						</Collapsable>
					</>
				)}
				{reportedWithReceived?.dev && (
					<>
						<hr />
						<Collapsable
							id={'cat:information'}
							title={<h3>{emojify('ℹ️ Device Information')}</h3>}
						>
							<DeviceInfo
								key={`${cat.version}`}
								device={reportedWithReceived.dev}
								roaming={reportedWithReceived.roam}
								skyKey={reportedWithReceived.skyKey}
								appV={reportedWithReceived.dev?.v?.value?.appV}
								dataStaleAfterSeconds={expectedSendIntervalInSeconds}
							/>
						</Collapsable>
					</>
				)}
				{reported?.dev && (
					<>
						<hr />
						<Collapsable
							id={'cat:fota'}
							title={<h3>{emojify('🌩️ Device Firmware Upgrade (FOTA)')}</h3>}
						>
							<FOTA
								key={`${cat.version}`}
								device={reported.dev}
								onCreateUpgradeJob={onCreateUpgradeJob}
								listUpgradeJobs={listUpgradeJobs}
								cancelUpgradeJob={cancelUpgradeJob}
								deleteUpgradeJob={deleteUpgradeJob}
								cloneUpgradeJob={cloneUpgradeJob}
							/>
						</Collapsable>
					</>
				)}
				{reported?.dev && (
					<>
						<hr />
						<Collapsable
							id={'cat:pw_update'}
							title={<h3>{emojify('🗝️ Upload Passwordfile')}</h3>}
						>
							<CreatePasswordUpdateJob
								onFile={onPasswordUpdate}
								onError={setError}
							/>
						</Collapsable>
					</>
				)}
				{children}
			</CardBody>
		</CatCard>
	)
}

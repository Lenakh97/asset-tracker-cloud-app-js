import React, { useState } from 'react'
import { Button, ButtonGroup, Form, FormGroup, Alert } from 'reactstrap'
import equal from 'fast-deep-equal'
import { OutDatedWarning } from './OutDatedWarning'
import { NumberConfigSetting } from './NumberConfigSetting'
import { formatDistanceToNow } from 'date-fns'
import { emojify } from '../Emojify/Emojify'
import styled from 'styled-components'
import { mobileBreakpoint } from '../Styles'
import {
	DeviceConfig,
	ReportedConfigState,
	SkyKeyInformation,
	ReportedSkyKeyInformation,
} from '../@types/device-state'
import { default as introJs } from 'intro.js'
import { number } from '@amcharts/amcharts4/core'

const intro = introJs()

const MAX_INT32 = 2147483647

const SettingsForm = styled(Form)`
	@media (min-width: ${mobileBreakpoint}) {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: auto;
		grid-column-gap: 1rem;
	}

	input,
	span.input-group-text,
	label,
	legend,
	button {
		font-size: 80%;
		@media (min-width: ${mobileBreakpoint}) {
			font-size: 100%;
		}
	}

	fieldset {
		@media (min-width: ${mobileBreakpoint}) {
			border-radius: 5px;
			border: 1px solid #cccccc;
			padding: 0.5rem 1rem 0 1rem;
			margin-bottom: 1rem;
		}
		legend {
			width: auto;
			margin: 0;
		}
	}
	.btn-group {
		width: 100%;
	}
	label {
		font-weight: normal;
	}
`

const SideBySide = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-column-gap: 1rem;
	align-items: baseline;
	@media (min-width: ${mobileBreakpoint}) {
		display: block;
	}
`

const Help = styled.p`
	display: flex;
	font-style: italic;
	font-size: 90%;
	button {
		font-size: inherit;
		padding: 0 0.25rem;
	}
	align-items: center;
`

export const FooterWithFullWidthButton = styled.footer`
	grid-column: auto / span 2;
	display: flex;
	flex-direction: column;
`

export const Settings = ({
	onSave,
	reported,
	desired,
}: {
	reported?: ReportedSkyKeyInformation
	desired?: Partial<SkyKeyInformation>
	onSave: (config: Partial<SkyKeyInformation>) => void
}) => {
	const r: ReportedSkyKeyInformation = reported ?? {}

	const [newDesired, setNewDesired] = useState<Partial<SkyKeyInformation>>(
		desired ?? {},
	)

	const hasInitial = desired === undefined
	const [changed, setChanged] = useState(hasInitial)

	const updateConfig = (skyKey: Partial<SkyKeyInformation>) => {
		const updated = {
			...newDesired,
			...skyKey,
		}
		setNewDesired(updated)
		if (!hasInitial) {
			setChanged(!equal(updated, desired))
		}
	}

	const updateConfigProperty =
		(property: string, parser?: (v: string) => number) => (value: string) => {
			updateConfig({
				[property]: parser !== undefined ? parser(value) : parseInt(value, 10),
			})
		}

	const [visible, setVisible] = useState(
		window.localStorage.getItem('asset-tracker:settings:help') !== 'hidden',
	)

	const onDismiss = () => {
		window.localStorage.setItem('asset-tracker:settings:help', 'hidden')
		setVisible(false)
	}

	return (
		<>
			<Alert color={'info'} isOpen={visible} toggle={onDismiss}>
				<Help>
					Click{' '}
					<Button
						color={'link'}
						onClick={() => {
							window.requestAnimationFrame(() => {
								intro.start()
							})
						}}
					>
						{emojify('💁')} Help
					</Button>{' '}
					to view detailed description of the settings.
				</Help>
			</Alert>
			<SettingsForm>
				<fieldset data-intro={'How long the Skykey is going to be unlocked.'}>
					<legend>Lock Timeout Seconds</legend>
					<NumberConfigSetting
						id={'lockTimeoutSeconds'}
						desired={newDesired.lockTimeoutSeconds}
						reported={r.lockTimeoutSeconds}
						example={60}
						onChange={updateConfigProperty('lockTimeoutSeconds')}
						minimum={1}
						maximum={MAX_INT32}
					/>
				</fieldset>
				<FooterWithFullWidthButton>
					<Button
						color={'primary'}
						disabled={!changed}
						onClick={() => {
							onSave(newDesired)
						}}
					>
						Update
					</Button>
				</FooterWithFullWidthButton>
			</SettingsForm>
		</>
	)
}

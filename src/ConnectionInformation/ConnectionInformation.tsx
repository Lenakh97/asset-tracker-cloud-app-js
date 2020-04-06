import React from 'react'
import { filter as filterOperator, Operator as Op } from 'mcc-mnc-list'
import { ReportedTime } from '../ReportedTime/ReportedTime'
import { TextWithIcon } from '../TextWithIcon/TextWithIcon'
import { emojify } from '../Emojify/Emojify'
import styled from 'styled-components'
import { RSRP, RSRPBar } from '@bifravst/rsrp-bar'

const StyledRSRPBar = styled(RSRPBar)`
	width: 20px;
	height: 20px;
`
const signalQuality = (rsrp: number) => (
	<RSRP
		rsrp={rsrp}
		renderBar={({ quality, dbm }) =>
			quality === 0 ? (
				<abbr title={'Not known or not detectable'}>
					<StyledRSRPBar quality={0} />
				</abbr>
			) : (
				<>
					<StyledRSRPBar quality={quality} />
					<small>{`(${dbm}dBm)`}</small>
				</>
			)
		}
		renderInvalid={() => (
			<abbr title={`Unexpected value ${rsrp} reported!`}>{emojify('❎')}</abbr>
		)}
	/>
)

export const Operator = ({ op }: { op?: Op }) => (
	<span className={'operator'}>
		{!op && 'Unknown'}
		{op && op.brand}
	</span>
)

export const ConnectionInformation = ({
	networkOperator,
	rsrp,
	mccmnc,
	receivedAt,
	reportedAt,
}: {
	networkOperator?: string
	rsrp: number
	mccmnc: number
	receivedAt: Date
	reportedAt: Date
}) => (
	<div className={'info connection-information'}>
		<TextWithIcon icon={signalQuality(rsrp)}>
			<>
				&nbsp;
				<Operator op={filterOperator({ mccmnc: `${mccmnc}` })[0]} />
			</>
		</TextWithIcon>
		{emojify(`📱 ${networkOperator || '?'}`)}
		<ReportedTime receivedAt={receivedAt} reportedAt={reportedAt} />
	</div>
)

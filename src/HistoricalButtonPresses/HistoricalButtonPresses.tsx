import React from 'react'
import { Table } from 'reactstrap'
import { RelativeTime } from '../RelativeTime/RelativeTime'

export const HistoricalButtonPresses = ({
	data,
}: {
	data: { value: number; date: Date }[]
}) => (
	<Table>
		<thead>
			<th>Time</th>
		</thead>
		<tbody>
			{data.map(({ value, date }, k) => (
				<tr key={k}>
					<td>
						{date.toLocaleString()}{' '}
						<small>
							(<RelativeTime ts={date} />)
						</small>
					</td>
				</tr>
			))}
		</tbody>
	</Table>
)

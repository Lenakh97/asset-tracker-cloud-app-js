import React, { useState } from 'react'
import { Button, Form, FormGroup, Input, Label } from 'reactstrap'
import { FilePicker } from '../../FilePicker/FilePicker'
import { FooterWithFullWidthButton } from '../../Settings/Settings'

export const CreatePasswordUpdateJob = ({
	onFile,
	onError,
}: {
	onFile: (f: File) => unknown
	onError: (error?: Error) => void
}) => {
	const [upgradeFile, setUpgradeFile] = useState<File>()
	const [saving, setSaving] = useState(false)
	return (
		<Form>
			<fieldset>
				<FormGroup>
					<Label>Password File</Label>
					<p>
						<FilePicker
							accept={'text/octet-stream,.bin'}
							maxSize={1024 * 1024}
							onError={onError}
							disabled={saving}
							onFile={(file) => {
								onError(undefined)
								setUpgradeFile(file)
							}}
						/>
					</p>
				</FormGroup>
			</fieldset>
			{upgradeFile && (
				<>
					<FooterWithFullWidthButton>
						<Button
							color={'primary'}
							disabled={saving}
							onClick={() => {
								setSaving(true)
								onFile(upgradeFile)
							}}
						>
							{saving && 'Creating ...'}
							{!saving && 'Update database'}
						</Button>
					</FooterWithFullWidthButton>
				</>
			)}
		</Form>
	)
}

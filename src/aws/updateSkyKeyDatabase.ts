import {
	IoTDataPlaneClient,
	UpdateThingShadowCommand,
} from '@aws-sdk/client-iot-data-plane'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { fromUtf8 } from '@aws-sdk/util-utf8-browser'
import { v4 } from 'uuid'

export const updateSkyKeyDatabase =
	({
		s3,
		iotData,
		bucketName,
	}: {
		iotData: IoTDataPlaneClient
		bucketName: string
		s3: S3Client
	}) =>
	async ({
		file,
		thingName,
	}: {
		file: File
		thingName: string
	}): Promise<{ databaseLocation: string }> => {
		const databaseId = v4()
		const data = await new Promise<Buffer>((resolve) => {
			const reader = new FileReader()
			reader.onload = (e: any) => resolve(e.target.result)
			reader.readAsArrayBuffer(file)
		})
		await s3.send(
			new PutObjectCommand({
				Bucket: bucketName,
				Key: databaseId,
				Body: data,
				ContentLength: file.size,
				ContentType: 'text/octet-stream',
			}),
		)

		const databaseLocation = `https://${bucketName}.s3.amazonaws.com/${databaseId}`
		await iotData.send(
			new UpdateThingShadowCommand({
				thingName,
				payload: fromUtf8(
					JSON.stringify({
						state: {
							desired: {
								skyKey: {
									databaseLocation,
								},
							},
						},
					}),
				),
			}),
		)
		return { databaseLocation }
	}

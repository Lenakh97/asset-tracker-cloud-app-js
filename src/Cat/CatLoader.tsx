import React, { useContext, useEffect, useState } from 'react'
import { DisplayError } from '../Error/Error'
import { Card, CardBody } from 'reactstrap'
import { Loading } from '../Loading/Loading'
import { CatNavbar } from '../Navigation/CatNavbar'
import { NavbarBrandContext } from '../Navigation/NavbarBrand'
import { isRight, Either } from 'fp-ts/lib/Either'
import { ErrorInfo } from '../Error/ErrorInfo'

export type LoadedCat = {
	id: string
	name: string
	avatar: string
	version: number
}

export function CatLoader<
	T extends {
		name?: string
		avatar?: string
		version: number
	},
>({
	catId,
	children,
	loader,
}: {
	catId: string
	loader: (catId: string) => Promise<Either<ErrorInfo, T>>
	children: (
		cat: T & LoadedCat,
		update: (cat: T & LoadedCat) => void,
	) => React.ReactElement<any>
}) {
	const [cat, setCat] = useState<T & LoadedCat>()
	const [error, setError] = useState<ErrorInfo>()

	const navbarBrandState = useContext(NavbarBrandContext)
	const resetNavbar = navbarBrandState.reset
	const setNavbar = navbarBrandState.set

	useEffect(() => {
		let isCancelled = false
		loader(catId)
			.then((cat) => {
				if (!isCancelled) {
					if (isRight(cat)) {
						const c = {
							...cat.right,
							id: catId,
							name: cat.right.name ?? catId,
							avatar:
								cat.right.avatar ??
								'https://previews.123rf.com/images/muslumstock/muslumstock1808/muslumstock180805577/107657295-tiny-key-vector-icon-isolated-on-transparent-background-tiny-key-logo-concept.jpg',
						}
						setCat(c)
						setNavbar(<CatNavbar name={c.name} avatar={c.avatar} />)
					} else {
						setError(cat.left)
					}
				}
			})
			.catch((err) => {
				if (!isCancelled) setError(err)
			})
		return () => {
			isCancelled = true
			resetNavbar()
		}
	}, [catId, loader, resetNavbar, setNavbar])

	const update = (cat: T & LoadedCat) => {
		setCat(cat)
		setNavbar(<CatNavbar name={cat.name} avatar={cat.avatar} />)
	}

	if (error) return <DisplayError error={error} />

	if (!cat)
		return (
			<Card>
				<CardBody>
					<Loading text={`Opening can for ${catId}...`} />
				</CardBody>
			</Card>
		)

	return children(cat, update)
}

import React from 'react'

const ListItem = ({ id, onClicked, children, className }) => {
	return (
		<li
			id={id}
			onClick={onClicked}
			className={`h-18 bg-white shadow-md rounded-xl p-2 space-x-2 flex flex-row flex-nowrap items-center ${className}`}
		>
			{children}
		</li>
	)
}

export default ListItem

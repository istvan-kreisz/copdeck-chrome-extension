import React from 'react'
import { render } from 'react-dom'
import 'tailwindcss/tailwind.css'

import Popup from './Popup'
import './index.css'

render(<Popup />, window.document.querySelector('#app-container'))

if (module.hot) module.hot.accept()

import { Regex } from '@companion-module/base'

export const ConfigFields = [
	{
		type: 'textinput',
		id: 'host',
		label: 'Power Sequencer IP',
		tooltip: 'Enter the IP adress of the Power Sequencer and make sure it is reachable from your network.',
		width: 8,
		regex: Regex.IP,
	},
	{
		type: 'number',
		id: 'port',
		label: 'Port',
		default: 50000,
		width: 4,
		tooltip: 'Make sure to match the port to the same value you configured in the device settings.',
		regex: Regex.PORT,
	},
	{
		type: 'checkbox',
		id: 'autoReconnect',
		label: 'Auto Reconnect',
		default: false,
	},
	{
		type: 'textinput',
		id: 'deviceIDs',
		label: 'Device ID(s)',
		default: '0',
		tooltip: 'Enter a comma-separated list of device IDs that this module will manage.',
		width: 8,
	},
]

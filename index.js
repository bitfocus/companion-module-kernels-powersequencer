import { InstanceBase, runEntrypoint } from '@companion-module/base'

import { getActionDefinitions } from './actions.js'
import { ConfigFields } from './config.js'
import { getFeedbackDefinitions } from './feedbacks.js'
import { PowerSequencer, SocketManager } from './sequencer.js'

class GenericTcpUdpInstance extends InstanceBase {
	async init(config) {
		this.config = config
		this.socketManager = null
		this.sequencers = {}

		this.initializeSequencers()
	}

	async configUpdated(config) {
		this.config = config

		this.initializeSequencers()
	}

	async initializeSequencers() {
		if (this.socketManager) {
			this.socketManager.destroySocket()
			this.socketManager = null
		}
		this.sequencers = []

		if (this.socketManager != null) {
			this.socketManager.destroySocket()
			this.socketManager = null
		}

		this.socketManager = new SocketManager(this, this.config.host, this.config.port, this.config.autoReconnect)

		let allVars = []

		const deviceIDs = (this.config.deviceIDs || '').split(' ').map((id) => id.trim())

		if (deviceIDs.length === 0) {
			this.log('info', 'No device IDs provided. Adding default sequencer with ID 0.')
			deviceIDs.push('0')
		}

		for (const deviceId of deviceIDs) {
			if (deviceId) {
				if (deviceId >= 0 && deviceId <= 200) {
					const sequencer = new PowerSequencer(this, deviceId, this.socketManager)
					this.socketManager.getStatus(deviceId)
					this.sequencers[deviceId] = sequencer

					const deviceVariables = this.generateDeviceVariables(deviceId)
					allVars.push(...deviceVariables)
				} else {
					this.log('warn', 'Found invalid device ID, please review: ' + deviceId)
				}
			}
		}

		this.setVariableDefinitions(allVars)

		this.setActionDefinitions(getActionDefinitions(this))
		this.setFeedbackDefinitions(getFeedbackDefinitions(this))
	}

	generateDeviceVariables(deviceId) {
		const generateChannelVariables = (channelNumber) => {
			return [
				{
					name: `Device ${deviceId}: Channel ${channelNumber} Switch state`,
					variableId: `device${deviceId}_ch${channelNumber}_switch_state`,
				},
				{
					name: `Device ${deviceId}: Channel ${channelNumber} Power on delay time`,
					variableId: `device${deviceId}_ch${channelNumber}_power_on_delay_time`,
				},
				{
					name: `Device ${deviceId}: Channel ${channelNumber} Power off delay time`,
					variableId: `device${deviceId}_ch${channelNumber}_power_off_delay_time`,
				},
			]
		}

		const channelVariables = []
		for (let i = 1; i <= 8; i++) {
			channelVariables.push(...generateChannelVariables(i))
		}

		const deviceVariables = [
			{
				name: `Device ${deviceId}: Voltage (V)`,
				variableId: `device${deviceId}_voltage`,
			},
			{
				name: `Device ${deviceId}: Current (mA)`,
				variableId: `device${deviceId}_current`,
			},
			{
				name: `Device ${deviceId}: Power (W)`,
				variableId: `device${deviceId}_power`,
			},
			{
				name: `Device ${deviceId}: Power Factor`,
				variableId: `device${deviceId}_powerfactor`,
			},
			{
				name: `Device ${deviceId}: Power On Self-Start Status`,
				variableId: `device${deviceId}_power_on_self_start_status`,
			},
			{
				name: `Device ${deviceId}: Power State`,
				variableId: `device${deviceId}_power_state`,
			},
		]

		return [...channelVariables, ...deviceVariables]
	}

	async destroy() {
		if (this.socketManager) {
			this.socketManager.destroySocket()
		}
	}

	getConfigFields() {
		return ConfigFields
	}
}

runEntrypoint(GenericTcpUdpInstance, [])

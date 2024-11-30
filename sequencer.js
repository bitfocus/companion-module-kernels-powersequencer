import { InstanceStatus } from '@companion-module/base'

import net from 'net'

export class SocketManager {
	constructor(instanceContext, host, port, autoReconnect) {
		this.instanceContext = instanceContext
		this.host = host
		this.port = port
		this.autoReconnect = autoReconnect
		this.reconnectTimeout = null

		this.socket = null
		this.listeners = []

		this.createSocket()
	}

	createSocket() {
		this.socket = new net.Socket()

		this.socket.setKeepAlive(true, 10000)
		this.socket.setTimeout(5000)

		this.socket.connect(this.port, this.host, () => {
			this.instanceContext.log('debug', 'Connected')
			this.instanceContext.updateStatus(InstanceStatus.Ok)
		})

		this.socket.on('data', (data) => {
			this.listeners.forEach((callback) => callback(data))
		})

		this.socket.on('error', (err) => {
			this.instanceContext.log('error', 'Network error: ' + err.message)
			this.instanceContext.updateStatus(InstanceStatus.Error, err.message)
			this.reconnect()
		})

		this.socket.on('end', () => {
			this.instanceContext.log('error', 'Connection ended')
			this.instanceContext.updateStatus(InstanceStatus.Disconnected)
			this.reconnect()
		})

		this.socket.on('close', (hadError) => {
			if (hadError) {
				this.instanceContext.log('error', 'Socket closed due to an error.')
			} else {
				this.instanceContext.log('error', 'Socket closed.')
			}
			this.instanceContext.updateStatus(InstanceStatus.Disconnected)
			this.reconnect()
		})
	}

	reconnect() {
		if (this.autoReconnect && !this.reconnectTimeout) {
			this.instanceContext.log('debug', 'Attempting to reconnect in 5 seconds...')
			this.reconnectTimeout = setTimeout(() => {
				this.reconnectTimeout = null
				this.createSocket()
			}, 5000)
		} else {
			clearTimeout(this.reconnectTimeout)
			this.reconnectTimeout = null
		}
	}

	destroySocket() {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout)
			this.reconnectTimeout = null
		}
		if (this.socket) {
			this.socket.destroy()
			this.socket = null
		}
	}

	registerListener(callback) {
		this.listeners.push(callback)
	}

	async sendMessage(message) {
		try {
			if (!Buffer.isBuffer(message)) {
				message = Buffer.from(message)
			}

			return new Promise((resolve, reject) => {
				const isWritten = this.socket.write(message)

				if (isWritten) {
					resolve(true)
				} else {
					this.socket.once('drain', () => resolve(true))
				}
			})
		} catch (error) {
			this.instanceContext.log('error', 'Failed to send message: ' + error.message)
			return false
		}
	}

	setPower(deviceId, state) {
		var msg = [0x55, 0x5a, parseInt(deviceId, 10), 0x09, state == true ? 0x01 : 0x00, 0xaa]
		this.sendMessage(msg)
		this.getStatus(deviceId)
	}

	setChannel(deviceId, channel, state) {
		var msg = [0x55, 0x5a, parseInt(deviceId, 10), parseInt(channel, 16), state ? 0x01 : 0x00, 0xaa]
		this.sendMessage(msg)
		this.getStatus(deviceId)
	}

	setId(deviceId, newDeviceId) {
		var msg = [0x55, 0x5a, parseInt(deviceId, 10), 0xff, parseInt(newDeviceId, 10), 0xaa]
		this.sendMessage(msg)
		this.getStatus(newDeviceId)
	}

	getStatus(deviceId) {
		var msg = [0x55, 0xff, parseInt(deviceId, 10), 0xff, 0xff, 0xaa]
		this.sendMessage(msg)
	}
}

export class PowerSequencer {
	constructor(instanceContext, deviceId, socketManager) {
		this.instanceContext = instanceContext
		this.socket = socketManager
		this.deviceId = deviceId

		this.socket.registerListener((data) => this.parseIncomingData(data))
	}

	parseIncomingData(data) {
		if (!this.messageBuffer) {
			this.messageBuffer = Buffer.alloc(0)
		}

		this.messageBuffer = Buffer.concat([this.messageBuffer, data])

		const MAX_BUFFER_SIZE = 1024
		if (this.messageBuffer.length > MAX_BUFFER_SIZE) {
			this.instanceContext.log(
				'warn',
				`Message buffer overflow. Buffer size: ${this.messageBuffer.length}. Clearing buffer.`
			)
			this.messageBuffer = Buffer.alloc(0)
			return
		}

		let lastDelimiterIndex = 0
		for (let i = 0; i < this.messageBuffer.length; i++) {
			if (this.messageBuffer[i] === 0xaa) {
				const message = this.messageBuffer.slice(lastDelimiterIndex, i + 1)
				lastDelimiterIndex = i + 1

				if (message.length === 0) {
					this.instanceContext.log('debug', `Empty message skipped. Last delimiter index: ${lastDelimiterIndex}`)
					continue
				}

				if (message.length === 56) {
					if (message[0] !== 0x55 || message[1] !== 0x5a || message[55] !== 0xaa) {
						this.instanceContext.log(
							'warn',
							`Invalid message format. Header: ${message[0]}, ${message[1]}. Footer: ${message[55]}.`
						)
						continue
					}

					if (message[2] != this.deviceId) {
						continue
					}

					try {
						this.deviceId = message[2]
						this.chPowerOnDelays = Array.from({ length: 8 }, (_, i) => (message[3 + i * 2] << 8) | message[4 + i * 2])
						this.chShutdownDelays = Array.from(
							{ length: 8 },
							(_, i) => (message[20 + i * 2] << 8) | message[21 + i * 2]
						)
						this.chSwitchStatuses = Array.from({ length: 8 }, (_, i) => message[37 + i])
						this.powerOnSelfStartStatus = message[46]
						this.powerState = message[47]
						this.currentVoltage = (message[48] << 8) | message[49]
						this.currentCurrent = (message[50] << 8) | message[51]
						this.currentPower = (message[52] << 8) | message[53]
						this.powerFactor = message[54] / 100

						this.instanceContext.log(
							'debug',
							`Parsed data: 
          Device ID: ${this.deviceId}
          CH Power-On Delays: ${this.chPowerOnDelays}
          CH Shutdown Delays: ${this.chShutdownDelays}
          CH Switch Statuses: ${this.chSwitchStatuses}
          Power-On Self-Start: ${this.powerOnSelfStartStatus}
          Voltage: ${this.currentVoltage} V
          Current: ${this.currentCurrent} mA
          Power: ${this.currentPower} W
		  Power State: ${this.powerState} W
          Power Factor: ${this.powerFactor}`
						)

						const variableData = {}

						this.chPowerOnDelays.forEach((delay, index) => {
							variableData[`device${this.deviceId}_ch${index + 1}_power_on_delay_time`] = delay
						})

						this.chShutdownDelays.forEach((delay, index) => {
							variableData[`device${this.deviceId}_ch${index + 1}_power_off_delay_time`] = delay
						})

						this.chSwitchStatuses.forEach((status, index) => {
							variableData[`device${this.deviceId}_ch${index + 1}_switch_state`] = status ? 'on' : 'off'
						})

						variableData[`device${this.deviceId}_voltage`] = this.currentVoltage
						variableData[`device${this.deviceId}_current`] = this.currentCurrent
						variableData[`device${this.deviceId}_power`] = this.currentPower
						variableData[`device${this.deviceId}_powerfactor`] = this.powerFactor
						variableData[`device${this.deviceId}_power_on_self_start_status`] = this.powerOnSelfStartStatus
						variableData[`device${this.deviceId}_power_state`] = this.powerState

						this.instanceContext.setVariableValues(variableData)

						this.instanceContext.checkFeedbacks('channel_active')
						this.instanceContext.checkFeedbacks('power_state')
					} catch (error) {
						this.instanceContext.log('error', `Error parsing message fields: ${error.message}`)
					}
				} else {
					this.instanceContext.log('warn', `Invalid message length: ${message.length}`)
				}
			}
		}

		const remainingBufferSize = this.messageBuffer.length - lastDelimiterIndex
		this.messageBuffer = this.messageBuffer.slice(lastDelimiterIndex)
	}
}

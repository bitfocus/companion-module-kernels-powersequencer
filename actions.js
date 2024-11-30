export function getActionDefinitions(self) {
	return {
		switch_set_value: {
			name: 'Switch: Set Value',
			description: 'Turn on, turn off or toggle one of the eight available channels.',
			options: [
				{
					type: 'number',
					id: 'deviceid',
					label: 'Device ID',
					default: 0,
					min: 0,
					max: 200,
				},
				{
					type: 'dropdown',
					id: 'channel',
					label: 'Select Channel',
					default: 1,
					choices: [
						{ id: 1, label: 'Channel 1' },
						{ id: 2, label: 'Channel 2' },
						{ id: 3, label: 'Channel 3' },
						{ id: 4, label: 'Channel 4' },
						{ id: 5, label: 'Channel 5' },
						{ id: 6, label: 'Channel 6' },
						{ id: 7, label: 'Channel 7' },
						{ id: 8, label: 'Channel 8' },
					],
				},
				{
					type: 'dropdown',
					id: 'command',
					label: 'Action',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Turn On' },
						{ id: 'off', label: 'Turn Off' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: async (action) => {
				const deviceId = action.options.deviceid
				const selectedChannel = action.options.channel
				const command = action.options.command

				switch (command) {
					case 'on':
						self.socketManager.setChannel(deviceId, selectedChannel, true)
						break
					case 'off':
						self.socketManager.setChannel(deviceId, selectedChannel, false)
						break
					case 'toggle':
						const sequencer = self.sequencers[deviceId]
						if (!sequencer) {
							self.log('warn', 'Invalid device id used in action.')
							break
						}
						if (sequencer.chSwitchStatuses == null) {
							self.socketManager.setChannel(deviceId, selectedChannel, true)
						} else {
							self.socketManager.setChannel(deviceId, selectedChannel, !sequencer.chSwitchStatuses[selectedChannel - 1])
						}
						break
				}
			},
		},
		power_on_off: {
			name: 'Power: On/off',
			description: 'Turn the outlets on or off, following the programmed sequence',
			options: [
				{
					type: 'number',
					id: 'deviceid',
					label: 'Device ID',
					default: 0,
					min: 0,
					max: 200,
				},
				{
					type: 'dropdown',
					id: 'command',
					label: 'Action',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Turn On' },
						{ id: 'off', label: 'Turn Off' },
						{ id: 'toggle', label: 'Toggle' },
					],
				},
			],
			callback: async (action) => {
				const deviceId = action.options.deviceid
				const command = action.options.command

				switch (command) {
					case 'on':
						self.socketManager.setPower(deviceId, true)
						break
					case 'off':
						self.socketManager.setPower(deviceId, false)
						break
					case 'toggle':
						const sequencer = self.sequencers[deviceId]
						if (!sequencer) {
							self.log('warn', 'Invalid device id used in action.')
							break
						}
						if (!sequencer.powerState) {
							self.socketManager.setPower(deviceId, true)
						} else {
							self.socketManager.setPower(deviceId, !sequencer.powerState)
						}
				}
			},
		},
		get_data: {
			name: 'Device: Get latest data',
			description: 'Trigger the device to send the latest live data',
			options: [
				{
					type: 'number',
					id: 'deviceid',
					label: 'Device ID',
					default: 0,
					min: 0,
					max: 200,
				},
			],
			callback: async (action) => {
				const deviceId = action.options.deviceid
				self.socketManager.getStatus(deviceId)
			},
		},
		set_device_id: {
			name: 'Device: Set ID',
			description:
				'Set a new Device ID - make sure to change the Device ID in the module settings and in the corresponding Actions and Feedbacks afterwards!',
			options: [
				{
					type: 'number',
					id: 'deviceid',
					label: 'Device ID',
					default: 0,
					min: 0,
					max: 200,
				},
				{
					type: 'number',
					id: 'newdeviceid',
					label: 'New Device ID',
					default: 0,
					min: 0,
					max: 200,
				},
			],
			callback: async (action) => {
				const deviceId = action.options.deviceid
				const newDeviceId = action.options.newdeviceid

				self.socketManager.setId(deviceId, newDeviceId)
			},
		},
	}
}

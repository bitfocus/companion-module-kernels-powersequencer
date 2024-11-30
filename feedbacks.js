export function getFeedbackDefinitions(self) {
	return {
		channel_active: {
			type: 'boolean',
			name: 'Channel active',
			description: 'Check if a channel is turned on',
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
			],
			callback: (feedback) => {
				const deviceId = feedback.options.deviceid
				const channel = feedback.options.channel

				if (!self.sequencers || !self.sequencers[deviceId]) {
					self.log('warn', `Feedback callback triggered for unknown device ID: ${deviceId}`)
					return false
				}

				const sequencer = self.sequencers[deviceId]

				if (sequencer.chSwitchStatuses == null) {
					self.log('warn', `chSwitchStatuses is null or undefined for device ID: ${deviceId}`)
					return false
				}

				if (channel < 1 || channel > sequencer.chSwitchStatuses.length) {
					self.log('warn', `Invalid channel number: ${channel} for device ID: ${deviceId}`)
					return false
				}

				return sequencer.chSwitchStatuses[channel - 1] === 1
			},
		},
		power_state: {
			type: 'boolean',
			name: 'Power state',
			description: 'Check if a the power sequencer is turned on or off',
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
			callback: (feedback) => {
				const deviceId = feedback.options.deviceid

				if (!self.sequencers || !self.sequencers[deviceId]) {
					self.log('warn', `Feedback callback triggered for unknown device ID: ${deviceId}`)
					return false
				}

				const sequencer = self.sequencers[deviceId]

				if (sequencer.powerState == null) {
					self.log('warn', `Power State is null or undefined for device ID: ${deviceId}`)
					return false
				}

				return sequencer.powerState === 1
			},
		},
	}
}

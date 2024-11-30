# KernelS PS108 II

1. Make sure that the PS108 has TCP/IP enabled and has a valid IP adress and port configured. Make sure that the device is reachable from your current network environment.
2. Put the IP and port of the PS108 in the configuration part of the module.
3. If you are only using one PS108, keep the "Device IDs" textbox in the configuration as it is by default ("0").
4. If you are using multiple, daisy chained PS108 devices, which are connected via Serial to the master device, enter all device IDs to the "Device IDs" textbox in the configuration window. Seperate them with a blank and press "Save" - variables will now be generated for all device IDs.
5. If the connection was successful, you can now use the available actions, feedbacks and variables.

You can also connect multiple PS108 II devices by adding them all to your local network - but then use one module for each device. The multi device ID approach is only for users, who connect only the first device using the TCP/IP connection and daisy chaining other devices via the Serial ports on the devices.

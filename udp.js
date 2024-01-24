const UDP = require('dgram')
const {DNSPacket} = require('./index.js')

const client = UDP.createSocket('udp4')

const port = 53

const hostname = '8.8.8.8'

client.on('message', (message, info) => {
    console.log('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
    DNSPacket.readFromBytes(message)
    console.log('Message from server', message.toString())
})

const packet = Buffer.from([0x48, 0xf0, 0x01, 0x20, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01])

client.send(packet, port, hostname, (err) => {
    if (err) {
        console.error('Failed to send packet !!')
    } else {
        console.log('Packet send !!')
    }
})
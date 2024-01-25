const UDP = require('dgram')

const client = UDP.createSocket('udp4')

const port = 53

const hostname = '8.8.8.8'


function sendPacket(packet, callback) {
    client.on('message', (message, info) => {
        callback(message)
        console.log('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
        console.log('Message from server', message)
    })
    client.send(packet, port, hostname, (err) => {
        if (err) {
            console.error('Failed to send packet !!')
        } else {
            console.log('Packet send !!')
        }
    })
}
module.exports = {sendPacket}
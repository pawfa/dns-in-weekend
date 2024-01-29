const UDP = require('dgram')
const {DNSPacket, DNSHeader, DNSQuestion} = require("./dns-models");
const {BufferReader} = require("./reader");

const client = UDP.createSocket('udp4')


client.bind({
    address: '0.0.0.0',
    port: 2053,
})

client.on('message', (message, info) => {
    console.log('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
    handleQuery(message, sendResponse(info.port, info.address))
})

function sendResponse(port,address) {
    return (data)=> client.send(data,port,address,(err) => {
        if (err) {
            console.error('Failed to send packet !!')
        } else {
            console.log('Packet send to requester')
        }
    })
}

function handleQuery(message,sendFunc) {
    const myBuffer = new BufferReader(message)
    const requestPacket = DNSPacket.readFromBytes(myBuffer);
    const requestQuestion = requestPacket.questions[0];

    const header = new DNSHeader(requestPacket.header.id, 1);
    header.recursion_desired = 1;
    header.recursion_available = 1;
    header.response = 1;
    const respPacket = new DNSPacket(header, [requestQuestion])

    lookup(requestQuestion.name, requestQuestion.type_, (resp)=> {
        respPacket.header.rescode = resp.header.rescode
        respPacket.header.answers = resp.header.answers
        respPacket.answers = resp.answers
        respPacket.authorities = resp.authorities
        respPacket.resources = resp.resources
        console.log(respPacket)
        sendFunc(respPacket.writeToBytes())
    })
}

// Forward queries to Google's public DNS
function lookup(name, type_, callback) {
    const header = new DNSHeader(12345, 1);
    const question = new DNSQuestion(name,type_,1);

    const server = UDP.createSocket('udp4')

    const port = 53

    const hostname = '8.8.8.8'

    server.send(new DNSPacket(header,[question]).writeToBytes(), port, hostname, (err) => {
        if (err) {
            console.error('Failed to send packet !!')
        } else {
            console.log('Packet send to Google DNS')
        }
    })

    server.on('message', (message, info) => {
        console.log('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
        console.log('Message from Google DNS', message.toString())
        const myBuffer = new BufferReader(message)
        const dnsLookup = DNSPacket.readFromBytes(myBuffer)

        callback(dnsLookup)
    })
}


/*
00000000  30 39 ef bf bd ef bf bd  67 6f 6f 67 6c 65 63 6f  |09......googleco|
00000010  6d ef bf bd 0d 0a 20 20  20 20 20 20 20 20 20 20  |m.....          |
00000020  20 20 20 20 20 20 20 20  20 20 20 20 20 20 20 20  |                |
00000030  20 20 20 20 20 20 20 20  20 20 20 20 6c ef bf bd  |            l...|
00000040  ef bf bd cb 8e                                    |.....|
00000045
 */
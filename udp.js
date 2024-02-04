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
00000000  5a a8 81 80 00 01 00 05 00 00 00 00 03 77 77 77  |Z............www|
00000010  05 79 61 68 6f 6f 03 63 6f 6d 00 00 01 00 01 c0  |.yahoo.com......|
00000020  0c 00 05 00 01 00 00 01 1c 00 0f 06 66 64 2d 66  |............fd-f|
00000030  70 33 03 77 67 31 01 62 c0 10 c0 2b 00 05 00 01  |p3.wg1.b...+....|
00000040  00 00 01 1d 00 09 06 64 73 2d 66 70 33 c0 32 c0  |.......ds-fp3.2.|
00000050  46 00 05 00 01 00 00 00 2d 00 15 0e 64 73 2d 61  |F.......-...ds-a|
00000060  6e 79 2d 66 70 33 2d 6c 66 62 03 77 61 31 c0 36  |ny-fp3-lfb.wa1.6|
00000070  c0 5b 00 05 00 01 00 00 01 1d 00 12 0f 64 73 2d  |.[...........ds-|
00000080  61 6e 79 2d 66 70 33 2d 72 65 61 6c c0 6a c0 7c  |any-fp3-real.j.||
00000090  00 01 00 01 00 00 00 2d 00 04 ce be 24 2d        |.......-....$-|
0000009e
 */
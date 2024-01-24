class DNSHeader {
    id;
    recursion_desired;
    truncated_message;
    authoritative_answer;
    opcode;
    response;
    rescode;
    checking_disabled;
    authed_data;
    z;
    recursion_available;

    questions;
    answers;
    authoritative_entries;
    resource_entries;

    read(buffer) {
        const headerBytes = buffer.subarray(0,12);
        this.id = headerBytes.readUInt16BE(0)

        const flags = headerBytes.readUInt16BE(2)

        const firstByte = flags >> 8;
        this.response = (firstByte & 128) >> 7;
        this.opcode = (firstByte & 120) >> 3
        this.authoritative_answer  = (firstByte & 4) >> 2
        this.truncated_message  = (firstByte & 2) >> 1
        this.recursion_desired  = (firstByte & 1)

        const secondByte = flags & 255;

        this.rescode = secondByte & 31
        this.checking_disabled = (secondByte & 16) >> 4
        this.authed_data = (secondByte & 32) >> 5
        this.z = (secondByte & 64) >> 6
        this.recursion_available = (secondByte & 128) >> 7

        this.questions = headerBytes.readUInt16BE(4)
        this.answers = headerBytes.readUInt16BE(6)
        this.authoritative_entries = headerBytes.readUInt16BE(8)
        this.resource_entries = headerBytes.readUInt16BE(10)
    }
}

class DNSQuestion {
    name;
    type_;
    class_;
}

const queryArray = Buffer.from([0x48,0xf0,0x01,0x20,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x06,0x67,0x6f,0x6f,0x67,0x6c,0x65,0x03,0x63,0x6f,0x6d,0x00,0x00,0x01,0x00,0x01]);
console.log(queryArray);
const responseArray = Buffer.from([0x48,0xf0,0x81,0x80,0x00,0x01,0x00,0x01,0x00,0x00,0x00,0x00,0x06,0x67,0x6f,0x6f,0x67,0x6c,0x65,0x03,0x63,0x6f,0x6d,0x00,0x00,0x01,0x00,0x01,0xc0,0x0c,0x00,0x01,0x00,0x01,0x00,0x00,0x00,0x03,0x00,0x04,0x8e,0xfa,0xba,0xce])

new DNSHeader().read(queryArray)
new DNSHeader().read(responseArray)

module.exports = DNSHeader;
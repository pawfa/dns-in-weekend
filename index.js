class DNSPacket {
    header;
    questions;
    answers;
    authorities;
    resources;

    constructor(header, questions, answers, authorities, resources) {
    }

    writeToBytes() {
        const buffer = Buffer.alloc(512)
        buffer.write(this.header.writeToBytes())
        for (const question of this.questions) {
            buffer.write(question.writeToBytes())
        }
        return buffer
    }

    static readFromBytes(buffer) {
        const header = DNSHeader.readFromBytes(buffer)
        const questions = DNSQuestion.readFromBytes(buffer)

        return new DNSPacket(header,questions)

    }
}
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

    static readFromBytes(buffer) {
        const header = new DNSHeader();
        const headerBytes = buffer.subarray(0, 12);
        header.id = headerBytes.readUInt16BE(0);

        const flags = headerBytes.readUInt16BE(2);

        const firstByte = flags >> 8;
        header.response = (firstByte & 128) >> 7;
        header.opcode = (firstByte & 120) >> 3;
        header.authoritative_answer = (firstByte & 4) >> 2;
        header.truncated_message = (firstByte & 2) >> 1;
        header.recursion_desired = (firstByte & 1);

        const secondByte = flags & 255;

        header.rescode = secondByte & 31;
        header.checking_disabled = (secondByte & 16) >> 4;
        header.authed_data = (secondByte & 32) >> 5;
        header.z = (secondByte & 64) >> 6;
        header.recursion_available = (secondByte & 128) >> 7;

        header.questions = headerBytes.readUInt16BE(4);
        header.answers = headerBytes.readUInt16BE(6);
        header.authoritative_entries = headerBytes.readUInt16BE(8);
        header.resource_entries = headerBytes.readUInt16BE(10);
        console.log(header)
        return header
    }

    writeToBytes() {
        const buffer = Buffer.alloc(12)
        buffer.writeUInt16BE(this.id)

        buffer.writeUInt8(
            this.recursion_desired | (this.truncated_message << 1) | (this.authoritative_answer << 2) | (this.opcode << 3) | (this.response << 7),
            2
        )

        buffer.writeUInt8(
            this.rescode | (this.checking_disabled << 4) | (this.authed_data << 5) | (this.z << 6) | (this.recursion_available << 7),
            3
        )
        buffer.writeUInt16BE(this.questions,4)
        buffer.writeUInt16BE(this.answers,6)
        buffer.writeUInt16BE(this.authoritative_entries,8)
        buffer.writeUInt16BE(this.resource_entries,10)

        return buffer
    }
}

class DNSQuestion {
    name;
    type_;
    class_;

    constructor(name, type_, class_) {
        this.name = name;
        this.type_ = type_;
        this.class_ = class_;
    }

    writeToBytes() {
        const nameSplitted = this.name.split(".");
        let buffer = Buffer.alloc(500)
        for (let i = 0; i < nameSplitted.length; i++) {
            const len = nameSplitted[i].length;
            const hexLen = '0x' + (len.toString('16').length === 1 ? '0' + len.toString('16') : len.toString('16'));
            buffer.write(hexLen + nameSplitted[i])
        }

        return buffer;
    }

    static readFromBytes(buffer) {
        const questionBytes = buffer.subarray(12)
        let len = questionBytes.readUInt8(0)

        let current = 0;
        let res = []
        while (len > 0) {
            res.push(questionBytes.subarray(current+1, len+current+1).toString())
            current = current +len+1
            len = questionBytes.readUInt8(current)

        }
        console.log(res.join('.'))
        return res.join('.')
    }
}

const queryArray = Buffer.from([0x48, 0xf0, 0x01, 0x20, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01]);
console.log(queryArray);
const responseArray = Buffer.from([0x48, 0xf0, 0x81, 0x80, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x06, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01, 0xc0, 0x0c, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x03, 0x00, 0x04, 0x8e, 0xfa, 0xba, 0xce]);

// const dnsHeader = new DNSHeader()
// DNSHeader.readFromBytes(queryArray)
// dnsHeader.writeToBytes()
// new DNSHeader().readFromBytes(responseArray)


// new DNSQuestion("google.com", 1, 1).writeToBytes();

DNSPacket.readFromBytes(responseArray)



module.exports = {DNSHeader, DNSPacket, DNSQuestion};
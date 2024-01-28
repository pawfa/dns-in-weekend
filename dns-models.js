class DNSPacket {
    header;
    questions;
    answers;
    authorities;
    resources;

    constructor(header, questions, answers, authorities, resources) {
        this.header = header
        this.questions = questions
        this.answers = answers
    }

    writeToBytes() {
        const buffer = Buffer.concat([this.header.writeToBytes(), ...this.questions.map((q)=> q.writeToBytes())])

        return buffer
    }

    static readFromBytes(buffer) {
        const header = DNSHeader.readFromBytes(buffer)
        const questions = [DNSQuestion.readFromBytes(buffer)]
        const answers = [];

        for (let i =0; i< header.answers;i++) {
            answers.push(DNSRecord.readFromBytes(buffer))
        }

        return new DNSPacket(header,questions, answers)

    }
}
class DNSHeader {
    id = 0;
    recursion_desired = 1;
    truncated_message = 0;
    authoritative_answer = 0;
    opcode = 0;
    response = 0;
    rescode = 0;
    checking_disabled = 0;
    authed_data = 0;
    z = 0;
    recursion_available = 0;

    questions = 0;
    answers = 0;
    authoritative_entries = 0;
    resource_entries = 0;

    constructor(id, questions) {
        this.id = id
        this.questions = questions
    }

    static readFromBytes(buffer) {
        const header = new DNSHeader();
        header.id = buffer.readUInt16BE(0);

        const flags = buffer.readUInt16BE(2);

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

        header.questions = buffer.readUInt16BE(4);
        header.answers = buffer.readUInt16BE(6);
        header.authoritative_entries = buffer.readUInt16BE(8);
        header.resource_entries = buffer.readUInt16BE(10);

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
        const buffers = []
        for (let i = 0; i < nameSplitted.length; i++) {
            const len = nameSplitted[i].length;
            const hexLen = '0x' + (len.toString('16').length === 1 ? '0' + len.toString('16') : len.toString('16'));
            buffers.push(Buffer.from([hexLen]))
            buffers.push(Buffer.from(nameSplitted[i]))
        }
        buffers.push(Buffer.from([0]))
        const type = Buffer.alloc(2)
        type.writeUInt16BE(this.type_)
        buffers.push(type)

        const class_ = Buffer.alloc(2)

        class_.writeUInt16BE(this.class_)
        buffers.push(class_)

        return Buffer.concat(buffers);
    }

    static readFromBytes(buffer) {
        let len = buffer.readUInt8(0)
        let res = []
        while (len > 0) {
            res.push(buffer.readRange(len).toString())
            len = buffer.readUInt8()
        }

        const name = res.join('.')
        const type_ = buffer.readUInt16BE();
        const class_ = buffer.readUInt16BE()

        return new DNSQuestion(name, type_, class_)
    }
}

class DNSRecord {
    name;
    type_;
    class_
    ttl;
    len;
    ip;
    data;

    static typeToNameMap = {
        1: 'A',
        2: 'NS',
        5: 'CNAME',
        15: 'MX',
        28 : 'AAAA'
    }

    constructor(name, type_, class_, ttl, len, ip,data) {
        this.name = name;
        this.type_ = type_;
        this.class_ = class_;
        this.ttl = ttl;
        this.len = len;
        this.ip = ip;
        this.data = data;
    }

    static readFromBytes(buffer) {

        const nameBytes = [buffer.readUInt8(),buffer.readUInt8()];
        const jump = Buffer.from(nameBytes).readUInt16BE() ^ Buffer.from([nameBytes[0], 0x00]).readUInt16BE();

        const name = buffer.peekName(jump);

        const type_ = DNSRecord.typeToNameMap[buffer.readUInt16BE()];
        const class_ = buffer.readUInt16BE();
        const ttl = buffer.readUInt32BE();
        const len = buffer.readUInt16BE();
        if (type_ === 1) {
            const ip = `${buffer.readUInt8()}.${buffer.readUInt8()}.${buffer.readUInt8()}.${buffer.readUInt8()}`;
            return new DNSRecord(name, type_, class_, ttl, len, ip)
        } else {
            const data = buffer.readRange(len).toString();
            return new DNSRecord(name, type_, class_, ttl, len, undefined,data)
        }
    }
}

module.exports = {DNSPacket, DNSHeader, DNSQuestion}
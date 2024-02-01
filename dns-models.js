class DNSPacket {
    header;
    questions;
    answers;
    authorities;
    resources;

    constructor(header, questions = [], answers = [], authorities = [], resources = []) {
        this.header = header
        this.questions = questions
        this.answers = answers
        this.authorities = authorities
        this.resources = resources
    }

    writeToBytes() {
        const buffer = Buffer.concat([this.header.writeToBytes(), ...this.questions.map((q)=> q.writeToBytes()), ...this.answers.map((r)=> r.writeToBytes())])

        return buffer
    }

    static readFromBytes(buffer) {
        const header = DNSHeader.readFromBytes(buffer)
        const questions = [DNSQuestion.readFromBytes(buffer)]
        const answers = [];

        for (let i =0; i< header.answers;i++) {
            answers.push(DNSRecord.readFromBytes(buffer))
        }

        const authorities = [];
        for (let i =0; i< header.authoritative_entries;i++) {
            authorities.push(DNSRecord.readFromBytes(buffer))
        }

        const resources = [];
        for (let i =0; i< header.resource_entries;i++) {
            resources.push(DNSRecord.readFromBytes(buffer))
        }

        return new DNSPacket(header,questions, answers,authorities,resources)

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
    host;

    static typeToNameMap = {
        1: 'A',
        2: 'NS',
        5: 'CNAME',
        15: 'MX',
        28 : 'AAAA'
    }

    constructor(name, type_, class_, ttl, len, ip,host) {
        this.name = name;
        this.type_ = type_;
        this.class_ = class_;
        this.ttl = ttl;
        this.len = len;
        this.ip = ip;
        this.host = host;
    }

    writeToBytes() {
        const labels = this.name.split(".");
        const buffers = []

        for (const label of labels) {
            const len = label.length;
            buffers.push(Buffer.from([len]))
            buffers.push(Buffer.from(label))
        }
        buffers.push(Buffer.from([0]))

        const type = Buffer.alloc(2)
        const nameToTypeMap = Object.fromEntries(Object.entries(DNSRecord.typeToNameMap).map(([key, value]) => [value, key]))
        type.writeUInt16BE(nameToTypeMap[this.type_])
        buffers.push(type)

        const class_ = Buffer.alloc(2)
        class_.writeUInt16BE(this.class_)
        buffers.push(class_)

        const ttl = Buffer.alloc(4)
        ttl.writeUInt32BE(this.ttl)
        buffers.push(ttl)

        if (this.ip) {
            const len = Buffer.alloc(2)
            len.writeUInt16BE(4)
            buffers.push(len)
            const ipSplitted = this.ip?.split('.')

            for (let i = 0; i < ipSplitted.length; i++) {
                buffers.push(Buffer.from([Number(ipSplitted[i])]))
            }
        } else if (this.host) {
            const labels = this.host.split(".");
            const dataBuffers = []
            for (const label of labels) {
                const len = label.length;
                dataBuffers.push(Buffer.from([len]))
                dataBuffers.push(Buffer.from(label))
            }
            dataBuffers.push(Buffer.from([0]))

            console.log(labels);
            console.log(dataBuffers);
            console.log(Buffer.concat(dataBuffers).byteLength);
            console.log(Buffer.concat(dataBuffers));
            buffers.push(Buffer.from([Buffer.concat(dataBuffers).byteLength]))
            buffers.push(...dataBuffers)
        }


        return Buffer.concat(buffers)
    }

    static readFromBytes(buffer) {
        let name = ''
        const nameBytes = [buffer.buffer.readUInt8(buffer.currentPos),buffer.buffer.readUInt8(buffer.currentPos +1)];
        const isPointer = (Buffer.from(nameBytes).readUInt16BE() & 0xC000) === 0xC000;

        if(isPointer) {
            buffer.readUInt8()
            buffer.readUInt8()

            const jump = Buffer.from(nameBytes).readUInt16BE() ^ Buffer.from([nameBytes[0], 0x00]).readUInt16BE();
            name = buffer.peekName(jump);
        } else {
            name = buffer.peekName(buffer.currentPos);
        }

        const type_ = DNSRecord.typeToNameMap[buffer.readUInt16BE()];
        const class_ = buffer.readUInt16BE();
        const ttl = buffer.readUInt32BE();
        const len = buffer.readUInt16BE();

        if (type_ === 'A') {
            const ip = `${buffer.readUInt8()}.${buffer.readUInt8()}.${buffer.readUInt8()}.${buffer.readUInt8()}`;

            return new DNSRecord(name, type_, class_, ttl, len, ip)
        } else {

            let host = buffer.peekName(buffer.currentPos)
            buffer.readRange(len)

            const record = new DNSRecord(name, type_, class_, ttl, len, undefined,host)

            buffer.peekLeftBytes()
            return record
        }
    }
}

module.exports = {DNSPacket, DNSHeader, DNSQuestion}
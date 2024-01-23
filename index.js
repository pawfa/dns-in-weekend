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
        console.log(buffer)
        const headerBytes = buffer.subarray(0,12);
        this.id = headerBytes.readUInt16BE(0)
        console.log(this.id)
        const flags = headerBytes.readUInt16BE(2)
        console.log(flags)

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

const byteArray = Buffer.from([86,0x2a,0x01,0x20,0x00,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x06,0x67,0x6f,0x6f,0x67,0x06c,0x065,0x003,0x063,0x06f,0x06d,0x000,0x000,0x001,0x000,0x001]);
console.log(byteArray);

new DNSHeader().read(byteArray)

module.exports = DNSHeader;
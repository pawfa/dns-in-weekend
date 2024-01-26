class BufferReader {
    currentPos = 0
    buffer;
    constructor(buffer) {
        this.buffer = buffer
    }

    readUInt16BE() {
        const buff =  this.buffer.readUInt16BE(this.currentPos)
        this.currentPos +=2;
        return buff
    }
    readUInt32BE() {
        const buff =  this.buffer.readUInt32BE(this.currentPos)
        this.currentPos +=4;
        return buff
    }

    readUInt8() {
        const buff =  this.buffer.readUInt8(this.currentPos)
        this.currentPos +=1;
        return buff
    }
    readRange(len) {
        const res = this.buffer.subarray(this.currentPos,this.currentPos+len)
        this.currentPos += len
        return res
    }
}

module.exports= {BufferReader}
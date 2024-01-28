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

    peekUInt16BE() {
        return  this.buffer.readUInt16BE(this.currentPos)
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

    peekName(start) {
        const tmpBuff = this.buffer.subarray(start)
        let len = tmpBuff.readUInt8()
        let res = []
        let currIndex = 0

        while (len > 0) {
            res.push(tmpBuff.subarray(currIndex+1,len +currIndex+1).toString())
            currIndex += 1+len
            len = tmpBuff.readUInt8(currIndex)
        }
        console.log(res)
        return res.join('.')
    }
}

module.exports= {BufferReader}
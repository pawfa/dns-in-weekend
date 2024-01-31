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

    getJump(buffer) {
        const firstTwoBytes = [buffer.readUInt8(),buffer.readUInt8(1)];
        const isPointer = (Buffer.from(firstTwoBytes).readUInt16BE() & 0xC000) === 0xC000;

        if (isPointer) {
            return Buffer.from(firstTwoBytes).readUInt16BE() ^ Buffer.from([firstTwoBytes[0], 0x00]).readUInt16BE()
        }
        return 0
    }

    peekName(start) {
        const tmpBuff = this.buffer.subarray(start)
        let res = []
        let len = tmpBuff.readUInt8()
        let hasJumped = false

        let currIndex = 0

        while (len > 0 && !hasJumped) {
            const jump = this.getJump(tmpBuff.subarray(currIndex))

            if (jump) {
                hasJumped = true
                res.push(...this.peekName(jump).split('.'))
            } else {
                const labelPart = tmpBuff.subarray(currIndex+1,len +currIndex+1);

                res.push(labelPart.toString())
                currIndex += 1+len
                len = tmpBuff.readUInt8(currIndex)
            }
        }

        return res.join('.')
    }

    peekLeftBytes() {
        console.log(this.buffer.subarray(this.currentPos))
    }
}

module.exports= {BufferReader}
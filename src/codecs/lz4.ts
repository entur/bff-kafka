import lz4 from 'lz4'
import { Buffer } from 'buffer'

export default {
    async compress(encoder: { buffer: Buffer }) {
        return lz4.encode(encoder.buffer)
    },

    async decompress(buffer: Buffer) {
        return lz4.decode(buffer)
    },
}

const Blockchain = require('./blockchain')

const bitcoin = new Blockchain()

bitcoin.createNewBlock(2359, 'afsdfadfasdf', 'fadsfasdfsfadsf')

bitcoin.createNewTransaction(500, 'Tuong', 'Thuong')

bitcoin.createNewBlock(1234, '64adfads', '624asfa')

console.log(bitcoin)

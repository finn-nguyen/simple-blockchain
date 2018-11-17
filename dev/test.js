const Blockchain = require('./blockchain')

const bitcoin = new Blockchain()

const previousHashBlock = '41324alkjhdfasdf'
const currentBlockData = [
  {
    amount: 10,
    sender: 'Tuong',
    recipient: 'Thuong'
  },
  {
    amount: 100,
    sender: 'Thuong',
    recipient: 'Tuong'
  },
  {
    amount: 65,
    sender: 'Tuong',
    recipient: 'Thuong'
  }
]

const nonce = bitcoin.proofOfWork(previousHashBlock, currentBlockData)

console.log(bitcoin.hashBlock(previousHashBlock, currentBlockData, nonce))
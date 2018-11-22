const sha256 = require('sha256')
const uuid = require('uuid/v1')
const currentNodeUrl = process.argv[3]

function Blockchain() {
  this.chain = []
  this.pendingTransactions = []
  this.currentNodeUrl = currentNodeUrl
  this.networkNodes = []
  this.createNewBlock(100, '0', '0')
}

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce: nonce,
    hash: hash,
    previousBlockHash: previousBlockHash
  }

  this.pendingTransactions = []
  this.chain.push(newBlock)
  return newBlock
}

Blockchain.prototype.getLastBlock = function() {
  const index = this.chain.length - 1
  if (index < 0) return null
  return this.chain[index]
}

Blockchain.prototype.createNewTransaction = function(amount, sender, recipient) {
  const newTransaction = {
    amount,
    sender,
    recipient,
    transactionId: uuid().split('-').join('')
  }
  return newTransaction
}

Blockchain.prototype.addTransactionToPendingTransaction = function(transactionObj) {
  this.pendingTransactions.push(transactionObj)
  return this.getLastBlock()['index'] + 1
}

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
  const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData)
  const hash = sha256(dataAsString)
  return hash
}

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
  let nonce = 0
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce)
  while (hash.substring(0, 4) !== '0000') {
    nonce++
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce)
  }
  return nonce
}

Blockchain.prototype.chainIsValid = function(blockchain) {
  let validChain = true
  for (let i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i]
    const prevBlock = blockchain[i-1]
    const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce'])
    if (blockHash.substring(0, 4) !== '0000') validChain = false
    if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false
  }
  const genesisBlock = blockchain[0]
  const correctNonce = genesisBlock['nonce'] === 100
  const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0'
  const correctHash = genesisBlock['hash'] === '0'
  const correctTransactions = genesisBlock['transactions'].length === 0
  if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) {
    validChain = false
  }
  return validChain
}

Blockchain.prototype.getBlock = function(blockHash) {
  return this.chain.find(block => block.hash === blockHash)
}

Blockchain.prototype.getTransaction = function(transactionId) {
  let correctBlock = null
  let correctTransaction = null
  this.chain.forEach(block => {
    block.transactions.forEach(transaction => {
      if (transaction.transactionId === transactionId) {
        correctBlock = block
        correctTransaction = transaction
      }
    })
  })
  return {
    transaction: correctTransaction,
    block: correctBlock
  }
}

Blockchain.prototype.getAddressData = function(address) {
  const addressTransactions = []
  this.chain.forEach(block => {
    block.transactions.forEach(transaction => {
      if (transaction.sender === address || transaction.recipient === address) {
        addressTransactions.push(transaction)
      }
    })
  })
  let addressBalance = 0
  addressTransactions.forEach(transaction => {
    if (transaction.recipient === address) {
      addressBalance += transaction.amount
    } else if (transaction.sender === address) {
      addressBalance -= transaction.amount
    }
  })
  return {
    addressTransactions,
    addressBalance
  }
}

module.exports = Blockchain

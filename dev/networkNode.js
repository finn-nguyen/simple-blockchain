const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const Blockchain = require('./blockchain')
const uuid = require('uuid/v1')
const nodeAddress = uuid().split('-').join('')
const port = process.argv[2]
const rq = require('request-promise')

const bitcoin = new Blockchain()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/blockchain', (req, res) => {
  res.send(bitcoin)
})

app.post('/transaction', (req, res) => {
  const { newTransaction } = req.body
  const blockIndex = bitcoin.addTransactionToPendingTransaction(newTransaction)
  res.json({ note: `Transaction will be added in block ${blockIndex}`})
})

app.post('/transaction/broadcast', (req, res) => {
  const { amount, sender, recipient } = req.body
  const newTransaction = bitcoin.createNewTransaction(amount, sender, recipient)
  bitcoin.addTransactionToPendingTransaction(newTransaction)

  const requestPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: 'POST',
      body: { newTransaction },
      json: true
    }
    requestPromises.push(rq(requestOptions))
  })

  Promise.all(requestPromises)
    .then(result => {
      res.json({ note: 'Transaction created & broadcast successfully.' })
    })
})

app.get('/mine', (req, res) => {
  const lastBlock = bitcoin.getLastBlock()
  const previousBlockHash = lastBlock['hash']
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock['index'] + 1
  }
  const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData)
  const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce)
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash)
  
  const requestPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/receive-new-block',
      method: 'POST',
      body: { newBlock },
      json: true
    }
    requestPromises.push(rq(requestOptions))
  })
  
  Promise.all(requestPromises)
  .then(result => {
    const requestOptions= {
      uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
      method: 'POST',
      body: {
        amount: 12.5,
        sender: "00",
        recipient: nodeAddress
      },
      json: true
    }
    return rq(requestOptions)
  })
  .then(result => {
    res.json({
      note: 'New block mined successfully',
      block: newBlock
    })
  })
  .catch(err => console.log(err))
})

app.post('/receive-new-block', (req, res) => {
  const { newBlock } = req.body
  const lastBlock = bitcoin.getLastBlock()
  const correctHash = lastBlock.hash === newBlock.previousBlockHash
  const correctIndex = lastBlock['index'] + 1 === newBlock.index
  if(correctHash && correctIndex) {
    bitcoin.chain.push(newBlock)
    bitcoin.pendingTransactions = []
    res.json({
      not: 'New block receive and accepted',
      newBlock
    })
  } else {
    res.json({
      note: 'New block rejected',
      newBlock
    })
  }
})

// register a node and broadcast it the network
app.post('/register-and-broadcast-node', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl
  if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1 && newNodeUrl != bitcoin.currentNodeUrl) {
    bitcoin.networkNodes.push(newNodeUrl)
  }
  const registerNodesPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: { newNodeUrl },
      json: true
    }
    registerNodesPromises.push(rq(requestOptions))
  })
  Promise.all(registerNodesPromises)
  .then(data => {
    const bulkRegisterOptions = {
      uri: newNodeUrl + '/register-nodes-bulk',
      method: 'POST',
      body: { allNetWorkNodes: [ ...bitcoin.networkNodes, bitcoin.currentNodeUrl ] },
      json: true
    }
    return rq(bulkRegisterOptions)
  })
  .then(data => {
    res.json({ note: 'New node registered with network successfully'})
  })
})

// register a node with the network
app.post('/register-node', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl
  const nodeNotInNetwork = bitcoin.networkNodes.indexOf(newNodeUrl) == -1
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl
  if(nodeNotInNetwork && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl)
  res.json({ note: 'New node registered successfully with node' })
})

app.post('/register-nodes-bulk', (req, res) => {
  const allNetWorkNodes = req.body.allNetWorkNodes
  allNetWorkNodes.forEach(networkNodeUrl => {
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1 && networkNodeUrl !== bitcoin.currentNodeUrl
    if(nodeNotAlreadyPresent) bitcoin.networkNodes.push(networkNodeUrl)
  })
  res.json({ note: 'Bulk registration successful.'})
})

app.get('/consensus', (req, res) => {
  const requestPromises = []
  bitcoin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/blockchain',
      method: 'GET',
      json: true
    }
    requestPromises.push(rq(requestOptions))
  })
  Promise.all(requestPromises)
    .then(blockchains => {
      const currentChainLength = bitcoin.chain.length
      let maxChainLength = currentChainLength
      let newLongestChain = null
      let newPendingTransactions = null
      blockchains.forEach(blockchain => {
        if (blockchain.chain.length > maxChainLength) {
          maxChainLength = blockchain.chain.length
          newLongestChain = blockchain.chain
          newPendingTransactions = blockchain.pendingTransactions
        }
      })
      if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))) {
        res.json({
          note: 'Current chain has not been replaced',
          chain: bitcoin.chain
        })
      } else if (newLongestChain && bitcoin.chainIsValid(newLongestChain)) {
        bitcoin.chain = newLongestChain
        bitcoin.pendingTransactions = newPendingTransactions
        res.json({
          note: 'This chain has been replaced',
          chain: bitcoin.chain
        })
      }
    })
})

app.get('/block/:blockHash', (req, res) => {
  const block = bitcoin.getBlock(req.params.blockHash)
  res.json({
    block
  })
})

app.get('/transaction/:transactionId', (req, res) => {
  const transaction = bitcoin.getTransaction(req.params.transactionId)
  res.json({
    ...transaction
  })
})

app.get('/address/:address', (req, res) => {
  const addressData = bitcoin.getAddressData(req.params.address)
  return res.json({
    addressData
  })
})

app.get('/block-explorer', (req, res) => {
  res.sendFile('./block-explorer/index.html', { root: __dirname })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
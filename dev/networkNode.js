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
  const { amount, sender, recipient } = req.body
  const blockIndex = bitcoin.createNewTransaction(amount, sender, recipient)
  res.json({ note: `Transaction will be added in block ${blockIndex}`})
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
  console.log(blockHash)
  bitcoin.createNewTransaction(1.5, '00', nodeAddress)
  const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash)
  res.json({
    note: 'New block mined successfully',
    block: newBlock
  })
})

// register a node and broadcast it the network
app.post('/register-and-broadcast-node', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl
  if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
const Blockchain = require('./blockchain')

const bitcoin = new Blockchain()

const bc1 = {
  "chain": [
      {
          "index": 1,
          "timestamp": 1542851999209,
          "transactions": [],
          "nonce": 100,
          "hash": "0",
          "previousBlockHash": "0"
      },
      {
          "index": 2,
          "timestamp": 1542852243866,
          "transactions": [
              {
                  "amount": 20,
                  "sender": "Tuong",
                  "recipient": "Thanh",
                  "transactionId": "c282d080edfa11e8941419f6226e0a6f"
              },
              {
                  "amount": 40,
                  "sender": "Tuong",
                  "recipient": "Tang",
                  "transactionId": "d2dcc210edfa11e8941419f6226e0a6f"
              },
              {
                  "amount": 23,
                  "sender": "Leo",
                  "recipient": "KA",
                  "transactionId": "d8fa7660edfa11e8941419f6226e0a6f"
              }
          ],
          "nonce": 311343,
          "hash": "0000bab5b2e14e823f42faadf9e36ce3fedaac988dffdcf52b45ba80cab5256a",
          "previousBlockHash": "0"
      },
      {
          "index": 3,
          "timestamp": 1542852259514,
          "transactions": [
              {
                  "amount": 12.5,
                  "sender": "00",
                  "recipient": "50e6a5a0edfa11e8941419f6226e0a6f",
                  "transactionId": "e2e27920edfa11e8941419f6226e0a6f"
              },
              {
                  "amount": 17,
                  "sender": "Leo",
                  "recipient": "KA",
                  "transactionId": "e8750470edfa11e8941419f6226e0a6f"
              },
              {
                  "amount": 12,
                  "sender": "Leo",
                  "recipient": "KA",
                  "transactionId": "ea89dab0edfa11e8941419f6226e0a6f"
              }
          ],
          "nonce": 25580,
          "hash": "0000aba8d8618bb55421ad08fe979e9c43def993dac9d6af77a38cf9cc2ed65d",
          "previousBlockHash": "0000bab5b2e14e823f42faadf9e36ce3fedaac988dffdcf52b45ba80cab5256a"
      }
  ],
  "pendingTransactions": [
      {
          "amount": 12.5,
          "sender": "00",
          "recipient": "50e6a5a0edfa11e8941419f6226e0a6f",
          "transactionId": "ec32f6d0edfa11e8941419f6226e0a6f"
      }
  ],
  "currentNodeUrl": "http://localhost:3001",
  "networkNodes": []
}


console.log(bitcoin.chainIsValid(bc1.chain))
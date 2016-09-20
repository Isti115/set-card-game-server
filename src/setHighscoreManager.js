const MongoClient = require('mongodb').MongoClient

class SetHighscoreManager {
  constructor () {
    this.dbConnected = this.dbConnected.bind(this)
    this.clientRequested = this.clientRequested.bind(this)

    MongoClient.connect('mongodb://localhost/set', this.dbConnected)
  }

  dbConnected (err, db) {
    this.db = db
    this.scores = db.collection('scores')
  }

  clientRequested (ws) {
    console.log('requested')

    ws.on('message', (msg) => {
      this.clientMessaged(ws, msg)
    })

    ws.on('close', () => {
      this.clientClosed(ws)
    })
  }

  clientMessaged (ws, msg) {
    console.log('messaged')

    console.log(msg)

    this.scores.find({}).toArray((err, data) => {
      ws.send(JSON.stringify(data))
    })
  }

  clientClosed (ws) {
    console.log('closed')
  }
}

export default new SetHighscoreManager()

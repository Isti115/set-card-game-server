const MongoClient = require('mongodb').MongoClient

class SetHighscoreManager {
  constructor () {
    this.dbConnected = this.dbConnected.bind(this)
    this.clientRequested = this.clientRequested.bind(this)
    this.clientMessaged = this.clientMessaged.bind(this)
    this.clientClosed = this.clientClosed.bind(this)

    MongoClient.connect('mongodb://localhost/set', this.dbConnected)
  }

  dbConnected (err, db) {
    this.db = db
    this.scores = db.collection('scores')
  }

  clientRequested (ws) {
    console.log('requested')

    this.sendScores(ws)

    ws.on('message', (msg) => {
      this.clientMessaged(ws, msg)
    })

    ws.on('close', () => {
      this.clientClosed(ws)
    })
  }

  clientMessaged (ws, msg) {
    console.log(`messaged at: ${new Date()}`)
    console.log(msg)

    const message = JSON.parse(msg)

    if (message.type === 'score') {
      this.scores.insert({
        name: message.data.name,
        score: message.data.score,
        date: new Date()
      })
    }

    this.sendScores(ws)
  }

  clientClosed (ws) {
    console.log('closed')
  }

  sendScores (ws) {
    this.scores.find({}, { name: 1, score: 1, _id: 0 })
      .sort({score: -1}).limit(10).toArray((err, data) => {
      ws.send(JSON.stringify({
        type: 'globalScores',
        data: data
      }))
    })

    // const date = new Date()
    // const dayBegin = new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}T00:00:00+0200`)
    // const dayEnd = new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}T24:00:00+0200`)
    //
    // this.scores.find({ date: { $gt: dayBegin, $lt: dayEnd } }, { name: 1, score: 1, _id: 0 })
    //   .sort({score: -1}).limit(10).toArray((err, data) => {
    //   ws.send(JSON.stringify({
    //     type: 'dailyScores',
    //     data: data
    //   }))
    // })

  // db.scores.group({key: {name: 1}, initial: {max: 0},reduce: function(curr, result) {if(result.max < curr.score){result.max = curr.score}}})
  // db.scores.aggregate([{$group: {_id: '$name', maxScore: {$max: '$score'}}}])
  }
}

export default new SetHighscoreManager()

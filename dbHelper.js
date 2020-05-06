const mongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

const url = 'mongodb://localhost:27017'
const dbname = 'store'

let client

function connect() {
    mongoClient.connect(url, {})
        .then(connectedClient => {
            client = connectedClient
            console.log('Connected to DB')
        })
        .catch(error => {
            console.error('Could not connect to mongo client, error {}', error)
        })
}

function create() {
    const db = client.db(dbname)
    db.collection('items').drop()
    db.collection('items').insertMany(
        [{
            name: "Maska ochronna jednorazowa trzywarstwowa 3szt",
            price: 17.99
        },
            {
                name: "Płyn do rąk antybakteryjny do dezynfekcji 5 litrów",
                price: 115.00
            },
            {
                name: "Rękawice nitrylowe Sempercare GREEN 100 szt roz. L",
                price: 82.90
            },
            {
                name: "PRZYŁBICA OCHRONNA Z OKULARAMI NA TWARZ PRO-TECT",
                price: 24.99
            }],
        {}, (err, res) => {
            if (err) console.log(err)
            console.log(res.ops)
        })
}


async function getItems() {

    const db = client.db(dbname)
    return db.collection('items').find().toArray()
}

async function getItemsByIDs(ids) {
    let items = await getItems()
    items = items.filter(item => ids.includes(item._id.toString()))
    return items
}

async function removeItemsByIds(ids) {
    console.log(ids)
    const db = client.db(dbname)
    let notBought = ids
    let found = await getItems() // db.collection('items').find().toArray()
    for (let item of found) {
        if (notBought.includes(item._id.toString())) {
            notBought = notBought.filter(id => item._id.toString() !== id)
        }
    }
    console.log('asdf')
    if (notBought.length === 0) {
        db.collection('items')
            .deleteMany({'_id': {$in: ids.map(id => ObjectId(id))}})
            .then(r => console.log("DELETED " + r.deletedCount))
    }
    return notBought
}

module.exports = {
    connect,
    create,
    getItems,
    getItemsByIDs,
    removeItemsByIds
}
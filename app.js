const express = require('express')
const path = require('path')
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const dbHelper = require('./dbHelper')
const AsyncLock = require('async-lock');


const app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

//allows to pass parameters through body (_id)
app.use(bodyParser.urlencoded())

//set session
app.use(expressSession({
    name: 'session',
    secret: 'CvfVKB4',
}))

//create cart for session
app.use((req, res, next) => {
    if (!Array.isArray(req.session.cart)) {
        req.session.cart = []
    }
    next()
})

//connect to database once
dbHelper.connect();

app.get('/', async (req, res) => {
    try {
        let offer = await dbHelper.getItems()
        //remove from cart those which are in card
        offer = offer.filter(item => !(req.session.cart.includes(item._id.toString())))
        res.render('MainPage', {items: offer, cart: req.session.cart})
    } catch (error) {
        console.error('Error while fetching items: ' + error)
    }

})

// app.get('/resetCollection', (req, res) => {
//     dbHelper.create()
//     res.redirect('/')
// })

app.get('/cart', async (req, res) => {
    try {
        let cartItems = await dbHelper.getItemsByIDs(req.session.cart)
        let summary = 0.00
        for(const item of cartItems){
            summary += item.price
        }
        res.render('Cart', {items : cartItems, summary : summary.toFixed(2)});
    } catch (error) {
        console.error('Error while fetching cart: ' + error)
    }
})

app.post('/addToCart', (req, res) => {
    console.log("Adding item {] to cart.", req.body.id)
    req.session.cart.push(req.body.id)
    res.redirect('/')
})

app.post('/removeFromCart', (req, res) => {
    console.log("Removing item {] from cart.", req.body.id)
    req.session.cart = req.session.cart.filter(uuid => uuid !== req.body.id);
    res.redirect('/cart')
})

app.post('/buy', async (req, res, next) => {
    const lock = new AsyncLock()

    lock.acquire('delete',
        async function () {
            let incorrect = await dbHelper.removeItemsByIds(req.session.cart);
            if(incorrect.length === 0){
                req.session.cart = []
                res.redirect('/')
            }else{
                console.log(incorrect)
                req.session.cart = req.session.cart.filter(id => !(incorrect.includes(id)))
                res.redirect('/cart')
            }
        },
        function (err, ret) {console.log()},
        {});



});

app.listen(8080, () => console.log('Running at http://localhost:8080/'))


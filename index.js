const express = require('express');
const mysqldao = require('./mySQLdao');
const mongodbsao = require('./mongodbsao');
const app = express();
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const { isValidObjectId } = require('mongoose'); 

app.use(bodyParser.urlencoded({ extended: true })); //  inititalizing body parser
app.set('view engine', 'ejs'); // setting EJS as the view engine

//  getting the products
app.get('/products', (req, res) => {
    mysqldao.getUser()
        .then((data) => {
            res.render('index', { Users: data });
        })
        .catch((error) => {
            res.send(error);
        });
});

//  getting the homepage 
app.get('/', (req, res) => {
    res.send("<h1>Homepage Links </h1> <br></br><hr><a href='/stores'>Stores</a>, <a href='/managers'>Managers</a>, <a href='/products'>Products</a><hr>");
});

//  getting the stores
app.get('/stores', (req, res) => {
    mysqldao.getStore()
        .then((data) => {
            res.render('stores', { stores: data });
        })
        .catch((error) => {
            res.send(error);
        });
    
});

// routes to render the ejs addstore
app.get('/stores/add', (req, res) => {
    res.render('addStore');
});

// route to handle form subission for new stores
app.post('/stores/add', async (req, res) => {
    const storeId = req.body.sid;
    const location = req.body.loc;
    let mID = req.body.mgrid;

    try {
        // check to see if the store id exists
        const existingStoreID = await mysqldao.getStoreByStoreId(storeId);
        if (existingStoreID) {
            return res.status(400).send('Error: Store ID already exists');
        }

        // check to see if manager id exists
        const existingManager = await mongodbsao.findManagerByMId(mID);
        if (!existingManager) {
            return res.status(400).send('Error: This Manager ID does not exist');
        }

        // if both checks pass add manager if not throw error
        await mysqldao.addStore(storeId, location, mID);
        res.redirect('/stores');
    } catch (error) {
        console.log('Request body:', req.body);
        res.status(500).send('Server Error - not added');
    }
});

// route to update store id
app.get('/stores/update/:id', async (req, res) => {
    try {
        const store = await mysqldao.getStoreByStoreId(req.params.id);

        if (!store) {
            return res.status(404).send('Store not found');
        }

        res.render('updateStore', { store });
    } catch (error) {
        console.error('Error retrieving store for update:', error);
        res.status(500).send('Server Error');
    }
});

// update route to handle  form submission for stores
app.post('/stores/update/:id', async (req, res) => {
    const storeId = req.params.id;
    const newmgrid = req.body.newmgrid;
    const newLocation = req.body.newLocation;

    try {
        const updateResult = await mysqldao.updateStore(storeId, newmgrid, newLocation);

        if (updateResult.error) {            
            return res.status(400).send(updateResult.error);
        }
        res.redirect('/stores');
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).send('Server Error');
    }
});



// route for adding a manager
app.get('/managers/add', (req, res) => {
    res.render('addForm'); 
});

// route for adding a manager into mongodb
app.post('/managers/add', async (req, res) => {
    const mgrID = req.body._id; 
    const mgrSalary = parseInt(req.body.salary); // parsing the salary into an integers
    const mgrName = req.body.name;
   

    try {
        // check if manager exists by looking at their id
        const existingMgr = await mongodbsao.findManagerByMId(mgrID);
        if (existingMgr) {
            return res.status(400).send('Error: Manager ID already exists');
        }

        // if manager id doesnt exist already then add manager to db and redirect back to managers page
        await mongodbsao.addManager(mgrID, mgrName, mgrSalary);
        res.redirect('/managers');
    } catch (error) {
        console.error('Error adding manager:', error);
        res.status(500).send('Server Error');
    }
});



app.get('/managers', (req, res) => {
    mongodbsao.findAll()
        .then((documents) => {
            res.render('managers', { managers: documents });
        })
        .catch((error) => {
            console.error('Error retrieving managers:', error);
            res.status(500).send('Error retrieving managers');
        });
});

// route for deleting products
app.get('/products/delete/:pid', async (req, res) => {
    const productId = req.params.pid;

    try {
        // validate product is in store
        const productInStore = await mysqldao.getStoreByMID(productId);

        if (productInStore) {
            // if the product is in a store display an error message
            return res.status(400).send("<h1 style='font-weight: bold;'>Error Message <br><br><br><br> Cannot delete product " + productId + " because it is currently in stores.</h1><br> <a href='/'>Home</a>");
        }

        // if product does not exist in any of the stores delete
        await mysqldao.deleteProduct(productId);

        // redirect to products page once a product has been deleted
        res.redirect('/products');
    } catch (error) {
        console.error('Product Delteion Error: ', error);
        res.status(500).send('Server Error');
    }
});

app.listen(3000, () => console.log('Example app is listening on port 3000.'));
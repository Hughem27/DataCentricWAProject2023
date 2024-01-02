var pmysql = require('promise-mysql')

var pool

pmysql.createPool(
    {
        connectionLimit : 3,
        host : 'localhost',
        user : 'root',
        password : 'root',
        database : 'proj2023'
    })
    .then(p => 
       {
            pool = p
        })
    .catch(e => 
        {
            console.log("pool error:" + e)
        })

var getUser = function()
{
    return new Promise((resolve, reject)=>
    {
        pool.query('SELECT ps.productdesc, p.pid, l.sid, l.location, p.Price, ps.supplier FROM product_store p JOIN store l ON p.sid = l.sid JOIN product ps ON p.pid = ps.pid;')
            .then((data) => {
                resolve(data)
                console.log(data)
            })
            .catch(error => {
                reject(error)
                console.log(error)
            })
    })    
}

var getStore = function()
{
    return new Promise((resolve, reject)=>
    {
        pool.query('SELECT * FROM store')
            .then((data) => {
                resolve(data)
                console.log(data)
            })
            .catch(error => {
                reject(error)
                console.log(error)
            })

    })   
}

// add store function
var addStore = function (sid, mgrid, loc) 
{
    return new Promise((resolve, reject) => {
        console.log('Adding store:', sid, loc, mgrid); // Log the input values
        pool.query('INSERT INTO store (sid, location, mgrid) VALUES (?, ?, ?)', [sid, loc, grid])
            .then((result) => {
                resolve({ storeId: result.insertId });
                console.log('store added:', result);
            })
            .catch((error) => {
                
                reject(error);                
            });
    });
}

//  update store function
async function updateStore(storeId, mgrid, location) {
    try {
        // Check if the new data already exists in the database
        const existingStore = await getStoreMIDAndLoc(mgrid, location);

        if (existingStore && existingStore.sid !== storeId) {            
            return { error: 'error this store already exists' };
        }

        const query = 'UPDATE store SET mgrid = ?, location = ? WHERE sid = ?';
        const values = [mgrid, location, storeId];
        const result = await pool.query(query, values);

        return result;
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') 
        {
            return { 
                error: `<ul>
                           <li>Manager ID: ${mgrid} is already managing another store.</li>
                       </ul>`
            };
        }

        console.error('Error: ', error);
        throw error;
    }
}

async function getStoreByStoreId(storeId) {
    const query = 'SELECT * FROM store WHERE sid = ?';
    const result = await pool.query(query, [storeId]);
    return result.length > 0 ? result[0] : null;
}

// check for if product is in store
async function isProductInStore(productId) {
    const query = 'SELECT COUNT(*) as count FROM product_store WHERE pid = ?';
    const values = [productId];

    try {
        const result = await pool.query(query, values);
        return result[0].count > 0;
    } catch (error) {
        console.error('Error checking if product is in store:', error);      
    }
}

async function getStoreMIDAndLoc(managerId, location) {
    const query = 'SELECT * FROM store WHERE mgrid = ? AND location = ?';
    const values = [managerId, location];

    try {
        const result = await pool.query(query, values);
        return result.length > 0 ? result[0] : null;
    } catch (error) {
        throw error;
    }
}

async function getStoreByMID(mID) {
    try {
        const query = 'SELECT * FROM store WHERE mgrid = ?';
        const result = await pool.query(query, [mID]);
        return result[0];
    } catch (error) {       
        throw error;
    }
}



module.exports = { getUser, getStore, addStore, updateStore, getStoreByStoreId, isProductInStore, getStoreByMID};
    
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');

let db;
let coll;

// connecting to mongodb
MongoClient.connect('mongodb://127.0.0.1:27017')
    .then(client => {        
        db = client.db('proj2023MongoDB');
        coll = db.collection('managers');
    })
    .catch(error => console.log(error.message));

var findAll = function() {
    return new Promise((resolve, reject) => {
      if (!coll) {
        reject(new Error('Database connection could not be established'));
      } else {
        var cursor = coll.find();
        cursor.toArray()
          .then((documents) => {
            resolve(documents);
          })
          .catch((error) => {
            reject(error);
          });
      }
    });
  };  


async function addManager(_id, name, salary) {
  try {
      // check for if the manager id already exists
      const existingManager = await findManagerByMId(_id);
      if (existingManager) {
          throw new Error('This manager ID already exists');
      }

      // insert manager if id doesn't already exist
      const result = await coll.insertOne({ _id, name, salary });
      console.log('Manager added with ID:', result.insertedId);
      return result.insertedId; // reutnr the id
  } catch (error) {      
      throw error;
  }
}

async function findManagerByMId(_id) { //  search by '_id'
  try {
      const manager = await coll.findOne({ _id });
      if (!manager) {
          console.error(`Manager ID: ${_id} not found`);
          return null; 
      }
      return manager;
  } catch (error) {      
      throw error;
  }
}
module.exports = { addManager, findAll, findManagerByMId };
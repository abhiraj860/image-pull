const express = require('express');
const Docker = require('dockerode');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Docker setup
const docker = new Docker();
const imageName = 'mongo';
const containerName = 'mongo-container';
const mongoPort = 27017;
const mongoUrl = `mongodb://localhost:${mongoPort}`;

// Middleware to parse JSON bodies
app.use(express.json());

let isContainerRunning = false;
let container;

// Function to start the MongoDB container if not running
async function startMongoContainer() {
  if (isContainerRunning) {
    console.log('MongoDB container is already running.');
    return;
  }

  // Pull the Docker image
  console.log(`Pulling ${imageName}...`);
  await new Promise((resolve, reject) => {
    docker.pull(imageName, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(stream, onFinished, onProgress);

      function onFinished(err, output) {
        if (err) return reject(err);
        resolve(output);
      }

      function onProgress(event) {
        console.log(event);
      }
    });
  });

  console.log(`Pulled ${imageName}`);

  // Create and start a container from the pulled image
  console.log(`Creating and starting container from ${imageName}...`);
  container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    HostConfig: {
      PortBindings: { '27017/tcp': [{ HostPort: mongoPort.toString() }] },
    },
  });

  await container.start();
  console.log(`Container started from ${imageName}`);

  // Wait for a moment to ensure MongoDB is fully started
  await new Promise(resolve => setTimeout(resolve, 5000));

  isContainerRunning = true;
}

app.get('/pull-and-run', (req, res)=>{
  console.log("Outer Container healthy");
  return res.status(200).send('Outer container is running');
})


// Endpoint to pull and run the MongoDB Docker image and insert data
app.post('/pull-and-run', async (req, res) => {
  const mongoData = req.body;

  if (!mongoData || typeof mongoData !== 'object') {
    return res.status(400).send('Invalid input data');
  }

  try {
    // Start the MongoDB container if not already running
    await startMongoContainer();

    // Connect to the running MongoDB container and insert data
    console.log(`Connecting to MongoDB at ${mongoUrl}...`);
    const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('testdb');
    const collection = db.collection('testcollection');

    console.log('Inserting data into MongoDB...');
    await collection.insertOne(mongoData);

    console.log('Data inserted into MongoDB');

    await client.close();
    res.status(200).send('Data has been inserted into MongoDB');
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error pulling, running MongoDB container, or inserting data');
  }
});

// Function to stop and remove the MongoDB container
async function stopAndRemoveContainer() {
  if (container && isContainerRunning) {
    console.log('Stopping and removing MongoDB container...');
    try {
      await container.stop();
      await container.remove();
      console.log('MongoDB container stopped and removed');
    } catch (err) {
      console.error('Error stopping or removing container:', err);
    }
    isContainerRunning = false;
  }
}

// Graceful shutdown
function handleShutdown() {
  console.log('Shutting down server...');
  stopAndRemoveContainer().finally(() => {
    process.exit(0);
  });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

server.on('close', stopAndRemoveContainer);

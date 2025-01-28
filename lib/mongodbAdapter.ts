// This shares the same connection as Mongoose to prevent multiple connections.
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGO_URI as string;
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("Please add your Mongo URI to .env.local");
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value is preserved across module reloads
  if (!(global as any).mongo) {
    (global as any).mongo = { client: null, promise: null };
  }
  client = (global as any).mongo.client;
  clientPromise = (global as any).mongo.promise;
  if (!clientPromise) {
    client = new MongoClient(uri, options);
    (global as any).mongo.promise = client.connect();
    clientPromise = (global as any).mongo.promise;
  }
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

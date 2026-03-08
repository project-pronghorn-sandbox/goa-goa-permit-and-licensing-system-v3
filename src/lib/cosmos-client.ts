/**
 * Azure Cosmos DB client singleton
 * Uses DefaultAzureCredential for production (Managed Identity) and connection string for development.
 */

import { CosmosClient, Database, Container } from "@azure/cosmos";
import { DefaultAzureCredential } from "@azure/identity";
import { logger } from "./logger.js";

let cosmosClient: CosmosClient | null = null;
let database: Database | null = null;

// Database and container configuration
const DATABASE_NAME = process.env.COSMOS_DB_NAME || "pronghorn-permits";
const CONTAINERS = {
  applications: "applications",
  permitTypes: "permit-types",
  users: "users",
} as const;

// Partition keys for each container
export const PARTITION_KEYS = {
  applications: "/applicantId",
  permitTypes: "/id",
  users: "/id",
} as const;

/**
 * Initialize the Cosmos DB client.
 * Uses DefaultAzureCredential in production, connection string in development.
 */
export function getCosmosClient(): CosmosClient {
  if (cosmosClient) {
    return cosmosClient;
  }

  const endpoint = process.env.COSMOS_DB_ENDPOINT;
  const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;

  if (connectionString) {
    // Development mode: use connection string
    logger.info("Initializing Cosmos DB client with connection string");
    cosmosClient = new CosmosClient(connectionString);
  } else if (endpoint) {
    // Production mode: use DefaultAzureCredential (Managed Identity)
    logger.info("Initializing Cosmos DB client with DefaultAzureCredential");
    const credential = new DefaultAzureCredential();
    cosmosClient = new CosmosClient({
      endpoint,
      aadCredentials: credential,
    });
  } else {
    throw new Error(
      "Cosmos DB configuration missing. Set either COSMOS_DB_CONNECTION_STRING (development) or COSMOS_DB_ENDPOINT (production)."
    );
  }

  return cosmosClient;
}

/**
 * Get the Cosmos DB database instance.
 */
export function getDatabase(): Database {
  if (database) {
    return database;
  }

  const client = getCosmosClient();
  database = client.database(DATABASE_NAME);
  logger.info(`Connected to Cosmos DB database: ${DATABASE_NAME}`);
  return database;
}

/**
 * Get the applications container.
 * Partition key: /applicantId
 */
export function getApplicationsContainer(): Container {
  return getDatabase().container(CONTAINERS.applications);
}

/**
 * Get the permit-types container.
 * Partition key: /id
 */
export function getPermitTypesContainer(): Container {
  return getDatabase().container(CONTAINERS.permitTypes);
}

/**
 * Get the users container.
 * Partition key: /id
 */
export function getUsersContainer(): Container {
  return getDatabase().container(CONTAINERS.users);
}

/**
 * Initialize the database and containers with proper partition keys.
 * This is typically run during deployment or initial setup.
 */
export async function initializeDatabase(): Promise<void> {
  const client = getCosmosClient();

  // Create database if it doesn't exist
  const { database: db } = await client.databases.createIfNotExists({
    id: DATABASE_NAME,
  });
  logger.info(`Database "${DATABASE_NAME}" ready`);

  // Create containers with partition keys
  await db.containers.createIfNotExists({
    id: CONTAINERS.applications,
    partitionKey: { paths: [PARTITION_KEYS.applications] },
  });
  logger.info(`Container "${CONTAINERS.applications}" ready (partition key: ${PARTITION_KEYS.applications})`);

  await db.containers.createIfNotExists({
    id: CONTAINERS.permitTypes,
    partitionKey: { paths: [PARTITION_KEYS.permitTypes] },
  });
  logger.info(`Container "${CONTAINERS.permitTypes}" ready (partition key: ${PARTITION_KEYS.permitTypes})`);

  await db.containers.createIfNotExists({
    id: CONTAINERS.users,
    partitionKey: { paths: [PARTITION_KEYS.users] },
  });
  logger.info(`Container "${CONTAINERS.users}" ready (partition key: ${PARTITION_KEYS.users})`);

  // Update database reference
  database = db;
}

/**
 * Check if Cosmos DB is connected and responsive.
 * Used for health checks.
 */
export async function checkCosmosHealth(): Promise<{ status: "up" | "down"; message?: string }> {
  try {
    const db = getDatabase();
    await db.read();
    return { status: "up" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Cosmos DB health check failed", { error: message });
    return { status: "down", message };
  }
}

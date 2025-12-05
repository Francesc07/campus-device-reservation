function getEnvironmentName(): string {
  const slot = process.env.WEBSITE_SLOT_NAME;

  if (!slot) return "local";
  if (slot === "dev") return "dev";
  if (slot === "test") return "test";
  if (slot === "production") return "prod";

  return slot.toLowerCase();
}

const activeEnv = getEnvironmentName();

function getEnv(baseVar: string): string {
  const prefix = activeEnv === "local" ? "" : `${activeEnv.toUpperCase()}_`;

  const value =
    process.env[`${prefix}${baseVar}`] ||
    process.env[baseVar];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${prefix}${baseVar} or ${baseVar}`
    );
  }

  return value;
}

export const environment = {
  name: activeEnv,

  cosmos: {
    connectionString: getEnv("COSMOS_DB_CONNECTION_STRING"),
    databaseName: getEnv("COSMOS_DB_DATABASE_NAME"),
    reservationContainer: getEnv("COSMOS_DB_CONTAINER_NAME")
  },

  /**
   * Reservation publishes to its own topic.
   * Other services (Loan, Confirmation) subscribe to this topic.
   */
  eventGrid: {
    topicEndpoint: getEnv("EVENTGRID_TOPIC_ENDPOINT"),
    topicKey: getEnv("EVENTGRID_TOPIC_KEY")
  }
};

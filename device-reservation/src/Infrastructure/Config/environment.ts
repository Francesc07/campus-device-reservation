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
    reservationContainer: getEnv("COSMOS_RESERVATION_CONTAINER")
  },

  /**
   * Reservation publishes only to Confirmation Service.
   */
  eventGrid: {
    confirmEndpoint: getEnv("EVENTGRID_CONFIRM_TOPIC_ENDPOINT"),
    confirmKey: getEnv("EVENTGRID_CONFIRM_TOPIC_KEY")   // ✔ REQUIRED
  }
};

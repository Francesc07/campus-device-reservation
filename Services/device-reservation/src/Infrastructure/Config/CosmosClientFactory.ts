import { CosmosClient } from "@azure/cosmos";
import { environment } from "./environment";

export class CosmosClientFactory {
  private static client = new CosmosClient(environment.cosmos.connectionString);

  static getReservationContainer() {
    return this.client
      .database(environment.cosmos.databaseName)
      .container(environment.cosmos.reservationContainer);
  }
}

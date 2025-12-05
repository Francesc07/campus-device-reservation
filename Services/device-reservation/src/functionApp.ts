// src/functionApp.ts
// Central entrypoint for the new Node programming model.
// Just import each function module so their `app.http(...)` calls run.

import "./API/functions/test-http";
import "./API/functions/reservation-event-http";
// add other function files here as you create them

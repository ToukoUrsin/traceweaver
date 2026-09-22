export const examples = [
  {id:'deploy', name:'A release that never gets healthy', label:'01 / Deployment', description:'Two services, one missing health check, and a rollback inside a protected window.',
  policy:`# A health check must belong to the same service.
event Deploy(service: text, version: text);
event Healthy(service: text);
event Rollback(service: text);

promise Ready {
  on Deploy;
  expect Healthy within 30s;
  match service;
}

promise Stable {
  on Deploy;
  forbid Rollback for 20s;
  match service;
}`,
  trace:`# Synthetic release telemetry, not a production incident.
0s Deploy(service: "api", version: "v42");
5s Deploy(service: "web", version: "v17");
12s Healthy(service: "web");
18s Rollback(service: "api");
40s Healthy(service: "api");`, initial:30000},
  {id:'coffee', name:'The right coffee, the wrong order', label:'02 / Coffee shop', description:'Matching names is not enough. Correlate each drink with its order and watch the deadline.',
  policy:`event Order(order: number, drink: text);
event Served(order: number, drink: text);

promise FreshCoffee {
  on Order;
  expect Served within 2m;
  match order, drink;
}`,
  trace:`# Entirely authored fixture; no customer records.
0s Order(order: 101, drink: "flat white");
10s Order(order: 102, drink: "espresso");
40s Served(order: 101, drink: "espresso");
70s Served(order: 102, drink: "espresso");
150s Served(order: 101, drink: "flat white");`,initial:120000},
  {id:'backup', name:'A backup is not a restore test', label:'03 / Data care', description:'A backup must pass a restore check. Deletion must wait out a ten-minute retention window.',
  policy:`event Backup(dataset: text, verified: bool);
event RestorePassed(dataset: text, verified: bool);
event Deleted(dataset: text);

promise Recoverable {
  on Backup;
  expect RestorePassed within 5m;
  match dataset, verified;
}

promise Retained {
  on Backup;
  forbid Deleted for 10m;
  match dataset;
}`,
  trace:`# Synthetic audit trail. No actual deletion occurs.
0s Backup(dataset: "invoices", verified: true);
1m Backup(dataset: "photos", verified: true);
2m RestorePassed(dataset: "invoices", verified: false);
3m RestorePassed(dataset: "photos", verified: true);
4m Deleted(dataset: "invoices");
6m RestorePassed(dataset: "invoices", verified: true);`,initial:300000}
];

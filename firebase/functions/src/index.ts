import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from './init';
import * as reports from './reports';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// Take the passed Event data and use it to generate an audit record of the change.
const saveAudit = function (
  change: functions.Change<functions.firestore.DocumentSnapshot>,
  context: functions.EventContext,
): Promise<FirebaseFirestore.WriteResult> {
  const docRef = db.collection('audits').doc();
  const audit = {
    what: change.before.ref,
    when: new Date(context.timestamp),
    type: context.eventType,
    who: null,
  };
  if (context.authType === 'USER') {
    audit.who = context.auth.uid;
  }
  const setAudit = docRef.set(audit);
  return setAudit;
};

// Connect the Audit recorder function to changes to the sites table itself.
export const observeChanges = functions.firestore
  .document('sites/{siteId}')
  .onWrite((change, context) => saveAudit(change, context));

// Connect the Audit recorder function to changes to subcollections of the sites table.
export const observeChangesSub = functions.firestore
  .document('sites/{siteId}/{collectionName}/{collectionId}')
  .onWrite((change, context) => saveAudit(change, context));

export const doCommissionReport = functions.https.onRequest((req, res) => {
  const siteid = req.query.siteid;
  const format = req.query.format;
  return reports.commissionReport(siteid, format as string, res);
});

export const doEnergySavingReport = functions.https.onRequest((req, res) => {
  // TEST Data
  /* [{"minute":2,"value":200},{"minute":3,"value":300},{"minute":4,"value":310},{"minute":5,"value":310},
   {"minute":6,"value":300},{"minute":7,"value":300},{"minute":8,"value":300},{"minute":9,"value":300},
   {"minute":10,"value":300},{"minute":11,"value":300},{"minute":12,"value":200},{"minute":13,"value":300},
   {"minute":14,"value":310},{"minute":15,"value":310},
   {"minute":16,"value":300},{"minute":17,"value":300},{"minute":18,"value":300},{"minute":19,"value":300},
   {"minute":20,"value":300},{"minute":21,"value":300},{"minute":22,"value":200},{"minute":23,"value":300},
   {"minute":24,"value":310},{"minute":25,"value":310},
   {"minute":26,"value":300},{"minute":27,"value":300},{"minute":28,"value":300},{"minute":29,"value":300},
   {"minute":30,"value":300},{"minute":31,"value":300}] */

  // The following is needed if we want to use a GET. Use only for testing.
  // const siteid = req.query.siteid;
  // const data = JSON.parse(req.query.data);
  // const name = req.query.name;
  // return reports.energyReport(siteid, data, name, res);

  // The following is needed for POST. We use POST outside of testing
  // as GET queries only support a limited data size.
  const siteid = req.body.siteid;
  const data = req.body.data;
  const name = req.body.name;
  const max = req.body.max || 0;
  return reports.energyReport(siteid, data, max, name, res);
});

// Uptime Robot Health Check.
export const ping = functions.https.onRequest((req, res) => {
  const siteid = 'qdwpxuwU4HelnZwjD9tY';
  return admin
    .firestore()
    .collection('sites')
    .doc(siteid)
    .get()
    .then((snapshot) => {
      res.send('1');
    })
    .catch((err) => {
      res.statusCode = 500;
      res.send('0');
    });
});

// export const searchSite = functions.https.onRequest((req, res) => {
//   const search = req.query.search;
//   return admin
//     .firestore()
//     .collection('sites')
//     .get()
//     .then(snapshot =>
//       res.json(snapshot.docs
//         .filter(doc => doc.get('name').indexOf(search) >= 0)
//         .map(doc => ({ ...doc.data(), id: doc.id }))));
// });

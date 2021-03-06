const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const postUtils = require('../../utils/post-utils');
const BusinessLogicManager = require('../../utils/business-logic-manager');

/**
 * Performs all operations necessary to create a master Order record and its associated flavour records.
 *
 * Example of incomingObj
 *
 *  orders: [
 *    {
 *      recordName: 'test abc',
 *      recordType: 'order',
 *      ...
 *      OrderLNG: {
 *        description: 'lng description'
 *        addRole: 'public',
 *        ...
 *      },
 *      OrderNRCED: {
 *        summary: 'nrced summary',
 *        addRole: 'public'
 *        ...
 *      }
 *    }
 *  ]
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @param {*} incomingObj see example
 * @returns object containing the operation's status and created records
 */
exports.createRecord = async function (args, res, next, incomingObj) {
  const flavourFunctions = {
    OrderLNG: this.createLNG,
    OrderNRCED: this.createNRCED
  }
  return await postUtils.createRecordWithFlavours(args, res, next, incomingObj, this.createMaster, flavourFunctions);
};

/**
 * Performs all operations necessary to create a master Order record.
 *
 * Example of incomingObj
 *
 *  orders: [
 *    {
 *      recordName: 'test abc',
 *      recordType: 'order',
 *      ...
 *      OrderLNG: {
 *        description: 'lng description'
 *        addRole: 'public',
 *        ...
 *      },
 *      OrderNRCED: {
 *        summary: 'nrced summary',
 *        addRole: 'public'
 *        ...
 *      }
 *    }
 *  ]
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @param {*} incomingObj see example
 * @param {*} flavourIds array of flavour record _ids
 * @returns created master order record
 */
exports.createMaster = function (args, res, next, incomingObj, flavourIds) {
  let Order = mongoose.model('Order');
  let order = new Order();

  order._schemaName = 'Order';

  // set integration references
  incomingObj._epicProjectId &&
    ObjectId.isValid(incomingObj._epicProjectId) &&
    (order._epicProjectId = new ObjectId(incomingObj._epicProjectId));
  incomingObj._sourceRefId &&
    ObjectId.isValid(incomingObj._sourceRefId) &&
    (order._sourceRefId = new ObjectId(incomingObj._sourceRefId));
  incomingObj._epicMilestoneId &&
    ObjectId.isValid(incomingObj._epicMilestoneId) &&
    (order._epicMilestoneId = new ObjectId(incomingObj._epicMilestoneId));

  // set permissions
  order.read = ['sysadmin'];
  order.write = ['sysadmin'];

  // set forward references
  if (flavourIds && flavourIds.length) {
    flavourIds.forEach(id => {
      if (ObjectId.isValid(id)) {
        order._flavourRecords.push(new ObjectId(id));
      }
    });
  }

  // set data
  incomingObj.recordName && (order.recordName = incomingObj.recordName);
  order.recordType = 'Order';
  incomingObj.recordSubtype && (order.recordSubtype = incomingObj.recordSubtype);
  incomingObj.dateIssued && (order.dateIssued = incomingObj.dateIssued);
  incomingObj.issuingAgency && (order.issuingAgency = incomingObj.issuingAgency);
  incomingObj.author && (order.author = incomingObj.author);

  incomingObj.legislation && incomingObj.legislation.act && (order.legislation.act = incomingObj.legislation.act);
  incomingObj.legislation &&
    incomingObj.legislation.regulation &&
    (order.legislation.regulation = incomingObj.legislation.regulation);
  incomingObj.legislation &&
    incomingObj.legislation.section &&
    (order.legislation.section = incomingObj.legislation.section);
  incomingObj.legislation &&
    incomingObj.legislation.subSection &&
    (order.legislation.subSection = incomingObj.legislation.subSection);
  incomingObj.legislation &&
    incomingObj.legislation.paragraph &&
    (order.legislation.paragraph = incomingObj.legislation.paragraph);
  incomingObj.legislationDescription && (order.legislationDescription = incomingObj.legislationDescription);

  order.issuedTo.read = ['sysadmin'];
  order.issuedTo.write = ['sysadmin'];
  incomingObj.issuedTo && incomingObj.issuedTo.type && (order.issuedTo.type = incomingObj.issuedTo.type);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.companyName &&
    (order.issuedTo.companyName = incomingObj.issuedTo.companyName);
  incomingObj.issuedTo && incomingObj.issuedTo.firstName && (order.issuedTo.firstName = incomingObj.issuedTo.firstName);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.middleName &&
    (order.issuedTo.middleName = incomingObj.issuedTo.middleName);
  incomingObj.issuedTo && incomingObj.issuedTo.lastName && (order.issuedTo.lastName = incomingObj.issuedTo.lastName);
  incomingObj.issuedTo && (order.issuedTo.fullName = postUtils.getIssuedToFullNameValue(incomingObj.issuedTo));
  incomingObj.issuedTo &&
    incomingObj.issuedTo.dateOfBirth &&
    (order.issuedTo.dateOfBirth = incomingObj.issuedTo.dateOfBirth);

  incomingObj.projectName && (order.projectName = incomingObj.projectName);
  incomingObj.location && (order.location = incomingObj.location);
  incomingObj.centroid && (order.centroid = incomingObj.centroid);
  incomingObj.outcomeStatus && (order.outcomeStatus = incomingObj.outcomeStatus);
  incomingObj.outcomeDescription && (order.outcomeDescription = incomingObj.outcomeDescription);
  incomingObj.documents && (order.documents = incomingObj.documents);

  // set meta
  order.addedBy = args.swagger.params.auth_payload.displayName;
  order.dateAdded = new Date();

  // set data source references
  incomingObj.sourceDateAdded && (order.sourceDateAdded = incomingObj.sourceDateAdded);
  incomingObj.sourceDateUpdated && (order.sourceDateUpdated = incomingObj.sourceDateUpdated);
  incomingObj.sourceSystemRef && (order.sourceSystemRef = incomingObj.sourceSystemRef);

  return order;
};

/**
 * Performs all operations necessary to create a LNG Order record.
 *
 * Example of incomingObj
 *
 *  orders: [
 *    {
 *      recordName: 'test abc',
 *      recordType: 'order',
 *      ...
 *      OrderLNG: {
 *        description: 'lng description'
 *        addRole: 'public',
 *        ...
 *      },
 *      OrderNRCED: {
 *        summary: 'nrced summary',
 *        addRole: 'public'
 *        ...
 *      }
 *    }
 *  ]
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @param {*} incomingObj see example
 * @returns created lng order record
 */
exports.createLNG = function (args, res, next, incomingObj) {
  let OrderLNG = mongoose.model('OrderLNG');
  let orderLNG = new OrderLNG();

  orderLNG._schemaName = 'OrderLNG';

  // set integration references
  incomingObj._epicProjectId &&
    ObjectId.isValid(incomingObj._epicProjectId) &&
    (orderLNG._epicProjectId = new ObjectId(incomingObj._epicProjectId));
  incomingObj._sourceRefId &&
    ObjectId.isValid(incomingObj._sourceRefId) &&
    (orderLNG._sourceRefId = new ObjectId(incomingObj._sourceRefId));
  incomingObj._epicMilestoneId &&
    ObjectId.isValid(incomingObj._epicMilestoneId) &&
    (orderLNG._epicMilestoneId = new ObjectId(incomingObj._epicMilestoneId));

  // set permissions and meta
  orderLNG.read = ['sysadmin'];
  orderLNG.write = ['sysadmin'];

  orderLNG.addedBy = args.swagger.params.auth_payload.displayName;
  orderLNG.dateAdded = new Date();

  // set master data
  incomingObj.recordName && (orderLNG.recordName = incomingObj.recordName);
  orderLNG.recordType = 'Order';
  incomingObj.recordSubtype && (orderLNG.recordSubtype = incomingObj.recordSubtype);
  incomingObj.dateIssued && (orderLNG.dateIssued = incomingObj.dateIssued);
  incomingObj.issuingAgency && (orderLNG.issuingAgency = incomingObj.issuingAgency);
  incomingObj.author && (orderLNG.author = incomingObj.author);

  incomingObj.legislation && incomingObj.legislation.act && (orderLNG.legislation.act = incomingObj.legislation.act);
  incomingObj.legislation &&
    incomingObj.legislation.regulation &&
    (orderLNG.legislation.regulation = incomingObj.legislation.regulation);
  incomingObj.legislation &&
    incomingObj.legislation.section &&
    (orderLNG.legislation.section = incomingObj.legislation.section);
  incomingObj.legislation &&
    incomingObj.legislation.subSection &&
    (orderLNG.legislation.subSection = incomingObj.legislation.subSection);
  incomingObj.legislation &&
    incomingObj.legislation.paragraph &&
    (orderLNG.legislation.paragraph = incomingObj.legislation.paragraph);
  incomingObj.legislationDescription && (orderLNG.legislationDescription = incomingObj.legislationDescription);

  orderLNG.issuedTo.read = ['sysadmin'];
  orderLNG.issuedTo.write = ['sysadmin'];
  incomingObj.issuedTo && incomingObj.issuedTo.type && (orderLNG.issuedTo.type = incomingObj.issuedTo.type);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.companyName &&
    (orderLNG.issuedTo.companyName = incomingObj.issuedTo.companyName);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.firstName &&
    (orderLNG.issuedTo.firstName = incomingObj.issuedTo.firstName);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.middleName &&
    (orderLNG.issuedTo.middleName = incomingObj.issuedTo.middleName);
  incomingObj.issuedTo && incomingObj.issuedTo.lastName && (orderLNG.issuedTo.lastName = incomingObj.issuedTo.lastName);
  incomingObj.issuedTo && (orderLNG.issuedTo.fullName = postUtils.getIssuedToFullNameValue(incomingObj.issuedTo));
  incomingObj.issuedTo &&
    incomingObj.issuedTo.dateOfBirth &&
    (orderLNG.issuedTo.dateOfBirth = incomingObj.issuedTo.dateOfBirth);

  incomingObj.projectName && (orderLNG.projectName = incomingObj.projectName);
  incomingObj.location && (orderLNG.location = incomingObj.location);
  incomingObj.centroid && (orderLNG.centroid = incomingObj.centroid);
  incomingObj.outcomeStatus && (orderLNG.outcomeStatus = incomingObj.outcomeStatus);
  incomingObj.outcomeDescription && (orderLNG.outcomeDescription = incomingObj.outcomeDescription);
  incomingObj.documents && (orderLNG.documents = incomingObj.documents);

  // set flavour data
  incomingObj.description && (orderLNG.description = incomingObj.description);

  // set data source references
  incomingObj.sourceDateAdded && (orderLNG.sourceDateAdded = incomingObj.sourceDateAdded);
  incomingObj.sourceDateUpdated && (orderLNG.sourceDateUpdated = incomingObj.sourceDateUpdated);
  incomingObj.sourceSystemRef && (orderLNG.sourceSystemRef = incomingObj.sourceSystemRef);

  // If incoming object has addRole: 'public' then read will look like ['sysadmin', 'public']
  if (incomingObj.addRole && incomingObj.addRole === 'public') {
    orderLNG.read.push('public');
    orderLNG.datePublished = new Date();
    orderLNG.publishedBy = args.swagger.params.auth_payload.displayName;
  }

  orderLNG = BusinessLogicManager.applyBusinessLogicOnPost(orderLNG);

  return orderLNG;
};

/**
 * Performs all operations necessary to create a NRCED Order record.
 *
 * Example of incomingObj
 *
 *  orders: [
 *    {
 *      recordName: 'test abc',
 *      recordType: 'order',
 *      ...
 *      OrderLNG: {
 *        description: 'lng description'
 *        addRole: 'public',
 *        ...
 *      },
 *      OrderNRCED: {
 *        summary: 'nrced summary',
 *        addRole: 'public'
 *        ...
 *      }
 *    }
 *  ]
 *
 * @param {*} args
 * @param {*} res
 * @param {*} next
 * @param {*} incomingObj see example
 * @returns created nrced order record
 */
exports.createNRCED = function (args, res, next, incomingObj) {
  let OrderNRCED = mongoose.model('OrderNRCED');
  let orderNRCED = new OrderNRCED();

  orderNRCED._schemaName = 'OrderNRCED';

  // set integration references
  incomingObj._epicProjectId &&
    ObjectId.isValid(incomingObj._epicProjectId) &&
    (orderNRCED._epicProjectId = new ObjectId(incomingObj._epicProjectId));
  incomingObj._sourceRefId &&
    ObjectId.isValid(incomingObj._sourceRefId) &&
    (orderNRCED._sourceRefId = new ObjectId(incomingObj._sourceRefId));
  incomingObj._epicMilestoneId &&
    ObjectId.isValid(incomingObj._epicMilestoneId) &&
    (orderNRCED._epicMilestoneId = new ObjectId(incomingObj._epicMilestoneId));

  // set permissions and meta
  orderNRCED.read = ['sysadmin'];
  orderNRCED.write = ['sysadmin'];

  orderNRCED.addedBy = args.swagger.params.auth_payload.displayName;
  orderNRCED.dateAdded = new Date();

  // set master data
  incomingObj.recordName && (orderNRCED.recordName = incomingObj.recordName);
  orderNRCED.recordType = 'Order';
  incomingObj.recordSubtype && (orderNRCED.recordSubtype = incomingObj.recordSubtype);
  incomingObj.dateIssued && (orderNRCED.dateIssued = incomingObj.dateIssued);
  incomingObj.issuingAgency && (orderNRCED.issuingAgency = incomingObj.issuingAgency);
  incomingObj.author && (orderNRCED.author = incomingObj.author);

  incomingObj.legislation && incomingObj.legislation.act && (orderNRCED.legislation.act = incomingObj.legislation.act);
  incomingObj.legislation &&
    incomingObj.legislation.regulation &&
    (orderNRCED.legislation.regulation = incomingObj.legislation.regulation);
  incomingObj.legislation &&
    incomingObj.legislation.section &&
    (orderNRCED.legislation.section = incomingObj.legislation.section);
  incomingObj.legislation &&
    incomingObj.legislation.subSection &&
    (orderNRCED.legislation.subSection = incomingObj.legislation.subSection);
  incomingObj.legislation &&
    incomingObj.legislation.paragraph &&
    (orderNRCED.legislation.paragraph = incomingObj.legislation.paragraph);
  incomingObj.legislationDescription && (orderNRCED.legislationDescription = incomingObj.legislationDescription);

  orderNRCED.issuedTo.read = ['sysadmin'];
  orderNRCED.issuedTo.write = ['sysadmin'];
  incomingObj.issuedTo && incomingObj.issuedTo.type && (orderNRCED.issuedTo.type = incomingObj.issuedTo.type);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.companyName &&
    (orderNRCED.issuedTo.companyName = incomingObj.issuedTo.companyName);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.firstName &&
    (orderNRCED.issuedTo.firstName = incomingObj.issuedTo.firstName);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.middleName &&
    (orderNRCED.issuedTo.middleName = incomingObj.issuedTo.middleName);
  incomingObj.issuedTo &&
    incomingObj.issuedTo.lastName &&
    (orderNRCED.issuedTo.lastName = incomingObj.issuedTo.lastName);
  incomingObj.issuedTo && (orderNRCED.issuedTo.fullName = postUtils.getIssuedToFullNameValue(incomingObj.issuedTo));
  incomingObj.issuedTo &&
    incomingObj.issuedTo.dateOfBirth &&
    (orderNRCED.issuedTo.dateOfBirth = incomingObj.issuedTo.dateOfBirth);

  incomingObj.projectName && (orderNRCED.projectName = incomingObj.projectName);
  incomingObj.location && (orderNRCED.location = incomingObj.location);
  incomingObj.centroid && (orderNRCED.centroid = incomingObj.centroid);
  incomingObj.outcomeStatus && (orderNRCED.outcomeStatus = incomingObj.outcomeStatus);
  incomingObj.outcomeDescription && (orderNRCED.outcomeDescription = incomingObj.outcomeDescription);
  incomingObj.documents && (orderNRCED.documents = incomingObj.documents);

  // set flavour data
  incomingObj.summary && (orderNRCED.summary = incomingObj.summary);

  // set data source references
  incomingObj.sourceDateAdded && (orderNRCED.sourceDateAdded = incomingObj.sourceDateAdded);
  incomingObj.sourceDateUpdated && (orderNRCED.sourceDateUpdated = incomingObj.sourceDateUpdated);
  incomingObj.sourceSystemRef && (orderNRCED.sourceSystemRef = incomingObj.sourceSystemRef);

  // If incoming object has addRole: 'public' then read will look like ['sysadmin', 'public']
  if (incomingObj.addRole && incomingObj.addRole === 'public') {
    orderNRCED.read.push('public');
    orderNRCED.datePublished = new Date();
    orderNRCED.publishedBy = args.swagger.params.auth_payload.displayName;
  }

  orderNRCED = BusinessLogicManager.applyBusinessLogicOnPost(orderNRCED);

  return orderNRCED;
};

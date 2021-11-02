import * as functions from 'firebase-functions';
import { db, storage } from './init';
import * as pdfkit from 'pdfkit';
import { Parser } from 'json2csv';
import * as chart from './chart';

const URLPREFIX = 'https://storage.googleapis.com/luxsmartcontroller-196104.appspot.com';

const asHex = num => `0x${Number(num).toString(16)}`;
const yesNo = b => (b ? 'Yes' : 'No');

const formatdate = function (dt: Date = new Date(), format: string = 'yyyymmddhhnnss') {
  const yyyy = `${dt.getFullYear()}`;
  const yy = yyyy.slice(-2);
  const m = `${dt.getMonth() + 1}`; // getMonth() is zero-based
  const mm = `00${m}`.slice(-2);
  const d = `${dt.getDate()}`;
  const dd = `00${d}`.slice(-2);
  const h = `${dt.getHours()}`;
  const hh = `00${h}`.slice(-2);
  const n = `${dt.getMinutes()}`;
  const nn = `00${n}`.slice(-2);
  const s = `${dt.getSeconds()}`;
  const ss = `00${s}`.slice(-2);
  let result = format
    .replace('yyyy', yyyy)
    .replace('mm', mm)
    .replace('dd', dd);
  result = result
    .replace('hh', hh)
    .replace('nn', nn)
    .replace('ss', ss);
  result = result
    .replace('yy', yy)
    .replace('m', m)
    .replace('d', d);
  result = result
    .replace('h', h)
    .replace('n', n)
    .replace('s', s);
  return result.trim();
};

const deleteifexists = function (filename, bucket) {
  if (filename) {
    bucket
      .file(filename)
      .exists()
      .then((existsarray) => {
        if (existsarray[0]) {
          bucket
            .file(filename)
            .delete()
            .then(result => console.log(`${filename} deleted.`))
            .catch(reason => console.error(reason));
        }
      })
      .catch(err => console.error(err));
  }
};

const getImageBuffer = async function (filename, bucket) {
  const file = bucket.file(filename);
  const res = await file.download();
  const image = res[0];
  const buf = Buffer.from(image, 'base64');
  return buf;
};

const generatePDF = async function (site: FirebaseFirestore.DocumentSnapshot, res) {
  try {
    // Installer and site details.
    const siteData = site.data();
    const {
      address, email, name, meshId, userRef, contactname, pin
    } = siteData;
    // Historial sites may not have a userRef.
    let installerName = null;
    let installerEmail = null;
    if (userRef) {
      const userDoc = await userRef.get();
      installerName = userDoc.get('displayName');
      installerEmail = userDoc.get('email');
    }

    // Installation summary.
    const zones = await site.ref
      .collection('zones')
      .orderBy('name')
      .get();
    const devices = await site.ref
      .collection('devices')
      .orderBy('name')
      .get();
    const calibrated = devices.docs.filter(d => d.get('calibrated'));

    const margins = {
      top: 27,
      bottom: 27,
      left: 27,
      right: 27,
    };
    const doc = new pdfkit({
      compress: true,
      layout: 'portrait',
      size: 'A4',
      margins,
      autoFirstPage: false,
    });
    const bucket = storage.bucket(functions.config().bucket);
    const when = formatdate();
    const filename = `site-${site.id}/commission${when}.pdf`;
    const file = bucket.file(filename);
    const previous = site.get('report_commission');
    deleteifexists(previous, bucket);
    const fs = file
      .createWriteStream({ metadata: { contentType: 'application/pdf' }, public: true })
      .on('finish', () => {
        site.ref
          .set({ report_commission: filename }, { merge: true })
          .then(result =>
            file
              .makePublic()
              .then(response => {
                res.send({
                  success: true,
                  filename,
                  publicurl: `${URLPREFIX}/${filename}`,
                })
              })
              .catch(err => res.send(err)))
          .catch(err => res.send(err));
      })
      .on('error', (err) => {
        console.error(err);
        res.send(err);
      });

    doc.pipe(fs);

    // const sizeHeading = 20;
    const sizeSubHeading = 12;
    const size = 10;
    const font = 'Helvetica';
    const fontBold = 'Helvetica-Bold';
    let w = 10;
    let y = doc.y;

    const imgBuffer = await getImageBuffer('images/logoPositive.png', bucket);

    // Add logo and page number to each page.
    let pageNumber = 0;
    doc.on('pageAdded', () => {
      pageNumber++;
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      doc.image(imgBuffer, doc.page.width - 100 - margins.right / 2, margins.top - 10, {
        fit: [100, 100],
      });

      doc.text(`Page ${pageNumber}`, doc.page.width - 100, doc.page.height - 30, {
        width: 100,
        align: 'center',
        lineBreak: false,
      });

      // Reset text writer position
      doc.text('', margins.top, margins.left);
      doc.page.margins.bottom = bottom;
    });

    // Add the first page
    doc.font(font).fontSize(size);
    doc.lineGap(5);
    doc.addPage();

    w = margins.left + doc.fontSize(size).widthOfString('Installation Location: ') + 10; // padding

    doc
      .font(fontBold)
      .fontSize(sizeSubHeading)
      .text('CUSTOMER DETAILS', margins.left, margins.top);
    y = doc.y;
    
    doc
      .font(font)
      .fontSize(size)
      .text('Company Name: ', margins.left)
      .text(name, w, y);
    y = doc.y;
    
    doc
    .text('Contact Name: ', margins.left)
    .text(contactname, w, y);
    y = doc.y;

    doc.text('Contact Email: ', margins.left).text(email, w, y);
    y = doc.y;
    doc
      .text('Installtion Location: ', margins.left)
      .text(address.address1, w, y)
      .text(address.address2)
      .text(address.suburb)
      .text(`${address.state} ${address.postcode}`);
    doc.moveDown();
    y = doc.y;
    doc
      .text('Site Key: ', margins.left)
      .font(fontBold)
      //.text(meshId || 'Unknown', w, y);
      .text(pin, w, y);
    doc.moveDown();

    const leftColY = doc.y;
    doc
      .font(fontBold)
      .fontSize(sizeSubHeading)
      .text('INSTALLER DETAILS', margins.left + 240, margins.top);
    y = doc.y;
    doc
      .font(font)
      .fontSize(size)
      .text('Installer Name: ')
      .text(installerName || 'Unknown', w + 220, y);
    y = doc.y;
    doc.text('Contact Details: ', margins.left + 240).text(installerEmail || 'Unknown', w + 220, y);

    // Move down below customer details section.
    y = leftColY;
    doc
      .font(fontBold)
      .fontSize(sizeSubHeading)
      .text('INSTALLATION SUMMARY', margins.left, y);
    y = doc.y;
    doc
      .fontSize(size)
      .font(font)
      .text('Number of Zones: ', margins.left)
      .text(zones.size, w, y);
    y = doc.y;
    doc.text('Number of Lights: ', margins.left).text(devices.size, w, y);
    y = doc.y;
    doc.text('Uncalibrated Lights: ', margins.left).text(devices.size - calibrated.length, w, y);
    doc.moveDown();
    y = doc.y;

    const cellSpacing = 80;

    if (zones.size) {
      doc
        .font(fontBold)
        .fontSize(sizeSubHeading)
        .text('ZONE DETAILS', margins.left);

      zones.docs.forEach((z) => {
        // Manually add page if we're near the bottom.
        if (doc.y >= doc.page.height - margins.bottom - margins.top - 50) {
          doc.addPage();
        }

        y = doc.y;
        doc
          .fontSize(size)
          .font(fontBold)
          .text('Zone Name ', margins.left)
          .font(font)
          .text(z.get('name'), w, y);
        y = doc.y;

        // Table header
        doc
          .font(fontBold)
          .text('Lux Level ', w)
          .text('PIR Activated', w + cellSpacing, y)
          .text('PIR Timer', w + cellSpacing * 2, y)
          .text('Standby Usage Level', w + cellSpacing * 3, y);
        y = doc.y;
        // Cells
        doc
          .font(font)
          .text(z.get('lux_active'), w)
          .text(yesNo(z.get('zone_PIR_enabled')), w + cellSpacing, y)
          .text(z.get('time_PIR_expired'), w + cellSpacing * 2, y)
          .text(`${z.get('power_saving')}%`, w + cellSpacing * 3, y);
        y = doc.y;

        // Table header
        if (devices.size === 0) return;
        doc
          .font(fontBold)
          .text('Light Name', margins.left, y)
          .text('Serial Number ', w, y)
          .text('Calibrated', w + cellSpacing, y);
        y = doc.y;
        doc.font(font);

        devices.docs.forEach((d) => {
          if (d.get('zoneid') !== z.id) return;

          // Manually add page if we're near the bottom.
          if (doc.y >= doc.page.height - margins.bottom - margins.top - 50) {
            doc.addPage();
          }

          y = doc.y;
          doc
            .text(d.get('name'), margins.left, y)
            .text(asHex(d.get('serial')), w, y)
            .text(yesNo(d.get('calibrated')), w + 80, y);
          y = doc.y;
        });
        doc.moveDown();
      });
    }

    doc.end();
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

export const generateCSV = async function (site: FirebaseFirestore.DocumentSnapshot) {
  // Installer and site details.
  const siteData = site.data();
  const {
    address, email, name, meshId, userRef, contactname, pin
  } = siteData;
  // Historial sites may not have a userRef.
  let installerName = null;
  let installerEmail = null;
  if (userRef) {
    const userDoc = await userRef.get();
    installerName = userDoc.get('displayName');
    installerEmail = userDoc.get('email');
  }

  // Installation summary.
  const zones = await site.ref
    .collection('zones')
    .orderBy('name')
    .get();
  const devices = await site.ref
    .collection('devices')
    .orderBy('name')
    .get();

  const table = [];
  const fields = [
    'Company Name',
    'Contact Name',
    'Contact Email',
    'Address1',
    'Address2',
    'Suburb',
    'State',
    'Postcode',
    'Site Key',
    'Zone Name',
    'Zone Serial Number',
    'Zone Lux',
    'Zone PIR Activated',
    'Zone PIR Timer',
    'Zone Standby Usage Level',
    'Light Name',
    'Light Serial Number',
    'Light Calibrated',
    'Installer Name',
    'Installer Email',
  ];
  const opts = { fields };
  devices.docs.forEach((d) => {
    const z = zones.docs.find(zone => zone.id === d.get('zoneid'));
    if (!z) return;
    table.push({
      'Company Name': name,
      'Contact Name': contactname,
      'Contact Email': email,
      Address1: address.address1,
      Address2: address.address2,
      Suburb: address.suburb,
      State: address.state,
      Postcode: address.postcode,
      //'Site Key': meshId,
      'Site Key': pin,
      'Zone Name': z.get('name'),
      'Zone Serial Number': asHex(z.get('meshId')),
      'Zone Lux': z.get('lux_active'),
      'Zone PIR Activated': yesNo(z.get('zone_PIR_enabled')),
      'Zone PIR Timer': z.get('time_PIR_expired'),
      'Zone Standby Usage Level': z.get('power_saving'),
      'Light Name': d.get('name'),
      'Light Serial Number': asHex(d.get('serial')),
      'Light Calibrated': yesNo(d.get('calibrated')),
      'Installer Name': installerName,
      'Installer Email': installerEmail,
    });
  });

  const parser = new Parser(opts);
  const csv = parser.parse(table);
  return csv;
};

export const saveAndOutputPNG = function (res, file, canvas, onFinish) {
  const out = file.createWriteStream({ metadata: { contentType: 'image/png' }, public: true });
  const stream = canvas.createPNGStream();
  out.on('finish', async () => {
    await onFinish();
  });
  stream.pipe(out);
};

export const saveAndOutputFile = async function (
  res,
  site,
  data,
  reportType = 'commission',
  filetype = 'pdf',
  contentType = 'application/pdf',
) {
  const bucket = storage.bucket(functions.config().bucket);
  const when = formatdate();
  const filename = `site-${site.id}/${reportType}${when}.${filetype}`;
  const file = bucket.file(filename);
  const previous = site.get(`report_${reportType}_${filetype}`);
  deleteifexists(previous, bucket);

  const onFinish = async () => {
    try {
      await site.ref.set({ [`report_${reportType}_${filetype}`]: filename }, { merge: true });
      await file.makePublic();
      res.send({success: true, filename, publicurl: `${URLPREFIX}/${filename}`});
    }
    catch (err) {
      console.log(err);
      res.send(err);
    }
  };

  if (filetype === 'png') {
    saveAndOutputPNG(res, file, data, onFinish);
  } else {
    const out = file.createWriteStream({ metadata: { contentType }, public: true });
    out
      .on('finish', async () => {
        await onFinish();
      })
      .on('error', (err) => {
        console.log(err);
        res.send(err);
      });
    out.end(data);
  }
};

export const commissionReport = function (siteid, format = 'pdf', res) {
  return db
    .collection('sites')
    .doc(`${siteid}`)
    .get()
    .then(async (site) => {
      if (format === 'pdf') {
        await generatePDF(site, res);
      } else if (format === 'csv') {
        const csv = await generateCSV(site);
        await saveAndOutputFile(res, site, csv, 'commission', format, 'text/csv');
      } else {
        res.send('0');
      }
    })
    .catch((error) => {
      console.log(error);
      res.send(error);
    });
};

export const energyReport = function (siteid, data, max, name, res) {
  return db
    .collection('sites')
    .doc(`${siteid}`)
    .get()
    .then(async (site) => {
      const canvas = chart.energySaving(data, max, name);
      await saveAndOutputFile(res, site, canvas, 'energy', 'png', 'image/png');
    })
    .catch((error) => {
      console.log(error);
      res.send(error);
    });
};

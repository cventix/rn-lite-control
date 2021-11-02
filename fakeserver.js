//
// File: fakeserver.js
//
const faker = require('faker');
const _ = require('lodash');

//
// Test JSON API
//

// faker.locale = 'en_IND';

const fakeserver = () => ({
  sites: _.times(20, index => ({
    id: index,
    customer: {
      name: faker.name.findName(),
      email: faker.internet.email(),
      address: {
        address1: faker.address.streetAddress(),
        address2: faker.address.secondaryAddress(),
        city: faker.address.city(),
        state: faker.address.state(),
        country: faker.address.country(),
      },
    },
    devices: _.times(5, () => ({
      id: faker.internet.mac(),
      name: faker.lorem.words(1),
      last_calibrated: faker.date.recent(10),
      on: faker.random.boolean,
    })),
    zones: _.times(2, zoneIndex => ({
      id: zoneIndex,
      name: faker.commerce.department(),
      lux_level: 100,
      devices: [1, 2, 3, 4, 5],
      on: faker.random.boolean,
      dimmable: faker.random.boolean,
      pir_activation: faker.random.boolean,
      schedule: [1, 2],
    })),
    groups: _.times(2, groupIndex => ({
      id: groupIndex,
      name: faker.commerce.department(),
      devices: [1, 2],
      on: faker.random.boolean,
      light_level: faker.random.number,
      timer: [],
    })),
    schedule: _.times(2, scheduleIndex => ({
      id: scheduleIndex,
      name: faker.company.bs(),
      days: [0, 2, 4],
      start_time: '10:00',
      end_time: '18:00',
      light_level: faker.random.number,
    })),
  })),
  help: {
    tutorial: _.times(2, tutorialIndex => ({
      id: tutorialIndex,
      content: faker.lorem.paragraphs(1),
    })),
  },
  login: {
    id: 1,
    email: 'thedarknight@wayneenterprises.com',
    mobile: '0423308987',
    username: 'Batman',
    password: 'bruce',
    name: {
      given: 'Bruce',
      family: 'Wayne',
    },
    company: {
      name: 'Wayne Enterprises',
      address: {
        address1: 'Secret Hideout',
        address2: '',
        city: 'Gotham',
        state: 'NY',
        country: 'United States',
      },
    },
    avatar: 'https://i.pinimg.com/originals/21/75/65/21756520fd48715a506661964c6ddf7a.jpg',
  },
});

module.exports = fakeserver;

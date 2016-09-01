
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

import Parse from 'parse/node';

const Page = Parse.Object.extend('Page');
const FAQ = Parse.Object.extend('FAQ');
const Session = Parse.Object.extend('Agenda');
const Artist = Parse.Object.extend('Artists');
const Notification = Parse.Object.extend('Notification');
const Map = Parse.Object.extend('Maps');

var {nodeInterface, nodeField} = nodeDefinitions(
  findObjectByGlobalId,
  objectToGraphQLType
);

function findObjectByGlobalId(globalId) {
  const {type, id} = fromGlobalId(globalId);
  const Ent = ({Page, FAQ, Session, Artist})[type];
  return new Parse.Query(Ent).get(id);
}

function objectToGraphQLType(obj) {
  switch (obj.className) {
    case 'Page':
      return AMFPageType;
    case 'Session':
      return AMFSessionType;
    case 'Artist':
      return AMFArtistType;
  }
  return null;
}

var USERS_SCHEDULE = {};

var AMFFriendType = new GraphQLObjectType({
  name: 'Friend',
  description: 'Facebook friend',
  fields: () => ({
    id: {
      type: GraphQLID,
    },
    name: {
      type: GraphQLString,
    },
    picture: {
      type: GraphQLString,
      resolve: (friend) => `https://graph.facebook.com/${friend.id}/picture`,
    },
    schedule: {
      type: new GraphQLList(AMFSessionType),
      description: 'Friends schedule',
      resolve: (friend, args) => new Parse.Query(Session)
        .containedIn('objectId', Object.keys(friend.schedule))
        .find(),
    },
  })
});

function loadFriends(rootValue) {
  return Parse.Cloud.run('friends', {user: rootValue});
}

function loadFriendsAttending(rootValue, session) {
  const {id} = session;
  return Parse.Cloud.run('friends', {user: rootValue})
    .then(friends => friends.filter(friend => !!friend.schedule[id]));
}

var AMFUserType = new GraphQLObjectType({
  name: 'User',
  description: 'A person who uses our app',
  fields: () => ({
    id: globalIdField('User'),
    name: {
      type: GraphQLString,
    },
    friends: {
      type: new GraphQLList(AMFFriendType),
      description: 'User friends who are also in the AMF app and enabled sharing',
      resolve: (user, args, {rootValue}) => loadFriends(rootValue),
    },
    notifications: {
      type: new GraphQLList(AMFNotificationType),
      resolve: () => new Parse.Query(Notification).find(),
    },
    faqs: {
      type: new GraphQLList(AMFFAQType),
      resolve: () => new Parse.Query(FAQ).find(),
    },
    pages: {
      type: new GraphQLList(AMFPageType),
      resolve: () => new Parse.Query(Page).find(),
    },
    config: {
      type: AMFConfigType,
      resolve: () => Parse.Config.get(),
    }
  }),
  interfaces: [nodeInterface],
});

var AMFMapType = new GraphQLObjectType({
  name: 'Map',
  description: 'A place at AMF venue',
  fields: () => ({
    id: globalIdField('Map'),
    name: {
      type: GraphQLString,
      resolve: (map) => map.get('name'),
    },
    map: {
      type: GraphQLString,
      resolve: (map) => map.get('x1') && map.get('x1').url(),
    },
  }),
});

var AMFSessionType = new GraphQLObjectType({
  name: 'Session',
  description: 'Represents AMF agenda item',
  fields: () => ({
    id: globalIdField('Session'),
    title: {
      type: GraphQLString,
      resolve: (session) => session.get('sessionTitle'),
    },
    slug: {
      type: GraphQLString,
      resolve: (session) => session.get('sessionSlug'),
    },
    day: {
      type: GraphQLInt,
      resolve: (session) => session.get('day'),
    },
    startTime: {
      type: GraphQLFloat,
      resolve: (session) => session.get('startTime').getTime(),
    },
    endTime: {
      type: GraphQLFloat,
      resolve: (session) => session.get('endTime').getTime(),
    },
    location: {
      type: AMFMapType,
      resolve: (session) => new Parse.Query(Map).equalTo('name', session.get('sessionLocation')).first(),
    },
    description: {
      type: GraphQLString,
      resolve: (session) => session.get('sessionDescription'),
    },
    artists: {
      type: new GraphQLList(AMFArtistType),
      resolve: (session) =>
        Promise.all((session.get('artists') || []).map(artist => artist.fetch())),
    },
    isAdded: {
      type: GraphQLBoolean,
      description: 'If the session has been added to persons schedule',
      resolve: (session, args, {rootValue}) => {
        return !!USERS_SCHEDULE[session.id];
      },
    },
    friends: {
      type: new GraphQLList(AMFFriendType),
      description: 'User\'s friends who attend this session',
      resolve: (session, args, {rootValue}) => loadFriendsAttending(rootValue, session),
    },
  }),
  interfaces: [nodeInterface],
});

var AMFPageType = new GraphQLObjectType({
  name: 'Page',
  description: 'Facebook pages',
  fields: () => ({
    id: globalIdField('Page'),
    title: {
      type: GraphQLString,
      resolve: (page) => page.get('title'),
    },
    url: {
      type: GraphQLString,
      resolve: (page) => `https://www.facebook.com/${page.get('alias')}`,
    },
    logo: {
      type: GraphQLString,
      resolve: (page) => {
        const logo = page.get('logo');
        if (logo) {
          return logo.url();
        } else {
          return `https://graph.facebook.com/${page.get('alias')}/picture?type=large`;
        }
      }
    }
  }),
  interfaces: [nodeInterface],
});

var AMFFAQType = new GraphQLObjectType({
  name: 'FAQ',
  description: 'Frequently asked questions',
  fields: () => ({
    id: globalIdField('FAQ'),
    question: {
      type: GraphQLString,
      resolve: (faq) => faq.get('question'),
    },
    answer: {
      type: GraphQLString,
      resolve: (faq) => faq.get('answer'),
    }
  }),
  interfaces: [nodeInterface],
});

var AMFArtistType = new GraphQLObjectType({
  name: 'Artist',
  fields: () => ({
    id: globalIdField('Artist'),
    name: {
      type: GraphQLString,
      resolve: (artist) => artist.get('artistName'),
    },
    title: {
      type: GraphQLString,
      resolve: (artist) => artist.get('artistTitle'),
    },
    picture: {
      type: GraphQLString,
      resolve: (artist) => artist.get('artistPic') && artist.get('artistPic').url(),
    }
  }),
  interfaces: [nodeInterface],
});

var AMFNotificationType = new GraphQLObjectType({
  name: 'Notification',
  fields: () => ({
    id: globalIdField('Notification'),
    text: {
      type: GraphQLString,
      resolve: (notification) => notification.get('text'),
    },
    url: {
      type: GraphQLString,
      resolve: (notification) => notification.get('url'),
    },
    time: {
      type: GraphQLFloat,
      description: 'Unix timestamp when the notification was sent.',
      resolve: (notification) => notification.get('createdAt').getTime(),
    }
  }),
});

var AMFConfigType = new GraphQLObjectType({
  name: 'Config',
  fields: () => ({
    wifiNetwork: {
      type: GraphQLString,
      resolve: (config) => config.get('wifiNetwork'),
    },
    wifiPassword: {
      type: GraphQLString,
      resolve: (config) => config.get('wifiPassword'),
    },
  }),
});

var AMFQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    viewer: {
      type: AMFUserType,
      resolve: (rootValue) => rootValue, // TODO: Authenticate user
    },
    schedule: {
      type: new GraphQLList(AMFSessionType),
      description: 'AMF agenda',
      resolve: (user, args) => new Parse.Query(Session)
        .ascending('startTime')
        .find(),
    },
    performer: {
      type: new GraphQLList(AMFArtistType),
      description: 'AMF performers',
      resolve: (user, args) => new Parse.Query(Artist)
        .ascending('name')
        .find(),
    },
  }),
});

var addToScheduleMutation = mutationWithClientMutationId({
  name: 'AddToSchedule',
  inputFields: {
    sessionId: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  outputFields: {
    session: {
      type: AMFSessionType,
      resolve: (payload) => new Parse.Query(Session).get(payload.id),
    },
  },
  mutateAndGetPayload: ({sessionId}, {rootValue}) => {
    const {type, id} = fromGlobalId(sessionId);
    if (type !== 'Session') {
      throw new Error(`Invalid type ${type}`);
    }
    USERS_SCHEDULE[id] = true;
    console.log(`Mutate ${id}`, rootValue);
    return {id};
  },
});

var AMFMutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    // Add your own mutations here
    addToSchedule: addToScheduleMutation,
  })
});

export var Schema = new GraphQLSchema({
  query: AMFQueryType,
  mutation: AMFMutationType,
});

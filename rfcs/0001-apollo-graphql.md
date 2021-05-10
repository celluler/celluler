# Using APOLLO GRAPHQL

- Start Date: 2021-05-07
- Target Major Version: [2.24.0](https://github.com/apollographql/apollo-server)
- Reference Issues: (fill in existing related issues, if any)
- Implementation PR: (leave this empty)

## Summary

Using Apollo GraphQL

## Basic example

```graphql
type LikePostMutationResponse implements MutationResponse {
  code: String!
  success: Boolean!
  message: String!
  post: Post
  user: User
}
```

```graphql
type Query {
  numberSix: Int! # Should always return the number 6 when queried
  numberSeven: Int! # Should always return 7
}
```

We want to define resolvers for the `numberSix` and `numberSeven` fields of the root Query type so that they always return `6` and `7` when they're queried.

Those resolver definitions look like this:

```javascript
const resolvers = {
  Query: {
    numberSix() {
      return 6;
    },
    numberSeven() {
      return 7;
    },
  },
};
```

## Motivation

We change to this because its support a lots of feature that need to improve the
performance and maintenance of code.]

Its also support modules dependence [federation](https://www.apollographql.com/docs/federation/managed-federation/overview/) that we need its to make every modules independency.

## Adoption strategy

List all modules then discuss how to make them dependence.
Should make another branch and apply for every modules.

## Unresolved questions

Optional, but suggested for first drafts. What parts of the design are still
TBD?

# octaview

Untangle your jungle of microservice dependencies. (Named for Marie
Octavie Coudreau, who explored the Amazon jungle from 1899 to 1906.)

## Status

Work in progress.

- Describe your services as a collection of JSON files: ID, name,
  description, dependencies, and URLs
- Octaview serves a website with an interactive graph
- The graph shows directed dependencies between labeled services
- Clicking on a service shows its information in a sidebar

## Demo

After installing the Leiningen build tool for Clojure:

```bash
lein run demo/settings.json
```

## TODO

Support the following interactions:

- "What is this service? Where can I find docs, source, monitoring?"
- "Show me only the things on the paths between A and B"
- "At a glance, are there any services with monitor alerts, and are
  they related?"

Represent and display the following types of information:

- Types of dependencies:
    - Direct call vs. communication through a queue (for the latter,
      is that a directed dependency? which direction?)
    - Data flow and freshness: Cached or not; read and/or write
    - Relationship with other dependencies: Calls made to serve
      inbound dependencies (request-path calls) vs. for maintaining
      service stability (e.g. signing keys)
    - Sync/async calls (async might include backfilling a cache, or
      fetching signing keys)
    - Format: HTTP, database connections, etc.
    - Locality: Across the network vs. local call vs. in-process
    - Intermediation: Via client-side or server-side load balancer, or
      no load-balancer at all
- Environments and variants of each service (which datacenter, which
  environment (qa/prod), which data partition if applicable)
- Server tags, genders, etc. -- how to locate them in an environment
- Links to source, operator manuals, documentation, metrics, monitors...
- Number of instances
- Current and recent health of instances (sparklines?)

## License

Source © Brightcove, Inc. 2016, authored by Tim McCormack; vendored
libraries have other ownsership and licensing. See COPYING.md for
details.

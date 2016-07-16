# octaview

Untangle your jungle of microservice dependencies. (Named for
[Marie Octavie Coudreau][wp-marie], who explored the Amazon jungle
from 1899 to 1906.)

[wp-marie]: https://en.wikipedia.org/wiki/Octavie_Coudreau

## Status

Work in progress.

- Describe your services as a collection of JSON files: ID, name,
  description, dependencies, and URLs
- Octaview serves a website with an interactive graph
- The graph shows directed dependencies between labeled services
- In **Explore** mode, clicking on a service shows its information in a
  sidebar
- In **Pathfinder** mode, clicking on two services will show the
  dependency chain from the first to the second

## Demo

After installing the [Leiningen][lein] build tool for Clojure:

[lein]: https://leiningen.org/

```bash
lein run demo/settings.json
```

## Format and example

Each service descriptor is a JSON file in a directory. The JSON data
structure is:

- `id`: A short, readable, unique ID string made of `[a-zA-Z0-9_-]+`,
  conventionally used as the filename as well. This is the only
  required field.
- `name`: Name of the service
- `desc`: Longer description (no formatting provided)
- `attrs`: Map of additional machine-readable key-value
  pairs. Suggested keys:
    - `team`: Canonicalized name of the team that maintains this service
- `dependencies`: Array of dependency maps with the following structure:
    - `id`: ID of another service this one depends on
- `links`: Array of link maps providing more information about the
  service, with the following structure:
    - `type`: Type of link, one of `doc` (documentation, a catch-all
      category), `source` (source code), or `monitor` (dashboards,
      alerts, graphs).
    - `name`: Text of link
    - `url`: URL of link (required)

Silly example:

```json
{
  "id": "dnaas",
  "name": "/dev/null",
  "desc": "Hosted instance of /dev/null-as-a-service",
  "attrs": {"team": "Deletion"},
  "dependencies": [
    {
      "id": "delete-auditor"
    },
    {
      "id": "trashdb"
    },
    {
      "id": "zookeeper"
    }
  ],
  "links": [
    {
      "type": "doc",
      "name": "Operator manual",
      "url": "https://intranet.example.com/19856195"
    },
    {
      "type": "source",
      "url": "https://github.com/example/example"
    },
    {
      "type": "monitor",
      "name": "Graphs",
      "url": "https://example.datadoghq.com/dash/31337/thing"
    }
  ]
}
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

Source © Brightcove, Inc. 2016, authored by Tim McCormack. License not yet
determined. Vendored libraries have other ownership and licensing. See
COPYING.md for details.

# app-2542: Graphing microservice dependencies

Work in progress.

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

- Types of dependencies (on/off request-path, sync/async, http/other,
  un/cached, read/write, network/localhost/in-process, via
  client/server/no load balancer)
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

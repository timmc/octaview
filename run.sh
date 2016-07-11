#!/bin/bash

set -eu

descriptors="$1"
port="$2"

localdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
build="$localdir/target"

[ -d "$build" ] || mkdir -- "$build"
[ -d "$build/lib" ] || mkdir -- "$build/lib"
[ -d "$build/data" ] || mkdir -- "$build/data"
cp -t "$build" "$localdir/src/"*
cp -t "$build/lib" "$localdir/vendor/"*
cp -- "$descriptors" "$build/data/services.json"

# Now that all relative paths have been resolved, feel free to change
# working directory

cd "$build"
echo "Go to http://localhost:$port/index.html"
python -mSimpleHTTPServer "$port"

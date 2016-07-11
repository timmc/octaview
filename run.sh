#!/bin/bash

set -eu
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

descriptors="$1"
port="$2"

cp -- "$1" "$DIR/descriptors.json"

echo "Go to http://localhost:$port/index.html"
(cd -- "$DIR"; python -mSimpleHTTPServer "$port")

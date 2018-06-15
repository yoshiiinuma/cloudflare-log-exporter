#!/bin/bash

curl -v -X POST -H 'Content-Type: application/x-ndjson' 'http://localhost:9200/_bulk' --data-binary "@test.json"

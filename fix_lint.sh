#!/bin/bash
sed -i 's/"lint": "eslint src --ext ts,tsx --report-unused-disable-directives "/"lint": "eslint src"/g' gui/frontend/package.json

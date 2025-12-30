#!/bin/bash

# Remove old web assets and use new build
# Ensure this runs from root
rm -rf web/static/*
cp -r web_new/dist/* web/static/

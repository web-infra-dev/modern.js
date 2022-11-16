#!/bin/bash
. /etc/profile

set -e

cp -R node_modules/@modern-js/main-doc/zh/* docs/
cp -R node_modules/@modern-js/main-doc/en/* i18n/en/docusaurus-plugin-content-docs/current/

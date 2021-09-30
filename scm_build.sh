#!/bin/bash
. /etc/profile

set -e

pnpm run setup

lerna publish

pnpm tags --auto-push

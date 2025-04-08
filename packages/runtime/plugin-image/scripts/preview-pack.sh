pnpm build
FILENAME=$(pnpm pack --json --pack-destination dist | jq '.filename' -r)
#HASH=$(md5sum ${FILENAME} | awk '{print $1}')
HASH=temp
DISTNAME="pack-${HASH:0:8}.tgz"
mv ${FILENAME} dist/${DISTNAME}

echo -e "\033[96mPreview Pack\033[0m"
echo "$(pwd)/dist/${DISTNAME}"

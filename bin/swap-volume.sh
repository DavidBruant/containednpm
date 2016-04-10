#!/bin/sh

# adapted from https://jpetazzo.github.io/2015/01/13/docker-mount-dynamic-volumes/

set -e
CONTAINER=$1
HOSTPATH=$2
CONTPATH=$3

REALPATH=$(x-readlink.sh $HOSTPATH)
FILESYS=$(df -P $REALPATH | tail -n 1 | awk '{print $6}')

while read DEV MOUNT JUNK
do [ $MOUNT = $FILESYS ] && break
done </proc/mounts
[ $MOUNT = $FILESYS ] # Sanity check!

while read A B C SUBROOT MOUNT JUNK
do [ $MOUNT = $FILESYS ] && break
done < /proc/self/mountinfo 
[ $MOUNT = $FILESYS ] # Moar sanity check!

SUBPATH=$(echo $REALPATH | sed s,^$FILESYS,,)
DEVDEC=$(printf "%d %d" $(stat --format "0x%t 0x%T" $DEV))

docker-enter $CONTAINER sh -c \
         "[ -b $DEV ] || mknod --mode 0600 $DEV b $DEVDEC"   
docker-enter $CONTAINER mkdir /tmpmnt   
docker-enter $CONTAINER mount $DEV /tmpmnt
docker-enter $CONTAINER mkdir -p $CONTPATH
docker-enter $CONTAINER mount -o bind /tmpmnt/$SUBROOT/$SUBPATH $CONTPATH
docker-enter $CONTAINER umount /tmpmnt
docker-enter $CONTAINER rmdir /tmpmnt
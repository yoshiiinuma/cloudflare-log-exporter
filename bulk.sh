#!/bin/bash

DATE=$1
HOUR=$2
MIN=$3
CNT=$4

if [ "$CNT" == "" ]
then
  CNT=1
fi

if [ "$DATE" == "" -o "$HOUR" == "" -o "$MIN" == "" ]
then
  echo ""
  echo " bulk.sh YYYY-MIN-DD hh mm [COUNT]"
  echo ""
  echo "   COUNT: [1-15]"
  echo ""
  exit 0
fi

while [ $CNT != 0 ]
do
  HH=$(printf "%02d" $HOUR)
  MM=$(printf "%02d" $MIN)

  echo "node dist/index.js -s ${DATE}T${HH}:${MM}:00 -r 1m -o"
  node dist/index.js -s ${DATE}T${HH}:${MM}:00 -r 1m -o

  MIN=$(($MIN + 1))
  if [ $MIN == 60 ]
  then
    MIN=0
    HOUR=$(($HH + 1))
  fi
  if [ $HOUR == 24 ]
  then
    HOUR=0
  fi
  CNT=$(($CNT - 1))
done 

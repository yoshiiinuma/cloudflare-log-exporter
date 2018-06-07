#!/bin/bash


for i in `seq -f "%02g" 0 5`;
do
  echo $i
  node dist/index.js -s 2018-06-06T10:$i:00 -r 1m -o
done 

#!/bin/bash
# Author:   Matthias Miller
# 
# This code only works when it is run from the root directory of the repository (codebase)

RED=`tput setaf 1`; GREEN=`tput setaf 2`; NC=`tput sgr0`;

PRE="${RED}[ GRAPHSTATEVIS ]${NC} ";
SFX="${NC}";
FOLDER="${GREEN}";

function c_echo() {	
    content=$1;
    echo "${PRE} ${content} ${SFX}";
}

echo "";
c_echo "${GREEN}>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>";
c_echo "${GREEN}>>> Starting the local development environment of GraphStateVis on http://localhost:8082/ >>>";
c_echo "${GREEN}>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>";
c_echo "";
c_echo ">> Content of ${RED}'codebase'${NC} root repository:";
ls;

c_echo "";
c_echo ">> Change directory to ${RED}'./app/' ${NC}:";
cd app;

c_echo "";
c_echo ">> Content of ${RED}'./app/' ${NC}directory:";
ls;

c_echo "";
c_echo ">> RUN ${RED}'npm install' ${NC}to install required node_modules before starting the environment:";
npm install --legacy-peer-deps;

c_echo ">> INSTALL ${RED}'webpack-dev-server' ${NC}globally.";
npm install webpack-dev-server -g

c_echo "";
c_echo ">> While waiting, please open your browser on ${RED}'http://localhost:8082/' ${NC}to view the app...";

c_echo "";
c_echo ">> RUN ${RED}'npm run development' ${NC}to start the local development server...";
npm run development;

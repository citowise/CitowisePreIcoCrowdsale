# Description

This is a Citowise Token smart contract. It relays heavily on [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/contracts/token/ERC20) source codes. For testing and compiling purposes it uses Ganache and Truffle.

## Prepare for testing

* Install Truffle.js

    npm install

* Install Ganache and launch it

    https://truffleframework.com/ganache

* Install Truffle.js

    npm install truffle-flattener -g

* Then

    truffle compile

* Then

    truffle migrate

* Finally run test

    truffle test

* Finally run test

    truffle-flattener contracts/CitowisePreIcoCrowdsale.sol > flattened_contracts/CitowisePreIcoCrowdsale.sol

## Tutorials and accompined materials

* Beginners guide - https://truffleframework.com/tutorials/pet-shop
* Truffle documantation - https://truffleframework.com/docs/truffle/getting-started/creating-a-project
* Ganache quickstart guide - https://truffleframework.com/docs/ganache/quickstart
* OpenZeppelin library - https://github.com/OpenZeppelin/openzeppelin-solidity
* Full list of Truffle solidity assertions - https://github.com/trufflesuite/truffle-core/blob/master/lib/testing/Assert.sol
* How to call methods - https://github.com/ethereum/wiki/wiki/JavaScript-API#contract-methods
* Contract interaction API - https://github.com/ethereum/wiki/wiki/JavaScript-API#contract-methods

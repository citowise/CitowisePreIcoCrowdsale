// /*global contract, config, it, assert*/
const { assertRevert } = require('./helpers/assertRevert');
const Token = artifacts.require("ERC20Mintable");
const CitowisePreIcoCrowdsale = artifacts.require("MockCitowisePreIcoCrowdsale");

const SECONDS_IN_A_DAY = 86400;
const BASE_RATE = 3888;
const ETH_EXPECTED = 19000;
const ETHER = 1000000000000000000;

const FirstPeriod = 4*SECONDS_IN_A_DAY;
const SecondPeriod = 10*SECONDS_IN_A_DAY;
const ThirdPeriod = 21*SECONDS_IN_A_DAY;
const AfterICO = 32*SECONDS_IN_A_DAY;

function roundValue(value) {
  return Math.round(value*1000)/1000;
}

contract("CitowisePreIcoCrowdsale", accounts => {

  beforeEach(async function () {
    this.owner     = accounts[0];
    this.wallet    = accounts[4];

    var currentTimestamp = new Date().getTime() / 1000;
    var startTime_timestamp = currentTimestamp + SECONDS_IN_A_DAY;
    var endTime_timestamp = currentTimestamp + 31*SECONDS_IN_A_DAY;

    this.token     = await Token.new({ from: this.owner });
    this.crowdsale = await CitowisePreIcoCrowdsale.new( startTime_timestamp, endTime_timestamp, this.wallet, this.token.address, { from: this.owner });
    await this.token.mint( this.crowdsale.address, BASE_RATE*ETH_EXPECTED*1.5*ETHER, { from: this.owner } );
  });

  describe('creation', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( FirstPeriod, { from: this.owner } );
    });

    it('has a creator assigned', async function () {
      const creator = await this.crowdsale.owner();
      const balance = await this.token.balanceOf.call(this.crowdsale.address);

      assert.equal(creator, this.owner, "wasn't in the first account");
      assert.equal(balance, BASE_RATE*ETH_EXPECTED*1.5*ETHER, "ballance is incorrect");
    })
  });

  describe('participation before starts', function() {
    it('is not allowed', async function () {
      var participant = accounts[1];

      await assertRevert(
        this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER })
      );
    });
  });

  describe('participation boundaries', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( FirstPeriod, { from: this.owner } );
    });

    it('is allowed', async function () {
      var participant = accounts[1];

      await assertRevert(
        this.crowdsale.sendTransaction({ from: participant, value: 0.4*ETHER })
      );
    });
  });

  describe('participation in first day', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( FirstPeriod, { from: this.owner } );
    });

    it('is allowed', async function () {
      var participant = accounts[1];

      const result = await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

      assert.equal(result.receipt.status, true);
    });

    describe('small amount', function() {

      it('should decreas contact balance after tokens sent', async function () {
        var participant = accounts[1];
        var expectedBonus = 1.4;

        const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
        const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceBefore = await this.token.balanceOf.call(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

        const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
        const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceAfter = await this.token.balanceOf.call(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 0);
        assert.equal(contractBalanceDifferenceRounded, -1*BASE_RATE*1.4);
        assert.equal(participantBalanceDifferenceRounded, 1*BASE_RATE*1.4);
      });

      it('forwards funds', async function () {
        var participant = accounts[1];
        var transactionCost = 0.009;

        const walletBalanceBefore = web3.eth.getBalance(this.wallet);
        const contractBalanceBefore = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceBefore = web3.eth.getBalance(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

        const walletBalanceAfter = web3.eth.getBalance(this.wallet);
        const contractBalanceAfter = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceAfter = web3.eth.getBalance(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 1);
        assert.equal(contractBalanceDifferenceRounded, 0);
        assert.equal(participantBalanceDifferenceRounded, -1*(1+transactionCost));
      });
    });

    describe('big amount', function() {

      it('should decreas contact balance after tokens sent', async function () {
        var participant = accounts[1];
        var expectedBonus = 1.5;

        const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
        const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceBefore = await this.token.balanceOf.call(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 10*ETHER });

        const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
        const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceAfter = await this.token.balanceOf.call(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 0);
        assert.equal(contractBalanceDifferenceRounded, -10*BASE_RATE*expectedBonus);
        assert.equal(participantBalanceDifferenceRounded, 10*BASE_RATE*expectedBonus);
      });

      it('forwards funds', async function () {
        var participant = accounts[1];
        var transactionCost = 0.009;

        const walletBalanceBefore = web3.eth.getBalance(this.wallet);
        const contractBalanceBefore = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceBefore = web3.eth.getBalance(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 10*ETHER });

        const walletBalanceAfter = web3.eth.getBalance(this.wallet);
        const contractBalanceAfter = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceAfter = web3.eth.getBalance(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 10);
        assert.equal(contractBalanceDifferenceRounded, 0);
        assert.equal(participantBalanceDifferenceRounded, -10.009);
      });
    });
  });

  describe('participation in first week', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( SecondPeriod, { from: this.owner } );
    });

    it('is allowed', async function () {
      var participant = accounts[1];

      const result = await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

      assert.equal(result.receipt.status, true);
    });

    describe('small amount', function() {
      it('should decreas contact balance after tokens sent', async function () {
        var participant = accounts[1];
        var expectedBonus = 1.3;

        const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
        const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceBefore = await this.token.balanceOf.call(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

        const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
        const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceAfter = await this.token.balanceOf.call(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 0);
        assert.equal(contractBalanceDifferenceRounded, roundValue(-1*BASE_RATE*expectedBonus));
        assert.equal(participantBalanceDifferenceRounded, roundValue(1*BASE_RATE*expectedBonus));
      });

      it('forwards funds', async function () {
        var participant = accounts[1];
        var transactionCost = 0.009;

        const walletBalanceBefore = web3.eth.getBalance(this.wallet);
        const contractBalanceBefore = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceBefore = web3.eth.getBalance(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

        const walletBalanceAfter = web3.eth.getBalance(this.wallet);
        const contractBalanceAfter = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceAfter = web3.eth.getBalance(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 1);
        assert.equal(contractBalanceDifferenceRounded, 0);
        assert.equal(participantBalanceDifferenceRounded, -1*(1+transactionCost));
      });
    });

    describe('big amount', function() {

      it('should decreas contact balance after tokens sent', async function () {
        var participant = accounts[1];
        var expectedBonus = 1.4;

        const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
        const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceBefore = await this.token.balanceOf.call(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 10*ETHER });

        const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
        const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceAfter = await this.token.balanceOf.call(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 0);
        assert.equal(contractBalanceDifferenceRounded, roundValue(-10*BASE_RATE*expectedBonus));
        assert.equal(participantBalanceDifferenceRounded, roundValue(10*BASE_RATE*expectedBonus));
      });

      it('forwards funds', async function () {
        var participant = accounts[1];
        var transactionCost = 0.009;

        const walletBalanceBefore = web3.eth.getBalance(this.wallet);
        const contractBalanceBefore = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceBefore = web3.eth.getBalance(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 10*ETHER });

        const walletBalanceAfter = web3.eth.getBalance(this.wallet);
        const contractBalanceAfter = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceAfter = web3.eth.getBalance(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 10);
        assert.equal(contractBalanceDifferenceRounded, 0);
        assert.equal(participantBalanceDifferenceRounded, -1*(10+transactionCost));
      });
    });
  });

  describe('participation in first month', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( ThirdPeriod, { from: this.owner } );
    });

    it('is allowed', async function () {
      var participant = accounts[1];

      const result = await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

      assert.equal(result.receipt.status, true);
    });

    describe('small amount', function() {
      it('should decreas contact balance after tokens sent', async function () {
        var participant = accounts[1];
        var expectedBonus = 1.2;

        const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
        const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceBefore = await this.token.balanceOf.call(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

        const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
        const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceAfter = await this.token.balanceOf.call(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 0);
        assert.equal(contractBalanceDifferenceRounded, roundValue(-1*BASE_RATE*expectedBonus));
        assert.equal(participantBalanceDifferenceRounded, roundValue(1*BASE_RATE*expectedBonus));
      });

      it('forwards funds', async function () {
        var participant = accounts[1];
        var transactionCost = 0.009;

        const walletBalanceBefore = web3.eth.getBalance(this.wallet);
        const contractBalanceBefore = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceBefore = web3.eth.getBalance(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

        const walletBalanceAfter = web3.eth.getBalance(this.wallet);
        const contractBalanceAfter = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceAfter = web3.eth.getBalance(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 1);
        assert.equal(contractBalanceDifferenceRounded, 0);
        assert.equal(participantBalanceDifferenceRounded, -1*(1+transactionCost));
      });
    });

    describe('big amount', function() {
      it('should decreas contact balance after tokens sent', async function () {
        var participant = accounts[1];
        var expectedBonus = 1.3;

        const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
        const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceBefore = await this.token.balanceOf.call(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 10*ETHER });

        const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
        const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
        const participantBalanceAfter = await this.token.balanceOf.call(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 0);
        assert.equal(contractBalanceDifferenceRounded, roundValue(-10*BASE_RATE*expectedBonus));
        assert.equal(participantBalanceDifferenceRounded, roundValue(10*BASE_RATE*expectedBonus));
      });

      it('forwards funds', async function () {
        var participant = accounts[1];
        var transactionCost = 0.009;

        const walletBalanceBefore = web3.eth.getBalance(this.wallet);
        const contractBalanceBefore = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceBefore = web3.eth.getBalance(participant);

        await this.crowdsale.sendTransaction({ from: participant, value: 10*ETHER });

        const walletBalanceAfter = web3.eth.getBalance(this.wallet);
        const contractBalanceAfter = web3.eth.getBalance(this.crowdsale.address);
        const participantBalanceAfter = web3.eth.getBalance(participant);

        const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
        const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
        const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
        const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
        const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
        const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

        assert.equal(walletBalanceDifferenceRounded, 10);
        assert.equal(contractBalanceDifferenceRounded, 0);
        assert.equal(participantBalanceDifferenceRounded, -10.009);
      });
    });
  });

  describe('participation after finish', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( AfterICO, { from: this.owner } );
    });

    it('is not allowed', async function () {
      var participant = accounts[1];

      await assertRevert(
        this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER })
      );
    });
  });

  describe('closing crowdsale', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( FirstPeriod, { from: this.owner } );
    });

    describe('by owner', function() {
      beforeEach(async function () {
        await this.crowdsale.closeCrowdsale( { from: this.owner } );
      });

      it('is allowed and participate after sale impossible', async function () {
        var participant = accounts[1];

        await assertRevert(
          this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER })
        );
      });
    });

    describe('by other person', function() {
      it('is not allowed and participate is possible', async function () {
        var participant = accounts[1];

        await assertRevert(
          this.crowdsale.closeCrowdsale( { from: participant } )
        );

        const result = await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

        assert.equal(result.receipt.status, true);
      });
    });
  });

  describe('currentBonus', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( ThirdPeriod, { from: this.owner } );
    });

    describe('by owner', function() {
      it('is allowed allowed to be set', async function () {
        var participant = accounts[1];

        const result = await this.crowdsale.setCurrentBonus( 50, { from: this.owner } );

        assert.equal(result.receipt.status, true);
      });

      describe('participation', function() {
        beforeEach(async function () {
          await this.crowdsale.setCurrentBonus( 50, { from: this.owner } );
        });

        it('is set for small amount', async function () {
          var participant = accounts[1];
          var expectedBonus = 1.5;

          const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
          const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
          const participantBalanceBefore = await this.token.balanceOf.call(participant);

          await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

          const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
          const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
          const participantBalanceAfter = await this.token.balanceOf.call(participant);

          const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
          const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
          const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
          const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
          const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
          const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

          assert.equal(walletBalanceDifferenceRounded, 0);
          assert.equal(contractBalanceDifferenceRounded, roundValue(-1*BASE_RATE*expectedBonus));
          assert.equal(participantBalanceDifferenceRounded, roundValue(1*BASE_RATE*expectedBonus));
        });

        it('is set for big amount', async function () {
          var participant = accounts[1];
          var expectedBonus = 1.5;

          const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
          const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
          const participantBalanceBefore = await this.token.balanceOf.call(participant);

          await this.crowdsale.sendTransaction({ from: participant, value: 10*ETHER });

          const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
          const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
          const participantBalanceAfter = await this.token.balanceOf.call(participant);

          const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
          const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
          const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
          const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
          const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
          const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

          assert.equal(walletBalanceDifferenceRounded, 0);
          assert.equal(contractBalanceDifferenceRounded, roundValue(-10*BASE_RATE*expectedBonus));
          assert.equal(participantBalanceDifferenceRounded, roundValue(10*BASE_RATE*expectedBonus));
        });
      });

      describe('canceled', function() {
        beforeEach(async function () {
          await this.crowdsale.setCurrentBonus( 50, { from: this.owner } );
          await this.crowdsale.cancelCurrentBonus( { from: this.owner } );
        });

        it('is set for small amount', async function () {
          var participant = accounts[1];
          var expectedBonus = 1.2;

          const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
          const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
          const participantBalanceBefore = await this.token.balanceOf.call(participant);

          await this.crowdsale.sendTransaction({ from: participant, value: 1*ETHER });

          const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
          const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
          const participantBalanceAfter = await this.token.balanceOf.call(participant);

          const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
          const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
          const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
          const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
          const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
          const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

          assert.equal(walletBalanceDifferenceRounded, 0);
          assert.equal(contractBalanceDifferenceRounded, roundValue(-1*BASE_RATE*expectedBonus));
          assert.equal(participantBalanceDifferenceRounded, roundValue(1*BASE_RATE*expectedBonus));
        });

        it('is set for big amount', async function () {
          var participant = accounts[1];
          var expectedBonus = 1.3;

          const walletBalanceBefore = await this.token.balanceOf.call(this.wallet);
          const contractBalanceBefore = await this.token.balanceOf.call(this.crowdsale.address);
          const participantBalanceBefore = await this.token.balanceOf.call(participant);

          await this.crowdsale.sendTransaction({ from: participant, value: 10*ETHER });

          const walletBalanceAfter = await this.token.balanceOf.call(this.wallet);
          const contractBalanceAfter = await this.token.balanceOf.call(this.crowdsale.address);
          const participantBalanceAfter = await this.token.balanceOf.call(participant);

          const walletBalanceDifference = (walletBalanceAfter.toNumber() - walletBalanceBefore.toNumber())/ETHER;
          const walletBalanceDifferenceRounded = roundValue(walletBalanceDifference);
          const contractBalanceDifference = (contractBalanceAfter.toNumber() - contractBalanceBefore.toNumber())/ETHER;
          const contractBalanceDifferenceRounded = roundValue(contractBalanceDifference);
          const participantBalanceDifference = (participantBalanceAfter.toNumber() - participantBalanceBefore.toNumber())/ETHER;
          const participantBalanceDifferenceRounded = roundValue(participantBalanceDifference);

          assert.equal(walletBalanceDifferenceRounded, 0);
          assert.equal(contractBalanceDifferenceRounded, roundValue(-10*BASE_RATE*expectedBonus));
          assert.equal(participantBalanceDifferenceRounded, roundValue(10*BASE_RATE*expectedBonus));
        });
      });
    });

    describe('by other person ', function() {
      it('is not allowed allowed to be set', async function () {
        var participant = accounts[1];

        await assertRevert(
          this.crowdsale.setCurrentBonus( 50, { from: participant } )
        );
      });
    });
  });


  describe('participation after cap', function() {
    beforeEach(async function () {
      await this.crowdsale.turnBackTime( FirstPeriod, { from: this.owner } );
    });

    it('is not allowed', async function () {
      var participant = accounts[2];

      this.crowdsale.sendTransaction({ from: participant, value: 17999*ETHER })

      await assertRevert(
        this.crowdsale.sendTransaction({ from: participant, value: 1200*ETHER })
      );
    });
  });


});

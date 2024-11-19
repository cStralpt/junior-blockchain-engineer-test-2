import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("LogisticsTracking", function () {
  async function deployLogisticsTrackingFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const LogisticsTracking = await hre.ethers.getContractFactory("LogisticsTracking");
    const logisticsTracking = await LogisticsTracking.deploy();

    return { logisticsTracking, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { logisticsTracking, owner } = await loadFixture(deployLogisticsTrackingFixture);

      expect(await logisticsTracking.owner()).to.equal(owner.address);
    });
  });

  describe("Delivery Recording", function () {
    it("Should record a new delivery and emit an event", async function () {
      const { logisticsTracking } = await loadFixture(deployLogisticsTrackingFixture);

      const sender = "Alice";
      const recipient = "Bob";
      const dispatchTime = Math.floor(Date.now() / 1000);
      const status = "dispatched";

      await expect(
        logisticsTracking.recordDelivery(sender, recipient, dispatchTime, status)
      )
        .to.emit(logisticsTracking, "DeliveryRecorded")
        .withArgs(1, sender, recipient, dispatchTime, status);

      const details = await logisticsTracking.getDeliveryDetails(1);

      expect(details.sender).to.equal(sender);
      expect(details.recipient).to.equal(recipient);
      expect(details.dispatchTime).to.equal(dispatchTime);
      expect(details.status).to.equal(status);
      expect(details.deliveryTime).to.equal(0);
    });

    it("Should increment package ID for each new delivery", async function () {
      const { logisticsTracking } = await loadFixture(deployLogisticsTrackingFixture);

      const sender1 = "Alice";
      const recipient1 = "Bob";
      const dispatchTime1 = Math.floor(Date.now() / 1000);
      const status1 = "dispatched";

      const sender2 = "Charlie";
      const recipient2 = "David";
      const dispatchTime2 = dispatchTime1 + 1000;
      const status2 = "in transit";

      await logisticsTracking.recordDelivery(sender1, recipient1, dispatchTime1, status1);
      await logisticsTracking.recordDelivery(sender2, recipient2, dispatchTime2, status2);

      const details1 = await logisticsTracking.getDeliveryDetails(1);
      const details2 = await logisticsTracking.getDeliveryDetails(2);

      expect(details1.sender).to.equal(sender1);
      expect(details2.sender).to.equal(sender2);
    });
  });

  describe("Status Updates", function () {
    it("Should update the delivery status and emit an event", async function () {
      const { logisticsTracking } = await loadFixture(deployLogisticsTrackingFixture);

      const sender = "Alice";
      const recipient = "Bob";
      const dispatchTime = Math.floor(Date.now() / 1000);
      const initialStatus = "dispatched";
      const newStatus = "delivered";

      await logisticsTracking.recordDelivery(sender, recipient, dispatchTime, initialStatus);

      await expect(logisticsTracking.updateStatus(1, newStatus))
        .to.emit(logisticsTracking, "StatusUpdated")
        .withArgs(1, initialStatus, newStatus);

      const details = await logisticsTracking.getDeliveryDetails(1);

      expect(details.status).to.equal(newStatus);
      expect(details.deliveryTime).to.be.greaterThan(0);
    });

    it("Should revert when updating status of a non-existent package", async function () {
      const { logisticsTracking } = await loadFixture(deployLogisticsTrackingFixture);

      await expect(logisticsTracking.updateStatus(1, "delivered")).to.be.revertedWith(
        "Delivery record not found"
      );
    });
  });

  describe("Retrieving Delivery Details", function () {
    it("Should return the correct delivery details", async function () {
      const { logisticsTracking } = await loadFixture(deployLogisticsTrackingFixture);

      const sender = "Alice";
      const recipient = "Bob";
      const dispatchTime = Math.floor(Date.now() / 1000);
      const status = "dispatched";

      await logisticsTracking.recordDelivery(sender, recipient, dispatchTime, status);

      const details = await logisticsTracking.getDeliveryDetails(1);

      expect(details.sender).to.equal(sender);
      expect(details.recipient).to.equal(recipient);
      expect(details.dispatchTime).to.equal(dispatchTime);
      expect(details.status).to.equal(status);
    });

    it("Should revert when fetching details of a non-existent package", async function () {
      const { logisticsTracking } = await loadFixture(deployLogisticsTrackingFixture);

      await expect(logisticsTracking.getDeliveryDetails(1)).to.be.revertedWith(
        "Delivery record not found"
      );
    });
  });

  describe("Retrieving All Package IDs", function () {
    it("Should return all recorded package IDs", async function () {
      const { logisticsTracking } = await loadFixture(deployLogisticsTrackingFixture);

      const sender1 = "Alice";
      const recipient1 = "Bob";
      const dispatchTime1 = Math.floor(Date.now() / 1000);
      const status1 = "dispatched";

      const sender2 = "Charlie";
      const recipient2 = "David";
      const dispatchTime2 = dispatchTime1 + 1000;
      const status2 = "in transit";

      await logisticsTracking.recordDelivery(sender1, recipient1, dispatchTime1, status1);
      await logisticsTracking.recordDelivery(sender2, recipient2, dispatchTime2, status2);

      const packageIds = await logisticsTracking.getAllPackageIds();

      expect(packageIds).to.deep.equal([1, 2]);
    });
  });
});

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LogisticsTracking {
    address public owner;

    struct Delivery {
        uint256 packageId;
        string sender;
        string recipient;
        uint256 dispatchTime;
        uint256 deliveryTime;
        string status;
        bool exists;
    }

    mapping(uint256 => Delivery) private deliveries;
    uint256[] private packageIds; // Array to store all package IDs
    uint256 private packageIdCounter;

    event DeliveryRecorded(
        uint256 packageId,
        string sender,
        string recipient,
        uint256 dispatchTime,
        string status
    );

    event StatusUpdated(uint256 packageId, string oldStatus, string newStatus);

    modifier onlyOwner() {
        require(msg.sender == owner, "Access restricted to owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        packageIdCounter = 1; // Start package IDs from 1
    }

    function recordDelivery(
        string memory sender,
        string memory recipient,
        uint256 dispatchTime,
        string memory status
    ) public onlyOwner returns (uint256) {
        uint256 packageId = packageIdCounter;
        deliveries[packageId] = Delivery({
            packageId: packageId,
            sender: sender,
            recipient: recipient,
            dispatchTime: dispatchTime,
            deliveryTime: 0,
            status: status,
            exists: true
        });

        packageIds.push(packageId); // Store the package ID
        packageIdCounter++;

        emit DeliveryRecorded(packageId, sender, recipient, dispatchTime, status);
        return packageId;
    }

    function updateStatus(uint256 packageId, string memory newStatus) public onlyOwner {
        require(deliveries[packageId].exists, "Delivery record not found");

        string memory oldStatus = deliveries[packageId].status;
        deliveries[packageId].status = newStatus;

        if (keccak256(bytes(newStatus)) == keccak256(bytes("delivered"))) {
            deliveries[packageId].deliveryTime = block.timestamp;
        }

        emit StatusUpdated(packageId, oldStatus, newStatus);
    }

    function getDeliveryDetails(uint256 packageId)
        public
        view
        returns (
            string memory sender,
            string memory recipient,
            uint256 dispatchTime,
            uint256 deliveryTime,
            string memory status
        )
    {
        require(deliveries[packageId].exists, "Delivery record not found");
        Delivery memory delivery = deliveries[packageId];
        return (
            delivery.sender,
            delivery.recipient,
            delivery.dispatchTime,
            delivery.deliveryTime,
            delivery.status
        );
    }

    /**
     * @dev Get all package IDs recorded in the contract.
     * @return Array of all package IDs.
     */
    function getAllPackageIds() public view onlyOwner returns (uint256[] memory) {
        return packageIds;
    }
}

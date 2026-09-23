// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {TicketContract} from "../src/TicketContract.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("Deploying TicketContract with deployer:", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy TicketContract
        TicketContract ticket = new TicketContract();
        console.log("TicketContract deployed at:", address(ticket));

        // Initiate 1 dummy ticket event
        uint256 eventId = 1;
        uint64 eventTimestamp = uint64(block.timestamp + 30 days);
        uint32 maxPerWallet = 2; // Batas maksimal 2 tiket per akun untuk anti-scalping
        ticket.createEvent(eventId, deployerAddress, eventTimestamp, maxPerWallet);
        console.log("Event 1 created. Organizer:", deployerAddress);

        // Initiate 1 dummy ticket category
        uint256 categoryId = 1;
        uint96 price = 150_000;
        uint32 quota = 100;
        ticket.addCategory(eventId, categoryId, price, quota);
        console.log("Category 1 added. Price:", price, "Quota:", quota);

        vm.stopBroadcast();
    }
}

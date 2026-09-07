// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {TicketContract} from "../src/TicketContract.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TicketContractTest is Test {
    TicketContract ticket;
    address organizer = makeAddr("organizer");
    address stranger  = makeAddr("stranger");
    // ...deklarasikan aktor lain yang kamu butuhkan

    function setUp() public {
        // deploy di sini — perhatikan jebakan "siapa owner-nya" di bawah
    }

    // satu fungsi test per skenario — lihat daftar kasus per fungsi
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {TicketContract} from "../src/TicketContract.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TicketContractTest is Test {
    TicketContract public ticket;

    address public owner = makeAddr("owner");
    address public organizer = makeAddr("organizer");
    address public stranger = makeAddr("stranger");
    address public marketplace = makeAddr("marketplace");
    address public signer = makeAddr("systemSigner");

    uint256 public constant EVENT_ID = 1;
    uint256 public constant CATEGORY_ID = 1;
    uint96 public constant PRICE = 150_000;
    uint32 public constant QUOTA = 500;
    uint32 public constant MAX_PER_WALLET = 4;
    uint64 public eventTimestamp;

    event EventCreated(uint256 indexed eventId, address indexed organizer, uint64 eventTimestamp, uint32 maxPerWallet);
    event CategoryCreated(uint256 indexed eventId, uint256 indexed categoryId, uint96 price, uint32 quota);

    function setUp() public {
        // block.timestamp diset ke 1_000_000 untuk simulasi waktu pasti
        vm.warp(1_000_000);
        eventTimestamp = uint64(block.timestamp + 7 days);

        // Deploy kontrak oleh akun 'owner'
        vm.prank(owner);
        ticket = new TicketContract();
    }

    // =========================================================================
    // 1. Initial State Tests
    // =========================================================================

    function test_InitialState() public view {
        assertEq(ticket.name(), "NFTix");
        assertEq(ticket.symbol(), "NFTIX");
        assertEq(ticket.owner(), owner);
        assertEq(ticket.marketplaceAddress(), address(0));
        assertEq(ticket.systemSigner(), address(0));
    }

    // =========================================================================
    // 2. createEvent Tests
    // =========================================================================

    function test_CreateEvent_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true, address(ticket));
        emit EventCreated(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);
    }

    function test_CreateEvent_RevertIf_NotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);
    }

    function test_CreateEvent_RevertIf_EventIdZero() public {
        vm.prank(owner);
        vm.expectRevert(TicketContract.ForbiddenZero.selector);
        ticket.createEvent(0, organizer, eventTimestamp, MAX_PER_WALLET);
    }

    function test_CreateEvent_RevertIf_OrganizerZero() public {
        vm.prank(owner);
        vm.expectRevert(TicketContract.EmptyIssuerWalletAddress.selector);
        ticket.createEvent(EVENT_ID, address(0), eventTimestamp, MAX_PER_WALLET);
    }

    function test_CreateEvent_RevertIf_TimestampPassed() public {
        vm.prank(owner);
        vm.expectRevert(TicketContract.EventAlreadyPassed.selector);
        ticket.createEvent(EVENT_ID, organizer, uint64(block.timestamp), MAX_PER_WALLET);

        vm.prank(owner);
        vm.expectRevert(TicketContract.EventAlreadyPassed.selector);
        ticket.createEvent(EVENT_ID, organizer, uint64(block.timestamp - 1), MAX_PER_WALLET);
    }

    function test_CreateEvent_RevertIf_MaxPerWalletZero() public {
        vm.prank(owner);
        vm.expectRevert(TicketContract.ForbiddenZero.selector);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, 0);
    }

    function test_CreateEvent_RevertIf_EventAlreadyExists() public {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        vm.expectRevert(abi.encodeWithSelector(TicketContract.EventAlreadyExists.selector, EVENT_ID));
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);
        vm.stopPrank();
    }

    // =========================================================================
    // 3. addCategory Tests
    // =========================================================================

    function test_AddCategory_Success() public {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        vm.expectEmit(true, true, false, true, address(ticket));
        emit CategoryCreated(EVENT_ID, CATEGORY_ID, PRICE, QUOTA);

        ticket.addCategory(EVENT_ID, CATEGORY_ID, PRICE, QUOTA);
        vm.stopPrank();
    }

    function test_AddCategory_RevertIf_NotOwner() public {
        vm.prank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        ticket.addCategory(EVENT_ID, CATEGORY_ID, PRICE, QUOTA);
    }

    function test_AddCategory_RevertIf_EventNotFound() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(TicketContract.EventNotFound.selector, 999));
        ticket.addCategory(999, CATEGORY_ID, PRICE, QUOTA);
    }

    function test_AddCategory_RevertIf_CategoryIdZero() public {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        vm.expectRevert(TicketContract.ForbiddenZero.selector);
        ticket.addCategory(EVENT_ID, 0, PRICE, QUOTA);
        vm.stopPrank();
    }

    function test_AddCategory_RevertIf_PriceZero() public {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        vm.expectRevert(TicketContract.ForbiddenZero.selector);
        ticket.addCategory(EVENT_ID, CATEGORY_ID, 0, QUOTA);
        vm.stopPrank();
    }

    function test_AddCategory_RevertIf_QuotaZero() public {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        vm.expectRevert(TicketContract.ForbiddenZero.selector);
        ticket.addCategory(EVENT_ID, CATEGORY_ID, PRICE, 0);
        vm.stopPrank();
    }

    function test_AddCategory_RevertIf_CategoryAlreadyExists() public {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);
        ticket.addCategory(EVENT_ID, CATEGORY_ID, PRICE, QUOTA);

        vm.expectRevert(abi.encodeWithSelector(TicketContract.CategoryAlreadyExist.selector, EVENT_ID, CATEGORY_ID));
        ticket.addCategory(EVENT_ID, CATEGORY_ID, PRICE, QUOTA);
        vm.stopPrank();
    }

    // =========================================================================
    // 4. setSalesOpen Tests
    // =========================================================================

    function test_SetSalesOpen_Success_ByOwner() public {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        // Owner menutup penjualan
        ticket.setSalesOpen(EVENT_ID, false);

        // Owner membuka kembali penjualan
        ticket.setSalesOpen(EVENT_ID, true);
        vm.stopPrank();
    }

    function test_SetSalesOpen_Success_ByOrganizer() public {
        vm.prank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        // Organizer menutup penjualan
        vm.prank(organizer);
        ticket.setSalesOpen(EVENT_ID, false);

        // Organizer membuka kembali penjualan
        vm.prank(organizer);
        ticket.setSalesOpen(EVENT_ID, true);
    }

    function test_SetSalesOpen_RevertIf_EventNotFound() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(TicketContract.EventNotFound.selector, 999));
        ticket.setSalesOpen(999, false);
    }

    function test_SetSalesOpen_RevertIf_NotAuthorized() public {
        vm.prank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);

        // Pihak asing (stranger) mencoba mengubah status penjualan
        vm.prank(stranger);
        vm.expectRevert(TicketContract.NotAuthorized.selector);
        ticket.setSalesOpen(EVENT_ID, false);
    }

    // =========================================================================
    // 5. setMarketplace Tests
    // =========================================================================

    function test_SetMarketplace_Success() public {
        vm.prank(owner);
        ticket.setMarketplace(marketplace);
        assertEq(ticket.marketplaceAddress(), marketplace);
    }

    function test_SetMarketplace_RevertIf_NotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        ticket.setMarketplace(marketplace);
    }

    function test_SetMarketplace_RevertIf_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(TicketContract.ForbiddenZero.selector);
        ticket.setMarketplace(address(0));
    }

    // =========================================================================
    // 6. setSystemSigner Tests
    // =========================================================================

    function test_SetSystemSigner_Success() public {
        vm.prank(owner);
        ticket.setSystemSigner(signer);
        assertEq(ticket.systemSigner(), signer);
    }

    function test_SetSystemSigner_RevertIf_NotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, stranger));
        ticket.setSystemSigner(signer);
    }

    function test_SetSystemSigner_RevertIf_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(TicketContract.ForbiddenZero.selector);
        ticket.setSystemSigner(address(0));
    }
}

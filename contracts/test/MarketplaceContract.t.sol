// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {TicketContract} from "../src/TicketContract.sol";
import {MarketplaceContract} from "../src/MarketplaceContract.sol";

contract MarketplaceContractTest is Test {
    TicketContract public ticket;
    MarketplaceContract public market;

    uint256 internal signerPrivateKey = 0xA11CE;
    address internal systemSigner;

    address internal owner = address(this);
    address internal organizer = address(0x100);
    address internal relayer = address(0x200);
    address internal alice = address(0x300);
    address internal bob = address(0x400);
    address internal charlie = address(0x500);

    uint256 internal constant EVENT_ID = 1;
    uint256 internal constant CAT_ID = 1;
    uint96 internal constant ORIGINAL_PRICE = 150_000;
    uint64 internal futureTimestamp;

    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant MINT_TYPEHASH =
        keccak256("MintAuth(address to,uint256 eventId,uint256 categoryId,uint256 nonce)");

    function setUp() public {
        systemSigner = vm.addr(signerPrivateKey);
        futureTimestamp = uint64(block.timestamp + 7 days);

        ticket = new TicketContract();
        market = new MarketplaceContract(address(ticket), relayer);

        ticket.setSystemSigner(systemSigner);
        ticket.setMarketplace(address(market));

        ticket.createEvent(EVENT_ID, organizer, futureTimestamp, 2);
        ticket.addCategory(EVENT_ID, CAT_ID, ORIGINAL_PRICE, 100);
    }

    function _signMint(address to, uint256 eventId, uint256 categoryId, uint256 nonce) internal view returns (bytes memory) {
        bytes32 domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("NFTix")),
                keccak256(bytes("1")),
                block.chainid,
                address(ticket)
            )
        );
        bytes32 structHash = keccak256(abi.encode(MINT_TYPEHASH, to, eventId, categoryId, nonce));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPrivateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _mintTo(address buyer, uint256 nonce) internal returns (uint256) {
        bytes memory sig = _signMint(buyer, EVENT_ID, CAT_ID, nonce);
        return ticket.mintTicket(buyer, EVENT_ID, CAT_ID, nonce, sig);
    }

    function test_DirectTransferBlocked_OutsideMarketplace() public {
        uint256 tokenId = _mintTo(alice, 1);
        vm.prank(alice);
        vm.expectRevert(TicketContract.TransferNotAllowed.selector);
        ticket.transferFrom(alice, bob, tokenId);
    }

    function test_IsApprovedForAll_AutoTrueForMarketplace() public view {
        assertTrue(ticket.isApprovedForAll(alice, address(market)));
        assertFalse(ticket.isApprovedForAll(alice, bob));
    }

    function test_ListTicket_LocksOriginalPrice() public {
        uint256 tokenId = _mintTo(alice, 1);

        vm.prank(relayer);
        market.listTicket(tokenId, alice);

        (address seller, uint96 price, bool active) = market.listings(tokenId);
        assertEq(seller, alice);
        assertEq(price, ORIGINAL_PRICE);
        assertTrue(active);
    }

    function test_ListTicket_RevertIfNotRelayer() public {
        uint256 tokenId = _mintTo(alice, 1);
        vm.prank(alice);
        vm.expectRevert(MarketplaceContract.NotRelayer.selector);
        market.listTicket(tokenId, alice);
    }

    function test_ListTicket_RevertIfNotTicketOwner() public {
        uint256 tokenId = _mintTo(alice, 1);
        vm.prank(relayer);
        vm.expectRevert(abi.encodeWithSelector(MarketplaceContract.NotTicketOwner.selector, tokenId, bob));
        market.listTicket(tokenId, bob);
    }

    function test_ListTicket_RevertIfEventPassed() public {
        uint256 tokenId = _mintTo(alice, 1);
        vm.warp(futureTimestamp + 1);
        vm.prank(relayer);
        vm.expectRevert(MarketplaceContract.EventAlreadyPassed.selector);
        market.listTicket(tokenId, alice);
    }

    function test_ExecuteResale_SuccessAndUpdatesWalletPurchases() public {
        uint256 tokenId = _mintTo(alice, 1);
        assertEq(ticket.getWalletPurchases(EVENT_ID, alice), 1);
        assertEq(ticket.getWalletPurchases(EVENT_ID, bob), 0);

        vm.prank(relayer);
        market.listTicket(tokenId, alice);

        vm.prank(relayer);
        market.executeResale(tokenId, bob);

        assertEq(ticket.ownerOf(tokenId), bob);
        assertEq(ticket.getWalletPurchases(EVENT_ID, alice), 0);
        assertEq(ticket.getWalletPurchases(EVENT_ID, bob), 1);

        (, , bool active) = market.listings(tokenId);
        assertFalse(active);
    }

    function test_ExecuteResale_RevertIfUsedDuringListing() public {
        uint256 tokenId = _mintTo(alice, 1);
        vm.prank(relayer);
        market.listTicket(tokenId, alice);

        vm.prank(organizer);
        ticket.markUsed(tokenId);

        vm.prank(relayer);
        vm.expectRevert(abi.encodeWithSelector(TicketContract.TicketAlreadyUsed.selector, tokenId));
        market.executeResale(tokenId, bob);
    }

    function test_ExecuteResale_RevertIfBuyerExceedsMaxPerWallet() public {
        uint256 token1 = _mintTo(alice, 1);
        _mintTo(bob, 2);
        _mintTo(bob, 3); // Bob sudah punya 2 tiket (batas maxPerWallet = 2)

        vm.prank(relayer);
        market.listTicket(token1, alice);

        vm.prank(relayer);
        vm.expectRevert(TicketContract.MaxPerWalletExceeded.selector);
        market.executeResale(token1, bob);
    }

    function test_CancelListing_Success() public {
        uint256 tokenId = _mintTo(alice, 1);
        vm.prank(relayer);
        market.listTicket(tokenId, alice);

        vm.prank(relayer);
        market.cancelListing(tokenId);

        vm.prank(relayer);
        vm.expectRevert(abi.encodeWithSelector(MarketplaceContract.NotListed.selector, tokenId));
        market.executeResale(tokenId, charlie);
    }

    function test_Mint_RevertIfSaleNotStarted() public {
        uint64 startTime = uint64(block.timestamp + 1 hours);
        vm.prank(organizer);
        ticket.setSaleStartTime(EVENT_ID, startTime);

        bytes memory sig = _signMint(alice, EVENT_ID, CAT_ID, 99);
        vm.expectRevert(abi.encodeWithSelector(TicketContract.SalesNotStarted.selector, startTime));
        ticket.mintTicket(alice, EVENT_ID, CAT_ID, 99, sig);

        vm.warp(startTime);
        uint256 tokenId = ticket.mintTicket(alice, EVENT_ID, CAT_ID, 99, sig);
        assertEq(ticket.ownerOf(tokenId), alice);
    }
}


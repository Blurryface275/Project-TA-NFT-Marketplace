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
    uint256 public signerPrivateKey = 0xA11CE;
    address public signer = vm.addr(signerPrivateKey);
    address public buyer = makeAddr("buyer");

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

    // =========================================================================
    // 7. EIP-712 mintTicket Tests
    // =========================================================================

    function _getEIP712Digest(address to, uint256 eventId, uint256 categoryId, uint256 nonce) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(ticket.MINT_TYPEHASH(), to, eventId, categoryId, nonce)
        );
        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("NFTix")),
                keccak256(bytes("1")),
                block.chainid,
                address(ticket)
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    function _signMint(uint256 pk, address to, uint256 eventId, uint256 categoryId, uint256 nonce) internal view returns (bytes memory) {
        bytes32 digest = _getEIP712Digest(to, eventId, categoryId, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _setupEventAndCategory() internal {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);
        ticket.addCategory(EVENT_ID, CATEGORY_ID, PRICE, QUOTA);
        ticket.setSystemSigner(signer);
        vm.stopPrank();
    }

    function test_MintTicket_Success_WithEIP712Signature() public {
        _setupEventAndCategory();
        uint256 nonce = 12345;
        bytes memory signature = _signMint(signerPrivateKey, buyer, EVENT_ID, CATEGORY_ID, nonce);

        uint256 tokenId = ticket.mintTicket(buyer, EVENT_ID, CATEGORY_ID, nonce, signature);

        assertEq(tokenId, 1);
        assertEq(ticket.ownerOf(1), buyer);
        assertTrue(ticket.isNonceUsed(nonce));

        TicketContract.TicketInfo memory info = ticket.getTicket(1);
        assertEq(info.eventId, EVENT_ID);
        assertEq(info.categoryId, CATEGORY_ID);
        assertEq(info.originalPrice, PRICE);
        assertFalse(info.used);
    }

    function test_MintTicket_RevertIf_InvalidSignature() public {
        _setupEventAndCategory();
        uint256 nonce = 12345;
        uint256 fakePrivateKey = 0xBAD;
        bytes memory badSignature = _signMint(fakePrivateKey, buyer, EVENT_ID, CATEGORY_ID, nonce);

        vm.expectRevert(TicketContract.InvalidSignature.selector);
        ticket.mintTicket(buyer, EVENT_ID, CATEGORY_ID, nonce, badSignature);
    }

    function test_MintTicket_RevertIf_ReplayNonce() public {
        _setupEventAndCategory();
        uint256 nonce = 999;
        bytes memory signature = _signMint(signerPrivateKey, buyer, EVENT_ID, CATEGORY_ID, nonce);

        // Mint pertama berhasil
        ticket.mintTicket(buyer, EVENT_ID, CATEGORY_ID, nonce, signature);

        // Mint kedua dengan nonce yang sama wajib revert NonceAlreadyUsed
        vm.expectRevert(abi.encodeWithSelector(TicketContract.NonceAlreadyUsed.selector, nonce));
        ticket.mintTicket(buyer, EVENT_ID, CATEGORY_ID, nonce, signature);
    }

    function test_MintTicket_RevertIf_SystemSignerNotSet() public {
        vm.startPrank(owner);
        ticket.createEvent(EVENT_ID, organizer, eventTimestamp, MAX_PER_WALLET);
        ticket.addCategory(EVENT_ID, CATEGORY_ID, PRICE, QUOTA);
        vm.stopPrank();

        uint256 nonce = 1;
        bytes memory signature = _signMint(signerPrivateKey, buyer, EVENT_ID, CATEGORY_ID, nonce);

        vm.expectRevert(TicketContract.SystemSignerNotSet.selector);
        ticket.mintTicket(buyer, EVENT_ID, CATEGORY_ID, nonce, signature);
    }

    function test_MintTicket_RevertIf_MaxPerWalletExceeded() public {
        _setupEventAndCategory();

        // Mint sebanyak MAX_PER_WALLET (4 tiket)
        for (uint256 i = 1; i <= MAX_PER_WALLET; i++) {
            bytes memory sig = _signMint(signerPrivateKey, buyer, EVENT_ID, CATEGORY_ID, i);
            ticket.mintTicket(buyer, EVENT_ID, CATEGORY_ID, i, sig);
        }

        // Tiket ke-5 wajib gagal MaxPerWalletExceeded
        uint256 overNonce = 5;
        bytes memory sigOver = _signMint(signerPrivateKey, buyer, EVENT_ID, CATEGORY_ID, overNonce);
        vm.expectRevert(TicketContract.MaxPerWalletExceeded.selector);
        ticket.mintTicket(buyer, EVENT_ID, CATEGORY_ID, overNonce, sigOver);
    }
}

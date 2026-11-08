// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {TicketContract} from "./TicketContract.sol";

contract MarketplaceContract is Ownable {
    // ownable batasin fungsi admin (setRealyer) hanya untuk deployer/owner kontrak

    error NotRelayer();
    error ForbiddenZero();
    error NotTicketOwner(uint256 tokenId, address seller);
    error AlreadyListed(uint256 tokenId);
    error NotListed(uint256 tokenId);
    error TicketAlreadyUsed(uint256 tokenId);
    error EventAlreadyPassed();
    error BuyerIsSeller();

    struct Listing {
        address seller; // address sumber penarikan NFT
        uint96 price; // selalu = originalPrice, tidak pernah dari input -> tujuannya untuk ngunci harga
        bool active; // buat tau mana yg lagi dijual vs tiket yg tidak pernah didaftarkan
    }

    TicketContract public immutable ticket;
    address public relayer; // wallet backend NestJS
    mapping(uint256 => Listing) public listings; // key =tokenId. contoh: tiket dgn tokenId 1 nanti siapakah resellernya, status resellnya, harganya

    event RelayerUpdated(address indexed relayer);
    event TicketListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint96 price
    );
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event TicketResold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint96 price
    );

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert NotRelayer();
        _;
    }

    constructor(
        address ticketAddress,
        address relayerAddress
    ) Ownable(msg.sender) {
        if (ticketAddress == address(0) || relayerAddress == address(0))
            revert ForbiddenZero(); // make sure pas dideploy ga typo alamat -
        ticket = TicketContract(ticketAddress);
        relayer = relayerAddress;
    }

    function setRelayer(address newRelayer) external onlyOwner {
        if (newRelayer == address(0)) revert ForbiddenZero();
        relayer = newRelayer;
        emit RelayerUpdated(newRelayer);
    }

    function listTicket(uint256 tokenId, address seller) external onlyRelayer {
        if (listings[tokenId].active) revert AlreadyListed(tokenId); // mastiin klo tiket yg sedang resale tidak bisa ditimpa
        if (ticket.ownerOf(tokenId) != seller)
            revert NotTicketOwner(tokenId, seller); // biar seller tidak bsia jual tiket lainnya hanya dgn masukkan tokenID nya

        TicketContract.TicketInfo memory info = ticket.getTicket(tokenId);
        if (info.used) revert TicketAlreadyUsed(tokenId);
        if (block.timestamp >= ticket.getEvent(info.eventId).eventTimestamp)
            revert EventAlreadyPassed();

        // Price-lock: harga diambil dari data mint, bukan parameter
        listings[tokenId] = Listing({
            seller: seller,
            price: info.originalPrice,
            active: true
        });
        emit TicketListed(tokenId, seller, info.originalPrice);
    }

    function cancelListing(uint256 tokenId) external onlyRelayer {
        Listing memory l = listings[tokenId];
        if (!l.active) revert NotListed(tokenId);

        delete listings[tokenId];
        emit ListingCancelled(tokenId, l.seller);
    }

    function executeResale(
        uint256 tokenId,
        address buyer
    ) external onlyRelayer {
        Listing memory l = listings[tokenId];
        if (!l.active) revert NotListed(tokenId);
        if (buyer == address(0)) revert ForbiddenZero();
        if (buyer == l.seller) revert BuyerIsSeller();

        TicketContract.TicketInfo memory info = ticket.getTicket(tokenId);
        if (block.timestamp >= ticket.getEvent(info.eventId).eventTimestamp)
            revert EventAlreadyPassed();

        // Effects sebelum interaction (pola checks-effects-interactions)
        delete listings[tokenId];
        ticket.transferFrom(l.seller, buyer, tokenId);

        emit TicketResold(tokenId, l.seller, buyer, l.price);
    }
}
